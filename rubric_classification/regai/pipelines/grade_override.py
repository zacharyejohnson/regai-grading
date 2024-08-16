# pipelines/grade_override.py
import json

from haystack import Pipeline
from haystack.components.builders.prompt_builder import PromptBuilder
from haystack.components.generators import OpenAIGenerator
from haystack.components.generators.chat import OpenAIChatGenerator
from haystack.utils import Secret
from haystack_integrations.components.generators.anthropic import AnthropicGenerator

from .rubric_generation import extract_json
from ..models import Assignment, Grade, Rubric


class GradeOverridePipeline:
    def __init__(self, assignment: Assignment, rubric: Rubric, original_grade: Grade, overridden_grade_content: dict):
        self.assignment = assignment
        self.rubric = rubric
        self.original_grade = original_grade
        self.overridden_grade_content = overridden_grade_content
        self.critique_revision_pipeline = self._create_critique_revision_pipeline()
        self.grade_revision_pipeline = self._create_revised_grade_pipeline()

    def _create_critique_revision_pipeline(self) -> Pipeline:
        pipeline = Pipeline()

        rubric_template = """
            You are an AI assistant tasked with generating a comprehensive critique that argues in favor of the teacher's overridden grade for a student submission. 

            Original grade: {{original_grade}}
            Teacher's overridden grade: {{overridden_grade}}
            Assignment: {{assignment}}
            Grading Rubric: {{rubric}}
            Student Submission: {{submission}}

            Please provide a detailed critique that:
            1. Compares the original grade with the teacher's override for each category.
            2. Provides strong arguments supporting the teacher's scores, referencing the rubric and submission.
            3. Identifies potential oversights or errors in the original grading.
            4. Suggests how the original grading process could be improved based on this override.
            5. You MUST argue in favor of the teachers judgement - this is meant to align the teachers wishes with an LLM's ability to interperet grades. 
            
            The original grade and the overriden grade may have the same justification. 
            Most often, this means that the teacher just changed the score and expects the justification to 
            be changed later on (i.e., they are too busy to manually change the justification).
            So ignore the justification for the overriden grade if it is the same as the original grade. 
            
            Provide your critique in the following JSON format:
            {
                "overall_assessment": "overall assessment of the grading",
                "category_critiques": [
                    {
                        "category": "category name",
                        "critique": "detailed critique of the grading for this category"
                    },
                    ...
                ],
                "potential_biases": ["list of potential biases"],
                "suggestions_for_improvement": ["list of suggestions"],
                "revision_status": "PASS" or "MINOR_REVISION" or "MAJOR_REVISION"
            }

            Your critique should be professional, objective, and focused on improving the grading process.
            Do not mention that the teacher gave a different grade, act as though you are directly critiquing the grade
             to be different based on the content of the submission and the rubric alone. 
            Remember, you MUST vehemently support the teachers judgement, as they have more experience grading assignments than you do. 
            """

        pipeline.add_component("override_prompt", PromptBuilder(template=rubric_template))
        pipeline.add_component("critique_generator", OpenAIGenerator(api_key=Secret.from_env_var("OPENAI_API_KEY"), model='gpt-4o',
                                                    generation_kwargs={'max_tokens': 4096,
                                                                       "response_format": {"type": "json_object"}}))

                               # (AnthropicGenerator(model="claude-3-5-sonnet-20240620",
                               #                                           api_key=Secret.from_env_var(
                               #                                               "ANTHROPIC_API_KEY"),
                               #                                           generation_kwargs={"max_tokens": 4096,
                               #                                                              "temperature": 0})))

        pipeline.connect("override_prompt", "critique_generator")
        return pipeline

    def _create_revised_grade_pipeline(self) -> Pipeline:
        pipeline = Pipeline()
        rubric_template = """
                    You are an AI assistant tasked with revising grades given to students. 
                    The submission was originally given a grade that the teacher has indicated that they disagree with and would like changed. 

                    Original grade: {{original_grade}}
                    Teacher's overridden grade: {{overridden_grade}}
                    Assignment: {{assignment}}
                    Grading Rubric: {{rubric}}
                    Student Submission: {{submission}}

                    Please provide a detailed grade that describes in detail why, given the submission and rubric, the submission
                    deserves the overriden grade given by the teacher. Your grade should be in the exact same form as the original grade. 
                    
                    If the original grade and overriden grade "justification" are not the same, the teacher just changed the grade and expects you to 
                    generate a comprehensive new justification for them. if they are materially different, then create a justficiation that 
                    heavily uses the justification given by the teacher (use much of the same language as them and mention details that support their 
                    justification).
                    
                    Do not reference the fact that this is an overriden grade. 

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
                    """

        pipeline.add_component("override_prompt", PromptBuilder(template=rubric_template))
        pipeline.add_component("grade_overrider",
                               (OpenAIGenerator(api_key=Secret.from_env_var("OPENAI_API_KEY"), model='gpt-4o',
                                                    generation_kwargs={'max_tokens': 4096,
                                                                       "response_format": {"type": "json_object"}})))
        # AnthropicGenerator(model="claude-3-5-sonnet-20240620",
        #                                                           api_key=Secret.from_env_var(
        #                                                               "ANTHROPIC_API_KEY"),
        #                                                           generation_kwargs={"max_tokens": 4096,
        #                                                                              "temperature": 0})))

        pipeline.connect("override_prompt", "grade_overrider")
        return pipeline

    def run(self):
        overidden_critique = self.critique_revision_pipeline.run(
            {
                "override_prompt": {
                    "original_grade": json.dumps(self.original_grade.content),
                    "overridden_grade": json.dumps(self.overridden_grade_content),
                    "assignment": self.assignment.description,
                    "rubric": json.dumps(self.rubric.content),
                    "submission": json.dumps(self.original_grade.submission.content)
                }
            }
        )

        overidden_grade = self.grade_revision_pipeline.run(
            {
                "override_prompt": {
                    "original_grade": json.dumps(self.original_grade.content),
                    "overridden_grade": json.dumps(self.overridden_grade_content),
                    "assignment": self.assignment.description,
                    "rubric": json.dumps(self.rubric.content),
                    "submission": json.dumps(self.original_grade.submission.content)
                }
            }
        )

        print("grade successfully overriden...")

        return (extract_json(overidden_critique['critique_generator']['replies'][0]),
                extract_json(overidden_grade['grade_overrider']['replies'][0]))
