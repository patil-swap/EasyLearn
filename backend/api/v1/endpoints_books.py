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

router = APIRouter()
db_manager = VectorDBManager()
limiter = Limiter(key_func=get_remote_address)

class BookUploadResponse(BaseModel):
    book_id: str
    title: str
    status: str

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Simple in-memory status tracker for Phase 1
processing_status = {}

def process_book_background(book_id: str, file_path: str, file_format: str):
    processing_status[book_id] = "processing"
    try:
        documents = IngestionService.process_file(file_path, file_format)
        if not documents or all(not d.get("content") for d in documents):
            raise ValueError("No readable text found in the document.")
        db_manager.create_collection_from_documents(book_id, documents)
        processing_status[book_id] = "completed"
    except Exception as e:
        print(f"Error processing book {book_id}: {e}")
        processing_status[book_id] = f"failed: {str(e)}"
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)

@router.post("/upload", response_model=BookUploadResponse)
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
        raise HTTPException(status_code=400, detail="Unsupported file extension. Use .pdf, .epub, or .txt")

    # Size check
    file.file.seek(0, os.SEEK_END)
    file_size = file.file.tell()
    file.file.seek(0)
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 50MB.")

    book_id = str(uuid.uuid4())
    temp_file_path = os.path.join(UPLOAD_DIR, f"{book_id}_{file.filename}")
    
    with open(temp_file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # MIME type validation
    mime = magic.Magic(mime=True)
    detected_mime = mime.from_file(temp_file_path)
    allowed_mimes = ["application/pdf", "application/epub+zip", "text/plain"]
    if detected_mime not in allowed_mimes:
        os.remove(temp_file_path)
        raise HTTPException(status_code=400, detail=f"Invalid file content. Detected MIME: {detected_mime}")
    
    background_tasks.add_task(process_book_background, book_id, temp_file_path, file_format)
    
    return {
        "book_id": book_id,
        "title": file.filename,
        "status": "processing"
    }

@router.get("/{book_id}/status")
async def get_upload_status(book_id: str):
    status = processing_status.get(book_id, "unknown")
    if status == "unknown":
        # Fallback to checking Chroma if memory lost/restarted
        try:
            db_manager.client.get_collection(f"book_{book_id}")
            return {"book_id": book_id, "status": "completed"}
        except Exception:
            return {"book_id": book_id, "status": "processing"}
    return {"book_id": book_id, "status": status}
