import fitz  # PyMuPDF
import ebooklib
from ebooklib import epub
from bs4 import BeautifulSoup
import os
from typing import List, Dict, Any

class IngestionService:
    @staticmethod
    def extract_text_from_pdf(file_path: str) -> List[Dict[str, Any]]:
        doc = fitz.open(file_path)
        pages = []
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            text = page.get_text()
            pages.append({
                "content": text,
                "metadata": {"page": page_num + 1}
            })
        return pages

    @staticmethod
    def extract_text_from_epub(file_path: str) -> List[Dict[str, Any]]:
        book = epub.read_epub(file_path)
        chapters = []
        for item in book.get_items():
            if item.get_type() == ebooklib.ITEM_DOCUMENT:
                soup = BeautifulSoup(item.get_content(), "html.parser")
                text = soup.get_text()
                chapters.append({
                    "content": text,
                    "metadata": {"chapter_title": item.get_name()}
                })
        return chapters

    @staticmethod
    def extract_text_from_txt(file_path: str) -> List[Dict[str, Any]]:
        with open(file_path, "r", encoding="utf-8") as f:
            text = f.read()
        return [{"content": text, "metadata": {}}]

    @classmethod
    def process_file(cls, file_path: str, file_format: str) -> List[Dict[str, Any]]:
        format_lower = file_format.lower()
        try:
            if format_lower == "pdf":
                return cls.extract_text_from_pdf(file_path)
            elif format_lower == "epub":
                return cls.extract_text_from_epub(file_path)
            elif format_lower == "txt":
                return cls.extract_text_from_txt(file_path)
            else:
                raise ValueError(f"Unsupported file format: {file_format}")
        except Exception as e:
            raise RuntimeError(f"Could not parse {file_format} file: {str(e)}")
