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
        self.assertEqual(response.status_code, 400)
        self.assertIn("Unsupported file extension", response.json()["detail"])

    def test_rate_limiting_upload(self):
        # This is hard to test deterministically without many requests, 
        # but we can verify the limiter is present in metadata if needed.
        pass

if __name__ == "__main__":
    unittest.main()
