import asyncio
import logging
import uuid
from typing import Callable, Awaitable
from schemas.workflow import TaskGraph, Task
from schemas.agent import AgentStatusUpdate
from services.workflow_engine import workflow_engine
from services.shared_context import shared_context
from agents.planner_agent import planner_agent
from agents.research_agent import research_agent
from agents.tool_agent import tool_agent
from agents.memory_agent import memory_agent
from agents.vision_agent import vision_agent
from agents.code_agent import code_agent
from agents.critic_agent import critic_agent
from agents.response_agent import response_agent
from services.trace_service import trace_service

logger = logging.getLogger(__name__)

class AgentOrchestrator:
    def __init__(self):
        self.register_agents()
        
    def register_agents(self):
        workflow_engine.register_agent("PlannerAgent", planner_agent.execute)
        workflow_engine.register_agent("ResearchAgent", research_agent.execute)
        workflow_engine.register_agent("ToolAgent", tool_agent.execute)
        workflow_engine.register_agent("MemoryAgent", memory_agent.execute)
        workflow_engine.register_agent("VisionAgent", vision_agent.execute)
        workflow_engine.register_agent("CodeAgent", code_agent.execute)
        workflow_engine.register_agent("CriticAgent", critic_agent.execute)
        workflow_engine.register_agent("ResponseAgent", response_agent.execute)

    async def execute(self, instruction: str, status_callback: Callable[[AgentStatusUpdate], Awaitable[None]]) -> str:
        with trace_service.Span(name="agent_orchestrator", metadata={"instruction": instruction}):
            workflow_id = str(uuid.uuid4())
            workflow_engine.set_status_callback(status_callback)
            
            shared_context.init_workflow(workflow_id, {"initial_instruction": instruction})
            
            # 1. Ask Planner to generate DAG
            await status_callback(AgentStatusUpdate(
                agent_name="PlannerAgent", task_id="planning", status="running", detail="Analyzing intent and generating DAG"
            ))
            
            with trace_service.Span(name="planner_agent", metadata={"workflow_id": workflow_id}):
                dag_dict = await planner_agent.run(instruction, {}, workflow_id)
            
            # Parse DAG
        graph = TaskGraph(id=workflow_id)
        for t_dict in dag_dict.get("tasks", []):
            task = Task(**t_dict)
            graph.tasks[task.id] = task
            
        await status_callback(AgentStatusUpdate(
            agent_name="PlannerAgent", task_id="planning", status="completed", detail=f"Generated {len(graph.tasks)} tasks"
        ))

        # 2. Execute DAG via Workflow Engine
        await workflow_engine.execute_graph(graph, workflow_id)
        
        # 3. Aggregate Final Output
        # The final task should ideally be the ResponseAgent, so we grab its output.
        # Alternatively, we just collect all outputs and return them if ResponseAgent failed or wasn't scheduled.
        
        final_output = ""
        for t_id, task in graph.tasks.items():
            if task.agent_name == "ResponseAgent" and task.result:
                final_output = task.result
                break
                
        if not final_output:
            # Fallback
            final_output = "Workflow completed but no final response was generated."
            
        shared_context.cleanup(workflow_id)
        return final_output

agent_orchestrator = AgentOrchestrator()
