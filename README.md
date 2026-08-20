# EasyLearn AI Assistant 📚

EasyLearn is an advanced, RAG-powered AI assistant designed to help users analyze, summarize, and query books (PDF, EPUB, TXT) with high precision and a modern, interactive web application.

---

## ✨ Core Features & Tools

### 🛠️ Specialized AI Tools
- **Summary**: Generates a concise overview of the book strictly adhering to length constraints (maximum 200 words or 3 distinct paragraphs in plain prose).
- **Question Answering**: Answers targeted, contextually grounded questions using retrieved book content only.
- **Character Arc Analysis**: Traces character emotional journeys, turning points, and plot contributions (*Fiction/Novels only*).
- **Plot Explanation**: Explains the narrative structure of specific chapters or the overarching book.
- **Concept Explanation**: Provides adaptive clarity explanations with customizable difficulty levels (simplified, standard, advanced) (*Educational material only*).
- **Problem Solving Assistance**: Provides step-by-step methods to solve problems based exclusively on book methodology (*Educational material only*).
- **Essay Outline + Thesis Generator**: Student Pro locked feature for fiction/novel uploads. Generates 1 arguable thesis, 3–5 body paragraph outline, and 2–3 verbatim quotes per paragraph with `[p. Y – Chapter Z]` citations. Locked for free users; clicking shows a “Coming soon for paid users. See more.” modal. Set `NEXT_PUBLIC_ENABLE_PAID_FEATURES=true` for local preview.

---

## ⚡ Advanced RAG & Technical Highlights

- **Local Embedding & Inference**: Powered by local Ollama models (`qwen3-embedding:0.6b` for dense embeddings and `qwen2.5:7b-instruct-q5_K_M` for local LLM generation), ensuring full data privacy with zero cloud transmission costs.
- **Two-Stage Retrieval System**:
  - **Stage 1 (Vector Search & MMR)**: Initial top-$k=30$ vector search using ChromaDB with tool-tuned MMR (`lambda_mult` ranging from 0.3 for summaries to 0.8 for concept explanations) to balance semantic relevance and diversity.
  - **Stage 2 (Reranking)**: `FlashrankRerank` re-scores retrieved chunks to select the top 8 most relevant passages for context injection.
- **Multi-Turn Conversation Memory**: Retains the last 10 chat messages (5 turns) in-memory (`InMemoryChatMessageHistory`) per book session to support natural follow-up questions.
- **New Conversation Button**: Clears the current chat UI and backend conversation memory via `POST /api/v1/query/clear-memory`, without deleting the uploaded book or vector index.
- **Inapplicability Guardrails**: Automatically detects content-type mismatches (e.g., character arc queries on educational texts) and provides clear user-facing guidance.
- **Academic Citations & Source Viewer**:
  - Responses include inline `[Chunk X]`, `[p. Y]`, and `[p. Y – Chapter Z]` citations rendered as interactive superscript tags.
  - Hovering a citation shows a popover with the matching verbatim excerpt and source metadata.
  - Collapsible **Source Viewer** panel exposes retrieved chunk metadata (chunk ID, page number, chapter title) and verbatim excerpts.
- **Asynchronous Token Streaming**: Real-time SSE (Server-Sent Events) streaming via FastAPI `StreamingResponse` and React Fetch API `ReadableStream`.
- **Automatic Cover Extraction**: Synchronously extracts cover thumbnails from PDF pages and EPUB metadata/images upon upload.

---

## 💬 Inline Feedback System

- Thumbs up/down controls are shown below every AI assistant message.
- Thumbs up submits silently.
- Thumbs down opens an optional feedback modal with:
  - Reason chips: wrong information, missing context, response too long, response too short, didn’t answer my question, cited wrong sources.
  - Optional free-text comment, max 500 characters.
- Feedback is submitted to `POST /api/v1/feedback/`.
- Stored as NDJSON in `feedback/feedback.json`.
- Rate limited to 60 submissions/hour per session.
- `feedback/feedback.json` is **not deleted** on server startup and should be gitignored.

---

## 🛡️ Security & Compliance

Aligned with OWASP Top 10:2025 and OWASP Top 10 for LLM Applications 2025:
- **File Ingestion Sanitization**: Strips zero-width characters, control characters, and hidden HTML/CSS styling. Scans uploaded text using fail-fast regex patterns for indirect prompt injection attempts.
- **MIME & Format Validation**: Enforces extension allow-lists (`.pdf`, `.epub`, `.txt`) and verifies true MIME types via `python-magic`.
- **Selected Format Mismatch**: If the user-selected format does not match the detected file type, upload is rejected with HTTP 422 and `INVALID_FORMAT`.
- **Input & Middleware Limits**:
  - Hard limit of 50MB per upload enforced at the FastAPI middleware level (HTTP 413).
  - PDF limits: Maximum 1000 pages; scanned image PDF detection.
  - EPUB/TXT limits: Maximum 1,500,000 characters.
- **Security Headers & Rate Limiting**: Enforces CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`.
- **Rate Limits**:
  - Uploads: 5/hour
  - Queries: 30/hour
  - Feedback: 60/hour
- Synchronous upload validation returns structured HTTP 422 responses:
  - `BOOK_TOO_LONG` when PDF exceeds 1000 pages or EPUB/TXT exceeds 1,500,000 characters.
  - `SCANNED_PDF` when the average text per page across the first 10 pages is below 20 characters.
  - `INVALID_FORMAT` for unsupported extensions, invalid MIME, or selected-format mismatches.

---

## 🛠️ Local Setup Instructions

### Prerequisites
- **Python 3.12+**
- **Node.js 20+**
- **Ollama**: [Download and install Ollama](https://ollama.com/)

### 1. Model Preparation (Ollama)

Pull the required local LLM and embedding models:
```bash
ollama pull qwen2.5:7b-instruct-q5_K_M
ollama pull qwen3-embedding:0.6b
```

### 2. Backend Setup (FastAPI)
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # Linux / macOS
   # .venv\Scripts\activate   # Windows
   ```
3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the API server:
   ```bash
   uvicorn backend.main:app --reload --port 8000
   ```

### 3. Frontend Setup (Next.js)
1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```

---

## 🧹 Data Persistence

- On server startup, `uploads/` and `db/` are wiped and recreated.
- Guest conversation memory is in-memory only and discarded on refresh/server restart.
- `feedback/feedback.json` is persisted across restarts and must be excluded from git.

---

## ⚙️ Environment Variables

### Backend

| Variable | Default | Description |
| --- | --- | --- |
| `OLLAMA_BASE_URL` | `http://127.0.0.1:11434` | Base URL for local Ollama API |
| `CHROMA_DB_PATH` | `./db` | ChromaDB persistence directory |

### Frontend

| Variable | Default | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000/api/v1` | Backend API base URL |
| `NEXT_PUBLIC_ENABLE_PAID_FEATURES` | `false` | Enables Student Pro Essay Outline preview |

Example:

```env
OLLAMA_BASE_URL=http://127.0.0.1:11434
CHROMA_DB_PATH=./db
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_ENABLE_PAID_FEATURES=false
```

---

## 🚀 Usage Guide

1. Open `http://localhost:3000` in your web browser.
2. Select your book file (`.pdf`, `.epub`, or `.txt`), choose the book category (**Fiction** or **Educational**), and choose the correct format. If the book type or format is not selected, upload is blocked with a validation message.
3. Once ingestion is complete, select a tool from the **Quick Tools** panel (e.g., Summary, Character Arc, Concept, Problem).
4. Enter custom prompts or difficulty preferences, and view streaming AI responses with expandable inline citations!

