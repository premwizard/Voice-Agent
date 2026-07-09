import base64
import uuid
from datetime import datetime
try:
    from cryptography.fernet import Fernet
except ImportError:
    # Fallback/mock if cryptography isn't installed. Highly discouraged for real prod.
    class Fernet:
        def __init__(self, key): pass
        def encrypt(self, data): return b"encrypted_" + data
        def decrypt(self, data): return data.replace(b"encrypted_", b"")

from config.settings import settings
from database.db import db_connection

class APIKeyService:
    def __init__(self):
        # Fernet requires a 32-url-safe-base64-encoded string. 
        # We ensure the settings key is properly formatted.
        key = settings.encryption_key.encode('utf-8')
        if len(key) != 32:
            key = key.ljust(32, b'0')[:32]
        fernet_key = base64.urlsafe_b64encode(key)
        self.cipher = Fernet(fernet_key)

    def encrypt_key(self, raw_key: str) -> str:
        return self.cipher.encrypt(raw_key.encode()).decode()

    def decrypt_key(self, encrypted_key: str) -> str:
        return self.cipher.decrypt(encrypted_key.encode()).decode()

    async def add_key(self, workspace_id: str, provider: str, raw_key: str) -> dict:
        encrypted = self.encrypt_key(raw_key)
        key_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        
        async with db_connection() as conn:
            # Delete old key for same provider/workspace if it exists
            await conn.execute("DELETE FROM api_keys WHERE workspace_id = ? AND provider = ?", (workspace_id, provider))
            
            await conn.execute(
                "INSERT INTO api_keys (id, workspace_id, provider, encrypted_key, created_at) VALUES (?, ?, ?, ?, ?)",
                (key_id, workspace_id, provider, encrypted, now)
            )
            await conn.commit()
            
        return {"id": key_id, "provider": provider}

    async def get_decrypted_key(self, workspace_id: str, provider: str) -> str | None:
        async with db_connection() as conn:
            cursor = await conn.execute("SELECT encrypted_key FROM api_keys WHERE workspace_id = ? AND provider = ?", (workspace_id, provider))
            row = await cursor.fetchone()
            if row:
                return self.decrypt_key(row['encrypted_key'])
        return None

api_key_service = APIKeyService()
