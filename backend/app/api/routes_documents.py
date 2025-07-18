from fastapi import APIRouter, UploadFile, File, HTTPException, status, BackgroundTasks, Form
from typing import List, Optional
from ..db.mongo import mongo_db
from ..models.schema import DocumentInDB, QuestionInDB, Source, Difficulty, MCQItem
from ..services.parser import process_document_and_chunk
from ..services.mcq_generator import mcq_generator_service, LLMGenerationError
import os
from bson import ObjectId
from datetime import datetime

router = APIRouter()

UPLOAD_DIR = "uploaded_documents"
os.makedirs(UPLOAD_DIR, exist_ok=True)

async def generate_mcqs_from_document_background(
    doc_id: str,
    text_content: str,
    num_questions_per_chunk: int,
    difficulty: Difficulty,
    category: Optional[str]
):
    try:
        print(f"Background MCQ generation started for document ID: {doc_id}")
        chunk_size = 2000
        overlap = 200
        
        chunks = []
        start = 0
        while start < len(text_content):
            end = start + chunk_size
            chunk = text_content[start:end]
            chunks.append(chunk)
            start += chunk_size - overlap
            if start >= len(text_content):
                break

        if not chunks:
            print(f"No valid text chunks found for document {doc_id}.")
            return

        all_generated_questions = []
        for i, chunk in enumerate(chunks):
            if not chunk.strip():
                continue
            print(f"Processing chunk {i+1}/{len(chunks)} for document {doc_id}...")
            try:
                generated_mcq_items_for_chunk: List[MCQItem] = await mcq_generator_service.generate_mcq_from_text(
                    topic=chunk,
                    num_questions=num_questions_per_chunk,
                    difficulty=difficulty,
                    category=category
                )
                for mcq_item in generated_mcq_items_for_chunk:
                    try:
                        correct_answer_index = mcq_item.options.index(mcq_item.correct_answer)
                    except ValueError:
                        print(f"Warning: Correct answer '{mcq_item.correct_answer}' not found in options for question: '{mcq_item.question}' from doc {doc_id}. Skipping this question.")
                        continue

                    question = QuestionInDB(
                        question_text=mcq_item.question,
                        options=mcq_item.options,
                        correct_answer_index=correct_answer_index,
                        explanation=f"The correct answer is {mcq_item.correct_answer}.",
                        difficulty=difficulty,
                        categories=[category] if category else [],
                        source=Source.DOCUMENT_UPLOAD,
                        generated_from_doc_id=ObjectId(doc_id)
                    )
                    all_generated_questions.append(question.model_dump(by_alias=True, exclude_none=True))
            except LLMGenerationError as e:
                print(f"LLM generation error for chunk {i+1} of doc {doc_id}: {e}")
            except Exception as e:
                print(f"Unexpected error processing chunk {i+1} of doc {doc_id}: {e}")

        if all_generated_questions:
            await mongo_db.db.questions.insert_many(all_generated_questions)
            print(f"Successfully generated and saved {len(all_generated_questions)} MCQs for document {doc_id}")
        else:
            print(f"No MCQs generated from document {doc_id} after processing all chunks.")

    except Exception as e:
        print(f"Critical error in background MCQ generation for document {doc_id}: {e}")
    finally:
        pass


@router.post("/upload", response_model=DocumentInDB, status_code=status.HTTP_201_CREATED)
async def upload_document_and_generate_mcqs(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(..., description="The document file to upload (PDF, TXT, DOCX)."),
    num_questions_per_chunk: int = Form(2, ge=1, le=5, description="Number of MCQs to attempt generating per text chunk."),
    difficulty: Difficulty = Form(Difficulty.MEDIUM, description="Desired difficulty for generated MCQs."),
    category: Optional[str] = Form(None, description="Optional category for generated MCQs.")
):
    allowed_extensions = ('.pdf', '.txt', '.docx')
    if not file.filename.lower().endswith(allowed_extensions):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Unsupported file type. Only {', '.join(allowed_extensions)} are allowed.")

    file_path = os.path.join(UPLOAD_DIR, file.filename)
    try:
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)

        text_content = await process_document_and_chunk(file_path)

        if not text_content.strip() or "Unsupported file type" in text_content or "not installed" in text_content:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Could not extract meaningful text from the document. Please ensure it's a valid {', '.join(allowed_extensions)} and contains readable text. Error: {text_content}")

        document_db_entry = DocumentInDB(
            filename=file.filename,
            file_size=file.size,
            upload_date=datetime.utcnow()
        )
        result = await mongo_db.db.documents.insert_one(document_db_entry.model_dump(by_alias=True, exclude_none=True))
        document_db_entry.id = str(result.inserted_id)

        background_tasks.add_task(
            generate_mcqs_from_document_background,
            doc_id=document_db_entry.id,
            text_content=text_content,
            num_questions_per_chunk=num_questions_per_chunk,
            difficulty=difficulty,
            category=category
        )

        return document_db_entry

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error during document upload or initial processing: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"File upload or processing failed: {e}")
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)

@router.get("/uploaded", response_model=List[DocumentInDB])
async def get_uploaded_documents():
    results_cursor = mongo_db.db.documents.find({})
    documents = []
    for doc in await results_cursor.to_list(length=None):
        documents.append(DocumentInDB.model_validate(doc))
    return documents
