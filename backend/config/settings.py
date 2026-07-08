from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    # App Settings
    app_name: str = "Voice Agent Backend"
    debug: bool = False
    ai_provider: str = "openrouter"
    
    # AI Keys
    openrouter_api_key: Optional[str] = None
    
    # Model Configuration
    system_prompt: str = "You are a helpful and concise AI voice assistant. Speak naturally."
    max_history: int = 20
    temperature: float = 0.7
    max_tokens: int = 1024
    
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

settings = Settings()
