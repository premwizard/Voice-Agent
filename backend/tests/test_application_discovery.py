# ==============================================================================
# FILE: backend/tests/test_application_discovery.py
# WHAT THIS FILE IS: Unit Test Suite for Application Discovery Service.
# WHY IT IS USED: Verifies installed application indexing from Start Menu, Registry,
#                 and built-in tools.
# ==============================================================================

import unittest
from tools.applications.discovery import app_discovery_service

class TestApplicationDiscovery(unittest.TestCase):
    def test_discovery_returns_applications(self):
        apps = app_discovery_service.get_installed_applications()
        self.assertIsInstance(apps, list)
        self.assertGreater(len(apps), 0)

    def test_built_in_tools_present(self):
        apps = app_discovery_service.get_installed_applications()
        names = [a["display_name"].lower() for a in apps]
        self.assertIn("notepad", names)
        self.assertIn("calculator", names)

    def test_application_entry_structure(self):
        apps = app_discovery_service.get_installed_applications()
        first_app = apps[0]
        self.assertIn("name", first_app)
        self.assertIn("display_name", first_app)
        self.assertIn("executable", first_app)
        self.assertIn("path", first_app)
        self.assertIn("source", first_app)
        self.assertIn("aliases", first_app)

if __name__ == "__main__":
    unittest.main()
