import json
from typing import Dict, List
from haystack import component
from haystack.components.generators import OpenAIGenerator
from haystack.utils import Secret
from ..models import Assignment, AssignmentAgent, AgentAction

@component
class Critic:
    def __init__(self,
                 openai_api_key: str,
                 model_name: str = "gpt-4o",
                 assignment: Assignment = None):
        self.openai_api_key = Secret.from_token(openai_api_key)
        self.model_name = model_name
        self.generator = OpenAIGenerator(api_key=self.openai_api_key, model=self.model_name)
        self.db_obj = AssignmentAgent.objects.create(
            assignment=assignment,
            agent_type='critic'
        )

    @component.output_types(critique=Dict)
    def run(self, grade: Dict, rubric: Dict, grading_process: List[Dict]):
        critique = self._generate_critique(grade, rubric, grading_process)
        revised_grade = self._revise_grade(grade, critique, rubric)
        return {"critique": critique, "revised_grade": revised_grade}

    def _generate_critique(self, grade: Dict, rubric: Dict, grading_process: List[Dict]) -> Dict:
        prompt = self._prepare_critique_prompt(grade, rubric, grading_process)
        response = self.generator.run(prompt=prompt)

        try:
            critique = json.loads(response['replies'][0])
        except json.JSONDecodeError:
            critique = {
                "overall_assessment": "Error in critique process. Please review manually.",
                "category_critiques": [],
                "suggestions_for_improvement": []
            }

        return critique

    def _revise_grade(self, original_grade: Dict, critique: Dict, rubric: Dict) -> Dict:
        prompt = self._prepare_revision_prompt(original_grade, critique, rubric)
        response = self.generator.run(prompt=prompt)

        try:
            revised_grade = json.loads(response['replies'][0])
        except json.JSONDecodeError:
            revised_grade = original_grade  # Fall back to original grade if parsing fails

        return revised_grade

    def _prepare_critique_prompt(self, grade: Dict, rubric: Dict, grading_process: List[Dict]) -> str:
        prompt = f"""
        Review and critique the following grade based on the provided rubric and grading process.

        Grade:
        {json.dumps(grade, indent=2)}

        Rubric:
        {json.dumps(rubric, indent=2)}

        Grading Process:
        {json.dumps(grading_process, indent=2)}

        Your task is to:
        1. Assess the fairness and accuracy of the overall grade.
        2. Evaluate each category score for consistency with the rubric criteria.
        3. Analyze the grading process for thoroughness and adherence to the rubric.
        4. Identify any potential biases or oversights in the grading.
        5. Suggest improvements or adjustments to the grade if necessary.

        Return your critique as a JSON object with the following structure:
        {{
            "overall_assessment": <string>,
            "category_critiques": [
                {{
                    "category": <string>,
                    "assessment": <string>,
                    "suggested_adjustments": <string>
                }},
                ...
            ],
            "grading_process_evaluation": <string>,
            "potential_biases": [<string>, ...],
            "suggestions_for_improvement": [<string>, ...]
        }}

        Ensure your critique is constructive, detailed, and focused on improving the accuracy and fairness of the grading process.
        """
        return prompt

    def _prepare_revision_prompt(self, original_grade: Dict, critique: Dict, rubric: Dict) -> str:
        prompt = f"""
        Revise the following grade based on the critique, ensuring it aligns with the rubric:

        Original Grade:
        {json.dumps(original_grade, indent=2)}

        Critique:
        {json.dumps(critique, indent=2)}

        Rubric:
        {json.dumps(rubric, indent=2)}

        Your task is to:
        1. Review the original grade and the critique.
        2. Adjust the overall score and category scores based on the critique's suggestions.
        3. Provide updated justifications for each category and the overall grade.
        4. Ensure the revised grade adheres closely to the rubric criteria.

        Return the revised grade as a JSON object with the following structure:
        {{
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
        }}

        Ensure your revisions are fair, justified, and aligned with both the critique and the original rubric.
        """
        return prompt