from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional, AsyncGenerator
from backend.core.rag_pipeline import RAGPipeline
from backend.core.llm_handler import LLMHandler
from backend.services.vector_db_manager import VectorDBManager
from slowapi import Limiter
from slowapi.util import get_remote_address
import json
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

@router.post("/")
@limiter.limit("30/hour")
async def execute_query(request: Request, query_request: QueryRequest):
    logger.info("Query received for book_id=%s, tool=%s", query_request.book_id, query_request.tool_name)

    try:
        collection = db_manager.client.get_collection(f"book_{query_request.book_id}")
        metadata = collection.metadata or {}
        book_type = metadata.get("book_type", "fiction")

        if query_request.tool_name == "character_arc" and book_type == "educational":
            async def inapplicable_stream():
                yield f"data: {json.dumps({'type': 'token', 'value': 'The Character Arc feature is only available for fiction books and is not applicable to educational content.'})}\n\n"
                yield f"data: {json.dumps({'type': 'sources', 'value': []})}\n\n"
                yield f"data: {json.dumps({'type': 'done'})}\n\n"
            return StreamingResponse(inapplicable_stream(), media_type="text/event-stream")

        if query_request.tool_name in ("concept", "problem") and book_type == "fiction":
            async def inapplicable_stream():
                yield f"data: {json.dumps({'type': 'token', 'value': 'The Concept/Problem Solving feature is only available for educational books and is not applicable to fiction content.'})}\n\n"
                yield f"data: {json.dumps({'type': 'sources', 'value': []})}\n\n"
                yield f"data: {json.dumps({'type': 'done'})}\n\n"
            return StreamingResponse(inapplicable_stream(), media_type="text/event-stream")

    except Exception:
        logger.error("Query failed: Book not found book_id=%s", query_request.book_id)
        raise HTTPException(status_code=404, detail="Book not found. Please upload it first.")

    async def stream_response() -> AsyncGenerator[str, None]:
        try:
            async for chunk in rag_pipeline.run_query(
                book_id=query_request.book_id,
                tool_name=query_request.tool_name,
                query_text=query_request.query_text,
                difficulty=query_request.difficulty_level
            ):
                if chunk["type"] == "token":
                    yield f"data: {json.dumps({'type': 'token', 'value': chunk['value']})}\n\n"
                elif chunk["type"] == "sources":
                    yield f"data: {json.dumps({'type': 'sources', 'value': chunk['value']})}\n\n"

            yield f"data: {json.dumps({'type': 'done'})}\n\n"

        except Exception as e:
            logger.exception("Streaming query failed for book_id=%s", query_request.book_id)
            yield f"data: {json.dumps({'type': 'error', 'value': str(e)})}\n\n"

    return StreamingResponse(stream_response(), media_type="text/event-stream")