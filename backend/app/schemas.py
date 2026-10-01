from typing import Optional

from pydantic import BaseModel, Field


class EyeValue(BaseModel):
    value: Optional[str] = None
    page: Optional[int] = None
    confidence: Optional[float] = None


class EyePrescription(BaseModel):
    right_sph: EyeValue = Field(default_factory=EyeValue)
    right_cyl: EyeValue = Field(default_factory=EyeValue)
    right_axis: EyeValue = Field(default_factory=EyeValue)
    left_sph: EyeValue = Field(default_factory=EyeValue)
    left_cyl: EyeValue = Field(default_factory=EyeValue)
    left_axis: EyeValue = Field(default_factory=EyeValue)
    right_visual_acuity: EyeValue = Field(default_factory=EyeValue)
    left_visual_acuity: EyeValue = Field(default_factory=EyeValue)


class ExtractedReport(BaseModel):
    document_type: str = "Unknown"
    patient_name: Optional[str] = None
    examination_date: Optional[str] = None
    prescription: EyePrescription = Field(default_factory=EyePrescription)
    findings: list[str] = Field(default_factory=list)
    medications: list[str] = Field(default_factory=list)
    follow_up: Optional[str] = None
    doctor_recommendations: list[str] = Field(default_factory=list)
    summary: str = ""
    pages_found: list[int] = Field(default_factory=list)


class ChatRequest(BaseModel):
    question: str = Field(min_length=1, max_length=1200)
    document_id: int
    language: str = "English"


class ChatResponse(BaseModel):
    answer: str
    sources: list[dict]
