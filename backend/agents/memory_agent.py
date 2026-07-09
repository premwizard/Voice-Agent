from typing import Dict, Any
from agents.base_agent import BaseAgent

class MemoryAgent(BaseAgent):
    def __init__(self):
        super().__init__("MemoryAgent")
    async def run(self, instruction: str, context: Dict[str, Any], workflow_id: str) -> Any:
        provider = self.get_provider()
        provider.initialize()
        full_response = ""
        system_prompt = "You are the Memory Agent. Retrieve context from past interactions."
        async for chunk in provider.stream(prompt=instruction, system_prompt=system_prompt, history=[]):
            full_response += chunk
        return full_response

memory_agent = MemoryAgent()
