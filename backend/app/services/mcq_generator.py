import os
import json
from typing import List, Optional
from pydantic import BaseModel, Field, ValidationError
import enum # Keep this import

# REMOVE: from dotenv import load_dotenv # REMOVE THIS LINE if present
# REMOVE: load_dotenv() # REMOVE THIS LINE if present

# --- FIX START ---
# Import the settings object from your config module
from ..config import settings
# --- FIX END ---

from ..utils.gemini_api_utils import call_gemini_api_with_retries
from ..models.schema import Difficulty, MCQItem # Keep these imports

# --- Custom Exception for LLM Generation Errors ---
class LLMGenerationError(Exception):
    """Custom exception for errors during LLM-based MCQ generation."""
    pass

# --- Pydantic Models ---
class Difficulty(str, enum.Enum): # This line now has 'enum' defined
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"

class MCQItem(BaseModel):
    question: str
    options: List[str]
    correct_answer: str
    explanation: Optional[str] = None

class MCQGeneratorService:
    def __init__(self):
        # --- FIX START ---
        # Get the API key directly from the settings object
        self.gemini_api_key = settings.GEMINI_API_KEY
        # The ValueError check is now handled by the Settings class's __init__
        # You can remove the 'if not self.gemini_api_key' block here,
        # as the app won't even start if it's missing from settings.
        # Keeping it for extra debug print, but it should ideally never be hit.
        if not self.gemini_api_key:
            print("DEBUG: GEMINI_API_KEY is still not set when MCQGeneratorService initializes (fallback check)!")
            raise ValueError("GEMINI_API_KEY environment variable not set. Please set it in your .env file.")
        
        # REMOVE: print(f"DEBUG: Gemini API Key loaded in MCQGeneratorService: {self.gemini_api_key[:5]}...{self.gemini_api_key[-5:]}")
        # --- FIX END ---

        self.GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
        self.GEMINI_HEADERS = {"Content-Type": "application/json"}

    async def generate_mcq_from_text(self, topic: str, num_questions: int, difficulty: Difficulty, category: Optional[str]) -> List[MCQItem]:
        category_prompt = f"The questions should be related to the category: {category}." if category else ""

        prompt = f"""
        Generate {num_questions} MCQs on the topic '{topic}'.
        Each MCQ should have exactly 4 options (A, B, C, D) and one correct answer.
        Difficulty: {difficulty.value}.
        {category_prompt}

        **STRICT FORMAT REQUIRED:**
        Q: <question text>
        A) <option A text>
        B) <option B text>
        C) <option C text>
        D) <option D text>
        Answer: <A/B/C/D>
        (Optional) Explanation: <explanation text>

        Ensure there are no introductory or concluding remarks, just the MCQs following this exact format, separated by blank lines.
        """

        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": prompt}]
                }
            ]
        }

        try:
            raw_output = await call_gemini_api_with_retries(
                api_url=self.GEMINI_API_URL,
                headers=self.GEMINI_HEADERS,
                payload=payload,
                api_key=self.gemini_api_key
            )
            
            print("\n--- Raw LLM Output Start ---")
            print(raw_output)
            print("--- Raw LLM Output End ---\n")

            lines = raw_output.strip().split("\n")

            questions: List[MCQItem] = []
            current_q_text: str = ""
            options: List[str] = []
            correct_answer_letter: str = ""
            explanation_text: Optional[str] = None

            for line in lines:
                line = line.strip()
                if not line:
                    continue

                if line.startswith("Q:"):
                    if current_q_text and len(options) == 4 and correct_answer_letter:
                        try:
                            correct_index = ord(correct_answer_letter) - ord('A')
                            if 0 <= correct_index < len(options):
                                correct_answer_text = options[correct_index]
                                questions.append(MCQItem(
                                    question=current_q_text,
                                    options=options,
                                    correct_answer=correct_answer_text,
                                    explanation=explanation_text
                                ))
                            else:
                                print(f"Warning: Correct answer letter '{correct_answer_letter}' points to an invalid option index for question: '{current_q_text}'. Skipping this question.")
                        except ValidationError as ve:
                            print(f"Pydantic validation error for MCQItem: {ve} on question: '{current_q_text}'")
                        except Exception as e:
                            print(f"Error processing previous question: {e} on question: '{current_q_text}'")
                    
                    current_q_text = line[2:].strip()
                    options = []
                    correct_answer_letter = ""
                    explanation_text = None
                elif line.startswith(("A)", "B)", "C)", "D)")):
                    options.append(line[2:].strip())
                elif line.startswith("Answer:"):
                    letter_part = line.split(":")[1].strip().upper()
                    if letter_part and len(letter_part) == 1 and 'A' <= letter_part <= 'D':
                        correct_answer_letter = letter_part
                    else:
                        print(f"Warning: Could not parse valid correct answer letter from '{line}'.")
                elif line.startswith("Explanation:"):
                    explanation_text = line[len("Explanation:"):].strip()
            
            if current_q_text and len(options) == 4 and correct_answer_letter:
                try:
                    correct_index = ord(correct_answer_letter) - ord('A')
                    if 0 <= correct_index < len(options):
                        correct_answer_text = options[correct_index]
                        questions.append(MCQItem(
                            question=current_q_text,
                            options=options,
                            correct_answer=correct_answer_text,
                            explanation=explanation_text
                        ))
                    else:
                        print(f"Warning: Correct answer letter '{correct_answer_letter}' points to an invalid option index for the last question: '{current_q_text}'. Skipping this question.")
                except ValidationError as ve:
                    print(f"Pydantic validation error for last MCQItem: {ve} on question: '{current_q_text}'")
                except Exception as e:
                    print(f"Error processing last question: {e} on question: '{current_q_text}'")
            
            return questions

        except Exception as e:
            print(f"An error occurred in generate_mcq_from_text: {e}")
            raise LLMGenerationError(f"Failed to generate MCQs from LLM: {e}")

mcq_generator_service = MCQGeneratorService()
