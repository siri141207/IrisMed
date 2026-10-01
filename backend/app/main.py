from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import Base, engine
from .routes import router

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="IrisMed API",
    description="Private eye-record intelligence API",
    version="2.0.0",
)

origins = [origin.strip() for origin in settings.frontend_url.split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/")
def root():
    return {"service": "IrisMed", "message": "IrisMed API is running."}
