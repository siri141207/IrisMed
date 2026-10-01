import json
import math
import re

from .ai import client
from .config import settings
from .models import DocumentChunk


def create_embedding(text: str):
    if client is None or not text.strip():
        return None
    try:
        result = client.models.embed_content(
            model=settings.embedding_model,
            contents=text,
        )
        return result.embeddings[0].values
    except Exception:
        return None


def cosine_similarity(a, b):
    if not a or not b:
        return 0.0
    length = min(len(a), len(b))
    if length == 0:
        return 0.0
    a, b = a[:length], b[:length]
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(x * x for x in b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def lexical_score(question: str, content: str) -> float:
    q_words = set(re.findall(r"[a-zA-Z0-9]+", question.lower()))
    c_words = set(re.findall(r"[a-zA-Z0-9]+", content.lower()))
    if not q_words or not c_words:
        return 0.0
    return len(q_words & c_words) / len(q_words)


def retrieve_chunks(db, document_id: int, question: str, top_k: int = 6):
    chunks = (
        db.query(DocumentChunk)
        .filter(DocumentChunk.document_id == document_id)
        .all()
    )
    if not chunks:
        return []

    query_embedding = create_embedding(question)
    scored = []
    for chunk in chunks:
        semantic = 0.0
        if chunk.embedding:
            try:
                semantic = cosine_similarity(
                    query_embedding,
                    json.loads(chunk.embedding),
                )
            except (TypeError, ValueError, json.JSONDecodeError):
                semantic = 0.0
        lexical = lexical_score(question, chunk.content)
        score = max(semantic, lexical * 0.75)
        scored.append((score, chunk))

    scored.sort(key=lambda item: item[0], reverse=True)
    return scored[:top_k]
