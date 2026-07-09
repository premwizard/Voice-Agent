from typing import Dict, Any
from agents.base_agent import BaseAgent

class CriticAgent(BaseAgent):
    def __init__(self):
        super().__init__("CriticAgent")
    async def run(self, instruction: str, context: Dict[str, Any], workflow_id: str) -> Any:
        return "Critic review complete"
critic_agent = CriticAgent()
