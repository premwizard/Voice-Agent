import jwt
import hashlib
import os
import uuid
import base64
from datetime import datetime, timedelta
from config.settings import settings
from database.db import db_connection

# Simple PBKDF2 hashing
def hash_password(password: str) -> str:
    salt = os.urandom(16)
    pw_hash = hashlib.pbkdf2_hmac('sha256', password.encode(), salt, 100000)
    return base64.b64encode(salt + pw_hash).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        decoded = base64.b64decode(hashed_password.encode('utf-8'))
        salt = decoded[:16]
        stored_hash = decoded[16:]
        pw_hash = hashlib.pbkdf2_hmac('sha256', plain_password.encode(), salt, 100000)
        return pw_hash == stored_hash
    except Exception:
        return False

def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm)
    return encoded_jwt

class AuthService:
    async def register_user(self, email: str, password: str, name: str = None) -> dict:
        async with db_connection() as conn:
            cursor = await conn.execute("SELECT id FROM users WHERE email = ?", (email,))
            if await cursor.fetchone():
                raise ValueError("Email already registered")
                
            user_id = str(uuid.uuid4())
            hashed = hash_password(password)
            now = datetime.utcnow().isoformat()
            
            await conn.execute(
                "INSERT INTO users (id, email, password_hash, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
                (user_id, email, hashed, name, now, now)
            )
            
            # Create default workspace
            workspace_id = str(uuid.uuid4())
            await conn.execute(
                "INSERT INTO workspaces (id, user_id, name, created_at) VALUES (?, ?, ?, ?)",
                (workspace_id, user_id, f"{name or 'Personal'} Workspace", now)
            )
            await conn.commit()
            
            return {"id": user_id, "email": email, "name": name, "role": "user"}

    async def authenticate_user(self, email: str, password: str) -> dict | None:
        async with db_connection() as conn:
            cursor = await conn.execute("SELECT * FROM users WHERE email = ?", (email,))
            user = await cursor.fetchone()
            if not user:
                return None
            if not verify_password(password, user["password_hash"]):
                return None
            return dict(user)

auth_service = AuthService()
