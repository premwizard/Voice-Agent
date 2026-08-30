# ==============================================================================
# FILE: backend/api/schemas/chat_schema.py
# WHAT THIS FILE IS: Pydantic Data Models for AI Chat Requests.
# WHY IT IS USED: Validates prompts, history, model, and system prompt overrides.
# ==============================================================================

from typing import Optional, List, Dict
from pydantic import BaseModel, Field

class ChatRequest(BaseModel):
    prompt: str = Field(..., description="Natural language prompt.")
    history: Optional[List[Dict[str, str]]] = Field(None, description="Prior conversation message turn history.")
    model: Optional[str] = Field(None, description="Target LLM model override.")
    system_prompt: Optional[str] = Field(None, description="System prompt override.")
    user_confirmed: Optional[bool] = Field(False, description="Explicit user confirmation for dangerous tools.")
