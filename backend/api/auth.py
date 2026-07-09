from fastapi import APIRouter, HTTPException, Depends
from schemas.auth import UserRegister, UserLogin, TokenResponse, UserResponse
from services.auth_service import auth_service, create_access_token
from middleware.auth import get_current_user
from datetime import timedelta
from config.settings import settings

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/register", response_model=UserResponse)
async def register(user_data: UserRegister):
    try:
        user = await auth_service.register_user(
            email=user_data.email, 
            password=user_data.password, 
            name=user_data.name
        )
        return user
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/login", response_model=TokenResponse)
async def login(user_data: UserLogin):
    user = await auth_service.authenticate_user(user_data.email, user_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
        
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": user["id"]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user
