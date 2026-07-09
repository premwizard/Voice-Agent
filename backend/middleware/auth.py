import jwt
from fastapi import HTTPException, Security, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from config.settings import settings
from typing import Optional
from database.db import db_connection

security = HTTPBearer(auto_error=False)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        payload = jwt.decode(credentials.credentials, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
            
        # Verify user exists in db
        async with db_connection() as conn:
            cursor = await conn.execute("SELECT id, role, email FROM users WHERE id = ?", (user_id,))
            user = await cursor.fetchone()
            if not user:
                raise HTTPException(status_code=401, detail="User not found")
                
            return {"id": user['id'], "role": user['role'], "email": user['email']}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_workspace(request: Request, current_user: dict = Security(get_current_user)):
    # By default, for Phase 6, a user has 1 workspace.
    # We fetch their default workspace.
    async with db_connection() as conn:
        cursor = await conn.execute("SELECT id FROM workspaces WHERE user_id = ? LIMIT 1", (current_user['id'],))
        workspace = await cursor.fetchone()
        if not workspace:
            raise HTTPException(status_code=404, detail="Workspace not found")
        
        return workspace['id']
