from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime

class MediaUploadRequest(BaseModel):
    conversation_id: str
    file_name: str
    mime_type: str
    size_bytes: int

class MediaUploadResponse(BaseModel):
    id: str
    upload_url: Optional[str] = None
    status: str

class MediaItemSchema(BaseModel):
    id: str
    conversation_id: str
    file_name: str
    file_path: str
    mime_type: str
    size_bytes: int
    status: Literal["uploaded", "processing", "processed", "error"]
    created_at: datetime
    updated_at: datetime
    metadata: Optional[dict] = None
