import json
import time

from google import genai
from google.genai import types

from .config import settings
from .schemas import ExtractedReport


if not settings.gemini_api_key:
    client = None
else:
    client = genai.Client(api_key=settings.gemini_api_key)

PRIMARY_MODEL = settings.gemini_model
FALLBACK_MODELS = ["gemini-3.8-flash", "gemini-3.5-flash-lite"]


def _temporary_error(exc: Exception) -> bool:
    message = str(exc).lower()
    return any(
        token in message
        for token in (
            "503",
            "unavailable",
            "high demand",
            "overloaded",
            "429",
            "resource exhausted",
            "rate limit",
            "500 internal",
        )
    )


def generate_with_fallback(contents, config=None):
    if client is None:
        raise RuntimeError("Gemini API key is not configured in backend/.env.")

    models = []
    for model in [PRIMARY_MODEL, *FALLBACK_MODELS]:
        if model and model not in models:
            models.append(model)

    last_error = None
    for model in models:
        for attempt in range(3):
            try:
                return client.models.generate_content(
                    model=model,
                    contents=contents,
                    config=config,
                )
            except Exception as exc:
                last_error = exc
                if not _temporary_error(exc):
                    raise
                if attempt < 2:
                    time.sleep(1.5 * (attempt + 1))

    raise RuntimeError(
        "The AI service is temporarily unavailable. Please try again in a moment."
    ) from last_error


EXTRACTION_PROMPT = """
You are the extraction engine for IrisMed, an eye-record understanding application.

Analyze the supplied document and extract ONLY information visibly present in it.
This is a medical-record organization task, not a diagnosis task.

Rules:
- Never invent, estimate, normalize, or clinically interpret a missing value.
- Preserve prescription signs, decimals, units, and right/left eye labels exactly.
- Keep dates as written when possible.
- If a field is absent, return null or an empty list.
- Do not convert a blank prescription cell into zero.
- Findings must be copied/paraphrased only from the record.
- Do not create a diagnosis from symptoms or measurements.
- Put page numbers in pages_found when information is found on that page.
- For prescription field page values, use the page where that exact value appears.
- The summary must be factual and describe the document, not assess the patient.

Extract:
1. document type
2. patient name if visible
3. examination date
4. right and left SPH/CYL/AXIS
5. right and left visual acuity
6. findings
7. medications
8. follow-up instruction
9. doctor recommendations
10. short factual summary
11. source page numbers
"""


def extract_report_from_file(file_bytes: bytes, mime_type: str) -> ExtractedReport:
    if client is None:
        raise RuntimeError("Gemini API key is not configured in backend/.env.")

    response = generate_with_fallback(
        contents=[
            types.Part.from_text(text=EXTRACTION_PROMPT),
            types.Part.from_bytes(data=file_bytes, mime_type=mime_type),
        ],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=ExtractedReport,
            temperature=0,
        ),
    )

    if getattr(response, "parsed", None):
        return response.parsed

    text = (response.text or "").strip()
    if not text:
        raise RuntimeError("The AI service returned an empty extraction response.")

    return ExtractedReport.model_validate(json.loads(text))


def answer_question(question: str, context: str, language: str = "English") -> str:
    prompt = f"""
You are IrisMed, a careful document-understanding assistant for eye records.

Answer the user's question using the document context below.

Rules:
- Use the supplied record as the source of truth for record-specific facts.
- Never invent a value or claim that a missing value exists.
- Explain terms in simple language suitable for a teenager.
- Do not diagnose or prescribe treatment.
- Do not advise changing medication.
- If the answer is not in the record, say that clearly, then optionally give a brief general explanation when useful.
- If a number/sign is ambiguous, tell the user to verify the original document.
- Mention source page numbers when the context provides them.
- Answer in {language}. Keep medical terms such as SPH, CYL and AXIS unchanged.

DOCUMENT CONTEXT:
{context}

USER QUESTION:
{question}
"""
    response = generate_with_fallback(contents=prompt)
    return (response.text or "").strip()
