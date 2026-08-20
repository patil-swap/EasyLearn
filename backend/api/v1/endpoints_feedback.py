from fastapi import APIRouter, Request
from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from slowapi import Limiter
from slowapi.util import get_remote_address
import json
import os
import logging

logger = logging.getLogger(__name__)

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

class FeedbackRequest(BaseModel):
    book_id: str
    tool_name: Literal[
        "summary",
        "question",
        "character_arc",
        "plot",
        "concept",
        "problem",
        "essay_outline",
    ]
    query_text: Optional[str] = None
    response_excerpt: str = Field(..., max_length=300)
    rating: Literal["up", "down"]
    reasons: Optional[
        List[
            Literal[
                "wrong_information",
                "missing_context",
                "too_long",
                "too_short",
                "unanswered",
                "wrong_sources",
            ]
        ]
    ] = None
    comment: Optional[str] = Field(None, max_length=500)
    session_id: str
    timestamp: str

@router.post("/")
@limiter.limit("60/hour")
async def submit_feedback(request: Request, feedback: FeedbackRequest):
    """
    Stores inline per-message feedback as NDJSON in ./feedback/feedback.json.
    Storage failure is logged but does not break the user experience.
    """
    try:
        os.makedirs("feedback", exist_ok=True)

        with open("feedback/feedback.json", "a", encoding="utf-8") as f:
            record = feedback.model_dump()
            f.write(json.dumps(record, ensure_ascii=False) + "\n")
    except Exception:
        logger.exception("Failed to store feedback")

    return {"status": "received"}
