"""
Document text extraction and section segmentation for CV parsing.

Functions:
  - extract_pdf(raw_bytes) -> str: pdfplumber primary, PyPDF2 fallback
  - extract_docx(raw_bytes) -> str: python-docx
  - segment_sections(text) -> dict[str, str]: regex-based section detection
"""

import io
import re


def extract_pdf(raw_bytes: bytes) -> str:
    """
    Extract text from a PDF file.

    Primary: pdfplumber (handles complex layouts better).
    Fallback: PyPDF2 if pdfplumber returns empty text.

    Args:
        raw_bytes: Raw PDF file bytes.

    Returns:
        Extracted text joined with newlines, or empty string if both fail.
    """
    import pdfplumber

    text = ""
    try:
        with pdfplumber.open(io.BytesIO(raw_bytes)) as pdf:
            pages = [page.extract_text() or "" for page in pdf.pages]
            text = "\n".join(pages).strip()
    except Exception:
        pass

    if not text:
        try:
            import PyPDF2

            reader = PyPDF2.PdfReader(io.BytesIO(raw_bytes))
            pages = [page.extract_text() or "" for page in reader.pages]
            text = "\n".join(pages).strip()
        except Exception:
            pass

    return text


def extract_docx(raw_bytes: bytes) -> str:
    """
    Extract text from a DOCX file using python-docx.

    Args:
        raw_bytes: Raw DOCX file bytes.

    Returns:
        Paragraph texts joined with newlines, or empty string on failure.
    """
    try:
        from docx import Document

        doc = Document(io.BytesIO(raw_bytes))
        return "\n".join(para.text for para in doc.paragraphs)
    except Exception:
        return ""


# Maps section keys to their recognised header patterns (case-insensitive)
_SECTION_PATTERNS: dict[str, re.Pattern] = {
    "skills": re.compile(
        r"^\s*(skills|technical\s+skills|core\s+competencies|technologies)\s*$",
        re.IGNORECASE | re.MULTILINE,
    ),
    "experience": re.compile(
        r"^\s*(experience|work\s+experience|employment|professional\s+experience)\s*$",
        re.IGNORECASE | re.MULTILINE,
    ),
    "education": re.compile(
        r"^\s*(education|academic|qualifications|degrees)\s*$",
        re.IGNORECASE | re.MULTILINE,
    ),
}


def segment_sections(text: str) -> dict[str, str]:
    """
    Split CV text into labelled sections using regex header detection.

    Recognised headers (case-insensitive, on their own line):
      - skills:     "skills", "technical skills", "core competencies", "technologies"
      - experience: "experience", "work experience", "employment", "professional experience"
      - education:  "education", "academic", "qualifications", "degrees"
      - other:      everything else / text before any recognised header

    Args:
        text: Full extracted CV text.

    Returns:
        Dict with keys "skills", "experience", "education", "other".
        Each value is the text content under that section (empty string if absent).
    """
    result: dict[str, str] = {"skills": "", "experience": "", "education": "", "other": ""}

    if not text:
        return result

    # Collect all header matches with their positions and section keys
    matches: list[tuple[int, int, str]] = []  # (start, end, section_key)
    for section_key, pattern in _SECTION_PATTERNS.items():
        for m in pattern.finditer(text):
            matches.append((m.start(), m.end(), section_key))

    # Sort by position in document
    matches.sort(key=lambda x: x[0])

    if not matches:
        # No recognised headers — everything goes to "other"
        result["other"] = text
        return result

    # Text before the first header goes to "other"
    first_start = matches[0][0]
    pre_header = text[:first_start].strip()
    if pre_header:
        result["other"] = pre_header

    # Extract content between consecutive headers
    for i, (start, end, section_key) in enumerate(matches):
        next_start = matches[i + 1][0] if i + 1 < len(matches) else len(text)
        content = text[end:next_start].strip()
        # If the same section appears multiple times, concatenate
        if result[section_key]:
            result[section_key] += "\n" + content
        else:
            result[section_key] = content

    return result
