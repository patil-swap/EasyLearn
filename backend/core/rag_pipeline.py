from backend.core.llm_handler import LLMHandler
from backend.services.vector_db_manager import VectorDBManager
from langchain_core.chat_history import InMemoryChatMessageHistory
from typing import List, Dict, Any, Optional
from langchain_community.document_compressors.flashrank_rerank import FlashrankRerank

class RAGPipeline:
    def __init__(self, db_manager: VectorDBManager, llm_handler: LLMHandler):
        self.db_manager = db_manager
        self.llm_handler = llm_handler
        self.memories: Dict[str, InMemoryChatMessageHistory] = {}

    def get_memory(self, book_id: str) -> InMemoryChatMessageHistory:
        if book_id not in self.memories:
            self.memories[book_id] = InMemoryChatMessageHistory()
        return self.memories[book_id]

    async def run_query(self, book_id: str, tool_name: str, query_text: Optional[str] = None, difficulty: str = "standard"):
        try:
            # 1. Tool-specific MMR tuning (PRD 16)
            # Lower lambda = more diversity (Summaries/Arcs), Higher = more relevance (QA/Concepts)
            lambda_map = {
                "summary": 0.3,
                "character_arc": 0.4,
                "plot": 0.5,
                "question": 0.7,
                "concept": 0.8,
                "problem": 0.7
            }
            tuning_lambda = lambda_map.get(tool_name, 0.5)

            # 2. Two-stage retrieval (Initial k=30, PRD 15)
            # We fetch 30, then rerank to get the most relevant 8
            retriever = self.db_manager.get_retriever(book_id, k=30, lambda_mult=tuning_lambda)
            
            search_query = query_text if query_text else "Summarize this book and its main themes."
            initial_docs = await retriever.ainvoke(search_query)

            if not initial_docs:
                return {
                    "answer": "No sufficient context found in the book to support this answer.",
                    "sources": []
                }

            # 3. Reranking using FlashRank (PRD 13)
            compressor = FlashrankRerank(top_n=8)
            
            # Since we already have initial_docs, we can just compress them directly to save time
            # or re-invoke via the compression retriever. To be robust with LangChain 1.x:
            docs = compressor.compress_documents(initial_docs, search_query)

            if not docs:
                return {
                    "answer": "No sufficient context found in the book to support this answer.",
                    "sources": []
                }

            # 3. Format context
            context_str = ""
            sources = []
            for i, doc in enumerate(docs):
                chunk_id = f"Chunk {i+1}"
                context_str += f"\n[{chunk_id}]: {doc.page_content}\n"
                sources.append({
                    "chunk_id": chunk_id,
                    "page": doc.metadata.get("page"),
                    "chapter": doc.metadata.get("chapter_title"),
                    "excerpt": doc.page_content[:200] + "..."
                })

            # 4. Get chat history (manual windowing for last 10 messages / 5 turns)
            memory = self.get_memory(book_id)
            all_messages = memory.messages
            chat_history = all_messages[-10:] if len(all_messages) > 10 else all_messages

            # 5. Generate response
            answer = await self.llm_handler.generate_response(
                tool_name=tool_name,
                context=context_str,
                user_input=search_query,
                difficulty=difficulty,
                chat_history=chat_history
            )

            # 6. Save to memory
            memory.add_user_message(search_query)
            memory.add_ai_message(answer)

            return {
                "answer": answer,
                "sources": sources
            }
        except Exception as e:
            return {
                "answer": f"I am currently unable to access the knowledge base for this book due to a system error: {str(e)}",
                "sources": []
            }
