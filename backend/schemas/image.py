from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class VisionAnalysisRequest(BaseModel):
    media_id: str
    prompt: Optional[str] = None
    max_tokens: int = 1024

class VisionAnalysisResponse(BaseModel):
    media_id: str
    description: str
    labels: List[str] = []
    metadata: Dict[str, Any] = {}
