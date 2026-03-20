from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import List, Optional
from backend.core.rag_pipeline import RAGPipeline
from backend.core.llm_handler import LLMHandler
from backend.services.vector_db_manager import VectorDBManager
from slowapi import Limiter
from slowapi.util import get_remote_address
import logging

logger = logging.getLogger(__name__)

router = APIRouter()
db_manager = VectorDBManager()
llm_handler = LLMHandler()
rag_pipeline = RAGPipeline(db_manager, llm_handler)
limiter = Limiter(key_func=get_remote_address)

class QueryRequest(BaseModel):
    book_id: str
    tool_name: str # "summary", "question", "character_arc", "plot", "concept", "problem"
    query_text: Optional[str] = None
    difficulty_level: Optional[str] = "standard"

class SourceMetadata(BaseModel):
    chunk_id: str
    page: Optional[int] = None
    chapter: Optional[str] = None
    excerpt: str

class QueryResponse(BaseModel):
    answer: str
    sources: List[SourceMetadata]

@router.post("/", response_model=QueryResponse)
@limiter.limit("30/hour")
async def execute_query(request: Request, query_request: QueryRequest):
    logger.info("Query received for book_id=%s, tool=%s", query_request.book_id, query_request.tool_name)
    try:
        # Check if book exists and verify applicability
        try:
            collection = db_manager.client.get_collection(f"book_{query_request.book_id}")
            # Correctly handle metadata which might be None if collection is empty
            metadata = collection.metadata or {}
            book_type = metadata.get("book_type", "fiction")
            
            if query_request.tool_name == "character_arc" and book_type == "educational":
                return {
                    "answer": "The 'Character Arc' feature is only available for fiction books and is not applicable to educational content.",
                    "sources": []
                }
        except Exception:
            # Collection not found
            logger.error("Query failed: Book not found book_id=%s", query_request.book_id)
            raise HTTPException(status_code=404, detail="Book not found. Please upload it first.")

        result = await rag_pipeline.run_query(
            book_id=query_request.book_id,
            tool_name=query_request.tool_name,
            query_text=query_request.query_text,
            difficulty=query_request.difficulty_level
        )
        logger.info("Query completed for book_id=%s, tool=%s", query_request.book_id, query_request.tool_name)
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Query failed for book_id=%s, tool=%s: %s", query_request.book_id, query_request.tool_name, str(e))
        raise HTTPException(status_code=500, detail=str(e))
