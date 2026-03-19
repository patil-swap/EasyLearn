import unittest
from backend.services.vector_db_manager import VectorDBManager
from langchain_core.documents import Document
import os

class TestVectorDB(unittest.TestCase):
    def setUp(self):
        self.db_manager = VectorDBManager()
        self.test_book_id = "test_logic_book"

    def test_collection_lifecycle(self):
        # Create a collection from dummy docs
        docs = [
            {"content": "This is chunk 1", "metadata": {"page": 1}},
            {"content": "This is chunk 2", "metadata": {"page": 2}}
        ]
        
        # Test collection creation
        try:
            self.db_manager.create_collection_from_documents(self.test_book_id, docs)
            
            # Test retriever retrieval
            retriever = self.db_manager.get_retriever(self.test_book_id, k=1)
            results = retriever.invoke("chunk 1")
            
            self.assertGreater(len(results), 0)
            self.assertIn("chunk 1", results[0].page_content)
        finally:
            # Cleanup Chroma (optional for ephemeral, but good practice)
            pass

if __name__ == "__main__":
    unittest.main()
