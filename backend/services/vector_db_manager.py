import chromadb
from chromadb.config import Settings
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_text_splitters import RecursiveCharacterTextSplitter
from typing import List, Dict, Any
import os

class VectorDBManager:
    def __init__(self, persist_directory: str = "db"):
        self.persist_directory = persist_directory
        self.embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        self.client = chromadb.PersistentClient(path=persist_directory)

    def create_collection_from_documents(self, book_id: str, documents: List[Dict[str, Any]]):
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

        # Create/overwrite collection
        vectorstore = Chroma.from_documents(
            documents=splits,
            embedding=self.embeddings,
            persist_directory=self.persist_directory,
            collection_name=f"book_{book_id}"
        )
        return vectorstore

    def get_retriever(self, book_id: str, search_type: str = "mmr", k: int = 5):
        vectorstore = Chroma(
            persist_directory=self.persist_directory,
            embedding_function=self.embeddings,
            collection_name=f"book_{book_id}"
        )
        return vectorstore.as_retriever(search_type=search_type, search_kwargs={"k": k})

    def delete_collection(self, book_id: str):
        try:
            self.client.delete_collection(f"book_{book_id}")
        except Exception:
            pass # Collection might not exist
