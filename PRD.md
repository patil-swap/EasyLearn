# EasyLearn

## Project Description

An AI assistant with a RAG setup for user to upload a book at a time. This will let user with 7 specialized tools:

1. **summary** - this will summarize the entire book for the user within 200 words or 3 paragraphs.
2. **question** - this will let user ask any question about a particular thing in the book
3. **character arc** - if the uploaded book is a novel, the user can ask the character arc of a particular character in the book from start to end.
4. **plot** - explains a plot of a particular chapter or the entire book.
5. **concept** - if the uploaded book is educational, the user can ask to explain a particular concept in a simpler way or in a way that is easily understandable
6. **problem** - if the uploaded book is educational, the user can ask on method to use to solve the problem
7. **essay outline + thesis generator** *(Student Pro — paid tier only)* - generates a structured essay outline, arguable thesis, and verbatim quotes with citations for fiction/novel uploads.

---

## Product Requirements Document

### Product Requirements Document (PRD) - EasyLearn AI Assistant

- **Document Version:** 1.1
- **Date:** March 2026
- **Project Name:** EasyLearn
- **Product Goal:** To provide users with an intelligent, context-aware AI assistant capable of analyzing uploaded books (one at a time) via a RAG architecture to offer specialized insights and learning tools.

---

## 1. Introduction and Goals

### 1.1 Product Vision

EasyLearn aims to revolutionize personal book consumption by allowing users to upload a single text file and instantly query its content using six distinct, specialized AI tools, maximizing comprehension and information retrieval efficiency. A seventh premium tool (Essay Outline + Thesis Generator) targets high-school literature students as a paid-tier feature demonstrating monetization potential.

### 1.2 Business Objectives

- Given this is an individual project with a super low budget, the primary immediate objective is successful implementation and demonstration of core RAG functionality and the six mandated tools. Scalability concerns are secondary to core feature accuracy in the initial phase.
- Demonstrate monetization potential by implementing one high-value, student-targeted paid feature (Essay Outline + Thesis Generator, F-107) that directly addresses a painful high-school literature homework task.

### 1.3 Success Metrics (Phase 1 - Individual Project)

- Successful ingestion and indexing of PDF, EPUB, and TXT files.
- Accurate execution of all six core features (Summary, Question, Character Arc, Plot, Concept, Problem).
- User feedback indicating high accuracy for the Summary feature (adhering to strict constraints).
- Robust handling of file corruption errors without crashing the application.
- Successful implementation and high factual accuracy of the Essay Outline + Thesis Generator (F-107), verified by zero hallucinated quotes or invented page numbers across 5–10 test novels.
- Positive user feedback (or simulated student beta feedback) on usefulness of F-107 for literature essay preparation.

---

## 2. Target Audience

The target audience is broad, focusing on users requiring high-speed, accurate information extraction from lengthy texts:

- **Casual Readers:** Seeking quick overviews or confirmation of details before/after reading.
- **Researchers/Professionals:** Needing rapid synthesis of complex textual information.
- **Students (especially High School):** Requiring simplified explanations of complex concepts found in textbooks or study materials.

---

## 3. Features and Requirements

EasyLearn will support one book upload at a time, leveraging the RAG system for context-specific answers.

### 3.1 Core Feature Set (Mandatory Tools)

| ID | Feature Name | Description | Specific Requirements & Constraints |
| :--- | :--- | :--- | :--- |
| F-101 | **Summary** | Generates a concise overview of the entire uploaded book. | Must strictly adhere to output constraints: **Maximum 200 words OR 3 distinct paragraphs**. No headers or bullet points. Plain prose only. Focus must be on accuracy, covering all main themes and crucial information. |
| F-102 | **Question Answering** | Allows users to ask specific, targeted questions about the book content. | Answers must be contextually derived only from the uploaded text corpus via RAG. |
| F-103 | **Character Arc Analysis** | (Applicable only to novels/fiction) Traces the journey of a specified character. | Must detail **emotional states, key plot involvements, major turning points, and the character's contribution** to the main plot, from beginning to end. |
| F-104 | **Plot Explanation** | Explains the narrative structure of a specified chapter or the entire book. | Must support queries for both specific chapter plots and the overarching narrative structure. |
| F-105 | **Concept Explanation** | (Applicable mainly to educational material) Explains a specific concept from the book. | **Adaptive Clarity:** Default clarity level is dictated by the source material's assumed audience (e.g., 5th-grade math book uses simpler language). UI must allow users to select a desired difficulty level (e.g., simplified, standard, advanced/research level). |
| F-106 | **Problem Solving Assistance** | (Applicable only to educational/technical material) Provides methods or steps to solve a problem mentioned in the text. | Must reference the context/methodology presented within the uploaded book. |
| F-107 | **Essay Outline + Thesis Generator** | Generates a high-school literature essay thesis, structured outline, and supporting verbatim quotes with precise page/chapter references. | • Paid-tier only<br>• Only available for book_type = FICTION / NOVEL<br>• Output: 1 arguable thesis (1–2 sentences) + 3–5 body paragraph outline + 2–3 exact quotes per body paragraph<br>• All quotes must be verbatim + include citation [p. XX – Chapter Y] or [Chunk ID]<br>• Quotes ≤ 40 words each<br>• Total outline length: 400–700 words<br>• If insufficient context: must respond "Not enough context in the book for this topic. Please try a different chapter or question."<br>• Input options: dropdown (Entire book / specific Chapter) + optional free-text essay topic/question |

### 3.2 Book Ingestion and Management

| ID | Requirement | Description |
| :--- | :--- | :--- |
| F-201 | **Format Support** | Must natively support reading and processing of **PDF, EPUB, and TXT** files. All ingested text must pass security sanitization before chunking and embedding (see Security section 7.2). |
| F-202 | **Format Identification** | The UI must include a dropdown menu for the user to manually select the format upon upload. |
| F-203 | **Metadata Verification** | The system should attempt automated metadata extraction to verify the user-selected format or gain initial context. |
| F-204 | **Single Book Limit** | The RAG system must be configured to operate on **one book at a time**. Subsequent uploads must replace the existing indexed book. |

### 3.3 Advanced RAG & UX Enhancements (Mandatory Across All Tools)

The following capabilities must be implemented application-wide to improve retrieval accuracy, answer trustworthiness, debuggability, and conversational naturalness. These apply uniformly to all core tools (F-101 through F-107) and the unified chat interface.

#### 3.3.1 Citations and Source Excerpts

**Description:** Every AI-generated response must include verifiable citations linking back to specific parts of the uploaded book, allowing users to trace and validate claims.

**Requirements:**
- Include inline citations for every factual claim or key statement in the response.
- Citation format: [Chunk X] or [p. Y – Chapter Z] immediately after the relevant sentence/claim (use metadata from ingestion if available: page number, chapter title, char index range).
- Each citation must be accompanied by a short verbatim excerpt (1–3 sentences) from the retrieved chunk.
- For Summary (F-101): Place citations at the end of each paragraph or after main themes.
- For Question Answering (F-102), Plot (F-104), Character Arc (F-103): Cite after specific facts, plot points, or arc descriptions.
- For Concept (F-105) and Problem (F-106): Cite definitions, steps, or methodologies.
- For Essay Outline + Thesis Generator (F-107): Mandatory inline citations after the thesis claim, each topic sentence, and **every quote**. Each quote citation must include the verbatim excerpt (full quote) in the popover/tooltip.
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
- Primary reranker: `FlashrankRerank` from `langchain_community.document_compressors.flashrank_rerank` (note: class name is lowercase 'r' — `FlashrankRerank`, not `FlashRankRerank`).
- Combine with MMR (Maximal Marginal Relevance) for diversity:
  - MMR lambda: 0.5–0.7 (tunable; higher = more relevance-focused, lower = more diverse).
  - Apply MMR either standalone or post-reranking.
- Default flow: Vector similarity search → rerank → MMR → LLM context.
- Tool-specific tuning: Higher diversity (lower lambda) for global tools (Summary, Character Arc); higher precision for targeted queries (Question, Concept).
- If reranker unavailable (fallback): Use Chroma native MMR only.

**Implementation Guidance:**
- Use `ContextualCompressionRetriever` from `langchain_classic.retrievers.contextual_compression`.
- Chroma supports `search_type="mmr"` natively.
- Instantiate `FlashrankRerank` once in `RAGPipeline.__init__` — not inside the query method, as it downloads a model on first instantiation.
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
- Use `InMemoryChatMessageHistory` from `langchain_core.chat_history` with manual windowing (last 10 messages / 5 turns). Note: `ConversationBufferWindowMemory` was removed in LangChain 1.x and is no longer available.
- For very long chats: Summarize older turns if approaching token limit.
- Reset: Clear memory automatically on new book upload or via explicit "New conversation" button.
- System prompt addition: "This is an ongoing conversation about the uploaded book. Use previous messages for context when relevant, but always ground answers in retrieved book content."
- Guest sessions: In-memory only (discarded on refresh/closure).
- No long-term persistence in Phase 1.
- For F-107: Support follow-up refinements such as "Make the thesis more arguable", "Add one more quote to paragraph 2", "Change the focus to symbolism instead" (leverage existing conversation memory).

**Implementation Guidance:**
- Backend: Use `InMemoryChatMessageHistory` per book_id, stored in a dict on the `RAGPipeline` instance.
- Frontend: Send conversation history array with each query (or use session/thread ID).
- Handle token overflow: Truncate oldest messages or use summary fallback.

### 3.4 Paid-Tier Exclusive Features

The following features are only available to users on a paid plan (e.g. "Student Pro" or equivalent). They are disabled (grayed out with upgrade tooltip) for guest/free users.

| ID | Feature Name | Description | Gating & Requirements |
| :--- | :--- | :--- | :--- |
| F-107 | Essay Outline + Thesis Generator | (see F-107 above) | • Visible/enabled only when book_type = FICTION<br>• Requires active paid subscription<br>• Rate limit: unlimited on paid, 3/day on free preview (if offered) |

---

## 4. Technical Specifications

### 4.1 RAG and LLM Configuration

- **Accuracy Priority:** Accuracy is the highest technical priority. The RAG pipeline (chunking, retrieval, context injection) must be optimized for high fidelity context retrieval.
- **Primary LLM Provider:** Ollama runs open-source models locally on the developer's machine (or server). Provides an OpenAI-compatible API endpoint at `http://127.0.0.1:11434/v1`. Chosen for: complete data privacy (no cloud transmission), offline capability, no per-token costs, and seamless integration with LangChain.
- **Selected Model:** `qwen2.5:7b-instruct-q5_K_M`
  - **Reasoning:**
    - Strong instruction-following and faithfulness in RAG contexts (2025–2026 benchmarks show excellent performance on long-document understanding, summarization, and structured reasoning).
    - Balanced size (~4–6 GB VRAM usage in Q5 quantization) — suitable for mid-range laptops (e.g. 16 GB RAM + RTX 3050 4 GB).
    - Quantized to Q5_K_M for good quality vs speed trade-off (generation ~30–50 tokens/s on compatible GPUs).
    - Supports up to ~32k context (configurable; default to 8k–16k for most book queries to stay performant).
  - **Fallback / alternatives** (in order of preference):
    1. `llama3.3:8b-instruct-q5_K_M`
    2. `mistral:7b-instruct-v0.3-q5_K_M`
- **Embedding Model:** `qwen3-embedding:0.6b` via Ollama (`langchain_ollama.OllamaEmbeddings`). Chosen for low resource footprint (~400MB), no HuggingFace Hub dependency, and strong semantic quality relative to size. Runs locally alongside the LLM without VRAM conflicts.
- **Performance/Latency:** While scalability (handling many users) is desired, initial performance targets are flexible. The focus is achieving correct results over speed, provided the response is not excessively slow (target < 10 seconds for complex queries on a single user session).

### 4.2 Data Handling and Persistence

- **Session-Based Default:** For non-logged-in users, all uploaded data (book file, RAG index, conversation history) must be discarded immediately upon **session refresh or closure**.
- **Logged-in Users (Future Tier Consideration):** If a user logs in (future paid tier functionality), data persistence is required for up to **7 days**. After 7 days, all associated data must be automatically purged.
- **Conversation Logging:** Conversation history logging is strictly limited to paid tiers (future state). Free/session-based users will not retain conversation history across sessions.
- **Startup Cleanup:** On server startup, the `uploads/` and `db/` directories are wiped and recreated to ensure no stale data persists between sessions. This cleanup must run before any module-level service instantiation in `main.py`.

### 4.3 User Interface (UI/UX)

- **Platform:** The application must be a **Web Application**.
- **Mobile Experience:** Must incorporate **PWA (Progressive Web Application)** features to ensure a high-quality, mobile-friendly experience.
- **Interaction:** The UI must clearly present the upload mechanism and a centralized chat/query interface, dynamically showing which features (F-103, F-105/106) are applicable based on the ingested document type.
- **Streaming Responses:** All AI-generated responses must stream to the UI word-by-word via Server-Sent Events (SSE), using FastAPI `StreamingResponse`. The frontend consumes the stream via the Fetch API `ReadableStream`. This eliminates block-response UX for slow local LLM inference.
- **Markdown Rendering:** All AI responses must be rendered as formatted markdown in the chat window using `react-markdown` with `@tailwindcss/typography` prose classes.

---

## 5. Error Handling and Fallback

Robust error handling is critical due to the dependence on external file systems and the RAG pipeline.

| Scenario | Required Action |
| :--- | :--- |
| **File Corruption/Unreadable** | If the upload is corrupt or cannot be parsed into indexable text chunks, **all features (F-101 through F-107) must be disabled**. The user must receive a clear message stating the file is unusable and cannot proceed with analysis. |
| **RAG System Failure (Runtime)** | If the underlying indexing or vector retrieval fails during a query execution: **The LLM must respond by explicitly stating it cannot retrieve the necessary context to answer the question.** Under no circumstances should it provide low-confidence answers, guesses, or hallucinated information based on general training data. |
| **Feature Inapplicability** | If a user queries F-103 (Character Arc) on a technical manual, the system must clearly state that the feature is inapplicable to the uploaded content type. |
| **User attempts to use F-107 on non-fiction book** | UI: Feature grayed out + tooltip: "This feature is designed for novels and fiction only." |
| **Insufficient retrieved context for F-107** | LLM must respond exactly: "Not enough context in the book for this topic. Please try a different chapter or question." (no fabricated outline/thesis/quotes) |
| **User is not on paid plan** | UI: Show locked icon + message: "Essay Outline Generator is a Student Pro feature. Upgrade to unlock." |
| **File exceeds 50MB** | Return HTTP 413 with `{"error": true, "code": "FILE_TOO_LARGE", "message": "File too large. Maximum allowed size is 50MB."}` |
| **PDF exceeds 1000 pages** | Return HTTP 422 with `{"error": true, "code": "BOOK_TOO_LONG", "message": "Book too long. Maximum supported length is 1000 pages or equivalent."}` |
| **EPUB/TXT exceeds 1.5M characters** | Return HTTP 422 with same `BOOK_TOO_LONG` error shape. |
| **Scanned/image-only PDF** | Return HTTP 422 with `{"error": true, "code": "SCANNED_PDF", "message": "This PDF appears to be a scanned image. Only text-based PDFs are supported."}` Detection: average text per page < 20 chars across first 10 pages. |

All validation errors must follow this structured response shape:

```json
{
  "error": true,
  "code": "FILE_TOO_LARGE | BOOK_TOO_LONG | SCANNED_PDF | INVALID_FORMAT",
  "message": "<human readable message>"
}
```

---

## 6. Future Considerations (Out of Scope for Initial Implementation)

- Registered user authentication, session persistence, and 7-day data retention.
- User account management and subscription tiers.
- Payment infrastructure for Student Pro tier (Stripe integration, subscription management, upgrade flow).
- Multi-document analysis.
- Long-term data storage beyond the 7-day grace period for logged-in users.
- Export functionality for generated summaries or explanations.
- OCR support for image-heavy PDFs and magazine documents.
- Adult content flagging and age-gating for explicit literary material.
- PWA offline support beyond basic mobile responsiveness and manifest file.

---

## 7. Security & Compliance

EasyLearn shall be developed with security as a first-class concern, aligning with the OWASP Top 10:2025 (web application risks) and OWASP Top 10 for LLM Applications 2025. The following requirements are mandatory for the initial implementation and any future iterations.

### 7.1 OWASP Top 10:2025 – Web Application Risks (Mandatory Controls)

| Rank | Risk (2025) | Key Requirements for EasyLearn |
|------|-------------|--------------------------------|
| A01 | Broken Access Control | • Enforce least privilege for all endpoints.<br>• Future logged-in tier: proper role-based access (user vs admin).<br>• Guest sessions: strict isolation per browser session (no cross-session leakage). |
| A02 | Security Misconfiguration | • Use secure defaults (FastAPI, Next.js, ChromaDB).<br>• Enforce HTTPS in production (HSTS header).<br>• Disable debug modes and verbose error messages in prod.<br>• Apply security headers: CSP, X-Content-Type-Options: nosniff, X-Frame-Options: DENY, Permissions-Policy. |
| A03 | Software Supply Chain Failures | • Pin all dependencies (requirements.txt, package.json) with exact versions.<br>• Run automated vulnerability scans (e.g. pip-audit, npm audit, Dependabot) in CI.<br>• Maintain minimal dependency footprint; prefer well-maintained libraries.<br>• Generate SBOM (Software Bill of Materials) for critical releases. |
| A04 | Cryptographic Failures | • Use TLS 1.3+ for all traffic.<br>• Hash future passwords with Argon2id or bcrypt (high work factor).<br>• Never store plaintext secrets (use environment variables or secret managers). |
| A05 | (Other relevant – Injection, etc.) | See file upload and LLM-specific controls below. |

(Only the most critical / directly applicable categories are listed above; remaining OWASP Top 10:2025 risks shall be addressed via secure coding practices.)

### 7.2 OWASP Top 10 for LLM Applications 2025 – Mandatory Controls

| Rank | Risk (2025) | Key Requirements for EasyLearn |
|------|-------------|--------------------------------|
| LLM01 | Prompt Injection | • Use strong system prompts that forbid executing code, revealing instructions, or deviating from RAG context.<br>• Apply input sanitization / guardrails on user queries (reject obvious jailbreak patterns).<br>• Prefer structured output (e.g. LangChain output parsers) to limit free-form malicious responses.<br>• Indirect injection via uploads (PDF/EPUB/TXT): Mandatory sanitization during ingestion (Unicode NFKC normalization, zero-width character stripping, regex detection of common injection patterns). Reject file if patterns detected. Use structural isolation ([DOCUMENT] tags) in all prompts. |
| LLM02 | Sensitive Information Disclosure | • Never return book content verbatim unless explicitly requested and safe.<br>• Sanitize LLM output before display (escape HTML/JS, strip suspicious patterns).<br>• Do not log full prompts/responses containing potentially sensitive book excerpts in plaintext. |
| LLM03 | Supply Chain Vulnerabilities | • Use trusted sources for embedding models, LLMs, and LangChain version.<br>• Monitor Ollama model integrity (checksums if possible). |
| LLM04 | Data & Model Poisoning | • Out of scope for v1 (no fine-tuning or persistent training).<br>• Validate uploaded documents for obvious tampering markers during ingestion. |
| LLM05 | Improper Output Handling | • Treat all LLM output as untrusted.<br>• Render responses safely using `react-markdown` with sanitized output — no `dangerouslySetInnerHTML`. |
| LLM08 | Vector & Embedding Weaknesses | • Use high-quality embedding models (qwen3-embedding:0.6b via Ollama).<br>• Apply metadata filtering and MMR re-ranking to reduce irrelevant / poisoned retrieval. |
| LLM10 | Unbounded Consumption | • Implement per-session rate limiting on uploads and queries (5 uploads/hour, 30 queries/hour per IP/session).<br>• Use slowapi in FastAPI.<br>• Set hard token limits per request. |

### 7.3 File Upload Specific Security (Critical Vector)

- Allow-list file extensions: `.txt`, `.pdf`, `.epub` only.
- Validate true MIME type using `python-magic` or equivalent (do not trust client Content-Type).
- Enforce maximum file size (50 MB) at the FastAPI app middleware level — not just the endpoint level.
- Store uploaded files in temporary, non-executable, randomized paths (never in web-accessible directory).
- Delete files immediately after successful ingestion (or after session expiry).
- Reject files containing executable content or suspicious signatures.
- During text extraction: apply full sanitization (see LLM01) including control-character removal and injection-pattern scanning.
- If suspicious content is detected: reject upload with clear message "File contains potentially malicious content and was rejected for security reasons."

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

All security requirements above shall be validated during development and before any public deployment.

---

## 8. User Feedback System

### 8.1 Overview

EasyLearn shall implement an inline, per-message feedback mechanism within the chat interface. This allows users to rate individual AI responses, providing granular signal on tool quality and RAG accuracy. A separate general feedback form is out of scope for Phase 1.

### 8.2 Feedback UI Specification

#### 8.2.1 Inline Feedback Controls

Every AI-generated message in the chat window shall display a feedback control row. The controls must:

- Appear below the message content, after the sources panel (if visible)
- Be visible by default on the last message, subtle (low opacity) on all previous messages, and fully visible on hover for all messages
- Consist of two icon buttons: Thumbs Up and Thumbs Down (use lucide-react `ThumbsUp` and `ThumbsDown` icons)
- On selection, the chosen icon must change to the Primary Color (#1A73E8) for thumbs up and Error/Alert color (#EA4335) for thumbs down to confirm the action
- Once rated, both buttons must remain visible but the unselected one must be dimmed (opacity 40%) to indicate the choice is locked
- A user may not change their rating after submission

#### 8.2.2 Thumbs Down Modal

When a user clicks Thumbs Down, a modal dialog must appear offering optional additional context. The modal must:

- Appear centered on screen with a dark overlay backdrop
- Title: "What went wrong?"
- Subtitle: "Your feedback helps improve EasyLearn. This is optional."
- Present the following quick-select reason chips (multi-select allowed):
  - "Wrong information"
  - "Missing context"
  - "Response too long"
  - "Response too short"
  - "Didn't answer my question"
  - "Cited wrong sources"
- An optional free-text field: "Anything else? (optional)" — max 500 characters
- Two action buttons:
  - "Skip" — submits the thumbs down with no reason, closes modal
  - "Submit Feedback" — submits with selected reasons and comment, closes modal
- Modal must close on backdrop click (treated as Skip)
- Styling must follow PRD Styling Guidelines — white surface, #E8EAED borders, #1A73E8 primary button

#### 8.2.3 Thumbs Up Behavior

When a user clicks Thumbs Up, no modal is shown. The rating is recorded silently and the icon state updates immediately. Do not interrupt a positive experience with additional prompts.

### 8.3 Feedback Data Model

#### 8.3.1 Feedback Payload

Every feedback submission must send the following payload to the backend:

```json
{
  "book_id": "string",
  "tool_name": "summary | question | character_arc | plot | concept | problem | essay_outline",
  "query_text": "string | null",
  "response_excerpt": "first 300 characters of the AI response",
  "rating": "up | down",
  "reasons": ["wrong_information", "missing_context", "too_long", "too_short", "unanswered", "wrong_sources"] | null,
  "comment": "string | null",
  "session_id": "string",
  "timestamp": "ISO 8601 string"
}
```

#### 8.3.2 Backend Endpoint

A new endpoint must be created:

```
POST /api/v1/feedback/
```

Request body matches the payload above. Response:

```json
{
  "status": "received"
}
```

The endpoint must:
- Validate the payload using Pydantic
- Store feedback to a local JSON file (`./feedback/feedback.json`) appending each entry as a newline-delimited JSON record (NDJSON format)
- Return 200 with `{"status": "received"}` on success
- Never fail silently — if storage fails, log the error but still return 200 to avoid disrupting the user experience
- Rate limit: 60 submissions per hour per session

#### 8.3.3 Storage

For Phase 1, feedback is stored as NDJSON (newline-delimited JSON) in `./feedback/feedback.json`. This is intentionally simple — no database required. Each line is one feedback record. This file must be:
- Excluded from git via `.gitignore`
- Not deleted on server startup (unlike `db/` and `uploads/`)
- Readable for manual review by the developer

### 8.4 Frontend Implementation Requirements

- `FeedbackControls` must be a standalone reusable component accepting `messageIndex`, `bookId`, `toolName`, `queryText`, and `responseContent` as props
- `FeedbackModal` must be a standalone component, rendered at the page root level (not inside the chat bubble) to avoid z-index and overflow clipping issues
- Feedback state (which messages have been rated and with what rating) must be stored in React state in `page.tsx` and passed down as props — do not use a global store for this
- The feedback API call must be non-blocking — use fire-and-forget pattern, do not await it in a way that blocks the UI
- If the feedback API call fails, fail silently — do not show an error to the user

### 8.5 Privacy Considerations

- Feedback records contain excerpts of AI responses and user queries
- For guest sessions, no personally identifiable information is collected — session_id is an ephemeral UUID generated client-side per session
- Feedback data must not be transmitted to any third party
- A brief notice must appear below the feedback controls: "Feedback is stored locally and used only to improve EasyLearn." in metadata/label style text (12px, #5F6368)

---

## 9. Paid Tier Infrastructure (Future — Out of Scope for Phase 1)

This section is a placeholder for the Student Pro paid tier. Implementation is deferred to a future phase but the requirements are documented here for planning purposes.

### 9.1 Overview

The paid tier gates access to F-107 (Essay Outline + Thesis Generator) and any future premium features. In Phase 1, the UI must show the locked state for F-107 with an upgrade prompt, but no actual payment flow is implemented.

### 9.2 Future Requirements

- Payment processing via Stripe (or equivalent) with monthly/annual subscription options.
- User authentication required for paid tier — guest users cannot access paid features.
- Subscription status must be verified server-side on every F-107 request — client-side gating alone is insufficient.
- Subscription tiers to define in a future phase: Free (guest), Student Pro (paid monthly), Institutional (future).
- Webhook handling for subscription lifecycle events (created, cancelled, payment failed).
- Grace period: 3 days after payment failure before access is revoked.

---

## Technology Stack

### TECHNOLOGY STACK FOR EASYLEARN - AI BOOK ASSISTANT

#### 1. CORE ARCHITECTURE

The system employs a modern web application architecture leveraging Python for backend processing due to its dominance in AI/ML and rapid prototyping capabilities.

- **Frontend:** React.js with Next.js (App Router, TypeScript)
- **Backend/API:** FastAPI (Python)
- **Database (User Management/Metadata):** PostgreSQL (future paid tier only — not implemented in Phase 1)
- **Vector Database:** ChromaDB (local/embedded, session-scoped)
- **LLM Orchestration:** LangChain 1.x

#### 2. FRONTEND STACK

- **Technology:** React.js / Next.js 16.x (App Router, TypeScript)
- **Styling:** Tailwind CSS + shadcn/ui component library
- **Markdown Rendering:** `react-markdown` with `@tailwindcss/typography`
- **PWA:** `manifest.json` for installability; full offline support deferred to future phase
- **Streaming:** Fetch API `ReadableStream` consuming SSE from FastAPI `StreamingResponse`

#### 3. BACKEND STACK

- **Technology:** FastAPI (Python 3.12)
- **Async Server:** Uvicorn
- **Rate Limiting:** slowapi
- **File Validation:** python-magic for MIME type verification

#### 4. DATA PROCESSING AND RETRIEVAL (RAG PIPELINE)

**Ingestion & Parsing:**
- PDF: PyMuPDF (`fitz`)
- EPUB: ebooklib + BeautifulSoup4
- TXT: standard file I/O

**Text Splitting/Chunking:** LangChain `RecursiveCharacterTextSplitter`

**Embedding Model:** `qwen3-embedding:0.6b` via Ollama (`langchain_ollama.OllamaEmbeddings`)
- Replaces previous `all-MiniLM-L6-v2` / HuggingFace Sentence Transformers
- Fully local, no HuggingFace Hub authentication required
- ~400MB footprint, compatible with mid-range hardware

**Vector Store:** ChromaDB (PersistentClient for development; in-memory `chromadb.Client()` option for pure guest sessions)

**Reranker:** `FlashrankRerank` from `langchain_community.document_compressors.flashrank_rerank`

**Retriever:** `ContextualCompressionRetriever` from `langchain_classic.retrievers.contextual_compression`

#### 5. LARGE LANGUAGE MODEL (LLM)

- **Primary:** `qwen2.5:7b-instruct-q5_K_M` via Ollama (`langchain_ollama.OllamaLLM`)
- **Endpoint:** `http://127.0.0.1:11434/v1` (local) or configurable via `OLLAMA_BASE_URL` env var
- **Cloud Fallback (if deploying publicly):** Groq API (`langchain_groq.ChatGroq`) with `llama-3.3-70b-versatile` — free tier supports ~14,400 requests/day, zero infrastructure cost

#### 6. DATA PERSISTENCE AND MANAGEMENT

- **Guest Sessions:** ChromaDB in-memory or PersistentClient wiped on server startup. Uploads deleted after ingestion. No cross-session data retention.
- **Feedback Storage:** NDJSON flat file at `./feedback/feedback.json` — persisted across restarts, excluded from git.
- **Registered User Storage (Future):** PostgreSQL for user credentials, book metadata, and 7-day conversation history retention.

#### 7. ERROR HANDLING AND FALLBACK

- **Validation Layer:** FastAPI + Pydantic for request validation. Structured error responses with `error`, `code`, and `message` fields.
- **RAG Failure Handling:** Pipeline exception handler logs full traceback via Python `logging` and returns a user-facing acknowledgement of failure — no hallucination fallback.
- **Streaming Error Handling:** Errors during SSE streaming are sent as `{"type": "error", "value": "..."}` events so the frontend can display them inline without breaking the stream.

#### 8. TOOL-SPECIFIC PROMPT ENGINEERING

- **Summary:** Prompt enforces strict 200-word/3-paragraph plain prose structure. No headers, bullets, or markdown formatting permitted in output.
- **Concept Explanation:** Prompts dynamically adjust output complexity based on user-selected difficulty level using few-shot examples.
- **Character Arc:** Prompts instruct LLM to synthesize emotional shifts and plot intersections across the full document timeline.
- **Essay Outline (F-107):** Prompt enforces thesis + 3–5 body paragraphs + 2–3 verbatim quotes per paragraph, all with citations. Hallucinated quotes treated as critical failure.

---

## Project Structure

### ACTUAL DIRECTORY STRUCTURE (as implemented)

```
easylearn/
│
├── backend/
│   ├── api/
│   │   ├── __init__.py
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── endpoints_books.py       # Upload, format detection, ingestion trigger
│   │       └── endpoints_query.py       # Routes for all 7 tools, SSE streaming
│   │
│   ├── core/
│   │   ├── __init__.py
│   │   ├── rag_pipeline.py              # Retrieval orchestration, MMR + reranking, memory
│   │   └── llm_handler.py              # Ollama interface, system prompts, fallback logic
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── ingestion_service.py         # PDF/EPUB/TXT parsing, guardrails, metadata extraction
│   │   └── vector_db_manager.py         # ChromaDB operations, session-scoped indexes
│   │
│   ├── models/                          # Pydantic models (to be populated)
│   │
│   ├── tests/
│   │   ├── conftest.py                  # pytest fixtures, ChromaDB isolation, HF warning suppression
│   │   ├── test_api.py                  # FastAPI endpoint tests
│   │   ├── test_core.py                 # Ingestion, LLM handler, pipeline tests
│   │   ├── test_rag.py                  # RAG pipeline, memory, reranker tests
│   │   ├── test_tools.py                # Per-tool response validation tests
│   │   └── test_vector_db.py            # ChromaDB lifecycle tests
│   │
│   ├── __init__.py
│   ├── main.py                          # FastAPI app entry point, startup cleanup, middleware
│   └── requirements.txt
│
├── frontend/                            # Next.js 16.x App Router (TypeScript)
│   ├── app/
│   │   ├── favicon.ico
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx                     # Main application page
│   │
│   ├── components/
│   │   ├── BookUploader.tsx
│   │   ├── ChatWindow.tsx               # Streaming chat, ReactMarkdown rendering
│   │   ├── ToolSelector.tsx             # Tab/button selector for tools
│   │   ├── SourceViewer.tsx             # Collapsible citations panel
│   │   └── ui/                          # shadcn/ui components
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── collapsible.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── scroll-area.tsx
│   │       └── select.tsx
│   │
│   ├── lib/
│   │   ├── api.ts                       # Typed API client including api.streamQuery()
│   │   └── utils.ts
│   │
│   ├── public/
│   │   ├── manifest.json                # PWA manifest
│   │   ├── file.svg
│   │   ├── globe.svg
│   │   ├── next.svg
│   │   ├── vercel.svg
│   │   └── window.svg
│   │
│   ├── components.json                  # shadcn/ui config
│   ├── eslint.config.mjs
│   ├── next.config.ts
│   ├── postcss.config.mjs
│   ├── tsconfig.json                    # paths: {"@/*": ["./*"]}
│   ├── package.json
│   └── package-lock.json
│
├── feedback/
│   └── feedback.json                    # NDJSON feedback storage — gitignored, not wiped on startup
│
├── .venv/                               # Python virtual environment — gitignored
├── PRD.md
└── README.md
```

**Files not yet created but required by PRD:**
- `backend/api/v1/endpoints_feedback.py` — POST /api/v1/feedback/ (Section 8)
- `frontend/components/FeedbackControls.tsx` — per-message thumbs up/down (Section 8)
- `frontend/components/FeedbackModal.tsx` — thumbs down reason modal (Section 8)
- `.env` / `.env.example` — environment variable templates
- `feedback/feedback.json` — created on first feedback submission

### COMPONENT RESPONSIBILITIES

**`backend/core/rag_pipeline.py`** — Central orchestrator:
- Receives user query and book_id context
- Applies tool-specific MMR lambda tuning
- Performs initial retrieval (k=30), then reranks to top 8 via FlashrankRerank
- Injects last 5 turns of conversation history
- Calls `llm_handler.generate_response()` and saves to memory
- Returns `{"answer": str, "sources": list}`

**`backend/core/llm_handler.py`** — LLM communication:
- Manages Ollama connection
- Holds system prompts per tool with security instructions
- Implements fallback: explicit failure acknowledgement, no hallucination
- All prompts enforce: no jailbreak execution, no instruction revelation, RAG-grounded only

**`backend/services/ingestion_service.py`** — File parsing:
- Handles PDF (PyMuPDF), EPUB (ebooklib + BS4), TXT
- Enforces: 1000 page PDF limit, 1.5M char EPUB/TXT limit, scanned PDF detection
- Strips junk EPUB items (nav.xhtml, toc.xhtml, CSS, etc.)
- Extracts chapter titles from EPUB TOC for citation metadata

**`backend/services/vector_db_manager.py`** — Vector store:
- ChromaDB PersistentClient, path from `CHROMA_DB_PATH` env var
- Creates/replaces collection per book_id
- Returns MMR retriever with configurable k and lambda_mult

---

## Database Schema Design

### 1. Overview

This section details the proposed database schema for the EasyLearn application, focusing on the persistence requirements for authenticated users. Given the requirement for session-based storage for non-logged-in users, the primary data models focus on storing user-specific assets (uploaded books) and interaction history, adhering to a maximum 7-day retention policy for persistent data.

### 2. Entity-Relationship Diagram (Conceptual)

- **User** (1) → (Many) **UploadedBook**
- **UploadedBook** (1) → (Many) **RAGChunk**
- **UploadedBook** (1) → (Many) **ConversationSession**
- **ConversationSession** (1) → (Many) **InteractionLog**

### 3. Detailed Schema Definitions

#### 3.1. User Table (Optional Persistence)

Stores user credentials and session management information for persistent storage options (future or paid tiers).

| Field Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `user_id` | UUID | PRIMARY KEY | Unique identifier for the user. |
| `username` | VARCHAR(100) | UNIQUE, NOT NULL (if registered) | User's chosen username or email. |
| `password_hash` | VARCHAR(255) | NULLABLE | Hashed password if login is active. |
| `created_at` | TIMESTAMP | NOT NULL | Timestamp of account creation. |
| `last_active` | TIMESTAMP | NOT NULL | Last time the user interacted with persistent storage. |

#### 3.2. UploadedBook Table

| Field Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `book_id` | UUID | PRIMARY KEY | Unique identifier for the book record. |
| `user_id` | UUID | FOREIGN KEY (User.user_id), NULLABLE | Link to the owning user (NULL for session-based uploads). |
| `title` | VARCHAR(255) | NOT NULL | Extracted or provided title of the book. |
| `author` | VARCHAR(255) | NULLABLE | Extracted or provided author. |
| `file_path` | VARCHAR(512) | NOT NULL | Location of the original uploaded file (temporary path — deleted after ingestion). |
| `file_format` | ENUM('PDF', 'EPUB', 'TXT') | NOT NULL | Format of the uploaded file. |
| `book_type` | ENUM('FICTION', 'EDUCATIONAL') | NOT NULL | Determined during ingestion/metadata extraction, critical for feature enablement. |
| `ingestion_status` | ENUM('PENDING', 'SUCCESS', 'FAILED') | NOT NULL | Status of RAG chunking and vector indexing. |
| `storage_expiry_date` | TIMESTAMP | NOT NULL | Based on 7-day retention policy from upload time or last access. |
| `uploaded_at` | TIMESTAMP | NOT NULL | Time of upload. |

#### 3.3. RAGChunk Table

| Field Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `chunk_id` | UUID | PRIMARY KEY | Unique identifier for the text segment. |
| `book_id` | UUID | FOREIGN KEY (UploadedBook.book_id), NOT NULL | The book this chunk belongs to. |
| `text_content` | TEXT | NOT NULL | The raw text content of the segment. |
| `start_char_index` | INTEGER | NOT NULL | Start position within the original document. |
| `end_char_index` | INTEGER | NOT NULL | End position within the original document. |
| `vector_embedding` | VECTOR | NOT NULL | Dense vector representation for similarity search. Dimension depends on embedding model (qwen3-embedding:0.6b). |
| `metadata_context` | JSONB | NULLABLE | Contextual data (e.g., page number, chapter identifier). |

#### 3.4. ConversationSession Table

| Field Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `session_id` | UUID | PRIMARY KEY | Unique identifier for the session. |
| `book_id` | UUID | FOREIGN KEY (UploadedBook.book_id), NOT NULL | The book this session pertains to. |
| `session_start_time` | TIMESTAMP | NOT NULL | When the user started interacting with this book. |
| `session_type` | ENUM('PERSISTENT', 'SESSIONAL') | NOT NULL | Whether this session is tied to a persistent user or temporary session. |
| `last_activity_time` | TIMESTAMP | NOT NULL | Used to enforce session expiry if applicable. |

#### 3.5. InteractionLog Table

| Field Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `log_id` | BIGINT | PRIMARY KEY AUTO_INCREMENT | Sequential ID for ordering interactions. |
| `session_id` | UUID | FOREIGN KEY (ConversationSession.session_id), NOT NULL | The session this interaction belongs to. |
| `timestamp` | TIMESTAMP | NOT NULL | Time of the interaction. |
| `user_prompt` | TEXT | NOT NULL | The raw question/request from the user. |
| `tool_used` | VARCHAR(50) | NOT NULL | e.g., 'SUMMARY', 'QUESTION', 'CHARACTER_ARC', 'ESSAY_OUTLINE'. |
| `difficulty_level_requested` | VARCHAR(50) | NULLABLE | Specific difficulty requested (e.g., '5th Grade', 'Expert'). |
| `llm_retrieved_context` | TEXT | NULLABLE | Snippets of RAG context retrieved (for auditing accuracy). |
| `llm_response` | TEXT | NOT NULL | The final answer generated by the LLM. |
| `response_status` | ENUM('SUCCESS', 'RAG_FAILURE', 'CORRUPT_INPUT') | NOT NULL | Status reflecting error handling requirements. |

### 4. Data Management and Policy Enforcement

1. **Session vs. Persistence:** For non-authenticated users, the `user_id` in `UploadedBook` will be NULL. All associated records must use the `storage_expiry_date` or rely on server startup cleanup for temporary data.
2. **7-Day Retention:** A scheduled background job must sweep tables for records where `storage_expiry_date` has passed and the user is not registered, deleting them to enforce the policy.
3. **Accuracy Priority:** The reliance on accurate `RAGChunk` generation and high-dimensional vector storage is paramount.
4. **Error Logging:** The `response_status` in `InteractionLog` is crucial for capturing RAG system failures.

---

## User Flow

### USERFLOW DOCUMENTATION: EasyLearn AI Assistant

**Document Version:** 1.1
**Date:** March 2026
**Project:** EasyLearn

---

### 1. Overview

This document details the user flows for the EasyLearn web application. The flows cover initial onboarding, book ingestion, feature utilization, session management, and feedback submission for both guest and logged-in users.

---

### 2. User Roles

1. **Guest User:** Uses the application for a single session. Data (uploaded books, conversations) is session-based and discarded upon refresh/exit.
2. **Registered User:** Can log in to persist data. Uploaded books and conversations are retained for a maximum of 7 days. *(Future — not implemented in Phase 1)*

---

### 3. Core User Flows

#### 3.1. Flow 1: Initial Access and Onboarding (Guest & Registered)

**Goal:** User accesses the platform and is presented with options to begin using the service.

| Step | Description | Wireframe/Screen Reference | Interaction Notes |
| :--- | :--- | :--- | :--- |
| 1.1 | User navigates to the EasyLearn URL. | Landing Page/Initial View | Displays value proposition and CTA: "Start Learning Now" or "Login/Sign Up". |
| 1.2 | (If Registered) User clicks "Login" or "Sign Up". | Authentication Modal/Page | Standard login/registration process. Post-login, redirects to Dashboard (3.3). |
| 1.3 | (If Guest) User clicks "Start Learning Now". | Dashboard/Upload Prompt | Proceeds directly to Book Upload Interface (3.2). |

#### 3.2. Flow 2: Book Upload and Ingestion

**Goal:** User successfully uploads a compatible file, and the RAG system processes the document into the vector store.

| Step | Description | Wireframe/Screen Reference | Interaction Notes |
| :--- | :--- | :--- | :--- |
| 2.1 | User initiates upload. | Upload Panel | Clearly visible area for drag-and-drop or file selection. |
| 2.2 | User selects file (PDF, EPUB, or TXT). | File Explorer Modal | Client-side validation: reject files >50MB immediately before API call. Show file size after selection. |
| 2.3 | User selects Book Type from dropdown (Fiction/Novel or Educational/Textbook). | Format Selection Field | Required input to tailor subsequent feature behavior. |
| 2.4 | User confirms upload. | Confirmation Button | Button becomes active only after file selection and Book Type selection. Disabled during processing. |
| 2.5 | System processes the document. | Processing Indicator | Staged messages: "Uploading file..." → "Validating file..." → "Processing book content..." → "Building search index..." → "Ready." |
| 2.6 | Processing successful. | Success Notification | Brief notification: "Book successfully processed. Ready for analysis." Redirects to Chat Interface. |
| 2.7 | Processing fails. | Error Card (#EA4335) | Displays specific error code message. User remains on Upload Interface. |

#### 3.3. Flow 3: Feature Utilization (Primary Interaction)

**Goal:** User interacts with the seven RAG features via the unified chat interface.

**Interface Structure:** Two-panel layout. Left panel (40%): book display + tool selector. Right panel (60%): chat window with streaming responses.

| Step | Description | Interaction Notes |
| :--- | :--- | :--- |
| 3.1 | User selects the desired tool from the Feature Panel. | Tools: Summary, Question, Character Arc, Plot, Concept, Problem, Essay Outline (locked for free users). Visibility adjusts based on Book Type. |
| 3.2 | User inputs prompt specific to the selected tool. | Input validation ensures text area is not empty before sending. Summary auto-sends. |
| 3.3 | System retrieves context via RAG and streams response via LLM. | Response streams word-by-word via SSE. Loading state shows rotating contextual messages. |
| 3.4 | User reviews streamed output rendered as markdown. | Citations appear as superscript numbers. Sources panel collapsible below response. |
| 3.5 | User rates the response. | Thumbs up/down visible below each response. Thumbs down triggers optional reason modal. |

#### 3.4. Tool Flow: Summary

1. User selects **Summary** tool.
2. System auto-sends summary request — no text input required.
3. System retrieves overall document embeddings using keyword-style search query for better semantic matching.
4. LLM generates a summary adhering strictly to 200-word/3-paragraph plain prose constraint. No headers or bullets.

#### 3.5. Tool Flow: Question

1. User selects **Question** tool.
2. User inputs: "What is the protagonist's motivation in Chapter 5?"
3. System performs targeted vector search and generates a grounded answer.

#### 3.6. Tool Flow: Character Arc

1. User selects **Character Arc** tool.
2. User inputs: "Trace the arc of [Character Name]."
3. System searches for all mentions/context related to the character.
4. LLM synthesizes the arc detailing emotional states, key plot involvements, and major turning points.

#### 3.7. Tool Flow: Plot Explanation

1. User selects **Plot** tool.
2. User inputs: "Explain the plot of Chapter 12" OR "Summarize the entire plot structure."
3. System retrieves plot-relevant sections and renders the explanation.

#### 3.8. Tool Flow: Concept Explanation

1. User selects **Concept** tool.
2. User inputs concept name AND/OR selects difficulty level from dropdown.
3. System retrieves relevant definitions and contextual examples.
4. LLM explains at the selected difficulty level.

#### 3.9. Tool Flow: Problem Solving

1. User selects **Problem** tool.
2. User inputs: "How do I solve [Specific Problem X] mentioned in the book?"
3. System retrieves methodology or solution steps from the educational material.
4. LLM outputs step-by-step instructions.

#### 3.10. Tool Flow: Essay Outline + Thesis Generator (F-107 — Paid)

1. Free user sees F-107 grayed out with "Student Pro" lock icon.
2. Paid user selects **Essay Outline** tool.
3. User selects scope (Entire Book / Specific Chapter) and optionally enters essay topic/question.
4. System retrieves broad context with higher diversity (lower MMR lambda).
5. LLM generates: 1 arguable thesis + 3–5 body paragraph outline + 2–3 verbatim quotes per paragraph with citations.
6. User may follow up: "Make the thesis more arguable", "Add a quote to paragraph 3", etc.

---

### 4. Error Handling and Fallback Flows

| Step | Scenario | User Feedback/System Action | Location |
| :--- | :--- | :--- | :--- |
| 4.1 | Uploaded file is corrupt/unreadable. | Error card: "File could not be processed. Check file integrity." User must re-upload. | Upload Interface |
| 4.2 | RAG System Failure (Post-Ingestion). | Streamed: "I am currently unable to access the knowledge base for this book due to a system error. Please try again shortly." | Chat Interface |
| 4.3 | User queries information outside the uploaded book context. | "My responses are strictly limited to the content of the book you uploaded." | Chat Interface |
| 4.4 | Feature not applicable to book type. | Feature button grayed out with tooltip. | Feature Panel |
| 4.5 | F-107 attempted on non-fiction book. | "This feature is designed for novels and fiction only." | Feature Panel |
| 4.6 | F-107 insufficient context. | "Not enough context in the book for this topic. Please try a different chapter or question." | Chat Interface |
| 4.7 | Free user attempts F-107. | "Essay Outline Generator is a Student Pro feature. Upgrade to unlock." | Feature Panel |

---

### 5. Session Management Flow

**Goal:** Differentiate persistence for Guest vs. Registered users.

| Step | User Role | Action | Data Persistence Outcome |
| :--- | :--- | :--- | :--- |
| 5.1 | Guest User | Uploads book and interacts. | All data (file reference, embeddings context, chat history) is tied to the current browser session only. Discarded on browser closure/refresh. |
| 5.2 | Registered User | Uploads book and interacts. | Data is saved to the user's account storage (DB). Conversation history and uploaded context are retained for 7 calendar days from the last interaction. |
| 5.3 | Registered User | Logs out manually. | Data persists for 7 days, but the user cannot access it until logging back in. |
| 5.4 | Registered User | Returns after 8 days. | System automatically purges data associated with that book/session from storage due to the 7-day retention limit. |

---

## Styling Guidelines

### EASYLEARN STYLING GUIDELINES DOCUMENT (V1.0)

#### 1. INTRODUCTION

This document outlines the styling and design principles for the EasyLearn web application. The styling must prioritize clarity, accessibility, and a clean, modern aesthetic suitable for prolonged reading and academic interaction.

#### 2. DESIGN PRINCIPLES

**2.1 Clarity and Focus (Primary)**
The interface must minimize distractions to keep the user focused on the book content and the AI responses. Ample whitespace and high contrast are essential.

**2.2 Accessibility and Readability**
Text must be highly legible across different screen sizes (desktop and mobile PWA). Adherence to WCAG guidelines (AA minimum) for color contrast is required.

**2.3 Modern and Trustworthy**
The visual design should evoke trust and competence. Avoid overly playful or distracting visual elements.

**2.4 Mobile Responsiveness (PWA Focus)**
All layouts must fluidly adapt to mobile viewports, prioritizing content display and easy interaction with input fields and feature selection.

#### 3. COLOR PALETTE

**3.1 Primary Color (Brand Accent)**
- Name: Academic Blue
- Hex: `#1A73E8`
- RGB: 26, 115, 232
- Usage: Active states, primary buttons, focus indicators, thumbs-up feedback confirmation

**3.2 Secondary Color (Informational/Success)**
- Name: Success Green
- Hex: `#34A853`
- RGB: 52, 168, 83
- Usage: Positive feedback, success states (used sparingly)

**3.3 Neutral Palette**
- Background (App/Container): `#F8F9FA`
- Surface (Card/Modal/Input Fields): `#FFFFFF`
- Primary Text: `#202124`
- Secondary Text (Labels, Metadata): `#5F6368`
- Borders/Dividers: `#E8EAED`

**3.4 Feedback Colors**
- Error/Alert: `#EA4335`
- Usage: Error cards, corrupt file messages, thumbs-down feedback confirmation

#### 4. TYPOGRAPHY

**4.1 Font Family**
- Primary: Inter or Roboto
- Fallback: Arial, sans-serif

**4.2 Sizing and Hierarchy**

| Element | Size (Desktop Base) | Weight | Usage |
| :--- | :--- | :--- | :--- |
| H1 (Page Title) | 28px | Bold (700) | Main Feature Selector |
| H2 (Section Header) | 22px | Semi-Bold (600) | Panel Titles |
| Body Text (Default) | 16px | Regular (400) | AI Outputs, Standard descriptions |
| Interactive Text (Buttons) | 14px | Medium (500) | Call to action |
| Metadata/Labels | 12px | Regular (400) | Upload details, feedback notice, constraints |
| Summary/Character Arc Output | 16px–18px | Regular (400) | Long-form results (line height 1.5) |

**4.3 Line Height**
- Standard text: 1.5x font size
- Headings: 1.2x font size

#### 5. UI/UX PRINCIPLES

**5.1 Layout Structure**
Two-panel structure on desktop:
1. Left Panel (40%): Book display, tool selector
2. Right Panel (60%): Chat window with streaming AI responses

**5.2 Interaction Design**

*Input Fields:* White background, `#E8EAED` border. Focus state: 2px `#1A73E8` border.

*Buttons:*
- Primary: `#1A73E8` background, white text, 4px border radius. Hover: `#165CB8`.
- Secondary: White background, blue text/border.
- Locked (paid feature): Grayed out, lock icon, upgrade tooltip on hover.

*Feature Selection:* Tool tabs/buttons with active state using Primary Color background or strong underline.

*Feedback Controls:* Thumbs up/down icons, low opacity by default, full opacity on hover or last message. Selected state: blue for up, red for down. Unselected dimmed to 40% opacity after rating.

**5.3 Feedback and Error Handling**

*Loading/Processing:* Rotating contextual messages ("Searching through the pages...", "Reading between the lines...") with animated dots. No static spinner for LLM responses.

*Error States:* Prominent error card using `#EA4335`. Message must state failure clearly and never provide speculative answers.

**5.4 Data Visualization**
Text-centric app — visualizations reserved for upload progress bars (blue progress, light grey track).

#### 6. RESPONSIVENESS (PWA Considerations)

**6.1 Mobile Layout**
Single column on mobile. Two-panel collapses: book panel stacks above chat panel. Tool selection via persistent bottom navigation or hamburger menu.

**6.2 Typography Scaling**
Minimum body size 14px on mobile. Target 16px preserved where possible.