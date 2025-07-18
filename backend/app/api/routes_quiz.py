from fastapi import APIRouter, HTTPException, status
from typing import List, Optional, Dict, Any
from ..db.mongo import mongo_db
from ..models.schema import QuestionInDB, Difficulty, QuizResult, PyObjectId
from random import sample
from bson import ObjectId
from pydantic import BaseModel, Field

router = APIRouter()

class QuizGenerationRequest(BaseModel):
    num_questions: int = Field(5, ge=1, le=20, description="Number of questions to include in the quiz.")
    difficulty: Optional[Difficulty] = Field(None, description="Optional difficulty filter for quiz questions.")
    category: Optional[str] = Field(None, description="Optional category filter for quiz questions.")

class QuizQuestionForUser(BaseModel):
    id: PyObjectId = Field(alias="_id", description="The unique ID of the question.")
    question_text: str = Field(..., description="The text of the question.")
    options: List[str] = Field(..., description="List of answer options.")

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True
    }

@router.post("/generate", response_model=List[QuizQuestionForUser])
async def generate_quiz(request: QuizGenerationRequest):
    query = {}
    if request.difficulty:
        query["difficulty"] = request.difficulty.value
    if request.category:
        query["categories"] = request.category

    all_matching_questions_cursor = mongo_db.db.questions.find(query)
    all_matching_questions = await all_matching_questions_cursor.to_list(length=None)

    if len(all_matching_questions) < request.num_questions:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Not enough questions found to create a quiz. Found {len(all_matching_questions)}, requested {request.num_questions}."
        )

    selected_questions_docs = sample(all_matching_questions, request.num_questions)

    return [
        QuizQuestionForUser(
            _id=str(q["_id"]),
            question_text=q["question_text"],
            options=q["options"]
        ) for q in selected_questions_docs
    ]

class UserAnswer(BaseModel):
    question_id: str = Field(..., description="The ID of the question.")
    user_answer_index: int = Field(..., description="The 0-based index of the option selected by the user.")

class QuizSubmission(BaseModel):
    answers: List[UserAnswer] = Field(..., description="A list of user's answers for each question in the quiz.")
    user_id: Optional[str] = Field(None, description="Optional user ID for tracking quiz results.")

@router.post("/submit", response_model=QuizResult, status_code=status.HTTP_201_CREATED)
async def submit_quiz(submission: QuizSubmission):
    correct_count = 0
    total_questions = len(submission.answers)

    if total_questions == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No answers provided in the submission.")

    attempted_question_ids_obj = []
    for ans in submission.answers:
        try:
            attempted_question_ids_obj.append(ObjectId(ans.question_id))
        except Exception:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid question ID format: {ans.question_id}")

    questions_map: Dict[str, QuestionInDB] = {}
    questions_cursor = mongo_db.db.questions.find({"_id": {"$in": attempted_question_ids_obj}})
    for doc in await questions_cursor.to_list(length=None):
        q_in_db = QuestionInDB.model_validate(doc)
        questions_map[str(q_in_db.id)] = q_in_db

    for answer in submission.answers:
        question_id_str = answer.question_id
        if question_id_str in questions_map:
            question = questions_map[question_id_str]
            if answer.user_answer_index == question.correct_answer_index:
                correct_count += 1
        else:
            print(f"Warning: Question ID {question_id_str} not found in DB during quiz submission.")

    score = (correct_count / total_questions) * 100 if total_questions > 0 else 0

    quiz_result = QuizResult(
        total_questions=total_questions,
        correct_answers=correct_count,
        score=score,
        user_id=submission.user_id
    )

    result = await mongo_db.db.quiz_results.insert_one(quiz_result.model_dump(by_alias=True, exclude_none=True))
    created_result_doc = await mongo_db.db.quiz_results.find_one({"_id": result.inserted_id})

    if created_result_doc:
        return QuizResult.model_validate(created_result_doc)
    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to save quiz result.")

@router.get("/results", response_model=List[QuizResult])
async def get_all_quiz_results():
    results_cursor = mongo_db.db.quiz_results.find({})
    results = []
    for doc in await results_cursor.to_list(length=None):
        results.append(QuizResult.model_validate(doc))
    return results
