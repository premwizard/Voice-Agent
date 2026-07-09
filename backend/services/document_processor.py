import os
import uuid
import logging
from typing import List, Dict, Any, Tuple
from fastapi import UploadFile
import pypdf
import docx
import pandas as pd
from datetime import datetime, timezone

from config.settings import settings
from schemas.document import DocumentCreate, DocumentUpdate, DocumentChunk, DocumentStatus
from repositories.document_repository import DocumentRepository
from services.chunking_service import ChunkingService
from providers.vector_stores.chroma_store import ChromaVectorStore
from providers.embeddings.gemini_embedding import GeminiEmbeddingProvider

logger = logging.getLogger(__name__)

class DocumentProcessor:
    def __init__(self):
        # Initialize providers
        # Currently hardcoded to gemini/chroma based on settings
        self.embedding_provider = GeminiEmbeddingProvider()
        self.vector_store = ChromaVectorStore(self.embedding_provider)
        self.chunking_service = ChunkingService()

    async def process_upload(self, file: UploadFile) -> str:
        """
        Main pipeline for ingesting a document.
        Returns the new document's ID.
        """
        doc_id = str(uuid.uuid4())
        
        # 1. Create DB Record
        doc_create = DocumentCreate(
            id=doc_id,
            filename=file.filename,
            file_type=file.content_type or 'unknown',
            file_size=file.size or 0
        )
        await DocumentRepository.create(doc_create)
        
        # Update status to processing
        await DocumentRepository.update(doc_id, DocumentUpdate(status=DocumentStatus.PROCESSING))
        
        try:
            # 2. Extract Text
            content = await self._extract_text(file)
            
            # 3. Chunk Text
            chunks = self.chunking_service.chunk_text(
                content,
                chunk_size=settings.chunk_size,
                chunk_overlap=settings.chunk_overlap
            )
            
            if not chunks:
                raise ValueError("No text could be extracted or chunked.")

            # 4. Prepare Chunks for Vector Store & DB
            chunk_ids = [f"{doc_id}_{i}" for i in range(len(chunks))]
            metadatas = [
                {
                    "document_id": doc_id,
                    "filename": file.filename,
                    "chunk_index": i
                }
                for i in range(len(chunks))
            ]
            
            # 5. Embed and Store in Vector DB
            await self.vector_store.add_documents(
                texts=chunks,
                metadatas=metadatas,
                ids=chunk_ids
            )
            
            # 6. Save Chunk metadata to SQL DB
            db_chunks = []
            now = datetime.now(timezone.utc)
            for i, chunk_text in enumerate(chunks):
                db_chunks.append(DocumentChunk(
                    id=chunk_ids[i],
                    document_id=doc_id,
                    chunk_index=i,
                    text_content=chunk_text,
                    vector_id=chunk_ids[i],
                    created_at=now
                ))
            await DocumentRepository.add_chunks(db_chunks)

            # 7. Update Status to Ready
            await DocumentRepository.update(doc_id, DocumentUpdate(
                status=DocumentStatus.READY,
                chunk_count=len(chunks),
                embedding_provider=settings.embedding_provider,
                vector_store=settings.vector_store
            ))
            
            return doc_id

        except Exception as e:
            logger.error(f"Failed to process document {doc_id}: {e}")
            await DocumentRepository.update(doc_id, DocumentUpdate(
                status=DocumentStatus.FAILED,
                error_message=str(e)
            ))
            raise

    async def _extract_text(self, file: UploadFile) -> str:
        """Extract text from supported file types."""
        file_ext = os.path.splitext(file.filename)[1].lower()
        content = ""
        
        # Reset file pointer
        await file.seek(0)
        
        if file_ext == '.pdf':
            pdf_reader = pypdf.PdfReader(file.file)
            for page in pdf_reader.pages:
                text = page.extract_text()
                if text:
                    content += text + "\n\n"
                    
        elif file_ext in ['.doc', '.docx']:
            doc = docx.Document(file.file)
            content = "\n".join([para.text for para in doc.paragraphs])
            
        elif file_ext == '.csv':
            df = pd.read_csv(file.file)
            # Convert CSV rows to readable text
            content = df.to_string(index=False)
            
        elif file_ext in ['.txt', '.md']:
            content_bytes = await file.read()
            content = content_bytes.decode('utf-8', errors='ignore')
            
        else:
            raise ValueError(f"Unsupported file type: {file_ext}")
            
        return content.strip()

    async def delete_document(self, doc_id: str):
        """Delete from Vector DB and SQL DB."""
        # 1. Delete from Vector Store
        await self.vector_store.delete_document(doc_id)
        
        # 2. Delete from SQL DB (cascade will delete chunks)
        await DocumentRepository.delete(doc_id)
