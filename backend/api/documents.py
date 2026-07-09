from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from typing import List
from schemas.document import Document
from repositories.document_repository import DocumentRepository
from services.document_processor import DocumentProcessor
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/documents", tags=["documents"])
processor = DocumentProcessor()

@router.post("/upload")
async def upload_document(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    """Uploads a document and begins processing in the background."""
    try:
        # Start processing immediately and await to return the doc ID
        doc_id = await processor.process_upload(file)
        return {"id": doc_id, "message": "Document uploaded and processed successfully"}
    except Exception as e:
        logger.error(f"Upload failed: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("", response_model=List[Document])
async def list_documents():
    """List all indexed documents."""
    return await DocumentRepository.get_all()

@router.delete("/{doc_id}")
async def delete_document(doc_id: str):
    """Delete a document and its vectors."""
    try:
        await processor.delete_document(doc_id)
        return {"message": "Document deleted successfully"}
    except Exception as e:
        logger.error(f"Delete failed: {e}")
        raise HTTPException(status_code=400, detail=str(e))
