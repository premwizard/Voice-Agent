# ==============================================================================
# FILE: backend/memory/memory_manager.py
# WHAT THIS FILE IS: Persistent SQLite Long-Term Memory Manager for Phoenix AI.
# WHY IT IS USED: Stores user facts, preferences, project directory paths, and 
#                 personal notes permanently across server restarts.
# ==============================================================================

import os
import sqlite3
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

DB_PATH = os.path.join(os.path.dirname(__file__), "phoenix_memory.db")

class MemoryManager:
    def __init__(self, db_path: str = DB_PATH):
        self.db_path = db_path
        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        """Creates user_memories database table if not present."""
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        with self._get_connection() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS user_memories (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL,
                    category TEXT DEFAULT 'general',
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
            """)
            conn.commit()

    def remember_fact(self, key: str, value: str, category: str = "general") -> Dict[str, Any]:
        """Saves or updates a fact/preference in long-term memory."""
        clean_key = key.strip().lower().replace(" ", "_")
        now = datetime.now(timezone.utc).isoformat()
        
        with self._get_connection() as conn:
            conn.execute("""
                INSERT INTO user_memories (key, value, category, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(key) DO UPDATE SET
                    value = excluded.value,
                    category = excluded.category,
                    updated_at = excluded.updated_at
            """, (clean_key, value, category, now, now))
            conn.commit()

        return {
            "success": True,
            "key": clean_key,
            "value": value,
            "category": category,
            "message": f"Successfully remembered: '{key}' = '{value}'."
        }

    def recall_fact(self, key: str) -> Dict[str, Any]:
        """Retrieves a stored memory by key."""
        clean_key = key.strip().lower().replace(" ", "_")
        with self._get_connection() as conn:
            cursor = conn.execute("SELECT * FROM user_memories WHERE key = ?", (clean_key,))
            row = cursor.fetchone()
            if row:
                return {
                    "success": True,
                    "found": True,
                    "key": row["key"],
                    "value": row["value"],
                    "category": row["category"],
                    "message": f"Retrieved memory '{key}': '{row['value']}'."
                }
            return {
                "success": False,
                "found": False,
                "key": clean_key,
                "message": f"No stored memory found for '{key}'."
            }

    def list_memories(self, category: Optional[str] = None) -> Dict[str, Any]:
        """Returns all stored memories."""
        with self._get_connection() as conn:
            if category:
                cursor = conn.execute("SELECT * FROM user_memories WHERE category = ?", (category,))
            else:
                cursor = conn.execute("SELECT * FROM user_memories ORDER BY updated_at DESC")
            
            rows = cursor.fetchall()
            memories = [{"key": r["key"], "value": r["value"], "category": r["category"]} for r in rows]
            return {
                "success": True,
                "total": len(memories),
                "memories": memories,
                "message": f"Retrieved {len(memories)} stored memories."
            }

    def forget_memory(self, key: str) -> Dict[str, Any]:
        """Deletes a memory entry by key."""
        clean_key = key.strip().lower().replace(" ", "_")
        with self._get_connection() as conn:
            cursor = conn.execute("DELETE FROM user_memories WHERE key = ?", (clean_key,))
            conn.commit()
            if cursor.rowcount > 0:
                return {"success": True, "key": clean_key, "message": f"Forgot memory '{key}'."}
            return {"success": False, "key": clean_key, "message": f"No memory found matching '{key}'."}

    def get_active_memories_prompt(self) -> str:
        """Returns formatted string summary of all stored memories for LLM prompt context."""
        mem_res = self.list_memories()
        memories = mem_res.get("memories", [])
        if not memories:
            return ""

        summary_items = [f"- {m['key']}: {m['value']}" for m in memories]
        return "\n\n--- SAVED USER LONG-TERM MEMORIES ---\n" + "\n".join(summary_items) + "\n"

# Global Memory Manager Instance
memory_manager = MemoryManager()
