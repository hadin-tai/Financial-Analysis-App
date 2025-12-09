"""Application configuration and environment loading."""
from __future__ import annotations

import os

try:
    from dotenv import load_dotenv  # type: ignore
except ImportError:  # pragma: no cover - fallback when package missing locally
    def load_dotenv():
        return None


load_dotenv()

HUGGINGFACE_API_KEY = (
    os.getenv("HUGGINGFACE_API_KEY")
    or os.getenv("HUGGINGFACEHUB_API_TOKEN")
    or os.getenv("HUGGINGFACEHUB_ACCESS_TOKEN")
)
if not HUGGINGFACE_API_KEY:
    raise RuntimeError("A Hugging Face API token is not set in the environment.")

HF_MODEL = "google/gemma-2-2b-it"
# HF_MODEL = "mistralai/Mistral-7B-Instruct-v0.2"

FASTAPI_METADATA = {
    "title": "InsightEdge Chatbot Backend",
    "description": "Simple FastAPI proxy for Hugging Face Gemma responses via LangChain.",
    "version": "1.1.0",
}

ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

