# ==============================================================================
# FILE: backend/core/command_router.py
# WHAT THIS FILE IS: Intelligent Fast-Path Command Router & Intent Classifier.
# WHY IT IS USED: Classifies prompts into FAST_PATH, CHAT, or COMPLEX_TASK routes.
#                 High-confidence local commands (set volume, open app, lock PC, check stats)
#                 bypass LLM reasoning to execute in under 50ms.
# ==============================================================================

from enum import Enum
from typing import Dict, Any
from core.latency import LatencyTracker
from ai.tool_calling import ai_tool_caller

class RouteTarget(str, Enum):
    FAST_PATH = "FAST_PATH"      # Sub-50ms local tool execution (volume, apps, stats)
    CHAT = "CHAT"                # LLM conversation streaming
    COMPLEX_TASK = "COMPLEX_TASK"# Agent multi-step workflow

class CommandRouter:
    @staticmethod
    def classify_and_route(
        user_prompt: str, 
        user_confirmed: bool = False
    ) -> Dict[str, Any]:
        """
        Classifies user prompt and routes to FAST_PATH execution or LLM CHAT.
        
        Returns structured payload:
          {
            "route": "FAST_PATH" | "CHAT" | "COMPLEX_TASK",
            "confidence": "HIGH" | "MEDIUM" | "LOW",
            "executed": bool,
            "result": Optional[Dict[str, Any]],
            "latency_metrics": Dict[str, Any]
          }
        """
        tracker = LatencyTracker()

        # Fast Intent Routing Check
        tool_spec, tool_result = ai_tool_caller.process_request(user_prompt, user_confirmed=user_confirmed)
        tracker.mark_stage("intent_classification_ms")

        if tool_spec and tool_result:
            tracker.mark_stage("tool_execution_ms")
            summary = tracker.get_summary()

            return {
                "route": RouteTarget.FAST_PATH.value,
                "confidence": "HIGH",
                "executed": True,
                "tool": tool_spec["tool"],
                "arguments": tool_spec["arguments"],
                "result": tool_result,
                "latency_metrics": summary,
                "message": tool_result.get("message", "Executed command on fast path.")
            }

        # Otherwise route to LLM CHAT
        tracker.mark_stage("route_determination_ms")
        summary = tracker.get_summary()

        return {
            "route": RouteTarget.CHAT.value,
            "confidence": "MEDIUM",
            "executed": False,
            "result": None,
            "latency_metrics": summary,
            "message": "Prompt routed to AI conversation stream."
        }

command_router = CommandRouter()
