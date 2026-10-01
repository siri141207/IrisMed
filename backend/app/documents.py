import hashlib
import json
import re
from pathlib import Path

import fitz

from .ai import extract_report_from_file
from .config import UPLOAD_DIR
from .models import Document, DocumentChunk
from .rag import create_embedding

ALLOWED_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/png",
}


def safe_filename(filename: str) -> str:
    clean = re.sub(r"[^a-zA-Z0-9._-]", "_", filename)
    digest = hashlib.sha256(filename.encode()).hexdigest()[:12]
    return f"{digest}_{clean[:180]}"


def extract_pdf_pages(path: Path):
    with fitz.open(path) as pdf:
        return [
            {"page": index + 1, "text": page.get_text("text").strip()}
            for index, page in enumerate(pdf)
        ]


def _report_context(extracted) -> str:
    payload = extracted.model_dump()
    lines = [f"Document type: {payload.get('document_type')}"]
    if payload.get("patient_name"):
        lines.append(f"Patient name: {payload['patient_name']}")
    if payload.get("examination_date"):
        lines.append(f"Examination date: {payload['examination_date']}")
    prescription = payload.get("prescription", {})
    for eye, label in (("right", "Right"), ("left", "Left")):
        for field in ("sph", "cyl", "axis", "visual_acuity"):
            value = prescription.get(f"{eye}_{field}", {}).get("value")
            if value:
                lines.append(f"{label} {field.upper()}: {value}")
    for key in ("findings", "medications", "doctor_recommendations"):
        for item in payload.get(key, []):
            lines.append(f"{key.replace('_', ' ').title()}: {item}")
    if payload.get("follow_up"):
        lines.append(f"Follow-up: {payload['follow_up']}")
    if payload.get("summary"):
        lines.append(f"Summary: {payload['summary']}")
    return "\n".join(lines)


def _split_text(text: str, max_chars: int = 2200):
    text = re.sub(r"\s+", " ", text).strip()
    if not text:
        return []
    chunks = []
    start = 0
    while start < len(text):
        end = min(start + max_chars, len(text))
        if end < len(text):
            boundary = text.rfind(" ", start, end)
            if boundary > start + 700:
                end = boundary
        chunks.append(text[start:end].strip())
        start = end
    return chunks


def process_document(db, document: Document, path: Path):
    raw = path.read_bytes()
    pdf_pages = extract_pdf_pages(path) if document.mime_type == "application/pdf" else []
    actual_page_count = len(pdf_pages) if pdf_pages else 1

    extracted = extract_report_from_file(raw, document.mime_type)
    document.document_type = extracted.document_type or "Unknown"
    document.page_count = actual_page_count
    document.extracted_json = extracted.model_dump_json()

    db.query(DocumentChunk).filter(DocumentChunk.document_id == document.id).delete()

    chunks = []
    if pdf_pages:
        for page in pdf_pages:
            for part in _split_text(page["text"]):
                chunks.append({"page": page["page"], "text": part})

    if not chunks:
        chunks = [{"page": 1, "text": _report_context(extracted)}]

    for item in chunks:
        embedding = create_embedding(item["text"])
        db.add(
            DocumentChunk(
                document_id=document.id,
                page_number=item["page"],
                content=item["text"],
                embedding=json.dumps(embedding) if embedding else None,
            )
        )

    document.status = "processed"
    db.commit()
    db.refresh(document)
    return extracted
