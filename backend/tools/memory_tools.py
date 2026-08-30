# ==============================================================================
# FILE: backend/tools/memory_tools.py
# WHAT THIS FILE IS: Persistent Memory Tool Definitions.
# WHY IT IS USED: Registers SQLite memory manipulation tools (remember, recall, 
#                 list, forget) onto the ToolRegistry.
# ==============================================================================

from typing import Dict, Any, Optional
from memory.memory_manager import memory_manager

def register_memory_tools(registry):
    """Registers long-term memory tool definitions onto the provided ToolRegistry instance."""

    @registry.register(
        "remember_fact",
        "Saves a user preference, project folder path, or personal fact into long-term SQLite memory.",
        parameters={
            "type": "object",
            "properties": {
                "key": {"type": "string", "description": "Identifier key for the memory (e.g. main_project_path, preferred_browser)."},
                "value": {"type": "string", "description": "Content value of the memory to save."},
                "category": {"type": "string", "description": "Optional category (e.g. preferences, paths, notes)."}
            },
            "required": ["key", "value"]
        }
    )
    def tool_remember_fact(key: str, value: str, category: str = "general") -> Dict[str, Any]:
        return memory_manager.remember_fact(key, value, category)

    @registry.register(
        "recall_fact",
        "Retrieves a saved user preference or fact from long-term SQLite memory by key.",
        parameters={
            "type": "object",
            "properties": {
                "key": {"type": "string", "description": "Memory key identifier to search."}
            },
            "required": ["key"]
        }
    )
    def tool_recall_fact(key: str) -> Dict[str, Any]:
        return memory_manager.recall_fact(key)

    @registry.register(
        "list_memories",
        "Lists all saved long-term user memories and preferences stored in SQLite.",
        parameters={
            "type": "object",
            "properties": {
                "category": {"type": "string", "description": "Optional memory category filter."}
            },
            "required": []
        }
    )
    def tool_list_memories(category: Optional[str] = None) -> Dict[str, Any]:
        return memory_manager.list_memories(category)

    @registry.register(
        "forget_memory",
        "Deletes a saved long-term memory entry from SQLite by key.",
        parameters={
            "type": "object",
            "properties": {
                "key": {"type": "string", "description": "Memory key identifier to delete."}
            },
            "required": ["key"]
        }
    )
    def tool_forget_memory(key: str) -> Dict[str, Any]:
        return memory_manager.forget_memory(key)
