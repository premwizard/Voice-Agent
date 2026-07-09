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

CREATE TABLE IF NOT EXISTS mcp_servers (
    id              TEXT PRIMARY KEY,
    workspace_id    TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    description     TEXT,
    transport       TEXT NOT NULL,
    command         TEXT,
    args            TEXT,
    url             TEXT,
    env_vars        TEXT,
    status          TEXT NOT NULL DEFAULT 'disconnected',
    created_at      TEXT NOT NULL,
    updated_at      TEXT NOT NULL
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

CREATE TABLE IF NOT EXISTS traces (
    id              TEXT PRIMARY KEY,
    workspace_id    TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    request_id      TEXT NOT NULL,
    timestamp       TEXT NOT NULL,
    total_latency_ms REAL NOT NULL,
    total_tokens    INTEGER NOT NULL,
    cost            REAL NOT NULL,
    status          TEXT NOT NULL,
    trace_data      TEXT NOT NULL,
    created_at      TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS prompts (
    id              TEXT PRIMARY KEY,
    workspace_id    TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    content         TEXT NOT NULL,
    version         INTEGER NOT NULL,
    is_active       INTEGER NOT NULL DEFAULT 1,
    tags            TEXT,
    created_at      TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS evaluations (
    id              TEXT PRIMARY KEY,
    workspace_id    TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    trace_id        TEXT NOT NULL REFERENCES traces(id) ON DELETE CASCADE,
    metrics         TEXT NOT NULL,
    created_at      TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS feedback (
    id              TEXT PRIMARY KEY,
    workspace_id    TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    trace_id        TEXT NOT NULL REFERENCES traces(id) ON DELETE CASCADE,
    rating          INTEGER NOT NULL,
    comment         TEXT,
    created_at      TEXT NOT NULL
);
"""

import asyncpg
import aiosqlite
import logging
import re
from typing import Any, List, Optional
from contextlib import asynccontextmanager
from config.settings import settings

logger = logging.getLogger(__name__)

def _convert_sqlite_to_postgres(query: str) -> str:
    # Converts ? placeholders to $1, $2, etc.
    parts = query.split('?')
    if len(parts) == 1:
        return query
    res = parts[0]
    for i, part in enumerate(parts[1:], 1):
        res += f"${i}{part}"
    return res

class ConnectionWrapper:
    def __init__(self, conn, is_postgres: bool):
        self._conn = conn
        self.is_postgres = is_postgres

    async def execute(self, query: str, args: tuple = ()) -> Any:
        if self.is_postgres:
            pg_query = _convert_sqlite_to_postgres(query)
            if query.strip().upper().startswith("SELECT"):
                # asyncpg doesn't return cursor from execute
                pass
            else:
                return await self._conn.execute(pg_query, *args)
        else:
            return await self._conn.execute(query, args)

    async def fetchall(self, query: str, args: tuple = ()) -> List[dict]:
        if self.is_postgres:
            pg_query = _convert_sqlite_to_postgres(query)
            records = await self._conn.fetch(pg_query, *args)
            return [dict(r) for r in records]
        else:
            cursor = await self._conn.execute(query, args)
            rows = await cursor.fetchall()
            return [dict(r) for r in rows]

    async def fetchone(self, query: str, args: tuple = ()) -> Optional[dict]:
        if self.is_postgres:
            pg_query = _convert_sqlite_to_postgres(query)
            record = await self._conn.fetchrow(pg_query, *args)
            return dict(record) if record else None
        else:
            cursor = await self._conn.execute(query, args)
            row = await cursor.fetchone()
            return dict(row) if row else None

    async def commit(self):
        if not self.is_postgres:
            await self._conn.commit()

@asynccontextmanager
async def db_connection():
    url = settings.database_url
    if url.startswith("postgres"):
        conn = await asyncpg.connect(url)
        try:
            yield ConnectionWrapper(conn, is_postgres=True)
        finally:
            await conn.close()
    else:
        path = url.replace("sqlite:///", "")
        conn = await aiosqlite.connect(path)
        conn.row_factory = aiosqlite.Row
        try:
            yield ConnectionWrapper(conn, is_postgres=False)
        finally:
            await conn.close()

async def init_db() -> None:
    url = settings.database_url
    logger.info(f"Initializing database at: {url}")
    if url.startswith("postgres"):
        logger.warning("Postgres schema initialization assumes Alembic in production. Skipping direct script exec.")
    else:
        path = url.replace("sqlite:///", "")
        async with aiosqlite.connect(path) as conn:
            conn.row_factory = aiosqlite.Row
            await conn.executescript(CREATE_TABLES_SQL)
            await conn.commit()
    logger.info("Database initialized successfully.")
