# ==============================================================================
# FILE: backend/tools/applications/resolver.py
# WHAT THIS FILE IS: Intelligent Application Name & Query Resolver for Phoenix AI.
# WHY IT IS USED: Maps natural language queries (e.g., "my browser", "coding editor", 
#                 "chrome", "vscode") to installed application entries, using multi-tier 
#                 matching, category synonym expansion, fuzzy scoring, and ambiguity detection.
# ==============================================================================

import re
import difflib
from typing import Dict, Any, List, Optional, Tuple
from tools.applications.discovery import app_discovery_service

# Category mappings for natural language generic terms to software keywords
CATEGORY_ALIASES: Dict[str, List[str]] = {
    "browser": ["chrome", "google chrome", "msedge", "edge", "firefox", "brave", "opera"],
    "my browser": ["chrome", "google chrome", "msedge", "edge", "firefox", "brave"],
    "code editor": ["code", "vscode", "visual studio code", "antigravity", "antigravity ide", "sublime_text"],
    "coding editor": ["code", "vscode", "visual studio code", "antigravity", "antigravity ide"],
    "thing for coding": ["code", "vscode", "visual studio code", "antigravity", "antigravity ide"],
    "coding": ["code", "vscode", "visual studio code", "antigravity"],
    "ide": ["code", "vscode", "visual studio code", "antigravity"],
    "terminal": ["cmd", "command prompt", "powershell", "windows terminal"],
    "command line": ["cmd", "command prompt", "powershell"],
    "text editor": ["notepad", "sublime_text", "notepad++"],
    "music player": ["spotify"],
    "music": ["spotify"],
    "calculator": ["calc", "calculator"]
}

class ApplicationResolver:
    def __init__(self, discovery_service=app_discovery_service):
        self.discovery = discovery_service

    def resolve(self, query: str) -> Dict[str, Any]:
        """
        Resolves a natural-language query to an installed application candidate or ambiguity state.
        
        Returns:
          {
            "success": bool,
            "status": "resolved" | "ambiguous" | "not_found",
            "best_match": Optional[Dict[str, Any]],
            "candidates": List[Dict[str, Any]],
            "query": str,
            "message": str
          }
        """
        raw_query = query.strip().lower()
        cleaned_query = re.sub(r'^(open|launch|start|run|show)\s+(the\s+|a\s+|my\s+)?', '', raw_query).strip()
        if not cleaned_query:
            cleaned_query = raw_query

        apps = self.discovery.get_installed_applications()
        if not apps:
            return {
                "success": False,
                "status": "not_found",
                "best_match": None,
                "candidates": [],
                "query": query,
                "message": "No installed applications could be indexed on this system."
            }

        # Expand category synonyms if available
        search_terms = [cleaned_query]
        if cleaned_query in CATEGORY_ALIASES:
            search_terms.extend(CATEGORY_ALIASES[cleaned_query])

        scored_candidates: List[Tuple[float, Dict[str, Any]]] = []

        for app in apps:
            app_name = app["name"].lower()
            display_name = app["display_name"].lower()
            exe_name = app["executable"].lower()
            aliases = [a.lower() for a in app.get("aliases", [])]

            best_score = 0.0

            for term in search_terms:
                # Tier 1: Exact match on name, exe, or alias
                if term == app_name or term == display_name or term == exe_name or term in aliases:
                    best_score = max(best_score, 1.0)
                    break

                # Tier 2: Substring or word match
                if term in app_name or term in display_name or any(term in a for a in aliases):
                    best_score = max(best_score, 0.85)

                # Tier 3: Fuzzy sequence similarity ratio
                fuzzy_name = difflib.SequenceMatcher(None, term, display_name).ratio()
                fuzzy_exe = difflib.SequenceMatcher(None, term, exe_name).ratio()
                max_fuzzy = max(fuzzy_name, fuzzy_exe)

                for alias in aliases:
                    max_fuzzy = max(max_fuzzy, difflib.SequenceMatcher(None, term, alias).ratio())

                if max_fuzzy > 0.6:
                    best_score = max(best_score, max_fuzzy * 0.8)

            if best_score >= 0.5:
                scored_candidates.append((best_score, app))

        scored_candidates.sort(key=lambda x: x[0], reverse=True)

        if not scored_candidates:
            return {
                "success": False,
                "status": "not_found",
                "best_match": None,
                "candidates": [],
                "query": query,
                "message": f"Could not find any installed application matching '{query}'."
            }

        top_score, top_app = scored_candidates[0]

        # Detect Ambiguity: If top 2 candidates are both > 0.75 and score difference is < 0.15
        if len(scored_candidates) > 1:
            second_score, second_app = scored_candidates[1]
            if top_score >= 0.75 and second_score >= 0.75 and (top_score - second_score) < 0.15 and top_app["name"] != second_app["name"]:
                ambiguous_list = [c[1] for c in scored_candidates if c[0] >= 0.75][:3]
                candidate_names = [a['display_name'] for a in ambiguous_list]
                return {
                    "success": False,
                    "status": "ambiguous",
                    "best_match": None,
                    "candidates": ambiguous_list,
                    "query": query,
                    "message": f"Found multiple matching applications: {', '.join(candidate_names)}. Please specify which one you'd like to open."
                }

        return {
            "success": True,
            "status": "resolved",
            "best_match": top_app,
            "candidates": [c[1] for c in scored_candidates[:3]],
            "query": query,
            "message": f"Resolved '{query}' to '{top_app['display_name']}'."
        }

# Global Resolver Instance
app_resolver = ApplicationResolver()
