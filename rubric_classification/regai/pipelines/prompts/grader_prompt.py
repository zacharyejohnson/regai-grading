# prompts/grader_prompt.py

from haystack.nodes import PromptTemplate

GRADER_PROMPT = PromptTemplate(
    prompt="""
    Grade the following student submission based on the provided rubric. 

    Submission:
    {{submission}}

    Rubric:
    {{rubric}}

    Your task is to:
    1. Carefully read the submission and the rubric.
    2. For each category in the rubric, assign a score and provide a brief justification.
    3. Do not calculate an overall score.

    Return your response as a JSON object with the following structure:
    {
        "category_scores": [
            {
                "name": <string>,
                "score": <float>,
                "justification": <string>
            },
            ...
        ],
        "grading_process": [
            {
                "step": <string>,
                "details": <string>
            },
            ...
        ]
    }

    Ensure your grading is fair, consistent, and well-justified based on the rubric criteria.
    """
)