from fastapi import APIRouter, Query, HTTPException, status
from fastapi.responses import JSONResponse, StreamingResponse
from typing import List, Optional
from ..db.mongo import mongo_db
from ..models.schema import QuestionInDB, Difficulty
from bson import ObjectId
import io
import json

# For PDF export (uncomment and install reportlab if you want backend PDF)
# from reportlab.lib.pagesizes import letter
# from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
# from reportlab.lib.styles import getSampleStyleSheet
# from reportlab.lib.units import inch

router = APIRouter()

@router.get("/json", response_class=JSONResponse)
async def export_questions_json(
    question_ids: Optional[List[str]] = Query(None, description="List of specific question IDs to export."),
    difficulty: Optional[Difficulty] = Query(None, description="Filter questions by difficulty level."),
    category: Optional[str] = Query(None, description="Filter questions by category.")
):
    query = {}
    if question_ids:
        try:
            obj_ids = [ObjectId(qid) for qid in question_ids]
            query["_id"] = {"$in": obj_ids}
        except Exception:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid question ID format in list.")
    if difficulty:
        query["difficulty"] = difficulty.value
    if category:
        query["categories"] = category

    questions_cursor = mongo_db.db.questions.find(query)
    questions_to_export = []
    for doc in await questions_cursor.to_list(length=None):
        doc["_id"] = str(doc["_id"])
        if "generated_from_doc_id" in doc and doc["generated_from_doc_id"]:
             doc["generated_from_doc_id"] = str(doc["generated_from_doc_id"])
        questions_to_export.append(doc)

    if not questions_to_export:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No questions found for the specified export criteria.")

    return JSONResponse(
        content=questions_to_export,
        media_type="application/json",
        headers={"Content-Disposition": "attachment; filename=mcq_questions.json"}
    )

# Uncomment and install 'reportlab' if you want to enable backend PDF generation
# @router.get("/pdf", response_class=StreamingResponse)
# async def export_questions_pdf(
#     question_ids: Optional[List[str]] = Query(None, description="List of specific question IDs to export."),
#     difficulty: Optional[Difficulty] = Query(None, description="Filter questions by difficulty level."),
#     category: Optional[str] = Query(None, description="Filter questions by category.")
# ):
#     query = {}
#     if question_ids:
#         try:
#             obj_ids = [ObjectId(qid) for qid in question_ids]
#             query["_id"] = {"$in": obj_ids}
#         except Exception:
#             raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid question ID format in list.")
#     if difficulty:
#         query["difficulty"] = difficulty.value
#     if category:
#         query["categories"] = category

#     questions_cursor = mongo_db.db.questions.find(query)
#     questions_data = []
#     for doc in await questions_cursor.to_list(length=None):
#         questions_data.append(QuestionInDB.model_validate(doc))

#     if not questions_data:
#         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No questions found for the specified export criteria.")

#     buffer = io.BytesIO()
#     doc = SimpleDocTemplate(buffer, pagesize=letter)
#     story = []
#     styles = getSampleStyleSheet()

#     # Title
#     story.append(Paragraph("<b>MCQ Questions Export</b>", styles['h1']))
#     story.append(Spacer(1, 0.2 * inch))

#     for i, q in enumerate(questions_data):
#         # Question Text
#         story.append(Paragraph(f"<b>Question {i+1}:</b> {q.question_text}", styles['Normal']))
#         story.append(Spacer(1, 0.05 * inch))

#         # Options
#         for j, opt in enumerate(q.options):
#             story.append(Paragraph(f"  {chr(65+j)}. {opt}", styles['Normal']))
#         story.append(Spacer(1, 0.05 * inch))

#         # Correct Answer and Explanation
#         story.append(Paragraph(f"<b>Correct Answer:</b> {q.options[q.correct_answer_index]}", styles['Normal']))
#         if q.explanation:
#             story.append(Paragraph(f"<b>Explanation:</b> {q.explanation}", styles['Normal']))
#         story.append(Spacer(1, 0.2 * inch)) # Add space after each question

#     doc.build(story)
#     buffer.seek(0)

#     return StreamingResponse(
#         buffer,
#         media_type="application/pdf",
#         headers={"Content-Disposition": "attachment; filename=mcq_questions.pdf"}
#     )

