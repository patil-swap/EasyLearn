import fitz  # PyMuPDF
import ebooklib
from ebooklib import epub
from bs4 import BeautifulSoup
import os
import base64
import re
import unicodedata
from typing import List, Dict, Any, Optional

MAX_PAGES_PDF = 1000
MAX_CHARS_EPUB_TXT = 1_500_000

EPUB_SKIP_NAMES = {"nav.xhtml", "toc.xhtml", "cover.xhtml", "title.xhtml", "copyright.xhtml", "dedication.xhtml"}
EPUB_SKIP_PREFIXES = ("css/", "styles/", "fonts/", "images/")
INJECTION_PATTERNS = [
    r'(?i)(ignore|disregard|forget|override|new\s+instructions?|you\s+are\s+now|system\s+prompt)',
    r'(?i)(previous\s+(instructions?|prompts?|rules?|context))',
    r'(?i)(from\s+now\s+on|act\s+as|role\s+play|become)',
    r'(?i)(output\s+only|respond\s+with|print\s+the\s+following)',
    r'(?i)(secret|override|admin|backdoor|leak|send\s+to|email|http)',
    r'(?i)(base64|data:application|javascript:|eval\()',
    r'(?i)(white\s+text|hidden|invisible|font-size:0|color:\s*white|display:\s*none)',
]

class IngestionService:

    @staticmethod
    def sanitize_text(text: str) -> str:
        # Step 1: Unicode normalization + remove zero-width / control characters
        text = unicodedata.normalize('NFKC', text)
        text = re.sub(r'[\u200B-\u200D\uFEFF\u2028\u2029]', '', text)
        text = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', text)

        # Step 2: Remove suspicious invisible / styling tricks often used in PDFs
        text = re.sub(r'(?i)(font-size:\s*0|color:\s*white|visibility:\s*hidden|display:\s*none)', '', text)

        # Step 3: Pattern-based rejection (fail-fast)
        for pattern in INJECTION_PATTERNS:
            if re.search(pattern, text):
                raise ValueError(
                    "Potential malicious content detected in uploaded file "
                    "(possible indirect prompt injection attempt). File rejected."
                )
        text = re.sub(r'<(script|style|iframe|object|embed|form)[^>]*>.*?</\1>', '', text, flags=re.DOTALL | re.I)

        return text.strip()

    @staticmethod
    def extract_text_from_pdf(file_path: str) -> List[Dict[str, Any]]:
        doc = fitz.open(file_path)

        # Scanned PDF detection — check first 5 pages for extractable text
        sample_pages = min(5, len(doc))
        sample_text = "".join(doc.load_page(i).get_text() for i in range(sample_pages))
        if len(sample_text.strip()) == 0:
            raise ValueError(
                "This PDF appears to be a scanned image. Only text-based PDFs are supported."
            )

        # Page count limit
        if len(doc) > MAX_PAGES_PDF:
            raise ValueError(
                f"Book too long. Maximum supported length is {MAX_PAGES_PDF} pages."
            )

        pages = []
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            raw_text = page.get_text("text").strip()

            try:
                clean_text = IngestionService.sanitize_text(raw_text)
            except ValueError as e:
                raise ValueError(f"Security rejection on page {page_num+1}: {str(e)}")

            if len(clean_text) < 50:
                continue
            pages.append({
                "content": clean_text,
                "metadata": {"page": page_num + 1}
            })

        return pages

    @staticmethod
    def extract_text_from_epub(file_path: str) -> List[Dict[str, Any]]:
        book = epub.read_epub(file_path)
        chapters = []
        total_chars = 0

        # Try to extract real chapter titles from the TOC
        toc_titles = {}
        for item in book.toc:
            try:
                if hasattr(item, "href") and hasattr(item, "title"):
                    toc_titles[item.href.split("#")[0]] = item.title
            except Exception:
                pass

        for item in book.get_items():
            if item.get_type() != ebooklib.ITEM_DOCUMENT:
                continue

            item_name = item.get_name().lower()

            # Skip known junk files by name
            if item_name in EPUB_SKIP_NAMES:
                continue

            # Skip known junk files by path prefix
            if any(item_name.startswith(prefix) for prefix in EPUB_SKIP_PREFIXES):
                continue

            soup = BeautifulSoup(item.get_content(), "html.parser")

            # Remove script and style tags before extracting text
            for tag in soup(["script", "style"]):
                tag.decompose()

            text = soup.get_text(separator=" ", strip=True)

            try:
                clean_text = IngestionService.sanitize_text(text)
            except ValueError as e:
                raise ValueError(f"Security rejection in EPUB chapter '{item.get_name()}': {str(e)}")

            if len(clean_text) < 100:
                continue

            # Character count limit
            total_chars += len(text)
            if total_chars > MAX_CHARS_EPUB_TXT:
                raise ValueError(
                    "Book too long. Maximum supported length is 1,500,000 characters."
                )

            # Use TOC title if available, fall back to item name
            chapter_title = toc_titles.get(item.get_name(), item.get_name())

            chapters.append({
                "content": clean_text,
                "metadata": {"chapter_title": chapter_title}
            })

        if not chapters:
            raise ValueError(
                "No readable text content found in this EPUB file."
            )

        return chapters

    @staticmethod
    def extract_text_from_txt(file_path: str) -> List[Dict[str, Any]]:
        with open(file_path, "r", encoding="utf-8") as f:
            text = f.read()

        try:
            clean_text = IngestionService.sanitize_text(text)
        except ValueError as e:
            raise ValueError(f"Security rejection in TXT file: {str(e)}")

        if len(clean_text.strip()) == 0:
            raise ValueError("The uploaded TXT file appears to be empty.")

        if len(clean_text) > MAX_CHARS_EPUB_TXT:
            raise ValueError(
                "Book too long. Maximum supported length is 1,500,000 characters."
            )

        return [{"content": text, "metadata": {}}]

    @staticmethod
    def extract_cover_from_pdf(file_path: str) -> Optional[str]:
        try:
            doc = fitz.open(file_path)
            if len(doc) == 0:
                return None
            page = doc.load_page(0)
            pix = page.get_pixmap(matrix=fitz.Matrix(0.5, 0.5)) # low res for thumbnail
            img_data = pix.tobytes("png")
            return base64.b64encode(img_data).decode("utf-8")
        except Exception:
            return None

    @staticmethod
    def extract_cover_from_epub(file_path: str) -> Optional[str]:
        try:
            book = epub.read_epub(file_path)
            # Try to find cover in metadata
            cover_item = None
            
            # Method 1: Get cover from metadata
            cover_id = None
            for name, value in book.get_metadata('OPF', 'cover'):
                cover_id = value
                break
            
            if cover_id:
                cover_item = book.get_item_with_id(cover_id)
            
            # Method 2: Look for items with 'cover' in name
            if not cover_item:
                for item in book.get_items():
                    if item.get_type() == ebooklib.ITEM_IMAGE and "cover" in item.get_name().lower():
                        cover_item = item
                        break
            
            if cover_item:
                return base64.b64encode(cover_item.get_content()).decode("utf-8")
            return None
        except Exception:
            return None

    @classmethod
    def process_file(cls, file_path: str, file_format: str) -> Dict[str, Any]:
        format_lower = file_format.lower()
        try:
            docs = []
            cover_data = None
            if format_lower == "pdf":
                docs = cls.extract_text_from_pdf(file_path)
                cover_data = cls.extract_cover_from_pdf(file_path)
            elif format_lower == "epub":
                docs = cls.extract_text_from_epub(file_path)
                cover_data = cls.extract_cover_from_epub(file_path)
            elif format_lower == "txt":
                docs = cls.extract_text_from_txt(file_path)
            else:
                raise ValueError(f"Unsupported file format: {file_format}")
            
            return {
                "documents": docs,
                "cover_data": cover_data
            }
        except ValueError as ve:
            raise RuntimeError(f"File rejected: {str(ve)}")
        except Exception as e:
            raise RuntimeError(f"Could not process {file_format} file: {str(e)}")