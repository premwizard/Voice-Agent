# ==============================================================================
# FILE: backend/tests/test_tool_calling.py
# WHAT THIS FILE IS: Unit Test Suite for ToolRegistry & AI Tool Caller.
# WHY IT IS USED: Verifies tool schema registration, permission evaluation,
#                 tool execution, structured logging, and intent processing.
# ==============================================================================

import unittest
from tools.tool_registry import tool_registry
from ai.tool_calling import ai_tool_caller

class TestToolCalling(unittest.TestCase):
    def test_registered_schemas(self):
        schemas = tool_registry.get_tools_schema()
        self.assertIsInstance(schemas, list)
        self.assertGreater(len(schemas), 0)

        names = [s["name"] for s in schemas]
        self.assertIn("open_application", names)
        self.assertIn("get_system_telemetry", names)
        self.assertIn("shutdown_system", names)

    def test_safe_tool_execution(self):
        res = tool_registry.execute("get_cpu_usage", user_request="Check CPU")
        self.assertTrue(res["success"])
        self.assertEqual(res["tool"], "get_cpu_usage")
        self.assertEqual(res["permission_level"], "SAFE")
        self.assertIn("execution_time_ms", res)

    def test_dangerous_tool_blocked_without_confirmation(self):
        res = tool_registry.execute("shutdown_system", user_request="Shutdown PC", user_confirmed=False)
        self.assertFalse(res["success"])
        self.assertTrue(res["requires_confirmation"])
        self.assertEqual(res["permission_level"], "DANGEROUS")

    def test_intent_processing_open_app(self):
        spec, res = ai_tool_caller.process_request("Open Notepad")
        self.assertIsNotNone(spec)
        self.assertEqual(spec["tool"], "open_application")
        self.assertEqual(spec["arguments"]["application"].lower(), "notepad")
        self.assertIsNotNone(res)
        self.assertTrue(res["success"])

    def test_intent_processing_telemetry(self):
        spec, res = ai_tool_caller.process_request("How much RAM am I using?")
        self.assertIsNotNone(spec)
        self.assertEqual(spec["tool"], "get_memory_usage")
        self.assertIsNotNone(res)
        self.assertTrue(res["success"])

    def test_volume_stt_mishearing_fix(self):
        parsed = ai_tool_caller.parse_volume_level("reduce my volume 250")
        self.assertEqual(parsed, 50)

        spec, res = ai_tool_caller.process_request("reduce my volume 250")
        self.assertIsNotNone(spec)
        self.assertEqual(spec["tool"], "set_master_volume")
        self.assertEqual(spec["arguments"]["level_percent"], 50)
        self.assertTrue(res["success"])

if __name__ == "__main__":
    unittest.main()
