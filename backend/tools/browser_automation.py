# ==============================================================================
# FILE: backend/tools/browser_automation.py
# WHAT THIS FILE IS: Web Navigation & Browser Automation Tool.
# WHY IT IS USED: Allows Phoenix AI to open web URLs (YouTube, GitHub, Google)
#                 and perform web searches directly in the user's default browser.
# ==============================================================================

import urllib.parse
import webbrowser
from typing import Dict, Any

class BrowserAutomationEngine:
    @staticmethod
    def open_website(url_or_domain: str) -> Dict[str, Any]:
        """Opens a web URL or domain in the default web browser."""
        target = url_or_domain.strip()
        if not target.startswith("http://") and not target.startswith("https://"):
            target = "https://" + target

        try:
            webbrowser.open(target)
            return {
                "success": True,
                "url": target,
                "message": f"Successfully opened website '{target}' in default browser."
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": f"Failed to open website '{target}': {str(e)}"
            }

    @staticmethod
    def web_search(query: str) -> Dict[str, Any]:
        """Searches the web for a query string in the default browser."""
        encoded_query = urllib.parse.quote(query.strip())
        search_url = f"https://www.google.com/search?q={encoded_query}"

        try:
            webbrowser.open(search_url)
            return {
                "success": True,
                "query": query,
                "url": search_url,
                "message": f"Searching web for '{query}'."
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": f"Failed to perform web search for '{query}': {str(e)}"
            }

browser_engine = BrowserAutomationEngine()
