# EasyLearn

## Project Description
An AI assistant with a RAG setup for user to upload a book at a time. This will let user with 5 or more tools 
1. summary - this will summarize the entire book for the user within 200 words or 3 paragraphs.
2. question - this will let user ask any question about a particular thing in the book
3. character arc - if the uploaded book is a novel, the user can ask the character arc of a particular character in the book from start to end.
4. plot - explains a plot of a particular chapter or the entire book.
5. concept - if the uploaded book is educational, the user can ask to explain a particular concept in a simpler way or in a way that is easily understandable
6. problem - if the uploaded book is educational, the user can ask on method to use to solve the problem

## Product Requirements Document
### Product Requirements Document (PRD) - EasyLearn AI Assistant

**Document Version:** 1.0
**Date:** October 26, 2023
**Project Name:** EasyLearn
**Product Goal:** To provide users with an intelligent, context-aware AI assistant capable of analyzing uploaded books (one at a time) via a RAG architecture to offer specialized insights and learning tools.

---

## 1. Introduction and Goals

### 1.1 Product Vision
EasyLearn aims to revolutionize personal book consumption by allowing users to upload a single text file and instantly query its content using five distinct, specialized AI tools, maximizing comprehension and information retrieval efficiency.

### 1.2 Business Objectives
Given this is an individual project with a super low budget, the primary immediate objective is successful implementation and demonstration of core RAG functionality and the five mandated tools. Scalability concerns are secondary to core feature accuracy in the initial phase.

### 1.3 Success Metrics (Phase 1 - Individual Project)
*   Successful ingestion and indexing of PDF, EPUB, and TXT files.
*   Accurate execution of all five core features (Summary, Question, Character Arc, Plot, Concept, Problem).
*   User feedback indicating high accuracy for the Summary feature (adhering to strict constraints).
*   Robust handling of file corruption errors without crashing the application.

---

## 2. Target Audience

The target audience is broad, focusing on users requiring high-speed, accurate information extraction from lengthy texts:

*   **Casual Readers:** Seeking quick overviews or confirmation of details before/after reading.
*   **Researchers/Professionals:** Needing rapid synthesis of complex textual information.
*   **Students (especially High School):** Requiring simplified explanations of complex concepts found in textbooks or study materials.

---

## 3. Features and Requirements

EasyLearn will support one book upload at a time, leveraging the RAG system for context-specific answers.

### 3.1 Core Feature Set (Mandatory Tools)

| ID | Feature Name | Description | Specific Requirements & Constraints |
| :--- | :--- | :--- | :--- |
| F-101 | **Summary** | Generates a concise overview of the entire uploaded book. | Must strictly adhere to output constraints: **Maximum 200 words OR 3 distinct paragraphs**. Focus must be on accuracy, covering all main themes and crucial information. |
| F-102 | **Question Answering** | Allows users to ask specific, targeted questions about the book content. | Answers must be contextually derived only from the uploaded text corpus via RAG. |
| F-103 | **Character Arc Analysis** | (Applicable only to novels/fiction) Traces the journey of a specified character. | Must detail **emotional states, key plot involvements, major turning points, and the character's contribution** to the main plot, from beginning to end. |
| F-104 | **Plot Explanation** | Explains the narrative structure of a specified chapter or the entire book. | Must support queries for both specific chapter plots and the overarching narrative structure. |
| F-105 | **Concept Explanation** | (Applicable mainly to educational material) Explains a specific concept from the book. | **Adaptive Clarity:** Default clarity level is dictated by the source material's assumed audience (e.g., 5th-grade math book uses simpler language). UI must allow users to select a desired difficulty level (e.g., simplified, standard, advanced/research level). |
| F-106 | **Problem Solving Assistance** | (Applicable only to educational/technical material) Provides methods or steps to solve a problem mentioned in the text. | Must reference the context/methodology presented within the uploaded book. |

### 3.2 Book Ingestion and Management

| ID | Requirement | Description |
| :--- | :--- | :--- |
| F-201 | **Format Support** | Must natively support reading and processing of **PDF, EPUB, and TXT** files. |
| F-202 | **Format Identification** | The UI must include a dropdown menu for the user to manually select the format upon upload. |
| F-203 | **Metadata Verification** | The system should attempt automated metadata extraction to verify the user-selected format or gain initial context. |
| F-204 | **Single Book Limit** | The RAG system must be configured to operate on **one book at a time**. Subsequent uploads must replace the existing indexed book. |

### 3.3 Advanced RAG & UX Enhancements (Mandatory Across All Tools)

The following capabilities must be implemented application-wide to improve retrieval accuracy, answer trustworthiness, debuggability, and conversational naturalness. These apply uniformly to all core tools (F-101 through F-106) and the unified chat interface.

#### 3.3.1 Citations and Source Excerpts

**Description:** Every AI-generated response must include verifiable citations linking back to specific parts of the uploaded book, allowing users to trace and validate claims.

**Requirements:**
- Include inline citations for every factual claim or key statement in the response.
- Citation format: [Chunk X] or [p. Y – Chapter Z] immediately after the relevant sentence/claim (use metadata from ingestion if available: page number, chapter title, char index range).
- Each citation must be accompanied by a short verbatim excerpt (1–3 sentences) from the retrieved chunk.
- For Summary (F-101): Place citations at the end of each paragraph or after main themes.
- For Question Answering (F-102), Plot (F-104), Character Arc (F-103): Cite after specific facts, plot points, or arc descriptions.
- For Concept (F-105) and Problem (F-106): Cite definitions, steps, or methodologies.
- UI presentation: Render citations as superscript numbers or hyperlinks. Hover/click reveals the full excerpt in a tooltip, popover, or expandable card below the message.
- If no relevant context retrieved: Response must state "No sufficient context found in the book to support this answer" (no citations required).
- Never fabricate citations or excerpts.

**Implementation Guidance:**
- Use `return_source_documents=True` in LangChain retriever.
- Pass retrieved documents (with metadata) to prompt and structured output parser.
- Prompt must enforce: "Cite every factual claim using [Chunk ID] or [page/chapter] immediately after the claim. Provide a brief verbatim excerpt for each citation."

#### 3.3.2 Reranking + Maximal Marginal Relevance (MMR)

**Description:** Enhance retrieval quality by re-scoring and diversifying chunks after initial similarity search, reducing redundancy and improving relevance — especially important for long books and complex tools like Character Arc or Plot.

**Requirements:**
- After initial retrieval (top-k = 20–30), apply reranking to select the most relevant chunks (final top-5–8 passed to LLM).
- Primary reranker: FlashRank (ultra-fast, lightweight) or BAAI/bge-reranker-base/v2-m3 (high accuracy, open-source).
- Combine with MMR (Maximal Marginal Relevance) for diversity:
  - MMR lambda: 0.5–0.7 (tunable; higher = more relevance-focused, lower = more diverse).
  - Apply MMR either standalone or post-reranking.
- Default flow: Vector similarity search → rerank → MMR → LLM context.
- Tool-specific tuning: Higher diversity (lower lambda) for global tools (Summary, Character Arc); higher precision for targeted queries (Question, Concept).
- If reranker unavailable (fallback): Use Chroma native MMR only.

**Implementation Guidance:**
- Use LangChain `ContextualCompressionRetriever` with `FlashrankRerank` or equivalent.
- Chroma supports `search_type="mmr"` natively.
- Test retrieval improvement on books >200 pages (measure coherence in Character Arc / Plot responses).

#### 3.3.3 Show Retrieved Context Toggle

**Description:** Enable users to inspect exactly what chunks were retrieved for any response, promoting transparency, trust, and easier debugging of unsatisfactory answers.

**Requirements:**
- Add a UI control next to every AI message: "Show sources" / "View context" button or icon (e.g., eye/book icon).
- On click/toggle: Expand a collapsible panel or sidebar section displaying:
  - Top retrieved chunks (3–8) with excerpts.
  - Metadata per chunk (ID, page/chapter if parsed, relevance score if available).
  - Sorted by final rank (post-reranking/MMR).
- Default state: Collapsed (clean chat view).
- Accessibility: Keyboard support, ARIA labels, screen-reader friendly.
- No performance impact on guest sessions (still ephemeral).

**Implementation Guidance:**
- Backend: Include `source_documents` list in every /query response.
- Frontend (Next.js): Use shadcn/ui Accordion, Collapsible, or Sheet component.
- Render excerpts safely (plain text or sanitized markdown).

#### 3.3.4 Multi-Turn Conversation Memory

**Description:** Support natural follow-up questions by retaining recent conversation context, so the assistant remembers prior exchanges within the same book session.

**Requirements:**
- Maintain short-term history within the current session/chat.
- Keep the last 4–8 turns (user message + AI response) as context.
- Inject history into every prompt (before retrieved context).
- Use LangChain memory: `ConversationBufferWindowMemory` (k=5–8) or `ConversationBufferMemory` with truncation.
- For very long chats: Summarize older turns if approaching token limit.
- Reset: Clear memory automatically on new book upload or via explicit "New conversation" button.
- System prompt addition: "This is an ongoing conversation about the uploaded book. Use previous messages for context when relevant, but always ground answers in retrieved book content."
- Guest sessions: In-memory only (discarded on refresh/closure).
- No long-term persistence in Phase 1.

**Implementation Guidance:**
- Backend: Wrap chain in `ConversationalRetrievalChain` or LCEL with memory component.
- Frontend: Send conversation history array with each query (or use session/thread ID).
- Handle token overflow: Truncate oldest messages or use summary fallback.

---

## 4. Technical Specifications

### 4.1 RAG and LLM Configuration

*   **Accuracy Priority:** Accuracy is the highest technical priority. The RAG pipeline (chunking, retrieval, context injection) must be optimized for high fidelity context retrieval.
*   **Primary LLM Provider:** Ollama runs open-source models locally on the developer's machine (or server). Provides an OpenAI-compatible API endpoint at `http://127.0.0.1:11434/v1`. Chosen for: complete data privacy (no cloud transmission), offline capability, no per-token costs, and seamless integration with LangChain.
* **Selected Model:** qwen2.5:7b-instruct-q5_K_M
  * **Reasoning:**  
    - Strong instruction-following and faithfulness in RAG contexts (2025–2026 benchmarks show excellent performance on long-document understanding, summarization, and structured reasoning).  
    - Balanced size (~4–6 GB VRAM usage in Q5 quantization) — suitable for mid-range laptops (e.g. 16 GB RAM + RTX 3050 4 GB).  
  -   Quantized to Q5_K_M for good quality vs speed trade-off (generation ~30–50 tokens/s on compatible GPUs).  
    - Supports up to ~32k context (configurable; default to 8k–16k for most book queries to stay performant).  
  * **Fallback / alternatives** (in order of preference):  
    1. llama3.3:8b-instruct-q5_K_M  
    2. mistral:7b-instruct-v0.3-q5_K_M
*   **Performance/Latency:** While scalability (handling many users) is desired, initial performance targets are flexible. The focus is achieving correct results over speed, provided the response is not excessively slow (target < 10 seconds for complex queries on a single user session).

### 4.2 Data Handling and Persistence

*   **Session-Based Default:** For non-logged-in users, all uploaded data (book file, RAG index, conversation history) must be discarded immediately upon **session refresh or closure**.
*   **Logged-in Users (Future Tier Consideration):** If a user logs in (future paid tier functionality), data persistence is required for up to **7 days**. After 7 days, all associated data must be automatically purged.
*   **Conversation Logging:** Conversation history logging is strictly limited to paid tiers (future state). Free/session-based users will not retain conversation history across sessions.

### 4.3 User Interface (UI/UX)

*   **Platform:** The application must be a **Web Application**.
*   **Mobile Experience:** Must incorporate **PWA (Progressive Web Application)** features to ensure a high-quality, mobile-friendly experience.
*   **Interaction:** The UI must clearly present the upload mechanism and a centralized chat/query interface, dynamically showing which features (F-103, F-105/106) are applicable based on the ingested document type.

---

## 5. Error Handling and Fallback

Robust error handling is critical due to the dependence on external file systems and the RAG pipeline.

| Scenario | Required Action |
| :--- | :--- |
| **File Corruption/Unreadable** | If the upload is corrupt or cannot be parsed into indexable text chunks, **all features (F-101 through F-106) must be disabled**. The user must receive a clear message stating the file is unusable and cannot proceed with analysis. |
| **RAG System Failure (Runtime)** | If the underlying indexing or vector retrieval fails during a query execution: **The LLM must respond by explicitly stating it cannot retrieve the necessary context to answer the question.** Under no circumstances should it provide low-confidence answers, guesses, or hallucinated information based on general training data. |
| **Feature Inapplicability** | If a user queries F-103 (Character Arc) on a technical manual, the system must clearly state that the feature is inapplicable to the uploaded content type. |

---

## 6. Future Considerations (Out of Scope for Initial Implementation)

*   User account management and subscription tiers.
*   Multi-document analysis.
*   Long-term data storage beyond the 7-day grace period for logged-in users.
*   Export functionality for generated summaries or explanations.

## 7. Security & Compliance

EasyLearn shall be developed with security as a first-class concern, aligning with the OWASP Top 10:2025 (web application risks) and OWASP Top 10 for LLM Applications 2025. The following requirements are mandatory for the initial implementation and any future iterations.

### 7.1 OWASP Top 10:2025 – Web Application Risks (Mandatory Controls)

| Rank | Risk (2025)                        | Key Requirements for EasyLearn                                                                 |
|------|------------------------------------|------------------------------------------------------------------------------------------------|
| A01  | Broken Access Control              | • Enforce least privilege for all endpoints.<br>• Future logged-in tier: proper role-based access (user vs admin).<br>• Guest sessions: strict isolation per browser session (no cross-session leakage). |
| A02  | Security Misconfiguration          | • Use secure defaults (FastAPI, Next.js, ChromaDB).<br>• Enforce HTTPS in production (HSTS header).<br>• Disable debug modes and verbose error messages in prod.<br>• Apply security headers: CSP, X-Content-Type-Options: nosniff, X-Frame-Options: DENY, Permissions-Policy. |
| A03  | Software Supply Chain Failures     | • Pin all dependencies (requirements.txt, package.json) with exact versions.<br>• Run automated vulnerability scans (e.g. pip-audit, npm audit, Dependabot) in CI.<br>• Maintain minimal dependency footprint; prefer well-maintained libraries.<br>• Generate SBOM (Software Bill of Materials) for critical releases. |
| A04  | Cryptographic Failures             | • Use TLS 1.3+ for all traffic.<br>• Hash future passwords with Argon2id or bcrypt (high work factor).<br>• Never store plaintext secrets (use environment variables or secret managers). |
| A05  | (Other relevant – Injection, etc.) | See file upload and LLM-specific controls below. |

(Only the most critical / directly applicable categories are listed above; remaining OWASP Top 10:2025 risks shall be addressed via secure coding practices.)

### 7.2 OWASP Top 10 for LLM Applications 2025 – Mandatory Controls

| Rank | Risk (2025)                          | Key Requirements for EasyLearn                                                                 |
|------|--------------------------------------|------------------------------------------------------------------------------------------------|
| LLM01| Prompt Injection                     | • Use strong system prompts that forbid executing code, revealing instructions, or deviating from RAG context.<br>• Apply input sanitization / guardrails on user queries (reject obvious jailbreak patterns).<br>• Prefer structured output (e.g. LangChain output parsers) to limit free-form malicious responses. |
| LLM02| Sensitive Information Disclosure     | • Never return book content verbatim unless explicitly requested and safe.<br>• Sanitize LLM output before display (escape HTML/JS, strip suspicious patterns).<br>• Do not log full prompts/responses containing potentially sensitive book excerpts in plaintext. |
| LLM03| Supply Chain Vulnerabilities         | • Use trusted sources for embedding models, LLMs, and LangChain version.<br>• Monitor Hugging Face / Ollama model integrity (checksums if possible). |
| LLM04| Data & Model Poisoning               | • Out of scope for v1 (no fine-tuning or persistent training).<br>• Validate uploaded documents for obvious tampering markers during ingestion. |
| LLM05| Improper Output Handling             | • Treat all LLM output as untrusted.<br>• Render responses safely (no dangerouslySetInnerHTML in React; use textContent or sanitized markdown). |
| LLM08| Vector & Embedding Weaknesses        | • Use high-quality, up-to-date embedding models (e.g. bge-m3 or nomic-embed-text-v2).<br>• Apply metadata filtering and MMR re-ranking to reduce irrelevant / poisoned retrieval. |
| LLM10| Unbounded Consumption                | • Implement per-session rate limiting on uploads and queries (e.g. 5 uploads/hour, 30 queries/hour per IP/session).<br>• Use slowapi or similar in FastAPI.<br>• Set hard token limits per request. |

### 7.3 File Upload Specific Security (Critical Vector)

- Allow-list file extensions: .txt, .pdf, .epub only.
- Validate true MIME type using python-magic or equivalent (do not trust client Content-Type).
- Enforce maximum file size (e.g. 50 MB).
- Store uploaded files in temporary, non-executable, randomized paths (never in web-accessible directory).
- Delete files immediately after successful ingestion (or after session expiry).
- Reject files containing executable content or suspicious signatures.

### 7.4 General Security Requirements

- Rate limiting on all public endpoints (uploads, queries) to prevent abuse / DoS.
- CORS policy: allow only the frontend origin (strict same-origin for API calls).
- Session management: secure cookies (HttpOnly, Secure, SameSite=Strict) for future auth; browser session storage only for guests.
- Logging: log security-relevant events (failed uploads, rate-limit triggers) without sensitive data.
- Dependency & vulnerability management: no vulnerable/outdated packages; regular scans required.
- Error handling: never expose stack traces, versions, or paths in production responses.

### 7.5 Out of Scope (for Phase 1)

- Full WAF / runtime application self-protection
- Advanced secrets scanning in CI/CD
- Formal penetration testing

All security requirements above shall be validated during development and before any public deployment. The development agent / implementer must reference this section explicitly when generating or reviewing code.

## Technology Stack
TECHNOLOGY STACK FOR EASYLEARN - AI BOOK ASSISTANT

1. CORE ARCHITECTURE

The system will employ a modern web application architecture leveraging Python for backend processing due to its dominance in AI/ML and rapid prototyping capabilities.

Frontend: React.js (with Next.js for potential SSR/SEO benefits and modern tooling)
Backend/API: FastAPI (Python)
Database (User Management/Metadata): PostgreSQL
Vector Database: ChromaDB (For low-budget, local/embedded RAG persistence)
LLM Orchestration: LangChain

2. FRONTEND STACK (User Interface and Experience)

Technology: React.js / Next.js
Justification: Provides a robust, component-based structure suitable for building a responsive web application. Next.js offers performance benefits and PWA features out-of-the-box, fulfilling the mobile-friendly requirement.
Styling: Tailwind CSS
Justification: Utility-first CSS framework for rapid styling development and ensuring a consistent, clean UI suitable for diverse audiences (students, researchers, casual readers).
PWA Implementation: Next.js PWA plugin or Workbox integration.
Justification: Necessary to meet the requirement for mobile-friendliness and potential offline capabilities (though core RAG functionality requires connectivity).

3. BACKEND STACK (API and Business Logic)

Technology: FastAPI (Python)
Justification: High performance, asynchronous capabilities, automatic OpenAPI documentation generation. Python compatibility is crucial for integrating with NLP/ML libraries and LangChain seamlessly.
Asynchronous Handling: Uvicorn/Gunicorn
Justification: Standard ASGI servers for running FastAPI efficiently, handling concurrent user requests effectively given the expected load profile (many users, low budget constraints).

4. DATA PROCESSING AND RETRIEVAL (RAG PIPELINE)

Ingestion & Parsing:
Technology: PyMuPDF (for PDF), epub-parser or similar library (for EPUB), standard file I/O (for TXT).
Justification: Robust libraries required to reliably extract clean text from the specified book formats (PDF, EPUB, TXT). Metadata extraction is critical for validation.

Text Splitting/Chunking: LangChain Text Splitters (e.g., RecursiveCharacterTextSplitter)
Justification: Essential for preparing text for effective embedding. Chunk size must be optimized for contextual retrieval, balancing detail needed for summary/arc/concept features against retrieval noise.

Embedding Model: Sentence Transformers (e.g., all-MiniLM-L6-v2 or a similar high-performing, lightweight model)
Justification: Chosen for low latency and low computational overhead, fitting the super low budget constraint while providing decent semantic understanding required for accuracy. If budget allows for API calls, OpenAI text-embedding-ada-002 would be considered, but Sentence Transformers is the strong default for local, free-tier operation.

Vector Store: ChromaDB
Justification: Excellent choice for embedded or local vector storage, easy to set up, no external cloud service costs, fitting the super low budget requirement. It supports session-based storage effectively.

5. LARGE LANGUAGE MODEL (LLM) SELECTION

Primary LLM: Open Source Models (e.g., Mistral 7B or Llama 3 8B via Hugging Face Inference API or self-hosting if feasible, depending on initial TCO assessment).
Justification: Accuracy is the highest priority, but the budget is extremely low, ruling out sustained high-volume usage of premium commercial APIs (like GPT-4). Open source models offer the best accuracy/cost trade-off for an individual project.
Fallback/API Call (If budget slightly increases): GPT-3.5 Turbo or a comparable Anthropic model via pay-as-you-go.
Justification: Necessary for demanding tasks like character arc synthesis, which requires deep contextual understanding.

LLM Orchestration: LangChain
Justification: Handles the complex RAG chaining, prompt engineering for the specific tool requirements (summary constraints, educational clarity levels, character arc depth), and managing the interaction between the vector store and the LLM.

6. DATA PERSISTENCE AND MANAGEMENT

Session Storage (Default/Free Tier): Browser LocalStorage or in-memory session management via FastAPI.
Justification: Fulfills the requirement for discarding data upon session refresh. Fast and requires no server-side database overhead.

User/Persistence Storage (Paid Tier Simulation): PostgreSQL
Justification: Reliable relational database for storing user credentials and history for the 7-day retention period specified for logged-in users.

7. ERROR HANDLING AND FALLBACK

Validation Layer: FastAPI request validation (Pydantic) to check file integrity upon upload.
RAG Failure Handling: Implemented via LangChain callbacks/chains. If retrieval fails or the LLM returns low-confidence markers, the response structure must explicitly acknowledge the failure rather than hallucinate, adhering strictly to the error handling requirement.

8. TOOL-SPECIFIC CONSIDERATIONS (Prompt Engineering Focus)

Summary: Prompts must enforce the strict 200-word/3-paragraph structure while prioritizing comprehensive theme coverage.
Concept Explanation: Prompts must dynamically adjust the output complexity based on user selection or inferred default difficulty level, using few-shot examples if necessary to guide the LLM's tone.
Character Arc: Prompts must specifically instruct the LLM to synthesize plot points and emotional shifts across the entire document timeline, requiring robust retrieval over long documents.

## Project Structure
PROJECT STRUCTURE DOCUMENT: EasyLearn

1. OVERVIEW
The EasyLearn project utilizes a Retrieval-Augmented Generation (RAG) framework to allow users to upload a single book (PDF, EPUB, TXT) and interact with its content through six specialized tools: Summary, Question Answering, Character Arc analysis, Plot explanation, Concept simplification, and Problem-solving assistance. This structure supports a web-based Progressive Web Application (PWA) frontend, a scalable backend for data processing and LLM interaction, and robust error handling.

2. DIRECTORY STRUCTURE

```
/EasyLearn
|
├── .github/                     # CI/CD workflows, configuration (if applicable)
|
├── docs/                        # Project documentation (excluding this file)
|   ├── architecture/
|   ├── api_specs/
|   └── user_guides/
|
├── src/                         # Core source code
|   ├── backend/                 # Server-side logic, API handling, RAG processing
|   |   ├── core/                # Core business logic and service orchestration
|   |   |   ├── llm_handler.py   # Interfaces for LLM interaction (e.g., OpenAI, HuggingFace wrappers)
|   |   |   ├── rag_pipeline.py  # Orchestration of document loading, chunking, indexing, and retrieval
|   |   |   └── data_processor.py# Pre-processing functions for text extraction and cleaning
|   |   |
|   |   ├── api/                 # FastAPI/Flask endpoints definitions
|   |   |   ├── v1/
|   |   |   |   ├── endpoints_books.py   # Routes for book upload and management
|   |   |   |   └── endpoints_query.py   # Routes for all 6 tool-based queries
|   |   |   └── middleware/      # Authentication, session management, rate limiting
|   |   |
|   |   ├── models/              # Data models (Pydantic or ORM definitions)
|   |   |   ├── book_metadata.py
|   |   |   └── session_state.py # Session tracking for non-logged-in users
|   |   |
|   |   └── services/            # Specific service implementations
|   |       ├── ingestion_service.py # Handles format detection (PDF/EPUB/TXT) and initial parsing
|   |       └── vector_db_manager.py # Interface for vector store operations (e.g., ChromaDB, FAISS setup)
|   |
|   └── frontend/                # Web application (React/Vue/Svelte)
|       ├── public/              # Static assets (index.html, icons)
|       ├── src/
|       |   ├── components/      # Reusable UI components (Button, BookUploader, ChatInterface)
|       |   |   ├── BookUploader.vue
|       |   |   └── ChatWindow.vue
|       |   |
|       |   ├── views/           # Main application screens
|       |   |   ├── DashboardView.vue  # Book management/selection screen
|       |   |   └── QueryView.vue      # Main interaction screen with 6 tools selector
|       |   |
|       |   ├── store/           # State management (Vuex/Redux, session state handling)
|       |   ├── services/        # Frontend API interaction logic
|       |   └── App.vue          # Root component
|       |
|       └── package.json
|
├── scripts/                     # Deployment, setup, and utility scripts
|   ├── setup_env.sh             # Script to initialize environment variables and dependencies
|   └── deploy.sh
|
├── .env.example                 # Template for environment variables (API keys, DB paths)
├── requirements.txt             # Python dependencies
├── Dockerfile                   # Containerization definition (recommended for consistency)
└── README.md                    # High-level project description and setup instructions
```

3. DETAILED COMPONENT EXPLANATIONS

3.1. Backend Core Logic (`src/backend/core/`)

*   `rag_pipeline.py`: Central orchestrator. Responsible for:
    *   Receiving user query and context (book ID).
    *   Determining which specific tool logic is needed (e.g., summary vs. character arc).
    *   Querying the Vector DB for relevant context chunks based on the input.
    *   Assembling the final prompt template, incorporating system instructions specific to the chosen tool (e.g., enforcing the 200-word limit for summary, or focusing on emotional states for character arc).
    *   Passing the final prompt to `llm_handler.py`.
*   `llm_handler.py`: Manages the direct communication with the chosen LLM (likely utilizing a free-tier or low-cost provider, given the budget). It must implement strict fallback logic: if the LLM call fails or returns clearly nonsensical data, it must return an error message acknowledging RAG failure, rather than hallucinating.

3.2. Ingestion and Data Management (`src/backend/services/`)

*   `ingestion_service.py`: This service is critical for handling the disparate file formats (PDF, EPUB, TXT). It uses libraries (e.g., PyMuPDF, beautifulsoup4) to extract raw text. It also attempts basic metadata extraction (title, author) for display verification.
*   `vector_db_manager.py`: Manages the embedding process (using a suitable open-source or free-tier embedding model) and storage. Since only one book is processed at a time, the database state should be temporary (per session or purged after 7 days if persistent login is used). Chunking strategy must prioritize semantic coherence over strict size limits to maximize RAG accuracy.

3.3. API Endpoints (`src/backend/api/v1/`)

*   `endpoints_books.py`: Handles initial POST requests for file uploads. It triggers ingestion, indexing, and returns a session ID or book reference token.
*   `endpoints_query.py`: Contains the main routing logic for the six tools. The payload must clearly identify the desired tool (`tool_name`) and the user query (`query_text`).

3.4. Frontend Implementation (`src/frontend/src/`)

*   **PWA Implementation:** The frontend framework must be configured to allow for PWA installation (manifest file generation).
*   **Tool Switching:** The main interaction view (`QueryView.vue`) must feature a clear, easily accessible selector allowing the user to switch between the 6 primary functionalities.
*   **Educational Clarity Control:** For the **Concept** tool, the UI must include a dropdown allowing users to explicitly select difficulty (e.g., 5th Grade, High School, Undergraduate, Researcher Level). If unset, it defaults to a pre-defined, moderate setting determined during backend prompt engineering.
*   **Error Display:** The UI must gracefully handle backend error responses, clearly displaying messages like \"Book processing failed\" or \"RAG system unavailable,\" aligning with the requirement to avoid low-confidence answers.

4. DATA PERSISTENCE STRATEGY MAPPING

| Data Type | Session-Based User | Logged-In User | Retention Policy |
| :--- | :--- | :--- | :--- |
| Uploaded Book Content/Vector Index | Held in memory/temporary storage | Stored in persistent storage | Discarded upon session end/refresh |
| Conversation History | Discarded upon session end/refresh | Stored in persistent storage | Maximum 7 days |
| User Credentials/Profile | N/A | Stored securely | Until account deletion |

5. TOOL-SPECIFIC CONSIDERATIONS (Backend Prompt Engineering Focus)

*   **Summary:** Prompt must explicitly constrain the output length to approximately 200 words or 3 coherent paragraphs, emphasizing coverage of main themes and crucial plot points.
*   **Character Arc:** Requires advanced entity recognition during RAG retrieval to pull all mentions of the target character across the text, ensuring the LLM synthesizes emotional shifts and plot intersections accurately.
*   **Concept/Problem Solving:** The retrieved context must be analyzed alongside the requested difficulty level to tailor the explanation accurately. For problem-solving, the retrieved context should contain solution methodologies or relevant formulas from the book.

## Database Schema Design
## SCHEMADESIGN - EasyLearn Book Analyzer

### 1. Overview

This section details the proposed database schema for the EasyLearn application, focusing on the persistence requirements for authenticated users. Given the requirement for session-based storage for non-logged-in users, the primary data models focus on storing user-specific assets (uploaded books) and interaction history, adhering to a maximum 7-day retention policy for persistent data. The schema is designed to support the core RAG functionality and the diverse analytical tools offered.

### 2. Entity-Relationship Diagram (Conceptual)

*   **User** (1) $
ightarrow$ (Many) **UploadedBook**
*   **UploadedBook** (1) $
ightarrow$ (Many) **RAGChunk**
*   **UploadedBook** (1) $
ightarrow$ (Many) **ConversationSession**
*   **ConversationSession** (1) $
ightarrow$ (Many) **InteractionLog**

### 3. Detailed Schema Definitions

#### 3.1. User Table (Optional Persistence)

Stores user credentials and session management information for persistent storage options (future or paid tiers). Since the default is session-based, this table might remain largely unused unless the user opts for log-in capabilities.

| Field Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `user_id` | UUID | PRIMARY KEY | Unique identifier for the user. |
| `username` | VARCHAR(100) | UNIQUE, NOT NULL (if registered) | User's chosen username or email. |
| `password_hash` | VARCHAR(255) | NULLABLE | Hashed password if login is active. |
| `created_at` | TIMESTAMP | NOT NULL | Timestamp of account creation. |
| `last_active` | TIMESTAMP | NOT NULL | Last time the user interacted with persistent storage. |

#### 3.2. UploadedBook Table

Represents a single book uploaded by the user. This stores metadata necessary for processing and RAG indexing.

| Field Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `book_id` | UUID | PRIMARY KEY | Unique identifier for the book record. |
| `user_id` | UUID | FOREIGN KEY (User.user_id), NULLABLE | Link to the owning user (NULL for session-based uploads). |
| `title` | VARCHAR(255) | NOT NULL | Extracted or provided title of the book. |
| `author` | VARCHAR(255) | NULLABLE | Extracted or provided author. |
| `file_path` | VARCHAR(512) | NOT NULL | Location of the original uploaded file (e.g., S3 path). |
| `file_format` | ENUM('PDF', 'EPUB', 'TXT') | NOT NULL | Format of the uploaded file. |
| `book_type` | ENUM('FICTION', 'EDUCATIONAL') | NOT NULL | Determined during ingestion/metadata extraction, critical for feature enablement (e.g., Character Arc vs. Concept Explanation). |
| `ingestion_status` | ENUM('PENDING', 'SUCCESS', 'FAILED') | NOT NULL | Status of RAG chunking and vector indexing. |
| `storage_expiry_date` | TIMESTAMP | NOT NULL | Based on 7-day retention policy from upload time or last access. |
| `uploaded_at` | TIMESTAMP | NOT NULL | Time of upload. |

#### 3.3. RAGChunk Table

Stores the segmented, processed text chunks derived from the uploaded book, which are necessary for accurate retrieval during RAG queries. This is the core data for the knowledge base.

| Field Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `chunk_id` | UUID | PRIMARY KEY | Unique identifier for the text segment. |
| `book_id` | UUID | FOREIGN KEY (UploadedBook.book_id), NOT NULL | The book this chunk belongs to. |
| `text_content` | TEXT | NOT NULL | The raw text content of the segment. |
| `start_char_index` | INTEGER | NOT NULL | Start position within the original document. |
| `end_char_index` | INTEGER | NOT NULL | End position within the original document. |
| `vector_embedding` | VECTOR (Dimension dependent on embedding model) | NOT NULL | The dense vector representation of the text content for similarity search. |
| `metadata_context` | JSONB | NULLABLE | Contextual data (e.g., page number, chapter identifier). |

#### 3.4. ConversationSession Table

Manages distinct, continuous interaction sessions associated with a specific uploaded book. Essential for tracking history even within a single session, though history is discarded upon session end if the user isn't logged in.

| Field Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `session_id` | UUID | PRIMARY KEY | Unique identifier for the session. |
| `book_id` | UUID | FOREIGN KEY (UploadedBook.book_id), NOT NULL | The book this session pertains to. |
| `session_start_time` | TIMESTAMP | NOT NULL | When the user started interacting with this book. |
| `session_type` | ENUM('PERSISTENT', 'SESSIONAL') | NOT NULL | Whether this session is tied to a persistent user or temporary session. |
| `last_activity_time` | TIMESTAMP | NOT NULL | Used to enforce session expiry if applicable. |

#### 3.5. InteractionLog Table

Records every user prompt and the resulting LLM response within a session. Critical for debugging, logging usage, and providing continuity within a single session.

| Field Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `log_id` | BIGINT | PRIMARY KEY AUTO_INCREMENT | Sequential ID for ordering interactions. |
| `session_id` | UUID | FOREIGN KEY (ConversationSession.session_id), NOT NULL | The session this interaction belongs to. |
| `timestamp` | TIMESTAMP | NOT NULL | Time of the interaction. |
| `user_prompt` | TEXT | NOT NULL | The raw question/request from the user. |
| `tool_used` | VARCHAR(50) | NOT NULL | e.g., 'SUMMARY', 'QUESTION', 'CHARACTER_ARC', 'CONCEPT'. |
| `difficulty_level_requested` | VARCHAR(50) | NULLABLE | Specific difficulty requested (e.g., '5th Grade', 'Expert'). |
| `llm_retrieved_context` | TEXT | NULLABLE | Snippets of RAG context retrieved (for auditing accuracy). |
| `llm_response` | TEXT | NOT NULL | The final answer generated by the LLM. |
| `response_status` | ENUM('SUCCESS', 'RAG_FAILURE', 'CORRUPT_INPUT') | NOT NULL | Status reflecting error handling requirements. |

### 4. Data Management and Policy Enforcement

1.  **Session vs. Persistence:** For non-authenticated users, the `user_id` in `UploadedBook` and the existence of a record in the `User` table will be NULL/absent. All associated records (`UploadedBook`, `RAGChunk`, `ConversationSession`, `InteractionLog`) must use the `storage_expiry_date` (for books) or rely on standard browser session expiry for temporary data.
2.  **7-Day Retention:** A scheduled background job must sweep tables (`UploadedBook`, `InteractionLog`, `ConversationSession`) for records where `storage_expiry_date` or session timeout has passed and the user is not registered, deleting them to enforce the policy.
3.  **Accuracy Priority:** The reliance on accurate `RAGChunk` generation and high-dimensional vector storage is paramount. The schema supports storing embeddings directly to minimize lookup latency during query time.
4.  **Error Logging:** The `response_status` in `InteractionLog` is crucial for capturing when the RAG system fails (triggering the fallback response) or when input file corruption prevents indexing.

## User Flow
# USERFLOW DOCUMENTATION: EasyLearn AI Assistant

**Document Version:** 1.0
**Date:** October 26, 2023
**Project:** EasyLearn

---

## 1. Overview

This document details the user flows (journeys) for the EasyLearn web application, an AI assistant leveraging Retrieval-Augmented Generation (RAG) specifically designed to interact with a single uploaded book at a time. The flows cover initial onboarding, book ingestion, feature utilization, and session management for both guest and logged-in users.

---

## 2. User Roles

1.  **Guest User:** Uses the application for a single session. Data (uploaded books, conversations) is session-based and discarded upon refresh/exit.
2.  **Registered User:** Can log in to persist data. Uploaded books and conversations are retained for a maximum of 7 days.

---

## 3. Core User Flows

### 3.1. Flow 1: Initial Access and Onboarding (Guest & Registered)

**Goal:** User accesses the platform and is presented with options to begin using the service.

| Step | Description | Wireframe/Screen Reference | Interaction Notes |
| :--- | :--- | :--- | :--- |
| 1.1 | User navigates to the EasyLearn URL. | Landing Page/Initial View | Displays value proposition and CTA: "Start Learning Now" or "Login/Sign Up". |
| 1.2 | (If Registered) User clicks "Login" or "Sign Up". | Authentication Modal/Page | Standard login/registration process. Post-login, redirects to Dashboard (3.3). |
| 1.3 | (If Guest) User clicks "Start Learning Now". | Dashboard/Upload Prompt | Proceeds directly to Book Upload Interface (3.2). |

### 3.2. Flow 2: Book Upload and Ingestion (Prerequisite for all features)

**Goal:** User successfully uploads a compatible file, and the RAG system processes the document into the vector store.

| Step | Description | Wireframe/Screen Reference | Interaction Notes |
| :--- | :--- | :--- | :--- |
| 2.1 | User initiates upload. | Upload Panel | Clearly visible area for drag-and-drop or file selection. |
| 2.2 | User selects file (PDF, EPUB, or TXT). | File Explorer Modal | Error check: If file size/type is invalid, display immediate error message. |
| 2.3 | User selects Book Type from dropdown (e.g., Fiction/Novel, Educational/Textbook). | Format Selection Field | Required input to tailor subsequent feature behavior (e.g., activating Character Arc). |
| 2.4 | User confirms upload. | Confirmation Button | Button becomes active only after file selection and Book Type selection. |
| 2.5 | System processes the document. | Processing Indicator | Displays progress bar/spinner: "Ingesting book content..." Metadata extraction runs concurrently. |
| 2.6 | Processing successful. | Success Notification | Brief notification: "Book successfully processed. Ready for analysis." Redirects to Chat Interface (3.3). |
| 2.7 | Processing fails (Corrupt/Unreadable). | Error Modal | Displays: "File processing failed. Please ensure the file is not corrupt and try again." User remains on Upload Interface. |

### 3.3. Flow 3: Feature Utilization (Primary Interaction)

**Goal:** User interacts with the five core RAG features via the unified chat interface.

**Interface Structure:** A persistent chat window on the right/bottom, with a tool selection panel visible on the left/top. The current uploaded book title is always displayed.

| Step | Description | Wireframe/Screen Reference | Interaction Notes |
| :--- | :--- | :--- | :--- |
| 3.1 | User selects the desired tool from the Feature Panel. | Tool Selector Tabs/Buttons | Tools available: Summary, Question, Character Arc, Plot, Concept, Problem. (Visibility may adjust based on Book Type selection in 3.2). |
| 3.2 | User inputs prompt specific to the selected tool. | Input Text Area | Input validation ensures the text area is not empty before sending. |
| 3.3 | **Feature Execution (Tool Specific)** | Chat Output Window | See Detailed Tool Flows (3.4 - 3.9). |
| 3.4 | System retrieves relevant context via RAG and generates response via LLM. | Chat Output Window | Response time should be monitored for performance benchmarking. |
| 3.5 | User reviews output. | Chat Output Window | Output is clearly demarcated as AI-generated text. |
| 3.6 | (Registered User) User navigates away or refreshes. | Session Check | System checks if data persistence is enabled (logged-in). If yes, conversation is saved for 7 days. If no (Guest), data is flagged for session expiry. |

### 3.4. Tool Flow: Summary (Constraint: 200 words / 3 paragraphs)

1.  User selects **Summary** tool.
2.  User clicks 'Generate Summary' (No text input usually required, or a confirmation button).
3.  System retrieves overall document embeddings.
4.  LLM generates a summary adhering strictly to the 200-word/3-paragraph constraints, prioritizing accuracy of main themes.

### 3.5. Tool Flow: Question (General RAG Query)

1.  User selects **Question** tool (or uses the default chat mode).
2.  User inputs: "What is the protagonist's motivation in Chapter 5?"
3.  System performs targeted vector search based on the query and generates an answer referencing specific parts of the book.

### 3.6. Tool Flow: Character Arc (Novel Specific)

1.  User selects **Character Arc** tool.
2.  User inputs: "Trace the arc of [Character Name]."
3.  System searches for all mentions/context related to the character.
4.  LLM synthesizes the arc, explicitly detailing emotional states, key plot involvements, and major turning points from start to end.

### 3.7. Tool Flow: Plot Explanation

1.  User selects **Plot** tool.
2.  User inputs: "Explain the plot of Chapter 12" OR "Summarize the entire plot structure."
3.  System retrieves plot-relevant sections (either chapter-specific or global summaries) and renders the explanation.

### 3.8. Tool Flow: Concept Explanation (Educational Specific)

1.  User selects **Concept** tool.
2.  User inputs: "Explain [Concept Name]" AND/OR selects a difficulty level (e.g., High School, Undergraduate, Expert) from a sub-dropdown.
3.  System retrieves relevant definitions and contextual examples from the book.
4.  LLM explains the concept tailored to the selected educational clarity level (defaulting to a perceived moderate level if not specified).

### 3.9. Tool Flow: Problem Solving (Educational Specific)

1.  User selects **Problem** tool.
2.  User inputs: "How do I solve [Specific Problem X] mentioned in the book?"
3.  System retrieves the corresponding methodology or solution steps described in the educational material.
4.  LLM outputs the required method/solution, aiming for clear, step-by-step instructions if applicable.

---

## 4. Error Handling and Fallback Flows

| Step | Scenario | User Feedback/System Action | Location |
| :--- | :--- | :--- | :--- |
| 4.1 | Uploaded file is corrupt/unreadable (Pre-Ingestion). | Error Modal: "File could not be processed. Check file integrity." User must re-upload. | Upload Interface |
| 4.2 | RAG System Failure (Post-Ingestion). | In Chat Output: "I am currently unable to access the specific knowledge base for this book due to a system error. Please try again shortly." (No speculative answers provided). | Chat Interface |
| 4.3 | User queries information outside the uploaded book context. | In Chat Output: "My responses are strictly limited to the content of the book you uploaded: '[Book Title]'. Please ask a question relevant to this text." | Chat Interface |
| 4.4 | Attempting to use a feature not applicable to the book type (e.g., Character Arc on a Textbook). | UI feedback: Feature button is grayed out or generates a tooltip: "This feature is only available for Novel/Fiction uploads." | Feature Panel |

---

## 5. Session Management Flow

**Goal:** Differentiate persistence for Guest vs. Registered users.

| Step | User Role | Action | Data Persistence Outcome |
| :--- | :--- | :--- | :--- |
| 5.1 | Guest User | Uploads book and interacts. | All data (file reference, embeddings context, chat history) is tied to the current browser session only. Discarded on browser closure/refresh. |
| 5.2 | Registered User | Uploads book and interacts. | Data is saved to the user's account storage (DB). Conversation history and uploaded context are retained for 7 calendar days from the last interaction. |
| 5.3 | Registered User | Logs out manually. | Data persists for 7 days, but the user cannot access it until logging back in. |
| 5.4 | Registered User | Returns after 8 days. | System automatically purges data associated with that book/session from storage due to the 7-day retention limit. |

## Styling Guidelines
EASYLEARN STYLING GUIDELINES DOCUMENT (V1.0)

1. INTRODUCTION
This document outlines the styling and design principles for the EasyLearn web application. EasyLearn is an AI assistant designed to help users (casual readers, researchers, students) quickly digest and inquire about the content of uploaded books (PDF, EPUB, TXT) via a RAG system. The styling must prioritize clarity, accessibility, and a clean, modern aesthetic suitable for prolonged reading and academic interaction.

2. DESIGN PRINCIPLES

2.1 Clarity and Focus (Primary)
The interface must minimize distractions to keep the user focused on the book content and the AI responses. Ample whitespace and high contrast are essential.

2.2 Accessibility and Readability
Given the target audience includes students and researchers, text must be highly legible across different screen sizes (desktop and mobile PWA). Adherence to WCAG guidelines (AA minimum) for color contrast is required.

2.3 Modern and Trustworthy
The visual design should evoke trust and competence, reflecting the accuracy priority of the RAG system. Avoid overly playful or distracting visual elements.

2.4 Mobile Responsiveness (PWA Focus)
All layouts must fluidly adapt to mobile viewports, prioritizing content display and easy interaction with input fields and feature selection (Summary, Question, Character Arc, etc.).

3. COLOR PALETTE

The palette is intentionally restrained to promote focus.

3.1 Primary Color (Brand Accent)
Used for active states, primary buttons, and important focus indicators.
Name: Academic Blue
Hex: #1A73E8 (Standard, reliable blue)
RGB: 26, 115, 232

3.2 Secondary Color (Informational/Success)
Used sparingly for positive feedback or informative tooltips.
Name: Success Green
Hex: #34A853
RGB: 52, 168, 83

3.3 Neutral Palette (Backgrounds & Text)
Crucial for readability and minimizing eye strain.

Background (App/Container): #F8F9FA (Very light grey/off-white)
Surface (Card/Modal/Input Fields): #FFFFFF (Pure White)
Primary Text: #202124 (Dark Charcoal, high contrast)
Secondary Text (Labels, Metadata): #5F6368 (Medium Gray)
Borders/Dividers: #E8EAED (Light Gray)

3.4 Feedback Colors
Error/Alert: #EA4335 (Vivid Red)

4. TYPOGRAPHY

Typography choices emphasize high legibility for both long-form text (book analysis) and short-form interaction (user queries).

4.1 Font Family
Recommendation: A neutral, highly readable sans-serif family.
Primary Choice: Roboto or Inter (for strong performance across web and mobile environments).
Fallback: Arial, sans-serif.

4.2 Sizing and Hierarchy

| Element | Size (Desktop Base) | Weight | Usage |
| :--- | :--- | :--- | :--- |
| H1 (Page Title) | 28px | Bold (700) | Main Feature Selector |
| H2 (Section Header) | 22px | Semi-Bold (600) | Panel Titles (e.g., "AI Response") |
| Body Text (Default) | 16px | Regular (400) | AI Outputs, Standard descriptions |
| Interactive Text (Buttons) | 14px | Medium (500) | Call to action |
| Metadata/Labels | 12px | Regular (400) | Upload details, constraints |
| Summary/Character Arc Output | 16px - 18px | Regular (400) | Long-form results (ensure line height of 1.5 for comfort) |

4.3 Line Height
Standard text (Body): 1.5 times the font size (e.g., 24px for 16px text).
Headings: 1.2 times the font size.

5. UI/UX PRINCIPLES

5.1 Layout Structure
The interface should employ a clear, two-panel structure, especially on desktop:
1. Navigation/Input Panel (Left or Top Bar): Book selection, feature toggles (Summary, Question, etc.).
2. Content/Output Panel (Main Area): Displays uploaded file status, query input, and AI response.

5.2 Interaction Design

5.2.1 Input Fields (Query/Prompt)
Must be visually distinct (White background, subtle #E8EAED border). Should clearly indicate when focused (Blue 2px border using Primary Color). The main prompt area should accommodate slightly longer inputs for detailed questions.

5.2.2 Buttons
Primary Actions (e.g., Upload Book, Submit Query): Academic Blue background, White text, 4px border radius. Hover state should slightly darken the blue (#165CB8).
Secondary Actions (e.g., Clear Session): White background, Blue text/border.

5.2.3 Feature Selection Tabs
The five/six core tools (Summary, Question, etc.) should be presented as clear, selectable tabs or discrete buttons. The active state must use the Primary Color for the background or a strong underline.

5.3 Feedback and Error Handling

5.3.1 Loading/Processing
When the RAG system or LLM is processing, use subtle, continuous loading indicators (spinners using Academic Blue). Avoid long blocks of static UI during high latency periods.

5.3.2 Error States (Crucial)
If the RAG system fails or the file is corrupt, the error message must be prominent, displayed in a card using the Error/Alert color (#EA4335). The message must clearly state the failure and avoid guessing answers, aligning with the requirement: "acknowledging its failure to answer rather than providing low confidence or wrong answers."

5.4 Data Visualization (Minimal)
Since EasyLearn is text-centric, visualizations should be reserved. If progress bars are used (e.g., upload status), they must adhere to the color palette (Blue for progress, light grey for track).

6. RESPONSIVENESS (PWA Considerations)

6.1 Mobile Layout
On mobile screens, the interface should collapse into a single column. The primary tool selection must be easily accessible, potentially via a persistent bottom navigation bar or a hamburger menu if necessary, ensuring the main interaction area (the input box and output display) takes precedence.

6.2 Typography Scaling
Font sizes should scale down gracefully on smaller screens, maintaining the minimum body size of 14px for readability if necessary, but ideally preserving 16px.
