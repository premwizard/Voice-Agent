from typing import Dict, Any
from agents.base_agent import BaseAgent

class ResearchAgent(BaseAgent):
    def __init__(self):
        super().__init__("ResearchAgent")

    async def run(self, instruction: str, context: Dict[str, Any], workflow_id: str) -> Any:
        provider = self.get_provider()
        provider.initialize()
        full_response = ""
        system_prompt = "You are the Research Agent. Use RAG to answer the instruction. Output facts and findings."
        async for chunk in provider.stream(prompt=instruction, system_prompt=system_prompt, history=[]):
            full_response += chunk
        return full_response

research_agent = ResearchAgent()
