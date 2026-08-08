# ==============================================================================
# FILE: backend/tests/test_permissions.py
# WHAT THIS FILE IS: Unit Test Suite for Security & Permissions Layer.
# WHY IT IS USED: Validates permission classification (SAFE, SENSITIVE, DANGEROUS)
#                 and verifies that dangerous actions require explicit confirmation.
# ==============================================================================

import unittest
from core.permissions import evaluate_permission, get_tool_permission_level, PermissionLevel

class TestPermissions(unittest.TestCase):
    def test_permission_classification(self):
        self.assertEqual(get_tool_permission_level("open_application"), PermissionLevel.SAFE)
        self.assertEqual(get_tool_permission_level("get_system_telemetry"), PermissionLevel.SAFE)
        self.assertEqual(get_tool_permission_level("terminate_process"), PermissionLevel.SENSITIVE)
        self.assertEqual(get_tool_permission_level("shutdown_system"), PermissionLevel.DANGEROUS)
        self.assertEqual(get_tool_permission_level("restart_system"), PermissionLevel.DANGEROUS)

    def test_safe_tool_evaluation(self):
        eval_res = evaluate_permission("open_application", {"application": "chrome"}, user_confirmed=False)
        self.assertTrue(eval_res["allowed"])
        self.assertFalse(eval_res["requires_confirmation"])

    def test_dangerous_tool_without_confirmation(self):
        eval_res = evaluate_permission("shutdown_system", {}, user_confirmed=False)
        self.assertFalse(eval_res["allowed"])
        self.assertTrue(eval_res["requires_confirmation"])

    def test_dangerous_tool_with_confirmation(self):
        eval_res = evaluate_permission("shutdown_system", {}, user_confirmed=True)
        self.assertTrue(eval_res["allowed"])
        self.assertFalse(eval_res["requires_confirmation"])

if __name__ == "__main__":
    unittest.main()
