from typing import List, Dict
from config.settings import settings

class SessionMemory:
    def __init__(self):
        self.history: List[Dict[str, str]] = []
        
    def add_user_message(self, content: str):
        self.history.append({"role": "user", "content": content})
        self._trim_history()
        
    def add_ai_message(self, content: str):
        self.history.append({"role": "assistant", "content": content})
        self._trim_history()
        
    def get_history(self) -> List[Dict[str, str]]:
        return self.history
        
    def clear(self):
        self.history = []
        
    def _trim_history(self):
        if len(self.history) > settings.max_history * 2:
            # keep the last N exchanges
            self.history = self.history[-(settings.max_history * 2):]
