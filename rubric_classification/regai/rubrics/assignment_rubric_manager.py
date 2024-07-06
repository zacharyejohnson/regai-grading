from ..grading.submission_grader import SubmissionGrader


def generate_rubric(description):
    # This function will eventually use AI to generate a rubric
    # For now, it returns a dummy rubric for essay evaluation

    return {
        "title": "Essay Evaluation Rubric",
        "description": description,
        "categories": [
            {
                "name": "Content and Ideas",
                "weight": 30,
                "scoring_levels": [
                    {
                        "level": 4,
                        "description": "Exceptional: Original and insightful ideas; thorough and relevant content; exceeds expectations."
                    },
                    {
                        "level": 3,
                        "description": "Proficient: Clear and relevant ideas; sufficient content; meets expectations."
                    },
                    {
                        "level": 2,
                        "description": "Developing: Basic ideas present; some irrelevant or missing content; partially meets expectations."
                    },
                    {
                        "level": 1,
                        "description": "Beginning: Unclear or irrelevant ideas; insufficient content; does not meet expectations."
                    }
                ]
            },
            {
                "name": "Organization and Structure",
                "weight": 25,
                "scoring_levels": [
                    {
                        "level": 4,
                        "description": "Exceptional: Logical and effective structure; smooth transitions; enhances overall argument."
                    },
                    {
                        "level": 3,
                        "description": "Proficient: Clear structure; appropriate transitions; supports argument."
                    },
                    {
                        "level": 2,
                        "description": "Developing: Basic structure present; some abrupt transitions; partially supports argument."
                    },
                    {
                        "level": 1,
                        "description": "Beginning: Unclear or illogical structure; lack of transitions; hinders argument."
                    }
                ]
            },
            {
                "name": "Evidence and Analysis",
                "weight": 20,
                "scoring_levels": [
                    {
                        "level": 4,
                        "description": "Exceptional: Strong, relevant evidence; insightful analysis; effectively supports claims."
                    },
                    {
                        "level": 3,
                        "description": "Proficient: Sufficient, relevant evidence; clear analysis; adequately supports claims."
                    },
                    {
                        "level": 2,
                        "description": "Developing: Some evidence present; basic analysis; partially supports claims."
                    },
                    {
                        "level": 1,
                        "description": "Beginning: Little or irrelevant evidence; minimal analysis; fails to support claims."
                    }
                ]
            },
            {
                "name": "Language and Style",
                "weight": 15,
                "scoring_levels": [
                    {
                        "level": 4,
                        "description": "Exceptional: Sophisticated language; clear and engaging style; enhances readability."
                    },
                    {
                        "level": 3,
                        "description": "Proficient: Clear language; appropriate style; supports readability."
                    },
                    {
                        "level": 2,
                        "description": "Developing: Basic language; inconsistent style; occasionally hinders readability."
                    },
                    {
                        "level": 1,
                        "description": "Beginning: Unclear language; inappropriate style; significantly hinders readability."
                    }
                ]
            },
            {
                "name": "Grammar and Mechanics",
                "weight": 10,
                "scoring_levels": [
                    {
                        "level": 4,
                        "description": "Exceptional: Error-free grammar, spelling, and punctuation; enhances clarity."
                    },
                    {
                        "level": 3,
                        "description": "Proficient: Minor errors in grammar, spelling, or punctuation; does not interfere with clarity."
                    },
                    {
                        "level": 2,
                        "description": "Developing: Several errors in grammar, spelling, or punctuation; sometimes interferes with clarity."
                    },
                    {
                        "level": 1,
                        "description": "Beginning: Numerous errors in grammar, spelling, or punctuation; significantly interferes with clarity."
                    }
                ]
            }
        ]
    }