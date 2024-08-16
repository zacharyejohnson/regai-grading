<<<<<<< HEAD
import json
import os
from typing import Dict, List

import backoff
from haystack import component
from haystack.components.generators import OpenAIGenerator
from haystack.dataclasses import Document
from haystack.components.retrievers import InMemoryEmbeddingRetriever
from haystack.components.embedders import SentenceTransformersTextEmbedder
from haystack.document_stores.in_memory import InMemoryDocumentStore
from haystack.utils import Secret
from openai import RateLimitError

from ..models import KnowledgeBaseItem

@component
class RubricCreator:
    def __init__(self,
                 openai_api_key: str,
                 similarity_threshold: float = 0.0,
                 model_name: str = "gpt-4o"):
        self.openai_api_key = Secret.from_token(openai_api_key)
        self.document_store = InMemoryDocumentStore()
        self.similarity_threshold = similarity_threshold
        self.model_name = model_name
        self.generator = OpenAIGenerator(api_key=self.openai_api_key,
                                         model=self.model_name,
                                         generation_kwargs={"response_format": {"type": "json_object"}})
        self.embedder = SentenceTransformersTextEmbedder()
        self.embedder.warm_up()
        self.retriever = InMemoryEmbeddingRetriever(document_store=self.document_store)

    @backoff.on_exception(backoff.expo, RateLimitError, max_tries=5)
    @component.output_types(rubric=Dict, similar_rubrics=List[Dict])
    def run(self, assignment_description: str):
        self._load_approved_rubrics()
        similar_rubrics = self._retrieve_similar_rubrics(assignment_description)
        initial_rubric = self._generate_initial_rubric(assignment_description, similar_rubrics)
        self._add_to_knowledge_base(initial_rubric, assignment_description)
        return {"rubric": initial_rubric, "similar_rubrics": similar_rubrics}

    def _load_approved_rubrics(self):
        approved_rubrics = KnowledgeBaseItem.objects.filter(item_type='rubric', status='approved')
        for item in approved_rubrics:
            content = json.dumps(item.content)
            embedding = self.embedder.run(text=content)['embedding']
            doc = Document(content=content, embedding=embedding, meta={"id": item.id})
            self.document_store.write_documents([doc])

    def _retrieve_similar_rubrics(self, assignment_description: str) -> List[Dict]:
        embedded_query = self.embedder.run(text=assignment_description)
        similar_docs = self.retriever.run(query_embedding=embedded_query['embedding'], top_k=5)
        similar_items = []
        for doc in similar_docs['documents']:
            if doc.meta.get('score', 0) >= self.similarity_threshold:
                similar_items.append(json.loads(doc.content))

        if not similar_items:
            print("No similar items found. Returning empty list.")

        return similar_items

    def _generate_initial_rubric(self, assignment_description: str, similar_rubrics: List[Dict]) -> Dict:
        prompt = self._prepare_prompt(assignment_description, similar_rubrics)
        response = self.generator.run(prompt=prompt)
        try:
            generated_rubric = json.loads(response['replies'][0])
        except json.JSONDecodeError as e:
            print("ERROR GENERATING RUBRIC: ", e)
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
            3. One or more categories (as appropriate), each with:
               - A name
               - A weight (percentage)
               - One or multiple scoring levels, each with a level number and description
               
            here is an example of an assignment description: 
            
            More and more people use computers, but not everyone agrees that this benefits society. Those who support advances in technology believe that computers have a positive effect on people. They teach hand-eye coordination, give people the ability to learn about faraway places and people, and even allow people to talk online with other people. Others have different ideas. Some experts are concerned that people are spending too much time on their computers and less time exercising, enjoying nature, and interacting with family and friends. 

            Write a letter to your local newspaper in which you state your opinion on the effects computers have on people. Persuade the readers to agree with you.

            With a rubric with a single scoring category for evaluating essays: 
            {{
              "title": "Persuasive Letter on Computer Effects Rubric",
              "description": "This rubric is designed to assess a persuasive letter to a local newspaper about the effects of computers on people.",
              "categories": [
                {{
                  "name": "Overall Quality",
                  "weight": 100,
                  "scoring_levels": [
                    {{
                      "level": 1,
                      "score": 1,
                      "description": "An undeveloped response that may take a position but offers no more than very minimal support. Contains few or vague details. Is awkward and fragmented. May be difficult to read and understand. May show no awareness of audience. Fails to persuade the reader due to lack of coherent arguments or relevant information about the effects of computers on people."
                    }},
                    {{
                      "level": 2,
                      "score": 2,
                      "description": "An under-developed response that may or may not take a position. Contains only general reasons with unelaborated and/or list-like details. Shows little or no evidence of organization. May be awkward and confused or simplistic. May show little awareness of audience. Presents a weak argument about the effects of computers, lacking in specificity and persuasive power."
                    }},
                    {{
                      "level": 3,
                      "score": 3,
                      "description": "A minimally-developed response that may take a position, but with inadequate support and details. Has reasons with minimal elaboration and more general than specific details. Shows some organization. May be awkward in parts with few transitions. Shows some awareness of audience. Attempts to argue about the effects of computers but lacks depth and compelling evidence."
                    }},
                    {{
                      "level": 4,
                      "score": 4,
                      "description": "A somewhat-developed response that takes a position and provides adequate support. Has adequately elaborated reasons with a mix of general and specific details. Shows satisfactory organization. May be somewhat fluent with some transitional language. Shows adequate awareness of audience. Presents a clear argument about the effects of computers with some supporting evidence, though it may not be fully convincing."
                    }},
                    {{
                      "level": 5,
                      "score": 5,
                      "description": "A developed response that takes a clear position and provides reasonably persuasive support. Has moderately well elaborated reasons with mostly specific details. Exhibits generally strong organization. May be moderately fluent with transitional language throughout. May show a consistent awareness of audience. Offers a convincing argument about the effects of computers, supported by relevant examples and thoughtful analysis."
                    }},
                    {{
                      "level": 6,
                      "score": 6,
                      "description": "A well-developed response that takes a clear and thoughtful position and provides persuasive support. Has fully elaborated reasons with specific details. Exhibits strong organization. Is fluent and uses sophisticated transitional language. May show a heightened awareness of audience. Presents a compelling and nuanced argument about the effects of computers, demonstrating a deep understanding of the topic, providing robust evidence, and effectively addressing potential counterarguments."
                    }}
                  ]
                }}
              ]
            }}
            
            Here are some similar rubrics for reference (ignore if there are none):
            {json.dumps(similar_rubrics, indent=2)}
            

            Please create a rubric that is tailored to the given assignment description while taking inspiration from the similar rubrics provided. Ensure that the categories and scoring levels are specific and relevant to the assignment.
            It would be perfectly normal for a rubric to have a single row with weight 100, or many rows with weight totalling to 100. Please use your best judgement. 

            Return only the JSON object without any additional text.
            """
        return prompt

    def _add_to_knowledge_base(self, rubric: Dict, assignment_description: str):
        content = {
            'rubric': rubric,
            'assignment_description': assignment_description
        }
        # kb_item = KnowledgeBaseItem.objects.create(
        #     item_type='rubric',
        #     content=content,
        #     status='pending'
        # )
        content_str = json.dumps(content)
        embedding = self.embedder.run(text=content_str)['embedding']
        doc = Document(content=content_str, embedding=embedding)
        self.document_store.write_documents([doc])
=======
>>>>>>> parent of fc22ff7 (for marsh)
