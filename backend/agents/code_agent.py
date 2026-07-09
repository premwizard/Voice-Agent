from typing import Dict, Any
from agents.base_agent import BaseAgent

class CodeAgent(BaseAgent):
    def __init__(self):
        super().__init__("CodeAgent")
    async def run(self, instruction: str, context: Dict[str, Any], workflow_id: str) -> Any:
        return "Code analysis complete"
code_agent = CodeAgent()
