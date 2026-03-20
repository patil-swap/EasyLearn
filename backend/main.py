from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from backend.api.v1 import endpoints_books, endpoints_query
import logging
import sys

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

limiter = Limiter(key_func=get_remote_address)
app = FastAPI(
    title="EasyLearn AI Assistant",
    description="RAG-powered book analysis assistant",
    version="1.0.0"
)

# Security Headers & File Size Middleware
@app.middleware("http")
async def security_and_size_middleware(request: Request, call_next):
    # 50MB limit (PRD 7.3)
    MAX_FILE_SIZE = 50 * 1024 * 1024 # 50MB
    content_length = request.headers.get("Content-Length")
    if content_length and int(content_length) > MAX_FILE_SIZE:
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=413,
            content={
                "error": True, 
                "code": "FILE_TOO_LARGE", 
                "message": "File too large. Maximum allowed size is 50MB."
            }
        )

    response: Response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' http://localhost:8000;"
    return response

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Set up CORS
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(endpoints_books.router, prefix="/api/v1/books", tags=["books"])
app.include_router(endpoints_query.router, prefix="/api/v1/query", tags=["queries"])

@app.get("/")
async def root():
    return {"message": "Welcome to EasyLearn AI Assistant API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
