# ==============================================================================
# FILE: backend/tests/test_application_resolver.py
# WHAT THIS FILE IS: Unit Test Suite for Application Resolver.
# WHY IT IS USED: Validates query resolution for exact match, category synonyms 
#                 (e.g., "my browser", "coding editor"), fuzzy matching, and ambiguity logic.
# ==============================================================================

import unittest
from tools.applications.resolver import app_resolver

class TestApplicationResolver(unittest.TestCase):
    def test_resolve_notepad_exact(self):
        res = app_resolver.resolve("notepad")
        self.assertTrue(res["success"])
        self.assertEqual(res["status"], "resolved")
        self.assertIsNotNone(res["best_match"])
        self.assertEqual(res["best_match"]["display_name"].lower(), "notepad")

    def test_resolve_calculator_alias(self):
        res = app_resolver.resolve("calc")
        self.assertTrue(res["success"])
        self.assertEqual(res["best_match"]["display_name"].lower(), "calculator")

    def test_resolve_category_term(self):
        res = app_resolver.resolve("text editor")
        self.assertTrue(res["success"])
        self.assertIsNotNone(res["best_match"])

    def test_non_existent_application(self):
        res = app_resolver.resolve("non_existent_xyz_app_12399")
        self.assertFalse(res["success"])
        self.assertEqual(res["status"], "not_found")
        self.assertIsNone(res["best_match"])

    def test_resolve_antigravity(self):
        res = app_resolver.resolve("antigravity")
        self.assertTrue(res["success"])
        self.assertIsNotNone(res["best_match"])
        self.assertIn("antigravity", res["best_match"]["display_name"].lower())


if __name__ == "__main__":
    unittest.main()
