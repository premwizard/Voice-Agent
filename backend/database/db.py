"""
Async SQLite connection and schema initialization.
Uses aiosqlite for non-blocking I/O compatible with FastAPI's async event loop.
Migration to PostgreSQL requires only replacing aiosqlite with asyncpg and
adapting the connection factory — all repository SQL is parameterized.
"""

import aiosqlite
import logging
from config.settings import settings

logger = logging.getLogger(__name__)

_DB_PATH = settings.database_url.replace("sqlite:///", "")

CREATE_TABLES_SQL = """
PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS users (
    id              TEXT PRIMARY KEY,
    email           TEXT UNIQUE NOT NULL,
    password_hash   TEXT NOT NULL,
    role            TEXT NOT NULL DEFAULT 'user',
    name            TEXT,
    created_at      TEXT NOT NULL,
    updated_at      TEXT NOT NULL,
    profile_data    TEXT
);

CREATE TABLE IF NOT EXISTS workspaces (
    id          TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    created_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS api_keys (
    id              TEXT PRIMARY KEY,
    workspace_id    TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    provider        TEXT NOT NULL,
    encrypted_key   TEXT NOT NULL,
    created_at      TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS activity_logs (
    id              TEXT PRIMARY KEY,
    workspace_id    TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    action          TEXT NOT NULL,
    metadata        TEXT,
    created_at      TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
    id          TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token       TEXT NOT NULL,
    expires_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS conversations (
    id          TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    title       TEXT NOT NULL DEFAULT 'New Conversation',
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL,
    message_count INTEGER NOT NULL DEFAULT 0,
    is_pinned   INTEGER NOT NULL DEFAULT 0,
    mode        TEXT NOT NULL DEFAULT 'chat'
);

CREATE TABLE IF NOT EXISTS messages (
    id              TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role            TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
    content         TEXT NOT NULL,
    timestamp       TEXT NOT NULL,
    mode            TEXT NOT NULL DEFAULT 'chat',
    media_ids       TEXT,
    metadata        TEXT
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation
    ON messages(conversation_id, timestamp);

CREATE TABLE IF NOT EXISTS summaries (
    id                      TEXT PRIMARY KEY,
    conversation_id         TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    content                 TEXT NOT NULL,
    message_count_at_summary INTEGER NOT NULL,
    created_at              TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_summaries_conversation
    ON summaries(conversation_id, created_at);

CREATE TABLE IF NOT EXISTS memory_items (
    id          TEXT PRIMARY KEY,
    key         TEXT NOT NULL UNIQUE,
    value       TEXT NOT NULL,
    category    TEXT NOT NULL DEFAULT 'fact',
    confidence  REAL NOT NULL DEFAULT 1.0,
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS session_metadata (
    id                      TEXT PRIMARY KEY,
    conversation_id         TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    start_time              TEXT NOT NULL,
    end_time                TEXT,
    duration_seconds        REAL,
    message_count           INTEGER NOT NULL DEFAULT 0,
    provider                TEXT NOT NULL DEFAULT 'openrouter',
    model                   TEXT NOT NULL DEFAULT 'google/gemini-2.5-flash',
    total_tokens_estimated  INTEGER NOT NULL DEFAULT 0,
    voice_seconds           REAL NOT NULL DEFAULT 0.0
);

CREATE TABLE IF NOT EXISTS media_items (
    id              TEXT PRIMARY KEY,
    workspace_id    TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    file_name       TEXT NOT NULL,
    file_path       TEXT NOT NULL,
    mime_type       TEXT NOT NULL,
    size_bytes      INTEGER NOT NULL,
    status          TEXT NOT NULL DEFAULT 'uploaded',
    created_at      TEXT NOT NULL,
    updated_at      TEXT NOT NULL,
    metadata        TEXT
);

CREATE TABLE IF NOT EXISTS documents (
    id                  TEXT PRIMARY KEY,
    workspace_id        TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    filename            TEXT NOT NULL,
    file_type           TEXT NOT NULL,
    file_size           INTEGER NOT NULL,
    status              TEXT NOT NULL DEFAULT 'pending',
    chunk_count         INTEGER NOT NULL DEFAULT 0,
    embedding_provider  TEXT,
    vector_store        TEXT,
    created_at          TEXT NOT NULL,
    updated_at          TEXT NOT NULL,
    error_message       TEXT
);

CREATE TABLE IF NOT EXISTS document_chunks (
    id                  TEXT PRIMARY KEY,
    document_id         TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    chunk_index         INTEGER NOT NULL,
    text_content        TEXT NOT NULL,
    page_number         INTEGER,
    vector_id           TEXT,
    created_at          TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_document_chunks_doc
    ON document_chunks(document_id);
"""


async def get_db() -> aiosqlite.Connection:
    """Open a new database connection. Use as: async with aiosqlite.connect(_DB_PATH) as conn."""
    conn = await aiosqlite.connect(_DB_PATH)
    conn.row_factory = aiosqlite.Row
    return conn


from contextlib import asynccontextmanager


@asynccontextmanager
async def db_connection():
    """
    Async context manager for database connections.

    Usage:
        async with db_connection() as conn:
            await conn.execute(...)
            await conn.commit()
    """
    conn = await aiosqlite.connect(_DB_PATH)
    conn.row_factory = aiosqlite.Row
    try:
        yield conn
    finally:
        await conn.close()


async def init_db() -> None:
    """Run schema creation on application startup."""
    logger.info(f"Initializing database at: {_DB_PATH}")
    async with aiosqlite.connect(_DB_PATH) as conn:
        conn.row_factory = aiosqlite.Row
        await conn.executescript(CREATE_TABLES_SQL)
        await conn.commit()
    logger.info("Database initialized successfully.")
