import json
import os
import io

import docx
from PyPDF2 import PdfReader
from haystack.utils import Secret
from haystack_integrations.components.generators.anthropic import AnthropicGenerator
import chardet


def parse_file_text(uploaded_file):
    file_name = uploaded_file.name
    file_extension = os.path.splitext(file_name)[1].lower()

    try:
        if file_extension == '.pdf':
            # Parse text from PDF file
            reader = PdfReader(uploaded_file)
            text = ""
            for page in reader.pages:
                text += page.extract_text() + "\n"
        elif file_extension == '.docx':
            # Parse text from DOCX file
            uploaded_file.seek(0)  # Reset file pointer to the beginning
            doc = docx.Document(uploaded_file)
            text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
        elif file_extension == '.txt':
            # Read text from TXT file
            raw_content = uploaded_file.read()
            detected_encoding = chardet.detect(raw_content)['encoding']
            text = raw_content.decode(detected_encoding or 'utf-8')
        else:
            raise ValueError(f"Unsupported file format: {file_extension}")

        return text
    except Exception as e:
        print(f"Error parsing file {file_name}: {str(e)}")
        raise


def process_syllabus(syllabus_text):
    client = AnthropicGenerator(
        model="claude-3-haiku-20240307",
        api_key=Secret.from_token(os.environ['ANTHROPIC_API_KEY']),
        generation_kwargs={"max_tokens": 4096, "temperature": 0}
    )

    prompt = """
            You are a syllabus parser for college courses. Your task is to read a syllabus and pull out specific information. 
            
            That information will include: course title, course description, and a list of assignments with specific information for each. 
            
            Please respond with a JSON object of the following form: 
            
            {
                "course_title": <string>,
                "course_description": <string>,
                "assignments": 
                    [
                        {
                            "title": <string>,
                            "description": <string> or "" if no description given
                        }, ...
                        as many assignments as listed in the syllabus...
                    ]
            }
            
            ONLY respond with the JSON object. It must be possible to call json.loads() directly on your output. 
            
            Here is the syllabus for you to parse: 
            
            """

    prompt += syllabus_text

    response = client.run(prompt)

    try:
        parsed_data = extract_json(response['replies'][0])
        return parsed_data
    except json.JSONDecodeError:
        print("Failed to parse JSON from the response. Raw response:", response['replies'][0])
        return None


def extract_json(response):
    print("BEGINNING JSON EXTRACTION PROCESS: ")
    print(response)
    # Find the start of the JSON structure (object or array)
    json_start_obj = response.find('{')
    json_start_arr = response.find('[')

    if json_start_obj == -1 and json_start_arr == -1:
        print("No JSON structure found in the response")
        return None

    # Determine which starts first (if both exist)
    if json_start_arr != -1 and (json_start_arr < json_start_obj or json_start_obj == -1):
        json_start = json_start_arr
        end_char = ']'
    else:
        json_start = json_start_obj
        end_char = '}'

    # Find the corresponding end character
    json_end = response.rfind(end_char)

    if json_end == -1:
        print("No properly closed JSON structure found")
        return None

    # Extract the JSON part of the response
    json_str = response[json_start:json_end + 1]

    try:
        # Parse the JSON
        return json.loads(json_str)
    except json.JSONDecodeError as e:
        print(f"Failed to parse JSON: {e}")
        return None
