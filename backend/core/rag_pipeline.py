from backend.core.llm_handler import LLMHandler
from backend.services.vector_db_manager import VectorDBManager
from langchain_core.chat_history import InMemoryChatMessageHistory
from typing import List, Dict, Any, Optional

class RAGPipeline:
    def __init__(self, db_manager: VectorDBManager, llm_handler: LLMHandler):
        self.db_manager = db_manager
        self.llm_handler = llm_handler
        self.memories: Dict[str, InMemoryChatMessageHistory] = {}

    def get_memory(self, book_id: str) -> InMemoryChatMessageHistory:
        if book_id not in self.memories:
            self.memories[book_id] = InMemoryChatMessageHistory(k=5, memory_key="chat_history", return_messages=True)
        return self.memories[book_id]

    async def run_query(self, book_id: str, tool_name: str, query_text: Optional[str] = None, difficulty: str = "standard"):
        try:
            # 1. Setup retriever
            retriever = self.db_manager.get_retriever(book_id, k=8)
            
            # 2. Retrieve documents
            search_query = query_text if query_text else "Summarize this book and its main themes."
            docs = await retriever.ainvoke(search_query)

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

            # 4. Get chat history
            memory = self.get_memory(book_id)
            chat_history = memory.load_memory_variables({})["chat_history"]

            # 5. Generate response
            answer = await self.llm_handler.generate_response(
                tool_name=tool_name,
                context=context_str,
                user_input=search_query,
                difficulty=difficulty,
                chat_history=chat_history
            )

            # 6. Save to memory
            memory.save_context({"input": search_query}, {"output": answer})

            return {
                "answer": answer,
                "sources": sources
            }
        except Exception as e:
            return {
                "answer": f"I am currently unable to access the knowledge base for this book due to a system error: {str(e)}",
                "sources": []
            }
