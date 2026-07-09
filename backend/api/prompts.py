from typing import List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from middleware.auth import get_current_workspace
from services.prompt_registry import prompt_registry
from repositories.prompt_repository import PromptRepository
from database.models import Prompt

router = APIRouter(prefix="/api/prompts", tags=["prompts"])
_repo = PromptRepository()

class PromptRequest(BaseModel):
    name: str
    content: str
    tags: str = ""

class PromptResponse(BaseModel):
    id: str
    name: str
    content: str
    version: int
    is_active: bool
    tags: str
    created_at: str

def _to_resp(p: Prompt) -> PromptResponse:
    return PromptResponse(
        id=p.id,
        name=p.name,
        content=p.content,
        version=p.version,
        is_active=p.is_active,
        tags=p.tags,
        created_at=p.created_at.isoformat()
    )

@router.get("/", response_model=List[PromptResponse])
async def list_active_prompts(workspace_id: str = Depends(get_current_workspace)):
    prompts = await _repo.get_all_active(workspace_id)
    return [_to_resp(p) for p in prompts]

@router.get("/{name}/history", response_model=List[PromptResponse])
async def list_prompt_history(name: str, workspace_id: str = Depends(get_current_workspace)):
    prompts = await _repo.list_versions(workspace_id, name)
    return [_to_resp(p) for p in prompts]

@router.post("/", response_model=PromptResponse)
async def save_prompt(req: PromptRequest, workspace_id: str = Depends(get_current_workspace)):
    prompt = await prompt_registry.save_prompt(workspace_id, req.name, req.content, req.tags)
    return _to_resp(prompt)
