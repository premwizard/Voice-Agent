from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class BoundingBox(BaseModel):
    x_min: float
    y_min: float
    x_max: float
    y_max: float

class OCRRegion(BaseModel):
    text: str
    confidence: float
    box: Optional[BoundingBox] = None

class OCRResult(BaseModel):
    media_id: str
    full_text: str
    regions: List[OCRRegion] = []
    metadata: Dict[str, Any] = {}
