# ==============================================================================
# FILE: backend/tests/test_vision.py
# WHAT THIS FILE IS: Unit Test Suite for Vision & Screen Inspection Engine.
# WHY IT IS USED: Verifies Win32 active window title inspection and screen capture.
# ==============================================================================

import unittest
from tools.vision import screen_vision

class TestScreenVision(unittest.TestCase):
    def test_get_active_window_info(self):
        info = screen_vision.get_active_window_info()
        self.assertIsInstance(info, dict)
        self.assertIn("success", info)
        if info["success"]:
            self.assertIn("title", info)
            self.assertIn("pid", info)

    def test_screen_analysis_structure(self):
        analysis = screen_vision.analyze_screen("What is on screen?")
        self.assertTrue(analysis["success"])
        self.assertIn("active_window", analysis)
        self.assertIn("analysis", analysis)

if __name__ == "__main__":
    unittest.main()
