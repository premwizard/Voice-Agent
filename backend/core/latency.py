# ==============================================================================
# FILE: backend/core/latency.py
# WHAT THIS FILE IS: Performance & Latency Instrumentation Tracker.
# WHY IT IS USED: Measures stage timing (STT, Command Router, Tool Execution, LLM, Total)
#                 in milliseconds to benchmark and guarantee sub-50ms execution for local tools.
# ==============================================================================

import time
from typing import Dict, Any

class LatencyTracker:
    def __init__(self):
        self.start_time = time.time()
        self.stages: Dict[str, float] = {}

    def mark_stage(self, stage_name: str):
        """Records elapsed duration up to this stage in milliseconds."""
        now = time.time()
        elapsed_ms = (now - self.start_time) * 1000
        self.stages[stage_name] = round(elapsed_ms, 2)

    def get_summary(self) -> Dict[str, Any]:
        """Returns structured timing metrics."""
        now = time.time()
        total_ms = (now - self.start_time) * 1000
        metrics = {
            "total_latency_ms": round(total_ms, 2),
            "stages": self.stages
        }
        return metrics
