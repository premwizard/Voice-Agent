import json
from typing import Dict, Any
from agents.base_agent import BaseAgent
from schemas.workflow import TaskGraph, Task
import uuid

class PlannerAgent(BaseAgent):
    def __init__(self):
        super().__init__("PlannerAgent")

    async def run(self, instruction: str, context: Dict[str, Any], workflow_id: str) -> Any:
        provider = self.get_provider()
        
        system_prompt = """
        You are the Planner Agent. Your job is to break the user's request into a Directed Acyclic Graph (DAG) of tasks.
        Available agents:
        - ResearchAgent: Searches RAG or knowledge bases.
        - ToolAgent: Executes external MCP tools or internal functions.
        - MemoryAgent: Retrieves past conversation context.
        - VisionAgent: Analyzes images.
        - CodeAgent: Explains or generates code.
        - CriticAgent: Reviews output for hallucinations.
        - ResponseAgent: Formats the final answer to the user.
        
        Output MUST be valid JSON matching this schema:
        {
            "tasks": [
                {
                    "id": "task_1",
                    "agent_name": "ResearchAgent",
                    "instruction": "Search for X",
                    "dependencies": []
                },
                ...
            ]
        }
        Do not wrap in markdown blocks, output raw JSON.
        """
        
        # Simple non-streaming call to get JSON
        # Since we just have a streaming provider right now, we can aggregate it.
        # But our provider.stream() might not easily support non-streaming, let's collect it.
        provider.initialize()
        full_response = ""
        async for chunk in provider.stream(prompt=instruction, system_prompt=system_prompt, history=[]):
            full_response += chunk
            
        full_response = full_response.strip().replace("```json", "").replace("```", "").strip()
        
        try:
            plan_data = json.loads(full_response)
        except json.JSONDecodeError:
            self.logger.error(f"Failed to parse DAG: {full_response}")
            # Fallback DAG
            plan_data = {
                "tasks": [
                    {"id": "t1", "agent_name": "ResponseAgent", "instruction": instruction, "dependencies": []}
                ]
            }
            
        # We don't execute the DAG here; we just return it so the Orchestrator can feed it to the Engine.
        return plan_data

planner_agent = PlannerAgent()
