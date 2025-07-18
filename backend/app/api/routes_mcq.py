from fastapi import APIRouter, HTTPException, status, Query, BackgroundTasks, Form, UploadFile, File
from pydantic import BaseModel, Field
from typing import List, Optional
from ..services.parser import process_document_and_chunk
from ..services.mcq_generator import mcq_generator_service, LLMGenerationError
from ..db.mongo import mongo_db
from ..models.schema import QuestionBase, QuestionInDB, Difficulty, Source, DocumentInDB, MCQItem
from bson import ObjectId
import os
from datetime import datetime

router = APIRouter()

UPLOAD_DIR = "uploaded_documents"
os.makedirs(UPLOAD_DIR, exist_ok=True)

class MCQGenerateRequest(BaseModel):
    topic: str = Field(..., description="The topic for which MCQs are to be generated.")
    difficulty: Difficulty = Field(
        Difficulty.MEDIUM, description="Difficulty level of the MCQs (easy, medium, hard)."
    )
    num_questions: int = Field(
        5, ge=1, le=50, description="Number of MCQs to generate (between 1 and 50)."
    )
    category: Optional[str] = Field(None, description="Optional category to guide MCQ generation.")

@router.post("/generate-from-text", response_model=List[QuestionInDB], status_code=status.HTTP_201_CREATED)
async def generate_mcqs_from_text_endpoint(request: MCQGenerateRequest):
    try:
        generated_mcq_items: List[MCQItem] = await mcq_generator_service.generate_mcq_from_text(
            topic=request.topic,
            num_questions=request.num_questions,
            difficulty=request.difficulty,
            category=request.category
        )

        questions_to_insert = []
        for mcq_item in generated_mcq_items:
            try:
                correct_answer_index = mcq_item.options.index(mcq_item.correct_answer)
            except ValueError:
                print(f"Warning: Correct answer '{mcq_item.correct_answer}' not found in options for question: '{mcq_item.question}'. Skipping this question.")
                continue

            question = QuestionInDB(
                question_text=mcq_item.question,
                options=mcq_item.options,
                correct_answer_index=correct_answer_index,
                explanation=f"The correct answer is {mcq_item.correct_answer}.",
                difficulty=request.difficulty,
                categories=[request.category] if request.category else [],
                source=Source.AI_GENERATED,
            )
            questions_to_insert.append(question.model_dump(by_alias=True, exclude_none=True))

        if questions_to_insert:
            result = await mongo_db.db.questions.insert_many(questions_to_insert)
            inserted_ids = result.inserted_ids
            inserted_questions = await mongo_db.db.questions.find({"_id": {"$in": inserted_ids}}).to_list(length=len(inserted_ids))
            return [QuestionInDB.model_validate(q) for q in inserted_questions]
        else:
            return []

    except LLMGenerationError as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"AI generation error: {e}")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"An unexpected error occurred during MCQ generation: {e}")

@router.post("/questions", response_model=QuestionInDB, status_code=status.HTTP_201_CREATED)
async def create_manual_question(question: QuestionBase):
    try:
        question_data = question.model_dump(by_alias=True, exclude_none=True)
        question_data["source"] = Source.MANUAL.value

        result = await mongo_db.db.questions.insert_one(question_data)
        
        created_question_doc = await mongo_db.db.questions.find_one({"_id": result.inserted_id})

        if created_question_doc:
            return QuestionInDB.model_validate(created_question_doc)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to retrieve created question after insertion.")

    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error creating manual question: {e}")

@router.get("/questions", response_model=List[QuestionInDB])
async def get_all_questions(
    difficulty: Optional[Difficulty] = Query(None, description="Filter by difficulty level."),
    category: Optional[str] = Query(None, description="Filter by category (exact match)."),
    source: Optional[Source] = Query(None, description="Filter by question source (Manual, AI_Generated, Document_Upload).")
):
    query = {}
    if difficulty:
        query["difficulty"] = difficulty.value
    if category:
        query["categories"] = category
    if source:
        query["source"] = source.value

    questions_cursor = mongo_db.db.questions.find(query)
    questions = []
    for doc in await questions_cursor.to_list(length=None):
        questions.append(QuestionInDB.model_validate(doc))
    return questions

@router.get("/questions/{question_id}", response_model=QuestionInDB)
async def get_question_by_id(question_id: str):
    try:
        object_id = ObjectId(question_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid question ID format.")

    question_doc = await mongo_db.db.questions.find_one({"_id": object_id})
    if question_doc:
        return QuestionInDB.model_validate(question_doc)
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found.")

@router.put("/questions/{question_id}", response_model=QuestionInDB)
async def update_question(question_id: str, question_update: QuestionBase):
    try:
        object_id = ObjectId(question_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid question ID format.")

    update_data = question_update.model_dump(by_alias=True, exclude_none=True)
    update_data.pop("source", None)
    update_data.pop("_id", None)

    result = await mongo_db.db.questions.update_one(
        {"_id": object_id},
        {"$set": update_data}
    )
    if result.modified_count == 1:
        updated_question_doc = await mongo_db.db.questions.find_one({"_id": object_id})
        return QuestionInDB.model_validate(updated_question_doc)
    elif result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found.")
    else:
        raise HTTPException(status_code=status.HTTP_304_NOT_MODIFIED, detail="Question found but no changes were made.")

@router.delete("/questions/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_question(question_id: str):
    try:
        object_id = ObjectId(question_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid question ID format.")

    result = await mongo_db.db.questions.delete_one({"_id": object_id})
    if result.deleted_count == 1:
        return
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found.")

