import json
import os
from typing import Dict, List
from haystack import component, Document
from haystack.components.embedders import SentenceTransformersTextEmbedder
from haystack.components.generators import OpenAIGenerator
from haystack.components.retrievers import InMemoryEmbeddingRetriever
from haystack.document_stores.in_memory import InMemoryDocumentStore
from haystack.utils import Secret
from ..models import Assignment, AssignmentAgent, KnowledgeBaseItem

@component
class Grader:
    def __init__(self,
                 openai_api_key: str,
                 model_name: str = "gpt-4o",
                 assignment: Assignment = None):
        self.openai_api_key = Secret.from_token(openai_api_key)
        self.model_name = model_name
        self.generator = OpenAIGenerator(api_key=self.openai_api_key, model=self.model_name)
        self.assignment = assignment
        self.db_obj = AssignmentAgent.objects.create(
            assignment=assignment,
            agent_type='grader'
        )
        self.document_store = InMemoryDocumentStore()
        self.embedder = SentenceTransformersTextEmbedder()
        self.embedder.warm_up()
        self.retriever = InMemoryEmbeddingRetriever(document_store=self.document_store)

    @component.output_types(grade=Dict, grading_process=List[Dict])
    def run(self, submission_text: str, rubric: Dict):
        similar_grades = self._retrieve_similar_grades(submission_text)
        prompt = self._prepare_grading_prompt(submission_text, rubric, similar_grades)
        response = self.generator.run(prompt=prompt)

        try:
            grading_result = json.loads(response['replies'][0])
            initial_grade = grading_result['grade']
            grading_process = grading_result['grading_process']
        except json.JSONDecodeError:
            initial_grade = {
                "overall_score": 0,
                "category_scores": [],
                "justification": "Error in grading process. Please review manually."
            }
            grading_process = []

        # self._add_to_knowledge_base(initial_grade, submission_text, rubric, "initial_grade")
        return {"grade": initial_grade, "grading_process": grading_process}

    def _retrieve_similar_grades(self, submission_text: str) -> List[Dict]:
        embedded_query = self.embedder.run(text=submission_text)
        similar_docs = self.retriever.run(query_embedding=embedded_query['embedding'], top_k=2)
        similar_grades = []
        for doc in similar_docs['documents']:
            similar_grades.append(json.loads(doc.content))
        return similar_grades

    def _prepare_grading_prompt(self, submission_text: str, rubric: Dict, similar_grades: List[Dict]) -> str:
        prompt = f"""
        Grade the following student submission based on the provided rubric. 

        Submission:
        {submission_text}

        Rubric:
        {json.dumps(rubric, indent=2)}

        Similar approved grades for reference:
        {json.dumps(similar_grades, indent=2)}

        Your task is to:
        1. Carefully read the submission and the rubric.
        2. For each category in the rubric, assign a score and provide a brief justification.
        3. Calculate the overall score based on the category weights.
        4. Provide an overall justification for the grade.
        5. Document your grading process, including any key points or considerations.

        Return your response as a JSON object with the following structure:
        {{
            "grade": {{
                "overall_score": <float>,
                "category_scores": [
                    {{
                        "name": <string>,
                        "score": <float>,
                        "justification": <string>
                    }},
                    ...
                ],
                "justification": <string>
            }},
            "grading_process": [
                {{
                    "step": <string>,
                    "details": <string>
                }},
                ...
            ]
        }}

        Ensure your grading is fair, consistent, and well-justified based on the rubric criteria and similar approved grades.
        """
        return prompt

    def _add_to_knowledge_base(self, grade: Dict, submission_text: str, rubric: Dict, item_type: str):
        content = {
            'grade': grade,
            'submission_text': submission_text,
            'rubric': rubric
        }
        # kb_item = KnowledgeBaseItem.objects.create(
        #     item_type=item_type,
        #     content=content,
        #     status='pending'
        # )
        content_str = json.dumps(content)
        embedding = self.embedder.run(text=content_str)['embedding']
        doc = Document(content=content_str, embedding=embedding)
        self.document_store.write_documents([doc])