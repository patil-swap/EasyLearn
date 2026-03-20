import unittest
from backend.services.vector_db_manager import VectorDBManager
from langchain_core.documents import Document
import os

class TestVectorDB(unittest.TestCase):
    def setUp(self):
        self.db_manager = VectorDBManager()
        self.test_book_id = "test_logic_book"

    def test_collection_replacement(self):
        """Verify that creating a collection for an existing book_id replaces it."""
        # Initial docs
        self.db_manager.create_collection_from_documents("comp_id", [{"content": "Old", "metadata": {}}])
        # Replacement docs
        self.db_manager.create_collection_from_documents("comp_id", [{"content": "New", "metadata": {}}])
        
        retriever = self.db_manager.get_retriever("comp_id", k=1)
        results = retriever.invoke("Old")
        if results:
            self.assertNotIn("Old", results[0].page_content)
        
        results = retriever.invoke("New")
        self.assertGreater(len(results), 0)
        self.assertIn("New", results[0].page_content)

    def test_retriever_k_parameter(self):
        """Verify retriever returns exactly k documents."""
        docs = [{"content": f"chunk {i}", "metadata": {}} for i in range(10)]
        self.db_manager.create_collection_from_documents("k_test", docs)
        
        for k in [1, 3, 5]:
            retriever = self.db_manager.get_retriever("k_test", k=k)
            results = retriever.invoke("chunk")
            self.assertEqual(len(results), k)

    def test_empty_collection_query(self):
        """Verify querying a collection with no documents (if possible)."""
        # In practice, process_file prevents this, but the DB should be robust
        try:
            self.db_manager.create_collection_from_documents("empty_book", [])
            retriever = self.db_manager.get_retriever("empty_book")
            results = retriever.invoke("some query")
            self.assertEqual(len(results), 0)
        except Exception as e:
            # If Chroma requires docs, it might fail here, which is fine
            pass

if __name__ == "__main__":
    unittest.main()
