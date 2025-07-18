from typing import List, Dict, Any
import os

# Install these if you need them:
# pip install PyPDF2
# pip install python-docx

async def process_document_and_chunk(file_path: str) -> str:
    """
    Processes an uploaded document to extract its text content.
    This is a simplified version. For production, you'd add robust error handling
    and potentially more advanced text extraction/cleaning.
    """
    file_extension = os.path.splitext(file_path)[1].lower()
    text_content = ""

    if file_extension == '.txt':
        with open(file_path, 'r', encoding='utf-8') as f:
            text_content = f.read()
    elif file_extension == '.pdf':
        try:
            from PyPDF2 import PdfReader
            reader = PdfReader(file_path)
            for page in reader.pages:
                text_content += page.extract_text() or ""
        except ImportError:
            print("PyPDF2 not installed. Cannot process PDF files.")
            text_content = "PyPDF2 not installed. Please install it to process PDF files."
        except Exception as e:
            print(f"Error processing PDF {file_path}: {e}")
            text_content = f"Error processing PDF: {e}"
    elif file_extension == '.docx':
        try:
            from docx import Document
            doc = Document(file_path)
            for paragraph in doc.paragraphs:
                text_content += paragraph.text + "\n"
        except ImportError:
            print("python-docx not installed. Cannot process DOCX files.")
            text_content = "python-docx not installed. Please install it to process DOCX files."
        except Exception as e:
            print(f"Error processing DOCX {file_path}: {e}")
            text_content = f"Error processing DOCX: {e}"
    else:
        print(f"Unsupported file type: {file_extension}")
        text_content = f"Unsupported file type: {file_extension}"

    if not text_content.strip():
        return "No readable text content found in the document."

    return text_content

