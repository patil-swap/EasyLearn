from fastapi.testclient import TestClient
from backend.main import app
import unittest
import os
import shutil
import io

client = TestClient(app)

class TestEasyLearnAPI(unittest.TestCase):
    def setUp(self):
        self.upload_dir = "uploads"
        if not os.path.exists(self.upload_dir):
            os.makedirs(self.upload_dir)

    def test_health_check(self):
        response = client.get("/")
        # If no root endpoint, this might 404, but let's check basic connectivity
        self.assertIn(response.status_code, [200, 404])

    def test_upload_invalid_file(self):
        # Test missing book_type or file_format
        files = {"file": ("test.txt", io.BytesIO(b"content"), "text/plain")}
        data = {"book_type": "educational"} # Missing file_format
        response = client.post("/api/v1/books/upload", files=files, data=data)
        self.assertEqual(response.status_code, 422) # Validation Error

    def test_upload_unsupported_extension(self):
        files = {"file": ("test.exe", io.BytesIO(b"content"), "application/x-msdownload")}
        data = {"book_type": "educational", "file_format": "txt"}
        response = client.post("/api/v1/books/upload", files=files, data=data)
        self.assertEqual(response.status_code, 422)
        resp_json = response.json()
        self.assertEqual(resp_json["code"], "INVALID_FORMAT")
        self.assertIn("Unsupported file extension", resp_json["message"])

    def test_upload_file_too_large(self):
        """Verify 50MB limit rejection (413)."""
        # Create a large payload (slightly over 50MB)
        large_content = b"0" * (51 * 1024 * 1024)
        files = {"file": ("huge.txt", io.BytesIO(large_content), "text/plain")}
        data = {"book_type": "educational", "file_format": "txt"}
        response = client.post("/api/v1/books/upload", files=files, data=data)
        self.assertEqual(response.status_code, 413)
        self.assertEqual(response.json()["code"], "FILE_TOO_LARGE")

    @unittest.mock.patch("backend.api.v1.endpoints_books.process_book_background")
    def test_valid_txt_upload(self, mock_process):
        """Verify valid TXT upload returns book_id."""
        files = {"file": ("book.txt", io.BytesIO(b"Valid content"), "text/plain")}
        data = {"book_type": "fiction", "file_format": "txt"}
        response = client.post("/api/v1/books/upload", files=files, data=data)
        self.assertEqual(response.status_code, 200)
        self.assertIn("book_id", response.json())
        mock_process.assert_called_once()

    @unittest.mock.patch("backend.core.rag_pipeline.RAGPipeline.run_query")
    def test_query_routing(self, mock_run_query):
        """Verify query endpoint routes to all 6 tools correctly."""
        tools = ["summary", "question", "character_arc", "plot", "concept", "problem"]
        mock_run_query.return_value = {"answer": "Mocked", "sources": []}

        mock_collection = unittest.mock.MagicMock()
        mock_collection.metadata = {"book_type": "fiction"}

        with unittest.mock.patch("backend.api.v1.endpoints_query.db_manager.client") as mock_client:
            mock_client.get_collection.return_value = mock_collection
            for tool in tools:
                payload = {
                    "book_id": "test_id",
                    "tool_name": tool,
                    "query_text": "What is AI?",
                    "difficulty_level": "standard"
                }
                response = client.post("/api/v1/query/", json=payload)
                self.assertEqual(response.status_code, 200)

    def test_query_invalid_book(self):
        """Verify 404 for non-existent book."""
        with unittest.mock.patch("backend.api.v1.endpoints_query.db_manager.client") as mock_client:
            mock_client.get_collection.side_effect = Exception("Collection not found")
            payload = {
                "book_id": "non_existent_id",
                "tool_name": "summary",
                "query_text": "Help",
                "difficulty_level": "standard"
            }
            response = client.post("/api/v1/query/", json=payload)
            self.assertEqual(response.status_code, 404)
            self.assertIn("Book not found", response.json()["detail"])

    def test_feature_inapplicability(self):
        """Verify character_arc on educational book returns inapplicability message."""
        mock_collection = unittest.mock.MagicMock()
        mock_collection.metadata = {"book_type": "educational"}

        with unittest.mock.patch("backend.api.v1.endpoints_query.db_manager.client") as mock_client:
            mock_client.get_collection.return_value = mock_collection
            payload = {
                "book_id": "math_book_id",
                "tool_name": "character_arc",
                "query_text": "What is the arc?",
                "difficulty_level": "standard"
            }
            response = client.post("/api/v1/query/", json=payload)
            self.assertEqual(response.status_code, 200)
            self.assertIn("not applicable to educational content", response.text)

if __name__ == "__main__":
    unittest.main()
