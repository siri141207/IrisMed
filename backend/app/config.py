from pathlib import Path

from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


class Settings(BaseSettings):
    gemini_api_key: str = ""
    gemini_model: str = "gemini-3.8-flash"
    embedding_model: str = "gemini-embedding-001"
    database_url: str = "sqlite:///./irismed.db"
    max_file_size_mb: int = 15
    frontend_url: str = "http://localhost:5173"

    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        extra="ignore",
    )


settings = Settings()
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
