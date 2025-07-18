# ==============================================================================
# mcq-generator/backend/test_hf_api.py (New/Updated file for direct testing)
# ==============================================================================
import os
import requests
from decouple import config
import json # ADDED: Import json for error handling

# Ensure the .env file is in the same directory as this script, or one level up
# For this test, assume you run this script from D:\mcq-generator\backend
# after moving the .env file there as per previous instructions.

# Load the API token from the .env file
HF_API_TOKEN = config('HUGGINGFACEHUB_API_TOKEN', default=None)

if not HF_API_TOKEN:
    print("Error: HUGGINGFACEHUB_API_TOKEN not found in .env file.")
    print("Please ensure your .env file is in the same directory as this script or its parent,")
    print("and contains HUGGINGFACEHUB_API_TOKEN=\"your_token_here\"")
    exit()

# Diagnostic print to confirm token loading in this script
print(f"DEBUG (test_hf_api.py): Loaded HuggingFace API Token: {HF_API_TOKEN[:5]}...{HF_API_TOKEN[-5:]}")

# CHANGED: Reverted to Llama 3.1 as per your accepted access
API_URL = "https://huggingface.co/meta-llama/Llama-3.1-8B-Instruct"
headers = {"Authorization": f"Bearer {HF_API_TOKEN}"}

def query(payload):
    # CHANGED: Return the raw response object
    response = requests.post(API_URL, headers=headers, json=payload)
    return response

# Test payload for MCQ generation
test_payload = {
    "inputs": "Generate 1 MCQ on the topic 'Artificial Intelligence'. Q: <question text> A) <option A text> B) <option B text> C) <option C text> D) <option D text> Answer: <A/B/C/D>",
    "parameters": {
        "max_new_tokens": 250,
        "temperature": 0.7,
        "return_full_text": False # Important for instruction models
    }
}

print("\nAttempting to query Hugging Face Inference API directly...")
try:
    raw_response = query(test_payload) # Get the raw response object

    print(f"\n--- Hugging Face API Raw Response ---")
    print(f"Status Code: {raw_response.status_code}")
    print(f"Response Headers: {raw_response.headers}")
    print(f"Response Text: {raw_response.text}") # Print raw text

    # Attempt to parse as JSON only if status code indicates success or a JSON error
    if raw_response.status_code == 200:
        output = raw_response.json()
        if isinstance(output, list) and len(output) > 0 and "generated_text" in output[0]:
            print("\nSuccessfully received generated text!")
            print(output[0]["generated_text"])
        else:
            print("\nUnexpected successful API response format.")
    else:
        # If not 200, it's an error. The raw_response.text should contain details.
        print(f"\nAPI returned an error status code: {raw_response.status_code}")
        if raw_response.text:
            try:
                error_json = raw_response.json()
                print(f"Error JSON: {error_json}")
            except json.JSONDecodeError:
                print(f"Error: Response text is not valid JSON for status code {raw_response.status_code}.")
        else:
            print("Error: Empty response body for non-200 status code.")


except requests.exceptions.RequestException as e:
    print(f"\nNetwork or Request Error: {e}")
except Exception as e:
    print(f"\nAn unexpected error occurred: {e}")