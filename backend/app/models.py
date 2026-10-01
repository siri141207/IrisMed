from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text

from .database import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    original_name = Column(String(255), nullable=False)
    stored_name = Column(String(255), nullable=False)
    mime_type = Column(String(100), nullable=False)
    file_size = Column(Integer, nullable=False)
    status = Column(String(30), default="processing", nullable=False)
    document_type = Column(String(100), default="Unknown")
    page_count = Column(Integer, default=0)
    extracted_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False, index=True)
    page_number = Column(Integer, default=1, index=True)
    content = Column(Text, nullable=False)
    embedding = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
