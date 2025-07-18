import time
import asyncio
import httpx
import json
from httpx import RequestError, HTTPStatusError

# --- Configuration for Retries ---
MAX_RETRIES = 5
INITIAL_BACKOFF_SECONDS = 1

async def call_gemini_api_with_retries(api_url: str, headers: dict, payload: dict, api_key: str) -> str:
    """
    Makes an asynchronous call to the Gemini API with retry logic for 503 errors.
    This version expects a plain text response from Gemini (not structured JSON within text).

    Args:
        api_url (str): The full URL for the Gemini API endpoint (should already include API key).
        headers (dict): HTTP headers for the request.
        payload (dict): The JSON payload for the Gemini API request.
        api_key (str): Your Gemini API key.

    Returns:
        str: The raw text content from Gemini's response.

    Raises:
        Exception: If the Gemini API call fails after all retries, or for other HTTP errors.
    """
    full_api_url = f"{api_url}?key={api_key}"

    async with httpx.AsyncClient() as client:
        for i in range(MAX_RETRIES):
            response = None # Initialize response to None
            try:
                print(f"Attempt {i + 1}/{MAX_RETRIES} to call Gemini API...")
                response = await client.post(full_api_url, json=payload, headers=headers, timeout=60.0)
                response.raise_for_status()
                print(f"Attempt {i + 1}: Gemini API call successful.")

                # Attempt to parse the response as JSON
                result = response.json() 

                if result.get("candidates") and len(result["candidates"]) > 0 and \
                   result["candidates"][0].get("content") and \
                   result["candidates"][0]["content"].get("parts") and \
                   len(result["candidates"][0]["content"]["parts"]) > 0:
                    raw_output = result["candidates"][0]["content"]["parts"][0]["text"]
                    return raw_output
                else:
                    print(f"Gemini API response structure unexpected: {result}")
                    raise ValueError("Gemini API returned an unexpected response structure or no content within candidates.")

            except HTTPStatusError as e:
                if e.response.status_code == 503:
                    wait_time = INITIAL_BACKOFF_SECONDS * (2 ** i)
                    print(f"Gemini API returned 503 (Overloaded). Retrying in {wait_time:.2f} seconds...")
                    await asyncio.sleep(wait_time)
                else:
                    # For other HTTP errors, include response text for debugging
                    error_detail = f"Gemini API HTTP error: {e.response.status_code} - {e.response.text}"
                    print(error_detail)
                    raise Exception(error_detail)
            except RequestError as e:
                wait_time = INITIAL_BACKOFF_SECONDS * (2 ** i)
                print(f"Network error during Gemini API call: {e}. Retrying in {wait_time:.2f} seconds...")
                await asyncio.sleep(wait_time)
            except json.JSONDecodeError as e:
                # --- FIX START ---
                # This block is specifically for when response.json() fails
                raw_response_text = response.text if response else "No response object available."
                error_message = f"Invalid JSON response from Gemini API: {e}. Raw response: {raw_response_text}"
                print(f"DEBUG: {error_message}") # Print to backend console
                raise Exception(error_message) # Re-raise with more detail
                # --- FIX END ---
            except ValueError as e: # Catches the ValueError from unexpected structure or missing content
                error_message = f"Error parsing Gemini response structure: {e}. Raw response: {{(response.text if response else 'N/A')}}"
                print(f"DEBUG: {error_message}")
                raise Exception(error_message)
            except Exception as e:
                # Catch any other unexpected errors
                print(f"An unexpected error occurred during Gemini API call: {e}")
                raise e

        raise Exception(f"Failed to get a successful response from Gemini API after {MAX_RETRIES} attempts.")
