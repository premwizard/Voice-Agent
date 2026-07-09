from fastapi import HTTPException, Depends
from typing import Callable
from middleware.auth import get_current_user

def require_role(required_role: str) -> Callable:
    async def role_checker(current_user: dict = Depends(get_current_user)):
        if current_user["role"] != required_role and current_user["role"] != "admin":
            raise HTTPException(status_code=403, detail="Not enough permissions")
        return current_user
    return role_checker
