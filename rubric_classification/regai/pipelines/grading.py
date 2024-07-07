# grading_pipeline.py
import json
import logging
from typing import Dict, List, Union
from django.utils import timezone
from django.db.models import Q
from haystack import Pipeline, component
from haystack.components.builders import PromptBuilder
from haystack.components.generators import OpenAIGenerator
from haystack.components.validators import JsonSchemaValidator
from haystack.utils import Secret
from haystack.dataclasses import ChatMessage



from ..models import Assignment, AssignmentAgent, GradingCycle, AgentAction, GradingResult, KnowledgeBaseItem
logger = logging.getLogger(__name__)

class GradingPipeline:
    def __init__(self, assignment: Assignment, openai_api_key: str):
        self.assignment = assignment
        self.openai_api_key = Secret.from_token(openai_api_key)
        self.pipeline = self._create_pipeline()



    def _create_pipeline(self) -> Pipeline:
        pipeline = Pipeline()

        # Grader
        grader_template = """
        Grade the following submission for the category '{{category_name}}' based on the provided rubric.

        Submission:
        {{submission}}

        Rubric for '{{category_name}}':
        {{category_description}}

        Provide a score and justification in the following JSON format:
        {
            "name": "category name",
            "score": integer corresponding to a scoring level on the rubric,
            "justification": "detailed justification for the score"
        }
        """
        pipeline.add_component("grader_prompt", PromptBuilder(template=grader_template))
        pipeline.add_component("grader", OpenAIGenerator(model="gpt-4o",
                                                         api_key=self.openai_api_key,
                                                         generation_kwargs={
                                                             "response_format": {"type": "json_object"}}))

        # Add a converter to change the output format
        @component
        class StringToChatMessage:
            @component.output_types(messages=List[ChatMessage])
            def run(self, strings: List[str]):
                return {"messages": [ChatMessage.from_assistant(s) for s in strings]}

        pipeline.add_component("converter", StringToChatMessage())

        pipeline.add_component("grader_validator", JsonSchemaValidator(json_schema={
            "type": "object",
            "properties": {
                "name": {"type": "string"},
                "score": {"type": "number"},
                "justification": {"type": "string"}
            },
            "required": ["name", "score", "justification"]
        }))

        pipeline.connect("grader_prompt", "grader")
        pipeline.connect("grader.replies", "converter.strings")
        pipeline.connect("converter.messages", "grader_validator.messages")

        return pipeline

    def grade_category(self, category: Dict, submission_text: str) -> Dict:
        result = self.pipeline.run(
            {
                "grader_prompt": {
                    "category_name": category['name'],
                    "category_description": category['scoring_levels'],
                    "submission": submission_text,
                }
            }
        )
        return result["grader_validator"]["validated"][0].content

    def grade_submission(self, submission_text: str) -> List[Dict]:
        grades = []
        for category in self.assignment.rubric['categories']:
            grade = self.grade_category(category, submission_text)
            grades.append(grade)
        return grades

    def critique_grades(self, grades: List[Dict]) -> Dict:
        critic_template = """
        Review and critique the following grades based on the provided rubric.

        Grades:
        {{grades}}

        Rubric:
        {{rubric}}

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
        critic_prompt = PromptBuilder(template=critic_template)
        critic = OpenAIGenerator(model="gpt-4o",
                                 api_key=self.openai_api_key,
                                 generation_kwargs={"response_format": {"type": "json_object"}})
        critic_validator = JsonSchemaValidator(json_schema={
            "type": "object",
            "properties": {
                "overall_assessment": {"type": "string"},
                "category_critiques": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "category": {"type": "string"},
                            "critique": {"type": "string"}
                        },
                        "required": ["category", "critique"]
                    }
                },
                "potential_biases": {"type": "array", "items": {"type": "string"}},
                "suggestions_for_improvement": {"type": "array", "items": {"type": "string"}}
            },
            "required": ["overall_assessment", "category_critiques", "potential_biases", "suggestions_for_improvement"]
        })

        result = critic.run(prompt=critic_prompt.run(grades=grades, rubric=self.assignment.rubric)["prompt"])
        print(result)
        print(result["replies"][0])
        last_message = result["replies"][0]
        if isinstance(last_message, str):
            last_message_content = last_message
        else:
            last_message_content = last_message.content

        validated_result = critic_validator.run(messages=[ChatMessage.from_user(last_message_content)])
        return validated_result["validated"][0].content



    def revise_grades(self, initial_grades: List[Union[Dict, str]], critique: Dict) -> List[Dict]:

        revised_grades = []
        logger.debug(f"Initial grades: {initial_grades}")
        logger.debug(f"Critique: {critique}")

        for grade in initial_grades:
            logger.debug(f"Processing grade: {grade}")

            if isinstance(grade, str):
                # If grade is a string, try to parse it as JSON
                try:
                    grade = json.loads(grade)
                except json.JSONDecodeError:
                    logger.error(f"Failed to parse grade as JSON: {grade}")
                    continue

            if not isinstance(grade, dict) or 'name' not in grade:
                logger.error(f"Invalid grade format: {grade}")
                continue

            category = next((cat for cat in self.assignment.rubric['categories'] if cat['name'] == grade['name']), None)
            if not category:
                logger.error(f"Category {grade['name']} not found in rubric")
                continue

            max_score = len(category['scoring_levels'])

            reviser_template = """
            Revise the following grade based on the critique, ensuring alignment with the rubric:

            Original Grade:
            {{original_grade}}

            Critique:
            {{critique}}

            Rubric Category:
            {{category}}

            Provide a revised grade in the following JSON format:
            {
                "name": "{{category.name}}",
                "score": integer between 1 and {{max_score}},
                "justification": "detailed justification for the score"
            }
            """
            reviser_prompt = PromptBuilder(template=reviser_template)
            reviser = OpenAIGenerator(model="gpt-4o",
                                      api_key=self.openai_api_key,
                                      generation_kwargs={"response_format": {"type": "json_object"}})
            reviser_validator = JsonSchemaValidator(json_schema={
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "score": {"type": "integer", "minimum": 1, "maximum": max_score},
                    "justification": {"type": "string"}
                },
                "required": ["name", "score", "justification"]
            })

            try:
                result = reviser.run(prompt=reviser_prompt.run(
                    original_grade=grade,
                    critique=critique,
                    category=category,
                    max_score=max_score
                )["prompt"])

                chat_message = ChatMessage.from_assistant(result["replies"][0])
                validated_result = reviser_validator.run(messages=[chat_message])

                if "validation_error" in validated_result:
                    logger.error(f"Validation error for {grade['name']}: {validated_result['validation_error']}")
                    continue

                revised_grade = json.loads(chat_message.content)
                revised_grades.append(revised_grade)
            except Exception as e:
                logger.error(f"Error processing grade {grade['name']}: {str(e)}")

        logger.debug(f"Revised grades: {revised_grades}")
        return revised_grades

    def calculate_overall_score(self, category_scores: List[Dict]) -> float:
        total_weighted_score = 0
        total_weighted_max_score = 0

        for category_score in category_scores:
            category_name = category_score['name']
            category = next((c for c in self.assignment.rubric['categories'] if c['name'] == category_name), None)

            if category:
                weight = category['weight']
                max_score = len(category['scoring_levels'])
                score = category_score['score']

                total_weighted_score += score * weight
                total_weighted_max_score += max_score * weight

        if total_weighted_max_score > 0:
            return total_weighted_score / total_weighted_max_score
        else:
            return 0.0

    def run(self, submission) -> Dict:
        grading_cycle = GradingCycle.objects.create(submission=submission, status='in_progress')

        # Grade each category
        initial_grades = self.grade_submission(submission.content)

        # Critique the grades
        critique = self.critique_grades(initial_grades)

        # Revise the grades based on the critique
        final_grades = self.revise_grades(initial_grades, critique)

        overall_score = self.calculate_overall_score(final_grades)

        # Create grading action
        try:
            grader_agent = AssignmentAgent.objects.filter(
                Q(assignment=self.assignment) & Q(agent_type='grader')
            ).first()

            if not grader_agent:
                # If no grader agent exists, create one
                grader_agent = AssignmentAgent.objects.create(
                    assignment=self.assignment,
                    agent_type='grader'
                )
        except Exception as e:
            # Log the error and create a new grader agent
            logger.error(f"Error retrieving grader agent: {str(e)}")
            grader_agent = AssignmentAgent.objects.create(
                assignment=self.assignment,
                agent_type='grader'
            )

        grading_action = AgentAction.objects.create(
            grading_cycle=grading_cycle,
            agent=grader_agent,
            action_type='grading',
            input_data={'submission_content': submission.content, 'rubric': self.assignment.rubric},
            output_data={'grades': final_grades, 'critique': critique}
        )
        grading_action.completed_at = timezone.now()
        grading_action.save()

        # Create grading result
        grading_result = GradingResult.objects.create(
            grading_cycle=grading_cycle,
            overall_score=overall_score,
            category_scores=final_grades,
            justification="Grades revised based on critique."
        )

        # Update grading cycle and submission status
        grading_cycle.status = 'completed'
        grading_cycle.completed_at = timezone.now()
        grading_cycle.save()

        # Add to knowledge base
        KnowledgeBaseItem.objects.create(
            assignment=self.assignment,
            item_type='grade',
            content={
                'submission_id': submission.id,
                'overall_score': overall_score,
                'category_scores': final_grades,
                'critique': critique
            }
        )

        submission.overall_score = overall_score
        submission.category_scores = final_grades
        submission.grading_critique = critique
        submission.status = 'graded'
        submission.graded_at = timezone.now()
        submission.save()

        return {
            'overall_score': overall_score,
            'category_scores': final_grades,
            'critique': critique
        }