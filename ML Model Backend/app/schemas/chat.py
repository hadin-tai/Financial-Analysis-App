"""Pydantic schemas for chat endpoints."""
from typing import Literal

from pydantic import BaseModel


class ChatRequest(BaseModel):
    session_id: str
    message: str


class ChatResponse(BaseModel):
    role: Literal["assistant"]
    content: str

