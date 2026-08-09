# ==============================================================================
# FILE: backend/tools/applications/discovery.py
# WHAT THIS FILE IS: Dynamic Windows Application Discovery Service for Phoenix AI.
# WHY IT IS USED: Automatically scans Start Menu shortcuts, Windows App Paths 
#                 registry keys, and common software install directories to dynamically 
#                 index all installed software on Windows without hardcoded lists.
# ==============================================================================

import os
import sys
import time
import winreg
from typing import Dict, Any, List

class ApplicationDiscoveryService:
    def __init__(self):
        self._index: List[Dict[str, Any]] = []
        self._last_scan_time: float = 0.0
        self._cache_ttl_seconds: int = 3600  # Refresh cache every hour

    def get_installed_applications(self, force_refresh: bool = False) -> List[Dict[str, Any]]:
        """
        Returns the normalized list of installed applications.
        Uses in-memory cache if available and TTL hasn't expired.
        """
        now = time.time()
        if not force_refresh and self._index and (now - self._last_scan_time < self._cache_ttl_seconds):
            return self._index

        self._index = self._scan_all_sources()
        self._last_scan_time = now
        return self._index

    def _scan_all_sources(self) -> List[Dict[str, Any]]:
        """Scans Start Menu, Windows Registry App Paths, and common install paths."""
        apps_dict: Dict[str, Dict[str, Any]] = {}

        # 1. Standard Built-in Windows Utilities & Well-known defaults
        builtins = [
            {"name": "Notepad", "executable": "notepad.exe", "path": "notepad.exe", "aliases": ["notepad", "text editor"]},
            {"name": "Calculator", "executable": "calc.exe", "path": "calc.exe", "aliases": ["calculator", "calc"]},
            {"name": "Command Prompt", "executable": "cmd.exe", "path": "cmd.exe", "aliases": ["cmd", "terminal", "command prompt"]},
            {"name": "File Explorer", "executable": "explorer.exe", "path": "explorer.exe", "aliases": ["explorer", "file explorer", "my computer", "files"]},
            {"name": "Task Manager", "executable": "taskmgr.exe", "path": "taskmgr.exe", "aliases": ["task manager", "taskmgr"]},
            {"name": "Paint", "executable": "mspaint.exe", "path": "mspaint.exe", "aliases": ["paint", "mspaint"]},
        ]
        for item in builtins:
            key = item["name"].lower()
            apps_dict[key] = {
                "name": item["name"],
                "display_name": item["name"],
                "executable": item["executable"],
                "path": item["path"],
                "source": "Built-in System Tool",
                "aliases": item["aliases"]
            }

        # 2. Windows App Paths Registry Keys
        registry_apps = self._scan_registry_app_paths()
        for app in registry_apps:
            key = app["display_name"].lower()
            if key not in apps_dict:
                apps_dict[key] = app

        # 3. Start Menu Shortcuts (.lnk files)
        start_menu_apps = self._scan_start_menu_shortcuts()
        for app in start_menu_apps:
            key = app["display_name"].lower()
            if key not in apps_dict or not apps_dict[key].get("path"):
                apps_dict[key] = app

        # 4. Local AppData / Program Files scanning for major IDEs (e.g. Antigravity IDE, VS Code)
        custom_apps = self._scan_common_program_directories()
        for app in custom_apps:
            key = app["display_name"].lower()
            if key not in apps_dict:
                apps_dict[key] = app

        return list(apps_dict.values())

    def _scan_registry_app_paths(self) -> List[Dict[str, Any]]:
        """Reads HKLM & HKCU SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths."""
        results = []
        if sys.platform != "win32":
            return results

        keys_to_check = [
            (winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths"),
            (winreg.HKEY_CURRENT_USER, r"SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths"),
        ]

        for hkey, subkey_path in keys_to_check:
            try:
                with winreg.OpenKey(hkey, subkey_path) as root_key:
                    num_subkeys = winreg.QueryInfoKey(root_key)[0]
                    for i in range(num_subkeys):
                        try:
                            exe_name = winreg.EnumKey(root_key, i)
                            with winreg.OpenKey(root_key, exe_name) as app_key:
                                raw_path, _ = winreg.QueryValueEx(app_key, "")
                                cleaned_path = raw_path.strip('"').strip()
                                display_name = os.path.splitext(exe_name)[0].replace("_", " ").title()
                                if cleaned_path and os.path.exists(cleaned_path):
                                    results.append({
                                        "name": display_name,
                                        "display_name": display_name,
                                        "executable": exe_name,
                                        "path": cleaned_path,
                                        "source": "Windows Registry",
                                        "aliases": [display_name.lower(), exe_name.lower(), os.path.splitext(exe_name)[0].lower()]
                                    })
                        except Exception:
                            continue
            except Exception:
                continue

        return results

    def _scan_start_menu_shortcuts(self) -> List[Dict[str, Any]]:
        """Scans user and system Start Menu directories for .lnk shortcuts."""
        results = []
        if sys.platform != "win32":
            return results

        user_profile = os.environ.get("USERPROFILE", "")
        program_data = os.environ.get("PROGRAMDATA", r"C:\ProgramData")

        start_dirs = [
            os.path.join(program_data, r"Microsoft\Windows\Start Menu\Programs"),
            os.path.join(user_profile, r"AppData\Roaming\Microsoft\Windows\Start Menu\Programs"),
        ]

        for start_dir in start_dirs:
            if not os.path.exists(start_dir):
                continue

            for root, _, files in os.walk(start_dir):
                for f in files:
                    if f.lower().endswith(".lnk") and not any(kw in f.lower() for kw in ["uninstall", "help", "readme", "website", "documentation"]):
                        shortcut_path = os.path.join(root, f)
                        display_name = os.path.splitext(f)[0]
                        results.append({
                            "name": display_name,
                            "display_name": display_name,
                            "executable": f,
                            "path": shortcut_path,
                            "source": "Start Menu Shortcut",
                            "aliases": [display_name.lower()]
                        })

        return results

    def _scan_common_program_directories(self) -> List[Dict[str, Any]]:
        """Checks specific program paths (Antigravity, VS Code, Chrome, etc.)."""
        results = []
        user_profile = os.environ.get("USERPROFILE", "")
        
        known_locations = [
            (
                "Antigravity IDE",
                os.path.join(user_profile, r"AppData\Local\Programs\Antigravity IDE\Antigravity IDE.exe"),
                ["antigravity", "antigravity ide", "antigravity-ide", "gemini ide"]
            ),
            (
                "Visual Studio Code",
                os.path.join(user_profile, r"AppData\Local\Programs\Microsoft VS Code\Code.exe"),
                ["vscode", "vs code", "code", "visual studio code", "code editor"]
            ),
            (
                "Google Chrome",
                r"C:\Program Files\Google\Chrome\Application\chrome.exe",
                ["chrome", "google chrome", "browser"]
            ),
            (
                "Google Chrome (x86)",
                r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
                ["chrome", "google chrome", "browser"]
            )
        ]

        for name, path, aliases in known_locations:
            if os.path.exists(path):
                results.append({
                    "name": name,
                    "display_name": name,
                    "executable": os.path.basename(path),
                    "path": path,
                    "source": "Program Directory Scan",
                    "aliases": aliases
                })

        return results

# Global Discovery Instance
app_discovery_service = ApplicationDiscoveryService()
