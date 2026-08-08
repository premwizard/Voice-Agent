# ==============================================================================
# FILE: backend/tests/test_memory.py
# WHAT THIS FILE IS: Unit Test Suite for Persistent SQLite Memory Manager.
# WHY IT IS USED: Verifies saving, retrieving, listing, and deleting memories in SQLite.
# ==============================================================================

import unittest
from memory.memory_manager import memory_manager

class TestMemoryManager(unittest.TestCase):
    def test_remember_and_recall_fact(self):
        save_res = memory_manager.remember_fact("test_project", "D:\\Voice Agent", "paths")
        self.assertTrue(save_res["success"])

        recall_res = memory_manager.recall_fact("test_project")
        self.assertTrue(recall_res["success"])
        self.assertTrue(recall_res["found"])
        self.assertEqual(recall_res["value"], "D:\\Voice Agent")

    def test_list_memories(self):
        memory_manager.remember_fact("pref_browser", "Chrome", "preferences")
        mem_list = memory_manager.list_memories()
        self.assertTrue(mem_list["success"])
        self.assertGreater(len(mem_list["memories"]), 0)

    def test_forget_memory(self):
        memory_manager.remember_fact("temp_key", "temp_val")
        del_res = memory_manager.forget_memory("temp_key")
        self.assertTrue(del_res["success"])

        recall_res = memory_manager.recall_fact("temp_key")
        self.assertFalse(recall_res["found"])

if __name__ == "__main__":
    unittest.main()
