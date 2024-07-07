import json
from typing import Dict, List
from haystack import component
from haystack.components.generators import OpenAIGenerator
from haystack.utils import Secret
from ..models import Assignment, AssignmentAgent, AgentAction # The database will be tied to this class

@component
class Grader:
    def __init__(self,
                 openai_api_key: str,
                 model_name: str = "gpt-4o",
                 assignment: Assignment = None,):
        print("Initializing Grader...", openai_api_key)
        self.openai_api_key = Secret.from_token(openai_api_key)
        self.model_name = model_name
        self.generator = OpenAIGenerator(api_key=self.openai_api_key, model=self.model_name)

        self.db_obj = AssignmentAgent.objects.create(
            assignment=assignment,
            agent_type='grader'
        )

    @component.output_types(grade=Dict, grading_process=List[Dict])
    def run(self, submission_text: str, rubric: Dict):
        prompt = self._prepare_grading_prompt(submission_text, rubric)
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

        return {"grade": initial_grade, "grading_process": grading_process}

    def _prepare_grading_prompt(self, submission_text: str, rubric: Dict) -> str:
        prompt = f"""
        Grade the following student submission based on the provided rubric. 

        Submission:
        {submission_text}

        Rubric:
        {json.dumps(rubric, indent=2)}

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

        Ensure your grading is fair, consistent, and well-justified based on the rubric criteria.
        """
        return prompt