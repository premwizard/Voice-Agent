from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    # App Settings
    app_name: str = "Voice Agent Backend"
    debug: bool = False
    ai_provider: str = "openrouter"

    # AI Keys
    openrouter_api_key: Optional[str] = None
    
    # ------------------------------------------------------------------ #
    # Security & Authentication Configuration
    # ------------------------------------------------------------------ #
    jwt_secret: str = "super_secret_jwt_key_change_in_production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 1 week
    encryption_key: str = "12345678901234567890123456789012" # 32 bytes for AES


    # Model Configuration
    system_prompt: str = "You are a helpful and concise AI voice assistant. Speak naturally."
    temperature: float = 0.7
    max_tokens: int = 1024

    # ------------------------------------------------------------------ #
    # Multimodal Configuration
    # ------------------------------------------------------------------ #
    enable_multimodal: bool = True
    enable_vision: bool = True
    enable_ocr: bool = True
    max_image_size: int = 10485760  # 10MB
    max_file_size: int = 52428800   # 50MB
    vision_provider: str = "gemini"
    ocr_provider: str = "gemini"
    auto_ocr: bool = True
    auto_rag: bool = True

    # ------------------------------------------------------------------ #
    # Memory System Configuration (all configurable via .env)
    # ------------------------------------------------------------------ #

    # Layer 1 — Active context: number of most recent messages always sent to LLM
    max_active_messages: int = 20

    # Layer 2 — Rolling summary: trigger summarization after this many total messages
    summary_threshold: int = 30

    # Max character length of a generated summary
    max_summary_length: int = 2000

    # Layer 3 — Long-term memory: max number of persistent memory items
    max_memory_items: int = 50

    # Session timeout in seconds (for future session expiry logic)
    session_timeout: int = 3600

    # Database (SQLite by default; swap prefix for PostgreSQL migration)
    database_url: str = "sqlite:///./voice_agent.db"

    # ------------------------------------------------------------------ #
    # RAG System Configuration
    # ------------------------------------------------------------------ #
    enable_rag: bool = True
    embedding_provider: str = "gemini" # 'gemini' or 'openai'
    vector_store: str = "chroma"
    top_k: int = 4
    chunk_size: int = 1000
    chunk_overlap: int = 200
    similarity_threshold: float = 0.5
    
    # Gemini specific config
    gemini_api_key: Optional[str] = None
    
    # Legacy alias kept for backward compat — maps to max_active_messages
    @property
    def max_history(self) -> int:
        return self.max_active_messages

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()

