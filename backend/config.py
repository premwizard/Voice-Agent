# ==============================================================================
# FILE: config.py
# WHAT THIS FILE IS: Application Configuration Settings Module.
# WHY IT IS USED: Uses pydantic-settings to safely load, validate, and expose 
#                 environment variables (including OpenRouter settings) across the backend.
# ==============================================================================

# Import os for filepath operations
import os
# Import BaseSettings and SettingsConfigDict from pydantic_settings
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Backend server port (default: 8000)
    PORT: int = 8000
    # Application environment mode (development or production)
    ENVIRONMENT: str = "development"
    # CORS allowed origins string
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"
    # Active AI Provider (openrouter, gemini, etc.)
    AI_PROVIDER: str = "openrouter"
    # OpenRouter API Key
    OPENROUTER_API_KEY: str = ""
    # OpenRouter Model Name (default standard model)
    OPENROUTER_MODEL: str = "meta-llama/llama-3.3-70b-instruct"
    # Optional Gemini API Key
    GEMINI_API_KEY: str = ""

    # Configure pydantic settings to load from backend/.env
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(__file__), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def cors_origins_list(self) -> list[str]:
        """
        Parses comma-separated CORS_ORIGINS string into a list of cleaned origin URLs.
        """
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

# Create global instance of settings to be imported by other backend modules
settings = Settings()
