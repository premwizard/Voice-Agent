import os
import uuid
import aiofiles
from datetime import datetime
from config.settings import settings
from database.db import db_connection
from schemas.media import MediaItemSchema

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

class MediaManager:
    async def save_file(self, conversation_id: str, file_name: str, content: bytes, mime_type: str) -> MediaItemSchema:
        media_id = str(uuid.uuid4())
        
        # Ensure conversation directory exists
        conv_dir = os.path.join(UPLOAD_DIR, conversation_id)
        os.makedirs(conv_dir, exist_ok=True)
        
        file_path = os.path.join(conv_dir, f"{media_id}_{file_name}")
        
        # Save to disk
        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(content)
            
        size_bytes = len(content)
        
        # Save to database
        now = datetime.utcnow().isoformat()
        async with db_connection() as conn:
            await conn.execute(
                """
                INSERT INTO media_items 
                (id, conversation_id, file_name, file_path, mime_type, size_bytes, status, created_at, updated_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (media_id, conversation_id, file_name, file_path, mime_type, size_bytes, "uploaded", now, now)
            )
            await conn.commit()
            
        return MediaItemSchema(
            id=media_id,
            conversation_id=conversation_id,
            file_name=file_name,
            file_path=file_path,
            mime_type=mime_type,
            size_bytes=size_bytes,
            status="uploaded",
            created_at=datetime.fromisoformat(now),
            updated_at=datetime.fromisoformat(now)
        )

    async def get_media_item(self, media_id: str) -> MediaItemSchema | None:
        async with db_connection() as conn:
            cursor = await conn.execute("SELECT * FROM media_items WHERE id = ?", (media_id,))
            row = await cursor.fetchone()
            if row:
                return MediaItemSchema(
                    id=row['id'],
                    conversation_id=row['conversation_id'],
                    file_name=row['file_name'],
                    file_path=row['file_path'],
                    mime_type=row['mime_type'],
                    size_bytes=row['size_bytes'],
                    status=row['status'],
                    created_at=datetime.fromisoformat(row['created_at']),
                    updated_at=datetime.fromisoformat(row['updated_at'])
                )
        return None

media_manager = MediaManager()
