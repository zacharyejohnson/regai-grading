<<<<<<< HEAD
import json
import logging
import os
import time
from collections import defaultdict
from datetime import datetime
from functools import lru_cache
from itertools import combinations
from json import JSONDecodeError
from pprint import pformat
from typing import Dict, List, Union, Tuple, Any
from enum import Enum

from django.core.serializers.json import DjangoJSONEncoder
from django.db import transaction
from django.forms import model_to_dict
from django.utils import timezone
from django.db.models import Q
from haystack_integrations.components.generators.anthropic import AnthropicGenerator, AnthropicChatGenerator
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from openai import RateLimitError, APIError
import numpy as np
from scipy.stats import entropy
from sklearn.preprocessing import MinMaxScaler

from haystack import Pipeline, Document
from haystack.components.builders.chat_prompt_builder import ChatPromptBuilder
from haystack.components.generators.chat import OpenAIChatGenerator
from haystack.components.embedders import SentenceTransformersTextEmbedder, SentenceTransformersDocumentEmbedder, \
    OpenAIDocumentEmbedder, OpenAITextEmbedder
from haystack.components.retrievers import InMemoryEmbeddingRetriever
from haystack.document_stores.in_memory import InMemoryDocumentStore
from haystack.dataclasses import ChatMessage
from haystack.utils import Secret, ComponentDevice, Device
from haystack.components.validators import JsonSchemaValidator

from .rubric_generation import extract_json
from ..models import Assignment, Submission, Grade, Critique, Rubric
from ..serializers import CritiqueSerializer, GradeSerializer

from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)


class CustomJSONEncoder(DjangoJSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)


class RevisionStatus(Enum):
    PASS = "PASS"
    MINOR_REVISION = "MINOR_REVISION"
    MAJOR_REVISION = "MAJOR_REVISION"


class GradingPipeline:
    def __init__(self, assignment: Assignment, rubric: Rubric, openai_api_key: str,
                 llm_name='gpt-4o-mini-2024-07-18'):  #'gpt-4o-mini-2024-07-18'):
        self.assignment = assignment
        self.rubric = rubric
        self.openai_api_key = Secret.from_token(openai_api_key)
        self.llm_name = llm_name

        self.document_store = InMemoryDocumentStore(embedding_similarity_function="cosine")
        self.embedder = OpenAITextEmbedder(
            api_key=Secret.from_token(openai_api_key),
            model='text-embedding-3-small'
        )
        # self.embedder.warm_up()
        self.document_embedder = OpenAIDocumentEmbedder(
            api_key=Secret.from_token(openai_api_key),
            model='text-embedding-3-small'
        )
        # self.document_embedder.warm_up()
        self.grade_retriever = InMemoryEmbeddingRetriever(
            document_store=self.document_store,
            filters={'field': 'meta.type',
                     'operator': '==',
                     'value': 'grade'}
        )
        self.critique_retriever = InMemoryEmbeddingRetriever(
            document_store=self.document_store,
            filters={'field': 'meta.type',
                     'operator': '==',
                     'value': 'critique'}
        )
        self.submission_retriever = InMemoryEmbeddingRetriever(
            document_store=self.document_store,
            filters={'field': 'meta.type',
                     'operator': '==',
                     'value': 'submission'}
        )

        self._load_knowledge_base()

        self.initial_scorer_pipeline = self._create_initial_scorer_pipeline()
        self.critic_pipeline = self._create_critic_pipeline()
        self.reviser_pipeline = self._create_reviser_pipeline()

        grades_2640 = Grade.objects.filter(submission__id=2640)
        print(f"Number of grades for submission 2640: {grades_2640.count()}")
        for grade in grades_2640:
            print(
                f"Grade {grade.id}: Type: {grade.type}, Human Approved: {grade.human_approved}, Content: {grade.content}")

        # Get all submissions with their grade counts
        from django.db.models import Count
        submissions_with_grade_counts = Submission.objects.annotate(grade_count=Count('grades'))
        for sub in submissions_with_grade_counts:
            print(f"Submission {sub.id}: {sub.grade_count} grades")

        # Get the content of the submission_retriever
        print(self.submission_retriever.__class__.__name__)
        print(self.submission_retriever.__dict__)

        # Get the distribution of grade types
        from django.db.models import Count
        grade_type_distribution = Grade.objects.values('type').annotate(count=Count('id'))
        print(grade_type_distribution)

        # Get the distribution of human_approved grades
        human_approved_distribution = Grade.objects.values('human_approved').annotate(count=Count('id'))
        print(human_approved_distribution)

    def _load_knowledge_base(self):
        approved_grades = Grade.objects.filter(assignment=self.assignment, human_approved=True).select_related(
            'submission')
        approved_critiques = Critique.objects.filter(assignment=self.assignment, human_approved=True).select_related(
            'grade', 'submission')

        submissions = []
        for grade in approved_grades:
            submission = Submission.objects.get(id=grade.submission_id)
            if submission not in submissions:
                submissions.append(submission)


        grade_documents = []
        critique_documents = []
        submission_documents = []

        for grade in approved_grades:
            grade_dict = {
                'id': grade.id,
                'content': grade.content,
                'human_approved': grade.human_approved,
                'created_at': grade.created_at,
                'approved_at': grade.approved_at,
                'submission_id': grade.submission_id,
                'type': grade.type
            }
            doc = Document(
                content=json.dumps(grade_dict, cls=CustomJSONEncoder),
                meta={"type": "grade", "id": grade.id}
            )
            grade_documents.append(doc)

        for critique in approved_critiques:
            critique_dict = {
                'id': critique.id,
                'content': critique.content,
                'human_approved': critique.human_approved,
                'created_at': critique.created_at,
                'approved_at': critique.approved_at,
                'grade_id': critique.grade_id,
                'submission_id': critique.submission_id,
                'revision_status': critique.revision_status
            }
            doc = Document(
                content=json.dumps(critique_dict, cls=CustomJSONEncoder),
                meta={"type": "critique", "id": critique.id, "revision_status": critique.revision_status}
            )
            critique_documents.append(doc)

        for submission in submissions:
            doc = Document(
                content=json.dumps(submission.content, cls=CustomJSONEncoder),
                meta={"type": "submission", "submission_id": submission.id}
            )
            submission_documents.append(doc)

        # Embed and write documents
        for doc_list in [grade_documents, critique_documents, submission_documents]:
            if doc_list:
                docs_with_embeddings = self.document_embedder.run(documents=doc_list)["documents"]
                self.document_store.write_documents(docs_with_embeddings)

    def _create_initial_scorer_pipeline(self) -> Pipeline:
        pipeline = Pipeline()

        scorer_template = [
            ChatMessage.from_system(
                "You are an expert assignment grader tasked with evaluating student submissions for a school assignment."
                "You will be given an assignment, the rubric made by the teacher for scoring these assignments, the students submission, "
                "and (possibly) some example submissions with grades already given by the teacher which you can use to model your "
                "responses."),
            ChatMessage.from_user("""
            Assignment Description:
            {{assignment_description}}

            Rubric to guide your scoring decisions: 
            {{rubric}}

            Student Submission:
            {{submission}}

            Similar approved grades:
            {{similar_grades}}

            Instructions:
            1. Carefully read the assignment description, rubric, and student submission.
            2. Review the similar approved grades for reference. These are grades given by teh teavher, so you should model 
            the grades you give after these. Let these guide how harsh or not harsh you should be in your evaluations. 
            3. Evaluate the submission for EACH category in the rubric.
            4. Provide a score and detailed justification for every category.
            5. Format your response as a JSON object containing an array of scores for each category.

            Your response MUST be in the following JSON format:
            {
                "scores": [
                    {
                        "name": "category name from the rubric",
                        "score": integer corresponding to a scoring level on the rubric,
                        "justification": "detailed justification for the score, pointing to specific parts of the submission that correspond to specific cells of the rubric"
                    },
                    ...
                ]
            }

            IMPORTANT:
            - Ensure you include an object for EVERY category in the rubric.
            - Your response must be a single, valid JSON object that can be parsed without additional processing.
            - If your justification cannot be a multi-line string, as that is not valid JSON format. 
            - Use proper JSON formatting, including escape characters for any special characters in the text. Your output must be loadable by python's json.loads() function
            - ONLY give the json object in your response. 
            """)
        ]

        prompt_builder = ChatPromptBuilder(template=scorer_template)
        # chat_generator = OpenAIChatGenerator(api_key=self.openai_api_key, model=self.llm_name)
        chat_generator = OpenAIChatGenerator(api_key=self.openai_api_key, model=self.llm_name,
                                             generation_kwargs={'max_tokens': 4096})
        #AnthropicChatGenerator(api_key=Secret.from_token(os.environ['ANTHROPIC_API_KEY']),
                                                # model='claude-3-haiku-20240307',
                                                # #'claude-3-5-sonnet-20240620',#'claude-3-haiku-20240307',
                                                # generation_kwargs={'max_tokens': 4096})
        # json_validator = JsonSchemaValidator(json_schema={
        #     "type": "object",
        #     "properties": {
        #         "scores": {
        #             "type": "array",
        #             "items": {
        #                 "type": "object",
        #                 "properties": {
        #                     "name": {"type": "string"},
        #                     "score": {"type": "integer"},
        #                     "justification": {"type": "string"}
        #                 },
        #                 "required": ["name", "score", "justification"]
        #             }
        #         }
        #     },
        #     "required": ["scores"]
        # })

        pipeline.add_component("prompt_builder", prompt_builder)
        pipeline.add_component("chat_generator", chat_generator)
        # pipeline.add_component("json_validator", json_validator)
        pipeline.connect("prompt_builder.prompt", "chat_generator.messages")
        # pipeline.connect("chat_generator.replies", "json_validator.messages")

        return pipeline

    def _create_critic_pipeline(self) -> Pipeline:
        pipeline = Pipeline()

        critic_template = [
            ChatMessage.from_system(
                "You are an expert educator who reviews grades given to student submissions for assignments. The grades are given "
                "to a submission for an assignment from a junior grader, who sometimes does not give accurate grades. "),
            ChatMessage.from_user("""
                Rubric:
                {{rubric}}

                Student Submission:
                {{student_submission}}

                Grade to Review:
                {{grade_to_review}}

                Grades for Similar Submissions:
                {{diverse_grades}}

                Instructions:
                1. Review the grade given by the scorer for each category.
                2. Review the similar approved critiques for reference.
                3. Carefully examine the diverse grades for similar submissions, considering how they compare to the grade under review.
                These are grades that were given already by the teacher. Use them to derive insights into the nuanced way they give grades, 
                such as not considering grammar mistakes or by weighing grade level into their scores. 
                4. Ensure that the scorer has followed the rubric accurately for each category.
                5. Provide a detailed critique for each category, explaining your assessment.
                6. After reviewing all categories and considering the diverse grades, determine an overall revision status for the entire critique:
                   - PASS (no changes needed)
                   - MINOR_REVISION (small adjustments required)
                   - MAJOR_REVISION (significant changes or reconsideration required)

                In your critique, explicitly discuss how the grade compares to the diverse grades provided, and whether any adjustments should be made based on these comparisons.

                Provide your critique in the following JSON format:
                {
                    "overall_assessment": "overall assessment of the grading, including comparison to diverse grades",
                    "category_critiques": [
                        {
                            "category": "category name",
                            "critique": "detailed critique of the grading for this category, referencing diverse grades if relevant"
                        },
                        ...
                    ],
                    "potential_biases": ["list of potential biases"],
                    "suggestions_for_improvement": ["list of suggestions"],
                    "revision_status": "PASS" or "MINOR_REVISION" or "MAJOR_REVISION"
                }

                IMPORTANT:
                - Ensure you include an object for EVERY category in the rubric.
                - Your response must be a single, valid JSON object that can be parsed without additional processing.
                - Use proper JSON formatting, including escape characters for any special characters in the text.
                - ONLY give the JSON object in your response. 
                - Often, the grader gives grades that are too low. Please review the providd submissions and their grades to understand 
                how the teacher gives grades in a nuanced way, considering the grade level of the students and not considering certain things 
                like grammar or spelling errors. 
                """)
        ]

        prompt_builder = ChatPromptBuilder(template=critic_template)
        chat_generator = OpenAIChatGenerator(api_key=self.openai_api_key, model=self.llm_name,
                                             generation_kwargs={'max_tokens': 4096})
        # json_validator = JsonSchemaValidator(json_schema={
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
        #         "potential_biases": {
        #             "type": "array",
        #             "items": {"type": "string"}
        #         },
        #         "suggestions_for_improvement": {
        #             "type": "array",
        #             "items": {"type": "string"}
        #         },
        #         "revision_status": {
        #             "type": "string",
        #             "enum": ["PASS", "MINOR_REVISION", "MAJOR_REVISION"]
        #         }
        #     },
        #     "required": ["overall_assessment", "category_critiques", "potential_biases", "suggestions_for_improvement",
        #                  "revision_status"]
        # })

        pipeline.add_component("prompt_builder", prompt_builder)
        pipeline.add_component("chat_generator", chat_generator)
        # pipeline.add_component("json_validator", json_validator)
        pipeline.connect("prompt_builder.prompt", "chat_generator.messages")
        # pipeline.connect("chat_generator.replies", "json_validator.messages")

        return pipeline

    def _create_reviser_pipeline(self) -> Pipeline:
        pipeline = Pipeline()

        reviser_template = [
            ChatMessage.from_system("You are an assignment grader tasked with revising grades based on critique."
                                    "A grader had previously made these grades, and they may need revisions based on the "
                                    "critique of the course instructor. Please change the grade address the concerns (if there are any) specified in the critique."),
            ChatMessage.from_user("""
            Rubric:
            {{rubric}}

            Student Submission: 
            {{student_submission}}

            Original Grades:
            {{original_grades}}

            Critique:
            {{critique}}

            Instructions:
            1. Carefully review the original grades, the critique, and the rubric.
            2. Address each point raised in the critique.
            3. Revise the grades according to the critique and rubric.
            4. Provide a detailed justification for each revised grade, pointing to specific parts of the submission and the rubric.

            Provide a revised grade in the EXACT SAME json format as the Original Grades:
            {
                "scores": [
                    {
                        "name": "category name from the rubric",
                        "score": integer corresponding to a scoring level on the rubric,
                        "justification": "detailed justification for the score, pointing to specific parts of the submission that correspond to specific cells of the rubric"
                    },
                    ...
                ]
            }
            
            IMPORTANT:
            - Ensure you include an object for EVERY category in the rubric.
            - Your response must be a single, valid JSON object that can be parsed without additional processing.
            - If your justification cannot be a multi-line string, as that is not valid JSON format. 
            - Use proper JSON formatting, including escape characters for any special characters in the text. Your output must be loadable by python's json.loads() function
            - ONLY give the json object in your response. Do not give a preamble or explanation outside of the json response. 
            """)
        ]

        prompt_builder = ChatPromptBuilder(template=reviser_template)
        chat_generator = OpenAIChatGenerator(api_key=self.openai_api_key, model=self.llm_name,
                                             generation_kwargs={'max_tokens': 4096})
        # # AnthropicChatGenerator(api_key=Secret.from_token(os.environ['ANTHROPIC_API_KEY']),
        #                                         model='claude-3-5-sonnet-20240620',  #'claude-3-haiku-20240307',
        #                                         generation_kwargs={'max_tokens': 4096})
        # json_validator = JsonSchemaValidator(json_schema={
        #     "type": "object",
        #     "properties": {
        #         "scores": {
        #             "type": "array",
        #             "items": {
        #                 "type": "object",
        #                 "properties": {
        #                     "name": {"type": "string"},
        #                     "score": {"type": "integer"},
        #                     "justification": {"type": "string"}
        #                 },
        #                 "required": ["name", "score", "justification"]
        #             }
        #         }
        #     },
        #     "required": ["scores"]
        # })

        pipeline.add_component("prompt_builder", prompt_builder)
        pipeline.add_component("chat_generator", chat_generator)
        # pipeline.add_component("json_validator", json_validator)
        pipeline.connect("prompt_builder.prompt", "chat_generator.messages")
        # pipeline.connect("chat_generator.replies", "json_validator.messages")

        return pipeline

    def calculate_overall_score(self, grade: Dict) -> float:
        scores = grade['scores']

        total_weighted_score = 0
        total_weight = 0

        for category_score in scores:
            category = next((c for c in self.rubric.content['categories'] if c['name'] == category_score['name']), None)
            if category:
                weight = category['weight']
                max_score = len(category['scoring_levels'])
                score = category_score['score']

                total_weighted_score += (score / max_score) * weight
                total_weight += weight

        return total_weighted_score / total_weight if total_weight > 0 else 0.0

    def calculate_entropy(self, scores: np.ndarray, num_bins: int = 10) -> float:
        """Calculate the entropy of the score distribution."""
        hist, _ = np.histogram(scores, bins=num_bins, range=(0, 1))
        prob_dist = hist / np.sum(hist)
        return entropy(prob_dist)

    def diversity_score(self, selected_scores: np.ndarray, all_scores: np.ndarray) -> float:
        all_entropy = self.calculate_entropy(all_scores)
        selected_entropy = self.calculate_entropy(selected_scores)
        return selected_entropy - all_entropy

    def get_diverse_similar_grades(self, query: str, top_k: int = 3, fetch_k: int = 50) -> List[Dict[str, Any]]:
        embedded_query = self.embedder.run(text=query)
        similar_docs = self.grade_retriever.run(query_embedding=embedded_query['embedding'],
                                                top_k=fetch_k)

        grades = []
        similarities = []
        for doc in similar_docs['documents']:
            if doc.meta['type'] == 'grade':
                try:
                    content = json.loads(doc.content)
                    grades.append(content)
                    similarities.append(doc.score)
                except json.JSONDecodeError:
                    logger.warning(f"Could not parse document content: {doc.content}")

        if not grades:
            logger.warning("No valid documents found")
            return []

        grades_array = np.array(grades)
        similarities_array = np.array(similarities)
        scores_array = np.array([self.calculate_overall_score(grade['content']) for grade in grades])

        # Generate all possible combinations
        combinations_array = np.array(list(combinations(range(len(grades)), top_k)))

        # Calculate similarity scores for all combinations
        similarity_scores = similarities_array[combinations_array].mean(axis=1)

        # Calculate diversity scores for all combinations
        diversity_scores = np.array([
            self.diversity_score(scores_array[combo], scores_array)
            for combo in combinations_array
        ])

        # Calculate combined scores - the geometric mean of each sub score
        combined_scores = similarity_scores ** 0.5 * diversity_scores ** 0.5

        # Find the best combination
        best_combination_index = np.argmax(combined_scores)
        best_combination = combinations_array[best_combination_index]

        best_set = [grades[i] for i in best_combination]

        return best_set

    @lru_cache(maxsize=100)
    def get_diverse_grades_by_score(self, query_submission: Submission, initial_score: float, top_k: int = 3) -> list[Any] | list[tuple[Any, Any]]:
        print(f"\n--- Starting diverse grade selection for submission {query_submission.id} ---")
        print(f"Initial score: {initial_score}")

        embedded_query = self.embedder.run(text=query_submission.content)
        similar_submissions = self.submission_retriever.run(query_embedding=embedded_query['embedding'], top_k=50)
        print(f"Retrieved {len(similar_submissions['documents'])} similar submissions")

        grades_with_submissions = []
        for doc in similar_submissions['documents']:
            submission = Submission.objects.get(id=doc.meta['submission_id'])
            approved_grades = Grade.objects.filter(submission_id=doc.meta['submission_id'], human_approved=True)

            for approved_grade in approved_grades:
                grade_score = self.calculate_overall_score(approved_grade.content)
                grades_with_submissions.append((approved_grade, submission, grade_score, doc.score))
                print(
                    f"Found approved grade for submission {submission.id}: score={grade_score:.3f}, similarity={doc.score:.3f}")

        print(f"\nTotal approved grades found: {len(grades_with_submissions)}")

        if not grades_with_submissions:
            print("WARNING: No approved grades found for similar submissions!")
            return []

        # Sort by similarity score
        grades_with_submissions.sort(key=lambda x: x[3], reverse=True)
        print("\nTop 5 grades by similarity:")
        for i, (grade, submission, score, similarity) in enumerate(grades_with_submissions[:5]):
            print(f"  {i + 1}. Submission {submission.id}: score={score:.3f}, similarity={similarity:.3f}")

        below_threshold = initial_score - (initial_score * 0.1)  # 10% below
        above_threshold = initial_score + (initial_score * 0.1)  # 10% above

        below_grades = [g for g in grades_with_submissions if g[2] < below_threshold]
        close_grades = [g for g in grades_with_submissions if below_threshold <= g[2] <= above_threshold]
        above_grades = [g for g in grades_with_submissions if g[2] > above_threshold]

        print(f"\nCategorized grades:")
        print(f"  Below ({len(below_grades)}): {[f'{g[2]:.3f}' for g in below_grades]}")
        print(f"  Close ({len(close_grades)}): {[f'{g[2]:.3f}' for g in close_grades]}")
        print(f"  Above ({len(above_grades)}): {[f'{g[2]:.3f}' for g in above_grades]}")

        selected_grades = []

        # Select the most similar grade from each category
        for category, grades in [("below", below_grades), ("close", close_grades), ("above", above_grades)]:
            if grades:
                selected = max(grades, key=lambda x: x[3])
                selected_grades.append(selected)
                print(
                    f"Selected {category} grade: submission {selected[1].id}, score {selected[2]:.3f}, similarity {selected[3]:.3f}")
            else:
                print(f"No grades found for category: {category}")

        print(f"\nInitial selection: {len(selected_grades)} grades")

        # If we don't have all three categories, fill with the most similar remaining grades
        remaining_grades = [g for g in grades_with_submissions if g not in selected_grades]
        if len(selected_grades) < top_k:
            additional = remaining_grades[:top_k - len(selected_grades)]
            selected_grades.extend(additional)
            print(f"Added {len(additional)} additional grades to reach top_k={top_k}")
            for grade in additional:
                print(f"Additional grade: submission {grade[1].id}, score {grade[2]:.3f}, similarity {grade[3]:.3f}")

        print(f"\nBefore fallback: {len(selected_grades)} grades selected")

        # Fallback mechanism
        if len(set(g[2] for g in selected_grades)) < 3:  # If we don't have 3 unique scores
            print("\n*** Fallback mechanism activated ***")
            sorted_by_score = sorted(grades_with_submissions, key=lambda x: x[2])
            if not any(g for g in selected_grades if g[2] < initial_score):
                selected_grades.append(sorted_by_score[0])
            if not any(g for g in selected_grades if g[2] > initial_score):
                selected_grades.append(sorted_by_score[-1])
            if not any(g for g in selected_grades if abs(g[2] - initial_score) <= 0.1):
                middle_index = len(sorted_by_score) // 2
                selected_grades.append(sorted_by_score[middle_index])
        else:
            print("Fallback mechanism not needed")

        # Remove duplicates and limit to top_k
        selected_grades = list(dict.fromkeys(selected_grades))[:top_k]
        print(f"\nFinal selection: {len(selected_grades)} grades")
        for grade in selected_grades:
            print(f"Final grade: submission {grade[1].id}, score {grade[2]:.3f}, similarity {grade[3]:.3f}")

        print("--- Diverse grade selection completed ---\n")

        return [(grade, submission) for grade, submission, _, _ in selected_grades]

    def get_similar_submissions_with_critiques(self, query_submission: Submission, top_k: int = 10):
        embedded_query = self.embedder.run(text=query_submission.content)
        similar_submissions = self.submission_retriever.run(query_embedding=embedded_query['embedding'], top_k=top_k)

        similar_submissions_with_critiques = []
        for doc in similar_submissions['documents']:
            submission_data = json.loads(doc.content)
            submission = Submission.objects.get(id=submission_data['id'])
            approved_critiques = Critique.objects.filter(assignment_id=submission.assignment_id, human_approved=True)

            if approved_critiques.exists():
                similar_submissions_with_critiques.append((submission, doc.score, approved_critiques))

        return similar_submissions_with_critiques

    def get_diverse_critiques_by_submission_similarity(self, query_submission: Submission, top_k: int = 3) -> List[Dict[str, Any]]:
        similar_submissions = self.get_similar_submissions_with_critiques(query_submission, top_k=10)

        # Group critiques by revision status
        grouped_critiques = defaultdict(list)
        for submission, similarity_score, critiques in similar_submissions:
            for critique in critiques:
                grouped_critiques[critique.revision_status].append((critique, similarity_score))

        selected_critiques = []

        # Select one of each revision status, prioritizing similarity within each group
        for status in ['PASS', 'MINOR_REVISION', 'MAJOR_REVISION']:
            if grouped_critiques[status]:
                selected_critiques.append(max(grouped_critiques[status], key=lambda x: x[1])[0])

        # If we don't have all three types, fill with the most similar remaining critiques
        remaining_critiques = [critique for group in grouped_critiques.values() for critique in group if
                               critique[0] not in selected_critiques]
        remaining_critiques.sort(key=lambda x: x[1], reverse=True)

        selected_critiques.extend([critique[0] for critique in remaining_critiques[:top_k - len(selected_critiques)]])

        return selected_critiques[:top_k]

    def _get_similar_documents(self, query: str, doc_type: str, top_k: int = 3, submission: Submission = None) -> List[
        Any]:
        if doc_type == 'grade':
            return self.get_diverse_similar_grades(query, top_k)
        elif doc_type == 'critique':
            if submission is None:
                raise ValueError("submission is required for critique retrieval")
            return self.get_diverse_critiques_by_submission_similarity(submission, top_k)
        else:
            raise ValueError(f"Invalid document type: {doc_type}")

    @transaction.atomic
    def _perform_critique_revision_cycle(self, submission: Submission, initial_grade: Grade) -> Tuple[Grade, Critique]:
        max_iterations = 3
        current_grade = initial_grade
        critique = None

        for iteration in range(max_iterations):
            critique, revision_needed = self._get_critique(submission, current_grade)

            if not critique:
                logger.error("Failed to get critique")
                break

            if critique.content['revision_status'] == RevisionStatus.PASS.value:
                current_grade.type = 'final'
                current_grade.save()
                break

            if critique.content['revision_status'] == RevisionStatus.MINOR_REVISION.value:
                revised_grade = self._revise_grades(submission, current_grade, critique)
                if revised_grade:
                    revised_grade.type = 'final'
                    revised_grade.save()
                    current_grade = revised_grade
                break

            if critique.content['revision_status'] == RevisionStatus.MAJOR_REVISION.value:
                if iteration < max_iterations - 1:
                    revised_grade = self._revise_grades(submission, current_grade, critique)
                    if revised_grade:
                        current_grade = revised_grade
                else:
                    current_grade.type = 'final'
                    current_grade.save()
                    break

        if current_grade.type != 'final':
            current_grade.type = 'final'
            current_grade.save()

        # except Exception as e:
        #     logger.error(f"Error in critique_revision_cycle for submission {submission.id}: {str(e)}")
        #     transaction.set_rollback(True)

        return current_grade, critique

    @transaction.atomic
    def _get_critique(self, submission: Submission, grade: Grade) -> tuple[None, bool] | tuple[Any, bool | Any]:
        print(f"\n=== Starting critique process for submission {submission.id} ===")
        initial_score = self.calculate_overall_score(grade.content)
        print(f"Initial score for submission {submission.id}: {initial_score:.3f}")

        diverse_grades = self.get_diverse_grades_by_score(submission, initial_score)
        print(f"\nRetrieved {len(diverse_grades)} diverse grades for comparison")
        for i, (grade, sub) in enumerate(diverse_grades):
            print(
                f"Diverse grade {i + 1}: submission {sub.id}, score {self.calculate_overall_score(grade.content):.3f}")

        result = self.critic_pipeline.run({
            "prompt_builder": {
                "template_variables": {
                    "rubric": json.dumps(self.rubric.content, indent=2),
                    "student_submission": submission.content,
                    "grade_to_review": json.dumps(grade.content, indent=2),
                    "diverse_grades": json.dumps([
                        {
                            "submission": g[1].content,
                            "grade": g[0].content,
                            "overall_score": self.calculate_overall_score(g[0].content)
                        } for g in diverse_grades
                    ], indent=2)
                }
            }
        },
            debug=True,
            include_outputs_from={'chat_generator'}
        )

        logger.debug(f"Critic pipeline result: {result}")

        if result is None or 'chat_generator' not in result or 'replies' not in result['chat_generator']:
            logger.error("Unexpected result structure from critic_pipeline")
            return None, False

        critique_content = extract_json(result["chat_generator"]["replies"][0].content)

        if critique_content is None:
            logger.error("Failed to extract JSON from critic_pipeline result")
            return None, False

        logger.info(f"Extracted critique content: {pformat(critique_content)}")

        with transaction.atomic():
            critique = Critique.objects.create(
                assignment=self.assignment,
                submission=submission,
                content=critique_content,
                grade=grade,
                revision_status=critique_content.get('revision_status', 'PASS')
            )
            logger.info(f"Created critique with ID {critique.id}, revision status: {critique.revision_status}")

        revision_needed = critique_content.get('revision_status', 'PASS') != 'PASS'
        logger.info(f"Revision needed: {revision_needed}")

        print("=== Critique process completed ===\n")

        return critique, revision_needed

    @transaction.atomic
    def _revise_grades(self, submission: Submission, current_grade: Grade, critique: Critique) -> Grade:
        logger.info(f"Starting grade revision for submission {submission.id}, current grade {current_grade.id}")

        try:
            initial_score = self.calculate_overall_score(current_grade.content)
            logger.info(f"Initial score: {initial_score}")

            result = self.reviser_pipeline.run({
                "prompt_builder": {
                    "template_variables": {
                        "rubric": json.dumps(self.rubric.content, indent=2),
                        "student_submission": submission.content,
                        "original_grades": json.dumps(current_grade.content, indent=2),
                        "critique": json.dumps(critique.content, indent=2)
                    }
                }
            },
                debug=True,
                include_outputs_from={'chat_generator'}
            )

            logger.debug(f"Reviser pipeline result: {result}")

            try:
                revised_grade_content = extract_json(result['chat_generator']['replies'][0].content)
                logger.info(f"Extracted revised grade content: {pformat(revised_grade_content)}")
            except JSONDecodeError as json_error:
                logger.error(f"JSON extraction failed: {str(json_error)}")
                logger.debug(f"Raw content: {result['chat_generator']['replies'][0].content}")
                raise ValueError("Failed to extract valid JSON from the reviser's response")

            if 'scores' not in revised_grade_content or not isinstance(revised_grade_content['scores'], list):
                logger.error(f"Revised grade content does not have the expected structure: {revised_grade_content}")
                raise ValueError(f"Revised grade content does not have the expected structure: {revised_grade_content}")

            with transaction.atomic():
                revised_grade = Grade.objects.create(
                    assignment_id=submission.assignment.id,
                    submission=submission,
                    content=revised_grade_content,
                    type='revision'
                )
                logger.info(f"Created revised grade with ID {revised_grade.id}")

            new_score = self.calculate_overall_score(revised_grade_content)
            logger.info(f"New overall score: {new_score} (change of {new_score - initial_score})")

            return revised_grade

        except Exception as e:
            logger.error(f"Error in _revise_grades: {str(e)}", exc_info=True)
            raise


    @retry(stop=stop_after_attempt(5), wait=wait_exponential(multiplier=1, min=4, max=10),
           retry=retry_if_exception_type((RateLimitError, APIError)))
    def run(self, submission: Submission) -> Dict:
        logger.info(f"Starting REGAI grading process for submission {submission.id}")
        start = time.time()
        try:
            # Initial scoring phase
            initial_grade = self._perform_initial_scoring(submission)

            # Critique and revision cycle
            final_grade, final_critique = self._perform_critique_revision_cycle(submission, initial_grade)

            # Calculate overall score
            overall_score = self.calculate_overall_score(final_grade.content)

            # Update submission
            self._update_submission(submission, overall_score, final_grade, final_critique)

            logger.info(f"REGAI grading completed for submission {submission.id}")
            end = time.time()
            logger.info(f"REGAI grading took {end - start:.2f} seconds")

            return {
                'overall_score': overall_score,
                'category_scores': final_grade,
                'critique': final_critique
            }

        except Exception as e:
            logger.error(f"Error during REGAI grading process for submission {submission.id}: {str(e)}")
            raise

    def _perform_initial_scoring(self, submission: Submission) -> Grade:
        logger.info(f"Starting initial scoring for submission {submission.id}")
        try:
            similar_grades = self._get_similar_documents(submission.content, 'grade')
            logger.debug(f"Retrieved {len(similar_grades)} similar grades")

            result = self.initial_scorer_pipeline.run({
                "prompt_builder": {
                    "template_variables": {
                        "assignment_description": self.assignment.description,
                        "rubric": json.dumps(self.rubric.content, indent=2),
                        "submission": submission.content,
                        "similar_grades": json.dumps(similar_grades, indent=2)
                    }
                },
            },
                debug=True,
                include_outputs_from={'chat_generator'}
            )

            logger.debug(f"Initial scoring result: {result}")

            content = extract_json(result['chat_generator']['replies'][0].content)
            logger.debug(f"Extracted content: {content}")

            initial_grade = Grade.objects.create(
                assignment=self.assignment,
                submission=submission,
                content=content,
                type='initial'
            )
            logger.info(f"Created initial grade with ID {initial_grade.id}")

            return initial_grade
        except Exception as e:
            logger.error(f"Error in _perform_initial_scoring for submission {submission.id}: {str(e)}", exc_info=True)
            raise

    def _update_submission(self, submission: Submission, overall_score: float, final_grade: Grade,
                           final_critique: Critique):
        submission.overall_score = overall_score
        submission.category_scores = final_grade.content['scores']
        submission.grading_critique = final_critique.content if final_critique else None
        submission.status = 'graded'
        submission.graded_at = timezone.now()
        submission.save()

    # def _clear_chat_history(self):
    #     # Clear chat history for all OpenAIChatGenerator components
    #     for pipeline in [self.initial_scorer_pipeline, self.critic_pipeline, self.reviser_pipeline]:
    #         for component in pipeline.components.values():
    #             if len(component.chat_history) > 0:
    #                 component.chat_history.clear()
=======
>>>>>>> parent of fc22ff7 (for marsh)
