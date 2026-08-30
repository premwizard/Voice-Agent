# ==============================================================================
# FILE: backend/services/system/process_service.py
# WHAT THIS FILE IS: System Process Management Service.
# WHY IT IS USED: Iterates through active processes and safely terminates 
#                 processes by PID or executable name using psutil.
# ==============================================================================

import psutil
from typing import Dict, Any

class ProcessService:
    """Service handling active system process listing and process termination."""

    def list_running_processes(self, limit: int = 15) -> Dict[str, Any]:
        """Returns top active processes ordered by CPU and Memory usage."""
        processes = []
        for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent']):
            try:
                info = proc.info
                if info['name'] and info['cpu_percent'] is not None:
                    processes.append({
                        'pid': info['pid'],
                        'name': info['name'],
                        'cpu_percent': round(info['cpu_percent'], 1),
                        'memory_percent': round(info['memory_percent'] or 0, 1)
                    })
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                pass
                
        sorted_procs = sorted(processes, key=lambda x: x['cpu_percent'], reverse=True)[:limit]
        return {
            "success": True,
            "total_running": len(processes),
            "processes": sorted_procs,
            "message": f"Retrieved top {len(sorted_procs)} running system processes."
        }

    def terminate_process(self, process_name_or_pid: str) -> Dict[str, Any]:
        """Terminates active process by executable name or PID."""
        terminated = []
        target = str(process_name_or_pid).strip().lower()
        
        is_pid = target.isdigit()
        target_pid = int(target) if is_pid else None

        for proc in psutil.process_iter(['pid', 'name']):
            try:
                p_name = proc.info['name'].lower() if proc.info['name'] else ""
                p_pid = proc.info['pid']
                
                if (is_pid and p_pid == target_pid) or (not is_pid and target in p_name):
                    proc.terminate()
                    terminated.append(f"{proc.info['name']} (PID: {p_pid})")
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass
                
        if terminated:
            return {
                "success": True,
                "terminated": terminated,
                "message": f"Successfully terminated process(es): {', '.join(terminated)}."
            }
        else:
            return {
                "success": False,
                "error": "Process not found",
                "message": f"No active process matching '{process_name_or_pid}' was found."
            }

process_service = ProcessService()
