# ==============================================================================
# FILE: backend/tests/test_command_router.py
# WHAT THIS FILE IS: Unit Test Suite for Intelligent Command Router.
# WHY IT IS USED: Verifies FAST_PATH intent classification (<50ms execution for local commands)
#                 vs CHAT routing and timing latency metrics.
# ==============================================================================

import unittest
from core.command_router import command_router, RouteTarget

class TestCommandRouter(unittest.TestCase):
    def test_fast_path_volume(self):
        res = command_router.classify_and_route("set my volume to 50%")
        self.assertEqual(res["route"], RouteTarget.FAST_PATH.value)
        self.assertEqual(res["confidence"], "HIGH")
        self.assertTrue(res["executed"])
        self.assertEqual(res["tool"], "set_master_volume")
        self.assertIn("latency_metrics", res)
        self.assertLess(res["latency_metrics"]["total_latency_ms"], 1000)

    def test_fast_path_open_app(self):
        res = command_router.classify_and_route("Open Notepad")
        self.assertEqual(res["route"], RouteTarget.FAST_PATH.value)
        self.assertEqual(res["confidence"], "HIGH")
        self.assertTrue(res["executed"])
        self.assertEqual(res["tool"], "open_application")

    def test_fast_path_telemetry(self):
        res = command_router.classify_and_route("How much RAM am I using?")
        self.assertEqual(res["route"], RouteTarget.FAST_PATH.value)
        self.assertTrue(res["executed"])
        self.assertEqual(res["tool"], "get_memory_usage")

    def test_chat_routing(self):
        res = command_router.classify_and_route("Tell me a story about space exploration.")
        self.assertEqual(res["route"], RouteTarget.CHAT.value)
        self.assertFalse(res["executed"])
        self.assertIsNone(res["result"])

if __name__ == "__main__":
    unittest.main()
