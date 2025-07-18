from pydantic import BaseModel, Field, BeforeValidator
from typing import List, Optional, Union
from enum import Enum
from datetime import datetime
from bson import ObjectId
from typing_extensions import Annotated

# Custom type for MongoDB ObjectId to Pydantic string conversion
PyObjectId = Annotated[str, BeforeValidator(str)]

class Difficulty(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"

class Source(str, Enum):
    AI_GENERATED = "AI_Generated"
    MANUAL = "Manual"
    DOCUMENT_UPLOAD = "Document_Upload"

class QuestionBase(BaseModel):
    """Base model for a question, used for creation/update."""
    question_text: str = Field(..., min_length=1, description="The text of the multiple-choice question.")
    options: List[str] = Field(..., min_items=2, max_items=6, description="A list of possible answers for the question.")
    correct_answer_index: int = Field(..., ge=0, description="The 0-based index of the correct answer in the options list.")
    explanation: Optional[str] = Field(None, description="An optional explanation for the correct answer.")
    difficulty: Difficulty = Field(Difficulty.MEDIUM, description="The difficulty level of the question.")
    categories: List[str] = Field(default_factory=list, description="A list of categories the question belongs to.")

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "question_text": "What is the capital of France?",
                    "options": ["Berlin", "Madrid", "Paris", "Rome"],
                    "correct_answer_index": 2,
                    "explanation": "Paris is the capital and most populous city of France.",
                    "difficulty": "easy",
                    "categories": ["Geography", "Europe"]
                }
            ]
        }
    }

class QuestionInDB(QuestionBase):
    """Model for a question as stored in MongoDB, including ObjectId and timestamps."""
    id: PyObjectId = Field(alias="_id", default_factory=ObjectId, description="The unique identifier of the question.")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Timestamp of when the question was created.")
    source: Source = Field(Source.MANUAL, description="The origin of the question (manual, AI-generated, document upload).")
    generated_from_doc_id: Optional[PyObjectId] = Field(None, description="If AI-generated from a document, the ID of the source document.")

    model_config = {
        "populate_by_name": True, # Allows Pydantic to map 'id' to '_id'
        "arbitrary_types_allowed": True, # Required for PyObjectId
        "json_schema_extra": {
            "examples": [
                {
                    "_id": "60c72b2f9b1d8c001a8c4d1e",
                    "question_text": "What is the capital of France?",
                    "options": ["Berlin", "Madrid", "Paris", "Rome"],
                    "correct_answer_index": 2,
                    "explanation": "Paris is the capital and most populous city of France.",
                    "difficulty": "easy",
                    "categories": ["Geography", "Europe"],
                    "created_at": "2023-10-26T10:00:00.000Z",
                    "source": "Manual"
                }
            ]
        }
    }

class QuizResult(BaseModel):
    """Model for storing quiz results."""
    id: PyObjectId = Field(alias="_id", default_factory=ObjectId, description="The unique identifier for the quiz result.")
    user_id: Optional[PyObjectId] = Field(None, description="Optional user ID if authentication is implemented.")
    quiz_date: datetime = Field(default_factory=datetime.utcnow, description="Timestamp of when the quiz was taken.")
    total_questions: int = Field(..., ge=0, description="Total number of questions in the quiz.")
    correct_answers: int = Field(..., ge=0, description="Number of correct answers.")
    score: float = Field(..., ge=0, le=100, description="Score as a percentage.")
    # You could add more detailed results like:
    # attempted_questions: List[Dict[str, Union[str, int, bool]]] = Field(default_factory=list)
    # e.g., [{"question_id": "...", "user_answer_index": N, "is_correct": bool}]

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_schema_extra": {
            "examples": [
                {
                    "_id": "60c72b2f9b1d8c001a8c4d1f",
                    "user_id": "60c72b2f9b1d8c001a8c4d20",
                    "quiz_date": "2023-10-26T11:00:00.000Z",
                    "total_questions": 10,
                    "correct_answers": 7,
                    "score": 70.0
                }
            ]
        }
    }

class DocumentInDB(BaseModel):
    """Model for storing uploaded document metadata."""
    id: PyObjectId = Field(alias="_id", default_factory=ObjectId, description="The unique identifier for the document.")
    filename: str = Field(..., description="The original filename of the uploaded document.")
    file_size: int = Field(..., ge=0, description="The size of the uploaded file in bytes.")
    upload_date: datetime = Field(default_factory=datetime.utcnow, description="Timestamp of when the document was uploaded.")
    # You could add a status field for processing:
    # status: str = Field("uploaded", description="Processing status of the document (uploaded, processing, completed, failed).")
    # And potentially store a reference to the extracted text or chunks if not directly in DB
    # text_content_preview: Optional[str] = Field(None, description="A short preview of the document's text content.")

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_schema_extra": {
            "examples": [
                {
                    "_id": "60c72b2f9b1d8c001a8c4d21",
                    "filename": "my_science_notes.pdf",
                    "file_size": 102400,
                    "upload_date": "2023-10-26T09:30:00.000Z"
                }
            ]
        }
    }
