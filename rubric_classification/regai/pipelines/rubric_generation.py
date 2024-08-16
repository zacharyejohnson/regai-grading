# rubric_pipeline.py
import json
import logging
from typing import Dict, List
from django.utils import timezone
from haystack.utils import Secret
from haystack_integrations.components.generators.anthropic import AnthropicGenerator
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from openai import RateLimitError, APIError
from haystack import Pipeline
from haystack.components.builders import PromptBuilder
from haystack.components.generators import OpenAIGenerator
from haystack.components.validators import JsonSchemaValidator
from haystack.dataclasses import ChatMessage, Document
from haystack.document_stores.in_memory import InMemoryDocumentStore
from haystack.components.retrievers import InMemoryEmbeddingRetriever
from haystack.components.embedders import SentenceTransformersTextEmbedder

from ..models import Assignment, Rubric

logger = logging.getLogger(__name__)

class RubricGenerationPipeline:
    def __init__(self, assignment: Assignment, openai_api_key: str):
        self.assignment = assignment
        self.openai_api_key = Secret.from_token(openai_api_key)
        self.document_store = InMemoryDocumentStore()
        self.embedder = SentenceTransformersTextEmbedder()
        self.embedder.warm_up()
        self.retriever = InMemoryEmbeddingRetriever(document_store=self.document_store)
        self.pipeline = self._create_pipeline()
        self._load_approved_rubrics()

    def _load_approved_rubrics(self):
        approved_rubrics = Rubric.objects.filter(human_approved=True)
        documents = []
        for rubric in approved_rubrics:
            doc = Document(content=json.dumps(rubric.content), meta={"id": rubric.id})
            documents.append(doc)
        self.document_store.write_documents(documents)

    def _create_pipeline(self) -> Pipeline:
        pipeline = Pipeline()

        rubric_template = """
        Create a comprehensive rubric for the following assignment:

        Assignment Description:
        {{assignment_description}}

        Similar approved rubrics:
        {{similar_rubrics}}

        Generate a detailed rubric in the following JSON format:
        {
          "title": "Rubric title",
          "description": "Brief description of the rubric",
          "categories": [
            {
              "name": "Category name",
              "weight": Weight as a percentage (e.g., 30),
              "scoring_levels": [
                {
                  "level": Level number (e.g., 1),
                  "score": Score for this level (identical to level, i.e., 1),
                  "description": "Detailed description of this scoring level"
                },
                ...
              ]
            },
            ...
          ]
        }
        
        Give your scoring levels in ascending order (i.e., give level 1 first)

        Ensure the rubric is tailored to the assignment description and takes inspiration from the similar rubrics provided.
        The rubric NEEDS to include TANGIBLE items one could see in an assignment submission that would allow the submission to reach 
        a given score. It should be clear how the scores are differentiated. 
        """

        pipeline.add_component("rubric_prompt", PromptBuilder(template=rubric_template))
        pipeline.add_component("rubric_generator", (AnthropicGenerator(model="claude-3-5-sonnet-20240620",
                                        api_key=Secret.from_env_var("ANTHROPIC_API_KEY"),
                                        generation_kwargs={"max_tokens": 4096,
                                                           "temperature": 0})))
        # pipeline.add_component("rubric_validator", JsonSchemaValidator(json_schema={
        #     "type": "object",
        #     "properties": {
        #         "title": {"type": "string"},
        #         "description": {"type": "string"},
        #         "categories": {
        #             "type": "array",
        #             "items": {
        #                 "type": "object",
        #                 "properties": {
        #                     "name": {"type": "string"},
        #                     "weight": {"type": "number"},
        #                     "scoring_levels": {
        #                         "type": "array",
        #                         "items": {
        #                             "type": "object",
        #                             "properties": {
        #                                 "level": {"type": "number"},
        #                                 "score": {"type": "number"},
        #                                 "description": {"type": "string"}
        #                             },
        #                             "required": ["level", "score", "description"]
        #                         }
        #                     }
        #                 },
        #                 "required": ["name", "weight", "scoring_levels"]
        #             }
        #         }
        #     },
        #     "required": ["title", "description", "categories"]
        # }))

        pipeline.connect("rubric_prompt", "rubric_generator")
        #pipeline.connect("rubric_generator.replies", "rubric_validator.messages")

        return pipeline

    def _get_similar_rubrics(self) -> List[Dict]:
        embedded_query = self.embedder.run(text=self.assignment.description)
        similar_docs = self.retriever.run(query_embedding=embedded_query['embedding'], top_k=3)
        similar_rubrics = [json.loads(doc.content) for doc in similar_docs['documents']]
        return similar_rubrics

    @retry(
        stop=stop_after_attempt(5),
        wait=wait_exponential(multiplier=1, min=4, max=10),
        retry=retry_if_exception_type((RateLimitError, APIError))
    )
    def run(self) -> Dict:
        logger.info(f"Starting rubric generation for assignment {self.assignment.id}")

        try:
            similar_rubrics = self._get_similar_rubrics()
            result = self.pipeline.run(
                {
                    "rubric_prompt": {
                        "assignment_description": self.assignment.description,
                        "similar_rubrics": json.dumps(similar_rubrics, indent=2)
                    }
                }
            )

            print(result)

            generated_rubric = extract_json(result["rubric_generator"]["replies"][0])

            # Create a new Rubric object
            rubric = Rubric.objects.create(
                assignment=self.assignment,
                content=generated_rubric,
                human_approved=False
            )

            # Update the assignment with the generated rubric
            self.assignment.rubric = rubric.content
            self.assignment.save()

            logger.info(f"Rubric generation completed for assignment {self.assignment.id}")

            return {
                'rubric': generated_rubric,
                'similar_rubrics': similar_rubrics
            }
        except (RateLimitError, APIError) as e:
            logger.warning(f"API error encountered. Retrying... Error: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Error generating rubric: {str(e)}")
            raise



def extract_json(text):
    try:
        # Find the start of the JSON structure (object or array)
        json_start = text.find('{')
        if json_start == -1:
            json_start = text.find('[')
        if json_start == -1:
            return None

        # Find the corresponding end character
        stack = []
        for i, char in enumerate(text[json_start:]):
            if char == '{' or char == '[':
                stack.append(char)
            elif char == '}' or char == ']':
                if not stack:
                    return None
                if (char == '}' and stack[-1] == '{') or (char == ']' and stack[-1] == '['):
                    stack.pop()
                    if not stack:
                        json_end = json_start + i + 1
                        break
                else:
                    return None

        if stack:
            return None

        # Extract the JSON part
        json_str = text[json_start:json_end]

        # Parse the JSON
        return json.loads(json_str)
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse JSON: {str(e)}")
        return None