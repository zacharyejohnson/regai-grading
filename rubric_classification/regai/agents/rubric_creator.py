import json
from typing import Dict, List
from haystack import component
from haystack.components.generators import OpenAIGenerator
from haystack.dataclasses import Document
from haystack.components.retrievers import InMemoryEmbeddingRetriever
from haystack.components.embedders import SentenceTransformersTextEmbedder
from haystack.document_stores.in_memory import InMemoryDocumentStore
from haystack.utils import Secret

@component
class RubricCreator:
    def __init__(self,
                 openai_api_key: str,

                 similarity_threshold: float = 0.7,
                 model_name: str = "gpt-4"):
        self.openai_api_key = Secret.from_token(openai_api_key)
        self.document_store = InMemoryDocumentStore()
        self.similarity_threshold = similarity_threshold
        self.model_name = model_name
        self.generator = OpenAIGenerator(api_key=self.openai_api_key, model=self.model_name)
        self.embedder = SentenceTransformersTextEmbedder()
        self.embedder.warm_up()
        self.retriever = InMemoryEmbeddingRetriever(document_store=self.document_store)

    @component.output_types(rubric=Dict, similar_rubrics=List[Dict])
    def run(self, assignment_description: str):
        similar_rubrics = self._retrieve_similar_rubrics(assignment_description)
        initial_rubric = self._generate_initial_rubric(assignment_description, similar_rubrics)
        return {"rubric": initial_rubric, "similar_rubrics": similar_rubrics}

    def _retrieve_similar_rubrics(self, assignment_description: str) -> List[Dict]:
        embedded_query = self.embedder.run(text=assignment_description)
        similar_docs = self.retriever.run(query_embedding=embedded_query['embedding'], top_k=5)
        similar_rubrics = []
        for doc in similar_docs['documents']:
            if doc.meta.get('similarity_score', 0) >= self.similarity_threshold:
                similar_rubrics.append(json.loads(doc.content))
        return similar_rubrics

    def _generate_initial_rubric(self, assignment_description: str, similar_rubrics: List[Dict]) -> Dict:
        prompt = self._prepare_prompt(assignment_description, similar_rubrics)
        response = self.generator.run(prompt=prompt)
        try:
            generated_rubric = json.loads(response['replies'][0])
        except json.JSONDecodeError:
            generated_rubric = {
                "title": "Generated Rubric",
                "description": "Please review and adjust this auto-generated rubric.",
                "categories": []
            }
        return generated_rubric

    def _prepare_prompt(self, assignment_description: str, similar_rubrics: List[Dict]) -> str:
        prompt = f"""
        Create a comprehensive rubric for the following assignment:

        Assignment Description:
        {assignment_description}

        Your task is to generate a detailed rubric in JSON format. The rubric should include:
        1. A title
        2. A brief description
        3. Multiple categories, each with:
           - A name
           - A weight (percentage)
           - Multiple scoring levels, each with a level number and description

        Here are some similar rubrics for reference:
        {json.dumps(similar_rubrics, indent=2)}

        Please create a rubric that is tailored to the given assignment description while taking inspiration from the similar rubrics provided. Ensure that the categories and scoring levels are specific and relevant to the assignment.

        Return only the JSON object without any additional text.
        """
        return prompt

def add_rubric_to_document_store(document_store: InMemoryDocumentStore, assignment_description: str, rubric: Dict):
    doc = Document(
        content=json.dumps(rubric),
        meta={"assignment_description": assignment_description}
    )
    document_store.write_documents([doc])