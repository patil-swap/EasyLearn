from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks, Request
from typing import Optional
from pydantic import BaseModel
import uuid
import os
import shutil
from backend.services.ingestion_service import IngestionService
from backend.services.vector_db_manager import VectorDBManager
from slowapi import Limiter
from slowapi.util import get_remote_address
import logging

logger = logging.getLogger(__name__)

router = APIRouter()
db_manager = VectorDBManager()
limiter = Limiter(key_func=get_remote_address)

class BookUploadResponse(BaseModel):
    book_id: str
    title: str
    status: str
    cover_data: Optional[str] = None

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Simple in-memory status tracker for Phase 1
processing_status = {}

import magic
from fastapi.responses import JSONResponse

# Standardized Error Codes (PRD)
class ErrorCodes:
    FILE_TOO_LARGE = "FILE_TOO_LARGE"
    BOOK_TOO_LONG = "BOOK_TOO_LONG"
    SCANNED_PDF = "SCANNED_PDF"
    INVALID_FORMAT = "INVALID_FORMAT"

MIME_TO_FORMAT = {
    "application/pdf": "pdf",
    "application/epub+zip": "epub",
    "text/plain": "txt",
}

def get_error_code_from_message(error_msg: str) -> str:
    msg_lower = error_msg.lower()
    if "too long" in msg_lower:
        return ErrorCodes.BOOK_TOO_LONG
    if "scanned image" in msg_lower:
        return ErrorCodes.SCANNED_PDF
    return ErrorCodes.INVALID_FORMAT

def process_book_background(book_id: str, file_path: str, file_format: str, book_type: str = "fiction"):
    processing_status[book_id] = {"status": "processing", "code": None, "message": None, "cover_data": None}
    logger.info("Ingestion started for book_id=%s", book_id)
    try:
        # Re-run process_file in background for the full document list and vector store
        docs_data = IngestionService.process_file(file_path, file_format)
        documents = docs_data["documents"]
        cover_data = docs_data["cover_data"]
        
        if not documents:
            raise ValueError("No readable text found in the document.")
        db_manager.create_collection_from_documents(book_id, documents, book_type=book_type)
        processing_status[book_id] = {"status": "completed", "code": None, "message": None, "cover_data": cover_data}
        logger.info("Ingestion completed for book_id=%s", book_id)
    except Exception as e:
        error_msg = str(e)
        code = get_error_code_from_message(error_msg)
        
        logger.error("Ingestion failed for book_id=%s: %s", book_id, error_msg)
        processing_status[book_id] = {
            "status": "failed",
            "code": code,
            "message": error_msg
        }
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)

@router.post("/upload")
@limiter.limit("5/hour")
async def upload_book(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    book_type: str = Form(...), # "fiction" or "educational"
    file_format: str = Form(...) # "pdf", "epub", "txt"
):
    # Extension validation
    if not file.filename.lower().endswith(('.pdf', '.epub', '.txt')):
        return JSONResponse(
            status_code=422,
            content={
                "error": True,
                "code": ErrorCodes.INVALID_FORMAT,
                "message": "Unsupported file extension. Use .pdf, .epub, or .txt"
            }
        )

    book_id = str(uuid.uuid4())
    logger.info("Book upload received: filename=%s, type=%s, book_id=%s", file.filename, book_type, book_id)
    temp_file_path = os.path.join(UPLOAD_DIR, f"{book_id}_{file.filename}")
    
    with open(temp_file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # MIME type validation
    try:
        mime = magic.Magic(mime=True)
        detected_mime = mime.from_file(temp_file_path)
        allowed_mimes = ["application/pdf", "application/epub+zip", "text/plain"]
        if detected_mime not in allowed_mimes:
            os.remove(temp_file_path)
            return JSONResponse(
                status_code=422,
                content={
                    "error": True,
                    "code": ErrorCodes.INVALID_FORMAT,
                    "message": f"Invalid file content. Expected PDF/EPUB/TXT, detected {detected_mime}"
                }
            )

        # New: compare selected format with detected MIME
        detected_format = MIME_TO_FORMAT.get(detected_mime)
        selected_format = file_format.lower()

        if detected_format and detected_format != selected_format:
            os.remove(temp_file_path)
            return JSONResponse(
                status_code=422,
                content={
                    "error": True,
                    "code": ErrorCodes.INVALID_FORMAT,
                    "message": f"Selected format does not match the uploaded file. Detected {detected_format.upper()}."
                }
            )

    except Exception as e:
        if os.path.exists(temp_file_path): os.remove(temp_file_path)
        return JSONResponse(
            status_code=500,
            content={"error": True, "code": "SERVER_ERROR", "message": str(e)}
        )
    
    # Synchronous pre-flight validation per PRD Section 5
    try:
        IngestionService.validate_file(temp_file_path, file_format)
    except ValueError as ve:
        error_msg = str(ve)
        code = get_error_code_from_message(error_msg)
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        logger.warning("Synchronous validation failed for upload book_id=%s: %s", book_id, error_msg)
        return JSONResponse(
            status_code=422,
            content={
                "error": True,
                "code": code,
                "message": error_msg
            }
        )
    except Exception:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        logger.exception("Synchronous validation crashed for book_id=%s", book_id)
        return JSONResponse(
            status_code=422,
            content={
                "error": True,
                "code": ErrorCodes.INVALID_FORMAT,
                "message": "File could not be processed. Check file integrity."
            }
        )

    # Extract cover synchronously for immediate feedback if possible
    cover_data = None
    if file_format.lower() in ["pdf", "epub"]:
        if file_format.lower() == "pdf":
            cover_data = IngestionService.extract_cover_from_pdf(temp_file_path)
        else:
            cover_data = IngestionService.extract_cover_from_epub(temp_file_path)

    background_tasks.add_task(process_book_background, book_id, temp_file_path, file_format, book_type)
    
    return {
        "book_id": book_id,
        "title": file.filename,
        "status": "processing",
        "cover_data": cover_data
    }

@router.get("/{book_id}/status")
async def get_upload_status(book_id: str):
    status_data = processing_status.get(book_id, "unknown")
    if status_data == "unknown":
        try:
            db_manager.client.get_collection(f"book_{book_id}")
            return {"book_id": book_id, "status": "completed", "code": None, "message": None}
        except Exception:
            return {"book_id": book_id, "status": "processing", "code": None, "message": None}
    
    if isinstance(status_data, str):
        return {"book_id": book_id, "status": status_data, "code": None, "message": None}
        
    return {
        "book_id": book_id,
        **status_data
    }
