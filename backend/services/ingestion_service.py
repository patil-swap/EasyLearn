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
    # More specific patterns that are less likely to trigger false positives
    (r'(?i)^(ignore|disregard|forget|override) (all )?(previous|earlier) (instructions|prompts|rules)', True),  # Must match full phrase
    (r'(?i)system prompt override', False),
    (r'(?i)you are now (a )?different (AI|system)', False),
    (r'(?i)previous instructions?.*?(ignore|override)', True),  # Requires both parts
    (r'(?i)forget (all )?(previous|earlier) (instructions|prompts)', True),
    (r'(?i)(from now on|act as|role play) (a )?(different )?(AI|system|assistant)', False),
    (r'(?i)output only (the word|this phrase)', False),
    (r'(?i)send (this|the) (message|text) to (http|email)', False),
    (r'(?i)base64 decode and (execute|run)', False),
    (r'(?i)javascript:.*?(alert|prompt|confirm|eval)', True),
    (r'(?i)(data:application|data:text/html)', False),
]

class IngestionService:

    @staticmethod
    def sanitize_text(text: str) -> str:
        # Step 1: Unicode normalization + remove zero-width / control characters
        text = unicodedata.normalize('NFKC', text)
        text = re.sub(r'[\u200B-\u200D\uFEFF\u2028\u2029]', '', text)
        text = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', text)

        # Step 2: Remove suspicious invisible styling tricks
        text = re.sub(r'style\s*=\s*["\'](?:[^"\']*?(?:font-size:\s*0|color:\s*white|visibility:\s*hidden|display:\s*none)[^"\']*?)["\']', '', text, flags=re.I)
        text = re.sub(r'class\s*=\s*["\'](?:[^"\']*?(?:hidden|invisible)[^"\']*?)["\']', '', text, flags=re.I)

        # Step 3: Pattern-based rejection (fail-fast with better context checking)
        for pattern, require_context in INJECTION_PATTERNS:
            matches = re.finditer(pattern, text, re.IGNORECASE | re.DOTALL)
            for match in matches:
                if require_context:
                    # Check if this appears in a suspicious context
                    start = max(0, match.start() - 100)
                    end = min(len(text), match.end() + 100)
                    context = text[start:end]
                    
                    if any(innocent in context.lower() for innocent in [
                        "example", "sample", "test", "demonstration", 
                        "the user said", "the system said", "the prompt said",
                        "for example", "like this", "such as", "for instance"
                    ]):
                        continue

                    if re.search(r'["\']' + re.escape(match.group(0)) + r'["\']', context, re.I):
                        continue
                
                # If we passed all checks, reject
                raise ValueError(
                    "Potential malicious content detected in uploaded file "
                    "(possible indirect prompt injection attempt). File rejected."
                )
        
        # Remove script/style tags but preserve their content
        text = re.sub(r'<(script|style|iframe|object|embed|form)[^>]*>.*?</\1>', ' ', text, flags=re.DOTALL | re.I)

        return text.strip()

    @staticmethod
    def validate_file(file_path: str, file_format: str) -> None:
        """
        Synchronous pre-flight validation for upload endpoint.
        Raises ValueError with a message matching PRD error codes:
        - BOOK_TOO_LONG for PDF > MAX_PAGES_PDF or EPUB/TXT > MAX_CHARS_EPUB_TXT
        - SCANNED_PDF for image-only PDFs
        """
        format_lower = file_format.lower()

        if format_lower == "pdf":
            doc = fitz.open(file_path)
            try:
                if len(doc) > MAX_PAGES_PDF:
                    raise ValueError(
                        f"Book too long. Maximum supported length is {MAX_PAGES_PDF} pages."
                    )

                sample_pages = min(10, len(doc))
                total_sample_chars = 0
                for i in range(sample_pages):
                    total_sample_chars += len(doc.load_page(i).get_text().strip())

                average_chars_per_page = total_sample_chars / sample_pages
                if average_chars_per_page < 20:
                    raise ValueError(
                        "This PDF appears to be a scanned image. Only text-based PDFs are supported."
                    )
            finally:
                doc.close()

        elif format_lower == "epub":
            book = epub.read_epub(file_path)
            total_chars = 0
            for item in book.get_items():
                if item.get_type() != ebooklib.ITEM_DOCUMENT:
                    continue

                item_name = item.get_name().lower()

                if item_name in EPUB_SKIP_NAMES:
                    continue

                if any(item_name.startswith(prefix) for prefix in EPUB_SKIP_PREFIXES):
                    continue

                soup = BeautifulSoup(item.get_content(), "html.parser")

                for tag in soup(["script", "style"]):
                    tag.decompose()

                text = soup.get_text(separator=" ", strip=True)
                total_chars += len(text)

                if total_chars > MAX_CHARS_EPUB_TXT:
                    raise ValueError(
                        f"Book too long. Maximum supported length is {MAX_CHARS_EPUB_TXT:,} characters."
                    )

        elif format_lower == "txt":
            with open(file_path, "r", encoding="utf-8") as f:
                text = f.read()

            if len(text) > MAX_CHARS_EPUB_TXT:
                raise ValueError(
                    f"Book too long. Maximum supported length is {MAX_CHARS_EPUB_TXT:,} characters."
                )

        else:
            raise ValueError(f"Unsupported file format: {file_format}")

    @staticmethod
    def extract_text_from_pdf(file_path: str) -> List[Dict[str, Any]]:
        doc = fitz.open(file_path)

        # Scanned PDF detection — check first 10 pages and average text per page
        sample_pages = min(10, len(doc))
        total_sample_chars = 0
        for i in range(sample_pages):
            total_sample_chars += len(doc.load_page(i).get_text().strip())
        
        average_chars_per_page = total_sample_chars / sample_pages
        if average_chars_per_page < 20:
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

            if len(raw_text) < 10:  # Skip nearly empty pages
                continue
                
            try:
                clean_text = IngestionService.sanitize_text(raw_text)
            except ValueError as e:
                # Add context but don't reject the whole file for a single page
                print(f"Warning: Security check failed on page {page_num+1}: {str(e)}")
                # Skip this page and continue with others
                continue

            if clean_text and len(clean_text) > 50:  # Only include pages with meaningful content
                pages.append({
                    "content": clean_text,
                    "metadata": {"page": page_num + 1}
                })

        if not pages:
            raise ValueError("No readable text content found in this PDF.")
            
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

            if len(text) < 50:  # Skip very short chapters
                continue
                
            try:
                clean_text = IngestionService.sanitize_text(text)
            except ValueError as e:
                # Log warning but don't reject the entire book
                print(f"Warning: Security rejection in EPUB chapter '{item.get_name()}': {str(e)}")
                continue

            if clean_text and len(clean_text) < 100:
                continue

            # Character count limit
            total_chars += len(clean_text)
            if total_chars > MAX_CHARS_EPUB_TXT:
                raise ValueError(
                    f"Book too long. Maximum supported length is {MAX_CHARS_EPUB_TXT:,} characters."
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
                f"Book too long. Maximum supported length is {MAX_CHARS_EPUB_TXT:,} characters."
            )

        return [{"content": clean_text, "metadata": {}}]

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
            
            if not docs:
                raise ValueError("No readable content found in the uploaded file.")
                
            return {
                "documents": docs,
                "cover_data": cover_data
            }
        except ValueError as ve:
            raise RuntimeError(f"File rejected: {str(ve)}")
        except Exception as e:
            raise RuntimeError(f"Could not process {file_format} file: {str(e)}")
