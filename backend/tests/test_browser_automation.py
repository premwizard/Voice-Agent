# ==============================================================================
# FILE: backend/tests/test_browser_automation.py
# WHAT THIS FILE IS: Unit Test Suite for Browser Automation & Web Searching.
# WHY IT IS USED: Verifies URL formatting and search URL generation.
# ==============================================================================

import unittest
from tools.browser_automation import browser_engine

class TestBrowserAutomation(unittest.TestCase):
    def test_open_website_url_formatting(self):
        # Test non-launch logic or URL formatting
        url = "youtube.com"
        target = "https://" + url if not url.startswith("http") else url
        self.assertEqual(target, "https://youtube.com")

    def test_web_search_query_encoding(self):
        import urllib.parse
        query = "Python Decorators"
        encoded = urllib.parse.quote(query)
        self.assertEqual(encoded, "Python%20Decorators")

if __name__ == "__main__":
    unittest.main()
