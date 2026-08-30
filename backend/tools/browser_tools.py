# ==============================================================================
# FILE: backend/tools/browser_tools.py
# WHAT THIS FILE IS: Browser & Web Search Automation Tool Definitions.
# WHY IT IS USED: Registers web opening and Google search tools onto the ToolRegistry.
# ==============================================================================

from typing import Dict, Any
from tools.browser_automation import browser_engine

def register_browser_tools(registry):
    """Registers browser automation tool definitions onto the provided ToolRegistry instance."""

    @registry.register(
        "open_website",
        "Opens a web URL or domain (e.g. youtube.com, github.com) in the default web browser.",
        parameters={
            "type": "object",
            "properties": {
                "url": {"type": "string", "description": "Web URL or domain name to open."}
            },
            "required": ["url"]
        }
    )
    def tool_open_website(url: str) -> Dict[str, Any]:
        return browser_engine.open_website(url)

    @registry.register(
        "web_search",
        "Searches Google/web for a query string in the default web browser.",
        parameters={
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Web search query."}
            },
            "required": ["query"]
        }
    )
    def tool_web_search(query: str) -> Dict[str, Any]:
        return browser_engine.web_search(query)
