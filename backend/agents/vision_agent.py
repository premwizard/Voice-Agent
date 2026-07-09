from typing import Dict, Any
from agents.base_agent import BaseAgent

class VisionAgent(BaseAgent):
    def __init__(self):
        super().__init__("VisionAgent")
    async def run(self, instruction: str, context: Dict[str, Any], workflow_id: str) -> Any:
        return "Vision analysis complete"
vision_agent = VisionAgent()
