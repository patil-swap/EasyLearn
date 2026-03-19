# EasyLearn AI Assistant 📚

EasyLearn is a powerful, RAG-powered AI assistant designed to help you analyze, summarize, and query books (PDF, EPUB, TXT) with academic-grade precision and a modern user interface.

## ✨ Features

- **Multi-Format Support**: Seamlessly ingest PDF, EPUB, and TXT files.
- **Specialized AI Tools**:
  - **Summary**: Concise overviews (max 200 words/3 paragraphs).
  - **Question Answering**: Contextually grounded answers from the book.
  - **Character Arc**: (Fiction) Deep synthesis of character journeys.
  - **Plot Explanation**: Chapter-by-chapter or global narrative structure.
  - **Concept Simplification**: (Educational) Adaptive clarity for students and researchers.
  - **Problem Solving**: Method-based solutions derived from technical texts.
  - **Two-Stage RAG Pipeline**: Uses **FlashRank Reranking** and **MMR (Maximal Marginal Relevance)** for 100% grounded answers.
  - **Academic Citation UX**: Responses include inline **clickable superscripts** with hover-ready excerpts.
  - **Real-Time Progress**: Multi-staged UI messaging (Uploading → Validating → Processing → Indexing).
  - **Security-First**: Prompt injection guards, rate limiting, and strict file validation.

## 🛠️ Local Setup

### Prerequisites
- **Python 3.10+**
- **Node.js 18+**
- **Ollama**: [Download and install Ollama](https://ollama.com/)

### 1. LLM Setup (Ollama)
Pull the required model:
```bash
ollama pull qwen2.5:7b-instruct-q5_K_M
```

### 2. Backend Setup (FastAPI)
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # Linux/macOS
   # or .venv\Scripts\activate on Windows
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the server:
   ```bash
   uvicorn main:app --reload
   ```

### 3. Frontend Setup (Next.js)
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## 🚀 How to Use

1. Open `http://localhost:3000` in your browser.
2. Upload a book (PDF, EPUB, or TXT) and select its type (Fiction or Educational).
3. Wait for the "Ready" status indicator.
4. Select a tool from the top panel (e.g., "Summary" or "Concept").
5. Ask questions or interact with the AI assistant!

## 🛡️ Security & Guardrails
EasyLearn follows OWASP and LLM security best practices:
- **Rate Limiting**: 5 uploads/hour and 30 queries/hour per session.
- **File Validation**:
  - **Global Limit**: 50MB maximum file size.
  - **PDF Restriction**: Max 1000 pages; must contain extractable text (no scanned images).
  - **EPUB/TXT Restriction**: Max 1,500,000 characters.
- **Content Security**: Security headers (CSP, X-Frame-Options) and sanitized React rendering.
- **Prompt Isolation**: System instructions are hidden and injection-hardened.
