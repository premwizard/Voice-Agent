# ==============================================================================
# FILE: backend/tools/application_tools.py
# WHAT THIS FILE IS: Application Automation Tool Definitions.
# WHY IT IS USED: Registers application discovery and launcher tools onto the ToolRegistry.
# ==============================================================================

from typing import Dict, Any
from core.context import system_context
from tools.applications.resolver import app_resolver
from tools.applications.launcher import app_launcher
from tools.applications.discovery import app_discovery_service

def register_application_tools(registry):
    """Registers application management tool definitions onto the provided ToolRegistry instance."""

    @registry.register(
        "open_application",
        "Launches a Windows desktop application by natural language name or description (e.g. 'chrome', 'browser', 'code editor', 'notepad', 'vscode', 'antigravity').",
        parameters={
            "type": "object",
            "properties": {
                "application": {
                    "type": "string",
                    "description": "Name, description, or alias of the application to launch."
                },
                "app_name": {
                    "type": "string",
                    "description": "Name or alias of the application to launch."
                }
            },
            "required": []
        }
    )
    def tool_open_application(
        application: str = "",
        app_name: str = "",
        name: str = "",
        app: str = ""
    ) -> Dict[str, Any]:
        target = application or app_name or name or app
        if not target:
            return {"success": False, "message": "Please specify an application name to launch."}

        resolved = app_resolver.resolve(target)
        if not resolved["success"]:
            return resolved
        
        best_match = resolved["best_match"]
        launch_res = app_launcher.launch(best_match)
        if launch_res["success"]:
            system_context.update_app_context(best_match["display_name"], best_match["path"])
        return launch_res

    @registry.register(
        "list_applications",
        "Returns a list of installed Windows applications discovered on the system.",
        parameters={
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Optional search term to filter installed applications."}
            },
            "required": []
        }
    )
    def tool_list_applications(query: str = "") -> Dict[str, Any]:
        apps = app_discovery_service.get_installed_applications()
        if query:
            q = query.lower()
            apps = [a for a in apps if q in a["display_name"].lower() or any(q in alias for alias in a.get("aliases", []))]
        return {
            "success": True,
            "total": len(apps),
            "applications": [a["display_name"] for a in apps[:20]],
            "message": f"Found {len(apps)} installed applications."
        }
