# ==============================================================================
# FILE: backend/tools/applications/launcher.py
# WHAT THIS FILE IS: Fast Asynchronous Windows Application Launcher.
# WHY IT IS USED: Launches Windows shortcuts (.lnk) and executables (.exe) 
#                 immediately without blocking the FastAPI server thread or chaining 
#                 through unnecessary PowerShell/subprocess loops.
# ==============================================================================

import os
import sys
import subprocess
from typing import Dict, Any

class ApplicationLauncher:
    @staticmethod
    def launch(app_entry: Dict[str, Any]) -> Dict[str, Any]:
        """
        Launches an application entry asynchronously.
        
        Returns:
          {
            "success": bool,
            "application": str,
            "path": str,
            "message": str
          }
        """
        app_name = app_entry.get("display_name", app_entry.get("name", "Unknown Application"))
        target_path = app_entry.get("path") or app_entry.get("executable") or ""

        if not target_path:
            return {
                "success": False,
                "application": app_name,
                "path": "",
                "message": f"Cannot launch '{app_name}': Invalid executable target path."
            }

        try:
            sys_os = sys.platform
            if sys_os == "win32":
                # If valid shortcut or executable path exists on disk, use os.startfile for instant OS shell launch
                if os.path.exists(target_path):
                    os.startfile(target_path)
                else:
                    # Fallback for PATH binaries (e.g. notepad.exe, calc.exe)
                    subprocess.Popen([target_path], shell=False, creationflags=subprocess.DETACHED_PROCESS | subprocess.CREATE_NEW_PROCESS_GROUP)
            elif sys_os == "darwin":
                subprocess.Popen(["open", "-a", target_path])
            else:
                subprocess.Popen([target_path], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

            return {
                "success": True,
                "application": app_name,
                "path": target_path,
                "message": f"Successfully launched application '{app_name}'."
            }
        except Exception as e:
            return {
                "success": False,
                "application": app_name,
                "path": target_path,
                "message": f"Failed to launch application '{app_name}': {str(e)}"
            }

app_launcher = ApplicationLauncher()
