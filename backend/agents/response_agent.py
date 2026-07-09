from typing import Dict, Any
from agents.base_agent import BaseAgent

class ResponseAgent(BaseAgent):
    def __init__(self):
        super().__init__("ResponseAgent")

    async def run(self, instruction: str, context: Dict[str, Any], workflow_id: str) -> Any:
        provider = self.get_provider()
        provider.initialize()
        
        # Merge context logically
        context_str = "\n".join([f"{k}: {v}" for k, v in context.items()])
        full_prompt = f"Instruction: {instruction}\n\nContext:\n{context_str}"
        
        system_prompt = "You are the Response Agent. Synthesize the context into a final coherent answer."
        
        full_response = ""
        # Assuming provider.stream streams text. For the orchestrator to pass chunks to WS,
        # it usually reads from a queue. Here we just aggregate or we'll need to yield.
        # For this version, we will aggregate.
        async for chunk in provider.stream(prompt=full_prompt, system_prompt=system_prompt, history=[]):
            full_response += chunk
            
        return full_response

response_agent = ResponseAgent()
