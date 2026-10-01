import json
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from .ai import answer_question
from .config import UPLOAD_DIR, settings
from .database import get_db
from .documents import ALLOWED_TYPES, process_document, safe_filename
from .models import Document, DocumentChunk
from .rag import retrieve_chunks
from .schemas import ChatRequest

router = APIRouter(prefix="/api")


def _serialize_document(document: Document):
    return {
        "id": document.id,
        "name": document.original_name,
        "type": document.document_type or "Unknown",
        "status": document.status,
        "pages": document.page_count or 0,
        "date": document.created_at.isoformat() if document.created_at else None,
        "mime_type": document.mime_type,
        "size": document.file_size,
    }


@router.get("/health")
def health():
    return {
        "status": "ok",
        "service": "IrisMed API",
        "ai_configured": bool(settings.gemini_api_key),
    }


@router.post("/documents/upload")
async def upload_document(file: UploadFile = File(...), db: Session = Depends(get_db)):
    mime_type = file.content_type or ""
    if mime_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Only PDF, JPG and PNG files are supported.")

    contents = await file.read()
    max_bytes = settings.max_file_size_mb * 1024 * 1024
    if not contents:
        raise HTTPException(status_code=400, detail="The selected file is empty.")
    if len(contents) > max_bytes:
        raise HTTPException(status_code=400, detail=f"File must be smaller than {settings.max_file_size_mb} MB.")

    stored_name = safe_filename(file.filename or "document")
    path = UPLOAD_DIR / stored_name
    path.write_bytes(contents)

    document = Document(
        original_name=file.filename or "document",
        stored_name=stored_name,
        mime_type=mime_type,
        file_size=len(contents),
        status="processing",
    )
    db.add(document)
    db.commit()
    db.refresh(document)

    try:
        extracted = process_document(db, document, path)
        return {
            **_serialize_document(document),
            "document_type": document.document_type,
            "page_count": document.page_count,
            "extracted": extracted.model_dump(),
        }
    except Exception as exc:
        document.status = "failed"
        db.commit()
        if path.exists():
            path.unlink()
        message = str(exc)
        if any(token in message.lower() for token in ("503", "unavailable", "high demand", "overloaded", "429", "rate limit")):
            raise HTTPException(status_code=503, detail="IrisMed's AI service is temporarily busy. Your file was not saved as a processed record. Please try again.")
        raise HTTPException(status_code=500, detail=f"Document processing failed: {message}")


@router.get("/documents")
def get_documents(db: Session = Depends(get_db)):
    return [_serialize_document(d) for d in db.query(Document).order_by(Document.created_at.desc()).all()]


@router.get("/documents/{document_id}")
def get_document(document_id: int, db: Session = Depends(get_db)):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found.")
    extracted = json.loads(document.extracted_json) if document.extracted_json else None
    return {**_serialize_document(document), "created_at": document.created_at.isoformat() if document.created_at else None, "extracted": extracted}


@router.get("/documents/{document_id}/file")
def get_document_file(document_id: int, db: Session = Depends(get_db)):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found.")
    path = UPLOAD_DIR / Path(document.stored_name).name
    if not path.exists():
        raise HTTPException(status_code=404, detail="Original file is no longer available.")
    return FileResponse(path, media_type=document.mime_type, filename=document.original_name, content_disposition_type="inline")


@router.post("/chat")
def chat(request: ChatRequest, db: Session = Depends(get_db)):
    document = db.query(Document).filter(Document.id == request.document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found.")
    if document.status != "processed":
        raise HTTPException(status_code=409, detail="This record is not ready for questions yet.")

    results = retrieve_chunks(db, request.document_id, request.question)
    context_parts = []
    sources = []
    for score, chunk in results:
        context_parts.append(f"[Page {chunk.page_number}]\n{chunk.content}")
        sources.append({"page": chunk.page_number, "score": round(score, 3)})

    if document.extracted_json:
        extracted = json.loads(document.extracted_json)
        if not context_parts:
            context_parts.append("[Extracted record]\n" + json.dumps(extracted, ensure_ascii=False, indent=2))
            pages = extracted.get("pages_found") or [1]
            sources = [{"page": pages[0], "score": 1.0}]

    if not context_parts:
        raise HTTPException(status_code=422, detail="IrisMed could not find enough readable information in this record to answer that question.")

    answer = answer_question(request.question, "\n\n".join(context_parts), request.language)
    return {"answer": answer, "sources": sources}


@router.delete("/documents/{document_id}")
def delete_document(document_id: int, db: Session = Depends(get_db)):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found.")

    path = UPLOAD_DIR / Path(document.stored_name).name
    if path.exists():
        path.unlink()
    db.query(DocumentChunk).filter(DocumentChunk.document_id == document_id).delete()
    db.delete(document)
    db.commit()
    return {"message": "Document deleted successfully."}
