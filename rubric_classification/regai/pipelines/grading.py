# grading_pipeline.py
import json
import logging
import re
from typing import Dict, List, Union
from django.utils import timezone
from django.db.models import Q
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from openai import RateLimitError, APIError
from haystack import Pipeline, component
from haystack.components.builders import PromptBuilder
from haystack.components.generators import OpenAIGenerator
from haystack_integrations.components.generators.google_vertex import VertexAITextGenerator
from haystack_integrations.components.generators.anthropic import AnthropicGenerator
from haystack.components.validators import JsonSchemaValidator
from haystack.utils import Secret
from haystack.dataclasses import ChatMessage, Document
from haystack.document_stores.in_memory import InMemoryDocumentStore
from haystack.components.retrievers.filter_retriever import FilterRetriever
from haystack.components.retrievers import InMemoryEmbeddingRetriever
from haystack.components.embedders import SentenceTransformersTextEmbedder, SentenceTransformersDocumentEmbedder

from ..models import Assignment, AssignmentAgent, Submission, Grade, Critique, Rubric
from ..serializers import CritiqueSerializer, GradeSerializer

logger = logging.getLogger(__name__)

from google.cloud import aiplatform
from dotenv import load_dotenv

load_dotenv('..')

aiplatform.init(project='regai-grading')


class GradingPipeline:
    def __init__(self, assignment: Assignment, rubric: Rubric, openai_api_key: str, llm_name='gpt-3.5-turbo-0125'):
        self.assignment = assignment
        self.rubric = rubric
        self.openai_api_key = Secret.from_token(openai_api_key)
        self.llm_name = llm_name
        self.document_store = InMemoryDocumentStore(embedding_similarity_function='cosine')
        self.embedder = SentenceTransformersTextEmbedder()
        self.embedder.warm_up()
        self.document_embedder = SentenceTransformersDocumentEmbedder()
        self.document_embedder.warm_up()
        self.retriever = InMemoryEmbeddingRetriever(document_store=self.document_store)
        self.grader_pipeline = self._create_grader_pipeline()
        self.critic_pipeline = self._create_critic_pipeline()
        self.reviser_pipeline = self._create_reviser_pipeline()
        self._load_approved_items()

    def _load_approved_items(self):
        approved_grades = Grade.objects.filter(assignment_id=self.assignment.id, human_approved=True)
        approved_critiques = Critique.objects.filter(assignment_id=self.assignment.id, human_approved=True)
        print("APPROVED CRITIQUES: ", approved_critiques)
        documents = []
        for grade in approved_grades:
            doc = Document(content=json.dumps(GradeSerializer(grade).data), meta={"id": grade.id, "type": "grade"})
            documents.append(doc)
        for critique in approved_critiques:
            doc = Document(content=json.dumps(CritiqueSerializer(critique).data),
                           meta={"id": critique.id, "type": "critique"})
            documents.append(doc)
        #self.document_store.write_documents(documents)
        if len(documents) > 0:
            docs_with_embeddings = self.document_embedder.run(documents)
            self.document_store.write_documents(docs_with_embeddings['documents'])

    def _create_grader_pipeline(self) -> Pipeline:
        pipeline = Pipeline()

        grader_template = """
        You are an expert grader tasked with evaluating student submissions for a school assignment. Your job is to grade the submission using the provided rubric, ensuring you assess EVERY category listed in the rubric.

        Assignment Description:
        {{assignment_description}}

        Rubric to guide your scoring decisions: 
        {{rubric}}

        Student Submission:
        {{submission}}

        Similar approved grades (for reference):
        {{similar_grades}}

        Instructions:
        1. Carefully read the assignment description, rubric, and student submission.
        2. Evaluate the submission for EACH category in the rubric.
        3. Provide a score and detailed justification for every category.
        4. Format your response as a single JSON array containing objects for each category.

        Your response MUST be in the following JSON format:
        [
            {
                "name": "Category 1 Name",
                "score": integer_score,
                "justification": "Detailed justification for Category 1, referencing specific parts of the submission and rubric"
            },
            {
                "name": "Category 2 Name",
                "score": integer_score,
                "justification": "Detailed justification for Category 2, referencing specific parts of the submission and rubric"
            },
            ...
            {
                "name": "Final Category Name",
                "score": integer_score,
                "justification": "Detailed justification for the final category, referencing specific parts of the submission and rubric"
            }
        ]

        IMPORTANT:
        - Ensure you include an object for EVERY category in the rubric.
        - Your response must be a single, valid JSON array that can be parsed without additional processing.
        - Do not include any text before or after the JSON array.
        - Use proper JSON formatting, including escape characters for any special characters in the text.
        """

        grader_template += """
        Your response must be in valid JSON format. Ensure that your output can be parsed directly by a JSON parser without any additional text before or after the JSON structure.
        """

        pipeline.add_component("grader_prompt", PromptBuilder(template=grader_template))

        # generator = (AnthropicGenerator(model="claude-3-haiku-20240307",
        #                                 api_key=Secret.from_env_var("ANTHROPIC_API_KEY"),
        #                                 generation_kwargs={"max_tokens": 2048,
        #                                                    "temperature": 0}))

        generator = OpenAIGenerator(model="gpt-3.5-turbo-0125",
                                    api_key=self.openai_api_key,
                                    generation_kwargs={
                                        "response_format": {"type": "json_object"}})
        pipeline.add_component("grader", generator)
        # pipeline.add_component("grader_validator", JsonSchemaValidator(json_schema={
        #     "type": "object",
        #     "properties": {
        #         "name": {"type": "string"},
        #         "score": {"type": "number"},
        #         "justification": {"type": "string"}
        #     },
        #     "required": ["name", "score", "justification"]
        # }))

        pipeline.connect("grader_prompt", "grader")
        # pipeline.connect("grader.replies", "grader_validator.messages")

        return pipeline

    def _create_critic_pipeline(self) -> Pipeline:
        pipeline = Pipeline()

        critic_template = """
        You are a reviewer who reviews grades given to student submissions for assignments. 
        Your job is to make sure that the grader has given an accurate and fair grade to the submission based on the rubric that 
        the teacher has created for grading the assignment, and the student's actual submission content. 
        Review and critique the following grade given to an assignment submission based on the provided rubric and student submission. 
        Make sure that the grader is following the rubric as closely as possible. Point out, in excruciating detail, where
        they did not follow the rubric correctly in grading the assignment based on the submission and rubric (if they did not; they may have!). 
        
        Here is an example of an essay(s), with a given grade(s) and critique(s) given by the teacher (you will do this job) to another grader's assigned grade:
        Example submission with grade: 
        {{example_submission}}
        {{example_grade}}
        {{example_critique}}
        Here is the assignment that students are giving submissions for: 
        {{assignment_description}}

        Here is the rubric the teacher has created for grading submissions to this assignment: 
        Rubric:
        {{rubric}}
        
        Here is the students original submission: 
        {{student_submission}}
        
        And here is the evaluation the grader gave for the submission for each rubric category: 
        Grades:
        {{grades}}
        
        You are to critique those grades. Remember, the grade not require revision (in fact, this is very likely).
        Just make sure that the grade points out specific details of the submission that correspond to specific details in the rubric. 
        
        Provide your critique in the following JSON format:
        {
            "overall_assessment": "overall assessment of the grading",
            "category_critiques": [
                {
                    "category": "category name",
                    "critique": "critique for this category"
                }
            ],
            "potential_biases": ["list of potential biases"],
            "suggestions_for_improvement": ["list of suggestions"]
        }
        """
        critic_template += """
        Your response must be in valid JSON format. Ensure that your output can be parsed directly by a JSON parser without any additional text before or after the JSON structure.
        Any special characters must be accompanied by the correct escape characters to ensure JSON compliance.
        """

        pipeline.add_component("critic_prompt", PromptBuilder(template=critic_template))
        # generator = (AnthropicGenerator(model="claude-3-haiku-20240307",
        #                                 api_key=Secret.from_env_var("ANTHROPIC_API_KEY"),
        #                                 generation_kwargs={"max_tokens": 2048,
        #                                                    "temperature": 0}))
        #
        generator = OpenAIGenerator(model="gpt-3.5-turbo-0125",
                        api_key=self.openai_api_key,
                        generation_kwargs={
                            "response_format": {"type": "json_object"}})
        pipeline.add_component("critic", generator)
        # pipeline.add_component("critic_validator", JsonSchemaValidator(json_schema={
        #     "type": "object",
        #     "properties": {
        #         "overall_assessment": {"type": "string"},
        #         "category_critiques": {
        #             "type": "array",
        #             "items": {
        #                 "type": "object",
        #                 "properties": {
        #                     "category": {"type": "string"},
        #                     "critique": {"type": "string"}
        #                 },
        #                 "required": ["category", "critique"]
        #             }
        #         },
        #         "potential_biases": {"type": "array", "items": {"type": "string"}},
        #         "suggestions_for_improvement": {"type": "array", "items": {"type": "string"}}
        #     },
        #     "required": ["overall_assessment", "category_critiques", "potential_biases", "suggestions_for_improvement"]
        # }))

        pipeline.connect("critic_prompt", "critic")
        # pipeline.connect("critic.replies", "critic_validator.messages")

        return pipeline

    def _create_reviser_pipeline(self) -> Pipeline:
        pipeline = Pipeline()

        reviser_template = """
        Revise the following category grades given to a student's assignment submission based on the critique given by a 
        professional regarding the grade given previously by an LLM, ensuring alignment with the rubric:
        
        Assignment Description: 
        {{assignment_description}}
        
        Rubric created by teacher to be used for grading:
        {{rubric}}
        
        Student Submission: 
        {{student_submission}}

        Original Grade given by Grader:
        {{original_grade}}

        Critique which should inform how you change the grade (if it needs changing). 
        This critique should be the main reason you decide to change or not to change your evaluation, but do not mention this critique in your final grade justification.
        {{critique}}

        

        Provide a revised (this does not necessarily mean the score changed! You could return the exact same original grade)
         grade in the EXACT SAME json format as the Original Grade, with a detailed justification explaining why you gave the submission the grade you did. 
         As a reminder, here is the json structure your response should take on: 
         [
            {
                "name": "first category name from the rubric",
                "score": integer corresponding to a scoring level on the rubric,
                "justification": "detailed justification for the score, pointing to specific parts of the submission that correspond to specific cells of the rubric"
            }, 
            ..., <similar json stricture for each category in the rubric>
            {
                "name": "last category name from the rubric",
                "score": integer corresponding to a scoring level on the rubric,
                "justification": "detailed justification for the score, pointing to specific parts of the submission that correspond to specific cells of the rubric"
            }
         ]

        """

        reviser_template += """
        Your response must be in valid JSON format. Ensure that your output can be parsed directly by a JSON parser without any additional text before or after the JSON structure.
        """

        pipeline.add_component("reviser_prompt", PromptBuilder(template=reviser_template))

        # generator = (AnthropicGenerator(model="claude-3-haiku-20240307",
        #                                 api_key=Secret.from_env_var("ANTHROPIC_API_KEY"),
        #                                 generation_kwargs={"max_tokens": 2048,
        #                                                    "temperature": 0}))

        generator = OpenAIGenerator(model="gpt-3.5-turbo-0125",
                                        api_key=self.openai_api_key,
                                        generation_kwargs={
                                            "response_format": {"type": "json_object"}})
        pipeline.add_component("reviser", generator)
        # pipeline.add_component("reviser_validator", JsonSchemaValidator(json_schema={
        #     "type": "object",
        #     "properties": {
        #         "name": {"type": "string"},
        #         "score": {"type": "integer", "minimum": 1},
        #         "justification": {"type": "string"}
        #     },
        #     "required": ["name", "score", "justification"]
        # }))

        pipeline.connect("reviser_prompt", "reviser")
        # pipeline.connect("reviser.replies", "reviser_validator.messages")

        return pipeline

    def _get_similar_grades(self, submission_text: str) -> List[Dict]:
        embedded_query = self.embedder.run(text=submission_text)
        similar_docs = self.retriever.run(query_embedding=embedded_query['embedding'])
        similar_grades = []
        for doc in similar_docs['documents']:
            if doc.meta['type'] == 'grade' or doc.meta['type'] == 'final_grade' or doc.meta['type'] == 'final':
                similar_grades.append(json.loads(doc.content))
        return similar_grades

    def _get_similar_critiques(self, grades: List[Dict]) -> List[Dict]:
        # relevant_critiques = CritiqueSerializer([Critique.objects.filter(grade_id=grade.id, human_approved=True) for grade in grades], many=True)
        embedded_query = self.embedder.run(text=str(json.dumps(grades)))
        similar_docs = self.retriever.run(query_embedding=embedded_query['embedding'])
        similar_critiques = []
        for doc in similar_docs['documents']:
            if doc.meta['type'] == 'critique':
                similar_critiques.append(json.loads(doc.content))

        return similar_critiques

    def _get_similar_revisions(self, grades: List[Dict]) -> List[Dict]:
        embedded_query = self.embedder.run(text=json.dumps(grades))
        similar_docs = self.retriever.run(query_embedding=embedded_query['embedding'])
        similar_revisions = []
        for doc in similar_docs['documents']:
            if doc.meta['type'] == 'grade' or doc.meta['type'] == 'final_grade' or doc.meta['type'] == 'final':
                similar_revisions.append(json.loads(doc.content))
        return similar_revisions

    def grade_submission(self, submission: Submission) -> List[Dict]:
        grades = []
        similar_grades = self._get_similar_grades(submission.content)
        result = self.grader_pipeline.run(
            {
                "grader_prompt": {
                    "rubric": json.dumps(self.rubric.content, indent=2),
                    "assignment_description": json.dumps(submission.assignment.description, indent=2),
                    "submission": submission.content,
                    "similar_grades": json.dumps(similar_grades, indent=2)
                }
            }
        )
        raw_response = result["grader"]["replies"][0]
        print(f"Raw grader response: {raw_response}...")

        def grade_submission(self, submission: Submission) -> List[Dict]:
            similar_grades = self._get_similar_grades(submission.content)
            result = self.grader_pipeline.run(
                {
                    "grader_prompt": {
                        "rubric": json.dumps(self.rubric.content, indent=2),
                        "assignment_description": self.assignment.description,
                        "submission": submission.content,
                        "similar_grades": json.dumps(similar_grades, indent=2)
                    }
                }
            )
            raw_response = result["grader"]["replies"][0]
            grades = extract_json(raw_response)

            if not isinstance(grades, list) or len(grades) == 0:
                logger.error(
                    f"Invalid grader response for submission {submission.id}. Expected a non-empty list of grades.")
                raise ValueError("Grader failed to produce valid output")

            expected_categories = set(category['name'] for category in self.rubric.content['categories'])
            received_categories = set(grade['name'] for grade in grades)

            if expected_categories != received_categories:
                missing_categories = expected_categories - received_categories
                extra_categories = received_categories - expected_categories
                logger.warning(f"Mismatch in graded categories for submission {submission.id}. "
                               f"Missing: {missing_categories}, Extra: {extra_categories}")

            return grades

    def critique_grades(self, grades: List[Dict], submission: Submission) -> Dict:
        similar_critiques = self._get_similar_critiques(grades)
        example_grades = [Grade.objects.get(pk=critique['grade']) for critique in similar_critiques]
        example_submissions = [grade.submission for grade in example_grades]

        result = self.critic_pipeline.run(
            {
                "critic_prompt": {
                    "example_submission": json.dumps([submission.content for submission in example_submissions],
                                                     indent=2),
                    "example_grade": json.dumps([GradeSerializer(grade).data['content'] for grade in example_grades],
                                                indent=2),
                    "example_critique": json.dumps(similar_critiques, indent=2),
                    "assignment_description": json.dumps(submission.assignment.description),
                    "student_submission": submission.content,
                    "grades": json.dumps(grades, indent=2),
                    "rubric": json.dumps(self.rubric.content, indent=2),
                    #"similar_critiques": json.dumps(similar_critiques, indent=2)
                }
            }
        )
        print("ENTIRE RESPONSE: ")
        print(result)
        print(result["critic"]["replies"][0])
        extracted_json = extract_json(result["critic"]["replies"][0])
        # if not isinstance(extracted_json, list):
        #     extracted_json = [extracted_json]
        return extracted_json

    def revise_grades(self, initial_grades: List[Dict], critique: Dict, submission: Submission) -> List[Dict]:

        #similar_revisions = self._get_similar_revisions(initial_grades)
        result = self.reviser_pipeline.run(
            {
                "reviser_prompt": {
                    "assignment_description": json.dumps(submission.assignment.description, indent=2),
                    "student_submission": json.dumps(submission.content, indent=2),
                    "original_grade": json.dumps(initial_grades, indent=2),
                    "rubric": json.dumps(self.rubric.content, indent=2),
                    "critique": json.dumps(critique, indent=2),
                    #"similar_revisions": json.dumps(similar_revisions, indent=2)
                }
            }
        )
        revised_grades = extract_json(result["reviser"]["replies"][0])
        if not isinstance(revised_grades, list):
            revised_grades = [revised_grades]
        return revised_grades

    def calculate_overall_score(self, category_scores: List[Dict]) -> float:
        total_weighted_score = 0
        total_weight = 0

        for category_score in category_scores:
            try:
                category = next((c for c in self.rubric.content['categories'] if c['name'] == category_score['name']),
                                None)
                if category:
                    weight = category['weight']
                    max_score = len(category['scoring_levels'])
                    score = category_score['score']

                    total_weighted_score += (score / max_score) * weight
                    total_weight += weight
            except Exception as e:
                print(e)
                print(category_scores)
                continue

        if total_weight > 0:
            return total_weighted_score / total_weight
        else:
            return 0.0

    @retry(
        stop=stop_after_attempt(5),
        wait=wait_exponential(multiplier=1, min=4, max=10),
        retry=retry_if_exception_type((RateLimitError, APIError))
    )
    def run(self, submission: Submission) -> Dict:
        logger.info(f"Starting grading process for submission {submission.id}")

        try:
            # Initial grading
            initial_grades = self.grade_submission(submission)
            initial_grade_obj = Grade.objects.create(
                assignment=self.assignment,
                submission=submission,
                content=initial_grades,
                type='initial'
            )

            # Critique
            critique = self.critique_grades(initial_grades, submission)
            critique_obj = Critique.objects.create(
                assignment=self.assignment,
                submission=submission,
                grade=initial_grade_obj,
                content=critique
            )

            # Revision
            final_grades = self.revise_grades(initial_grades, critique, submission)
            final_grade_obj = Grade.objects.create(
                assignment=self.assignment,
                submission=submission,
                content=final_grades,
                type='final'
            )

            overall_score = self.calculate_overall_score(final_grades)

            # Update submission
            submission.overall_score = overall_score
            submission.category_scores = final_grades
            submission.grading_critique = critique
            submission.status = 'graded'
            submission.graded_at = timezone.now()
            submission.save()

            logger.info(f"Grading completed for submission {submission.id}")

            return {
                'overall_score': overall_score,
                'category_scores': final_grades,
                'critique': critique
            }

        except (RateLimitError, APIError) as e:
            logger.warning(f"API error encountered. Retrying... Error: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Error during grading process: {str(e)}")
            raise


def extract_json(response):
    print("BEGINNING JSON EXTRACTION PROCESS: ")
    print(response)
    # Find the start of the JSON structure (object or array)
    json_start_obj = response.find('{')
    json_start_arr = response.find('[')

    if json_start_obj == -1 and json_start_arr == -1:
        print("No JSON structure found in the response")
        return None

    # Determine which starts first (if both exist)
    if json_start_arr != -1 and (json_start_arr < json_start_obj or json_start_obj == -1):
        json_start = json_start_arr
        end_char = ']'
    else:
        json_start = json_start_obj
        end_char = '}'

    # Find the corresponding end character
    json_end = response.rfind(end_char)

    if json_end == -1:
        print("No properly closed JSON structure found")
        return None

    # Extract the JSON part of the response
    json_str = response[json_start:json_end + 1]

    try:
        # Parse the JSON
        return json.loads(json_str)
    except json.JSONDecodeError as e:
        print(f"Failed to parse JSON: {e}")
        return None