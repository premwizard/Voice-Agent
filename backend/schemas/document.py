from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class DocumentStatus(str, Enum):
    PENDING = 'pending'
    PROCESSING = 'processing'
    READY = 'ready'
    FAILED = 'failed'

class DocumentBase(BaseModel):
    filename: str
    file_type: str
    file_size: int

class DocumentCreate(DocumentBase):
    id: str

class DocumentUpdate(BaseModel):
    status: Optional[DocumentStatus] = None
    chunk_count: Optional[int] = None
    embedding_provider: Optional[str] = None
    vector_store: Optional[str] = None
    error_message: Optional[str] = None
    updated_at: Optional[datetime] = None

class Document(DocumentBase):
    id: str
    status: DocumentStatus
    chunk_count: int
    embedding_provider: Optional[str] = None
    vector_store: Optional[str] = None
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class DocumentChunkBase(BaseModel):
    chunk_index: int
    text_content: str
    page_number: Optional[int] = None

class DocumentChunk(DocumentChunkBase):
    id: str
    document_id: str
    vector_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
