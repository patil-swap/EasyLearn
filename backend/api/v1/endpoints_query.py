from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import List, Optional
from backend.core.rag_pipeline import RAGPipeline
from backend.core.llm_handler import LLMHandler
from backend.services.vector_db_manager import VectorDBManager
from slowapi import Limiter
from slowapi.util import get_remote_address

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
    try:
        result = await rag_pipeline.run_query(
            book_id=query_request.book_id,
            tool_name=query_request.tool_name,
            query_text=query_request.query_text,
            difficulty=query_request.difficulty_level
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
