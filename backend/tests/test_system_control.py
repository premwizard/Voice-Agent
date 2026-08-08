# ==============================================================================
# FILE: backend/tests/test_system_control.py
# WHAT THIS FILE IS: Unit Test Suite for System Controls & Telemetry.
# WHY IT IS USED: Verifies live metric retrieval (CPU, RAM, Disk), volume get/set,
#                 and non-destructive system calls.
# ==============================================================================

import unittest
from tools.system_control import (
    get_detailed_telemetry,
    get_master_volume,
    set_master_volume,
    list_running_processes,
    shutdown_system,
    restart_system
)

class TestSystemControl(unittest.TestCase):
    def test_telemetry_fields(self):
        tel = get_detailed_telemetry()
        self.assertTrue(tel["success"])
        self.assertIn("cpu_usage_percent", tel)
        self.assertIn("ram_used_gb", tel)
        self.assertIn("disk_free_gb", tel)

    def test_volume_controls(self):
        get_res = get_master_volume()
        self.assertTrue(get_res["success"])
        self.assertIn("volume_percent", get_res)

        set_res = set_master_volume(level_percent=40)
        self.assertTrue(set_res["success"])

    def test_running_processes(self):
        proc_res = list_running_processes(limit=5)
        self.assertTrue(proc_res["success"])
        self.assertGreater(len(proc_res["processes"]), 0)

    def test_shutdown_unconfirmed_safety(self):
        sd_res = shutdown_system(confirmed=False)
        self.assertFalse(sd_res["success"])
        self.assertTrue(sd_res["requires_confirmation"])

    def test_restart_unconfirmed_safety(self):
        rst_res = restart_system(confirmed=False)
        self.assertFalse(rst_res["success"])
        self.assertTrue(rst_res["requires_confirmation"])

if __name__ == "__main__":
    unittest.main()
