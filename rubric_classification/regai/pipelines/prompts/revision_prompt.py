# prompts/revision_prompt.py

from haystack.nodes import PromptTemplate

REVISION_PROMPT = PromptTemplate(
    prompt="""
    Revise the following grade based on the critique, ensuring it aligns with the rubric:

    Original Grade:
    {{original_grade}}

    Critique:
    {{critique}}

    Rubric:
    {{rubric}}

    Your task is to:
    1. Review the original grade and the critique.
    2. Adjust the category scores based on the critique's suggestions.
    3. Provide updated justifications for each category.
    4. Ensure the revised grade adheres closely to the rubric criteria.

    Return the revised grade as a JSON object with the following structure:
    {
        "category_scores": [
            {
                "name": <string>,
                "score": <float>,
                "justification": <string>
            },
            ...
        ]
    }

    Ensure your revisions are fair, justified, and aligned with both the critique and the original rubric.
    """
)