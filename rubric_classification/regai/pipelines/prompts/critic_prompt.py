# prompts/critic_prompt.py

from haystack.components.builders.prompt_builder import PromptBuilder

CRITIC_PROMPT = PromptTemplate(
    prompt="""
    Review and critique the following grade based on the provided rubric and grading process.

    Grade:
    {{grade}}

    Rubric:
    {{rubric}}

    Grading Process:
    {{grading_process}}

    Your task is to:
    1. Evaluate each category score for consistency with the rubric criteria.
    2. Analyze the grading process for thoroughness and adherence to the rubric.
    3. Identify any potential biases or oversights in the grading.
    4. Suggest improvements or adjustments to the category scores if necessary.

    Return your critique as a JSON object with the following structure:
    {
        "category_critiques": [
            {
                "category": <string>,
                "assessment": <string>,
                "suggested_adjustments": <string>
            },
            ...
        ],
        "grading_process_evaluation": <string>,
        "potential_biases": [<string>, ...],
        "suggestions_for_improvement": [<string>, ...]
    }

    Ensure your critique is constructive, detailed, and focused on improving the accuracy and fairness of the grading process.
    """
)