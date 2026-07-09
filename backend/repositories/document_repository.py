from typing import List, Optional
from datetime import datetime, timezone
import aiosqlite
from database.db import db_connection
from schemas.document import Document, DocumentCreate, DocumentUpdate, DocumentChunk

class DocumentRepository:
    @staticmethod
    async def get_all() -> List[Document]:
        async with db_connection() as conn:
            async with conn.execute("SELECT * FROM documents ORDER BY created_at DESC") as cursor:
                rows = await cursor.fetchall()
                return [Document(**dict(row)) for row in rows]

    @staticmethod
    async def get_by_id(doc_id: str) -> Optional[Document]:
        async with db_connection() as conn:
            async with conn.execute("SELECT * FROM documents WHERE id = ?", (doc_id,)) as cursor:
                row = await cursor.fetchone()
                return Document(**dict(row)) if row else None

    @staticmethod
    async def create(doc: DocumentCreate) -> Document:
        now = datetime.now(timezone.utc).isoformat()
        async with db_connection() as conn:
            await conn.execute(
                """
                INSERT INTO documents (id, filename, file_type, file_size, status, chunk_count, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (doc.id, doc.filename, doc.file_type, doc.file_size, 'pending', 0, now, now)
            )
            await conn.commit()
            
        return await DocumentRepository.get_by_id(doc.id)

    @staticmethod
    async def update(doc_id: str, update_data: DocumentUpdate) -> Optional[Document]:
        now = datetime.now(timezone.utc).isoformat()
        fields = ["updated_at = ?"]
        values = [now]

        for key, value in update_data.model_dump(exclude_unset=True).items():
            if key != 'updated_at':
                fields.append(f"{key} = ?")
                values.append(value)

        values.append(doc_id)

        query = f"UPDATE documents SET {', '.join(fields)} WHERE id = ?"
        
        async with db_connection() as conn:
            await conn.execute(query, tuple(values))
            await conn.commit()
            
        return await DocumentRepository.get_by_id(doc_id)

    @staticmethod
    async def delete(doc_id: str) -> bool:
        async with db_connection() as conn:
            cursor = await conn.execute("DELETE FROM documents WHERE id = ?", (doc_id,))
            await conn.commit()
            return cursor.rowcount > 0

    @staticmethod
    async def add_chunks(chunks: List[DocumentChunk]):
        if not chunks:
            return
            
        query = """
            INSERT INTO document_chunks (id, document_id, chunk_index, text_content, page_number, vector_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """
        
        values = [
            (
                chunk.id,
                chunk.document_id,
                chunk.chunk_index,
                chunk.text_content,
                chunk.page_number,
                chunk.vector_id,
                chunk.created_at.isoformat()
            )
            for chunk in chunks
        ]
        
        async with db_connection() as conn:
            await conn.executemany(query, values)
            await conn.commit()
