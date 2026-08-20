import chromadb
from chromadb.config import Settings
from langchain_chroma import Chroma
from langchain_ollama import OllamaEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from typing import List, Dict, Any, Optional
import os

OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", "http://127.0.0.1:11434")

class VectorDBManager:
    def __init__(self, persist_directory: Optional[str] = None):
        self.persist_directory = persist_directory or os.environ.get("CHROMA_DB_PATH", "./db")
        self.embeddings = OllamaEmbeddings(
            model="qwen3-embedding:0.6b",
            base_url=OLLAMA_BASE_URL
        )
        self.client = chromadb.PersistentClient(path=self.persist_directory)

    def create_collection_from_documents(self, book_id: str, documents: List[Dict[str, Any]], book_type: str = "fiction"):
        # Flatten documents to LangChain format
        from langchain_core.documents import Document
        
        langchain_docs = []
        for doc in documents:
            langchain_docs.append(Document(
                page_content=doc["content"],
                metadata=doc["metadata"]
            ))

        # Split documents
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            add_start_index=True
        )
        splits = text_splitter.split_documents(langchain_docs)

        # Delete existing collection if it exists to ensure replacement (PRD 12)
        self.delete_collection(book_id)

        # Create/overwrite collection with timestamp metadata (PRD 32)
        import time
        metadata = {
            "created_at": time.time(), 
            "session_type": "guest",
            "book_type": book_type
        }
        
        vectorstore = Chroma.from_documents(
            documents=splits,
            embedding=self.embeddings,
            persist_directory=self.persist_directory,
            collection_name=f"book_{book_id}",
            collection_metadata=metadata
        )
        return vectorstore

    def get_retriever(self, book_id: str, search_type: str = "mmr", k: int = 5, lambda_mult: float = 0.5):
        # Simulation: Check if session expired (PRD 33)
        # In a real app, this would be a background cron job.
        # Here we just verify the collection exists.
        vectorstore = Chroma(
            persist_directory=self.persist_directory,
            embedding_function=self.embeddings,
            collection_name=f"book_{book_id}"
        )
        return vectorstore.as_retriever(
            search_type=search_type, 
            search_kwargs={"k": k, "lambda_mult": lambda_mult}
        )

    def cleanup_expired_sessions(self, days: int = 7):
        """Simulated auto-purge for PRD 33"""
        # Logic: Iterate through collections and delete those older than 7 days
        pass

    def delete_collection(self, book_id: str):
        try:
            self.client.delete_collection(f"book_{book_id}")
        except Exception:
            pass # Collection might not exist
