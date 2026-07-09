import asyncio
import logging
import time
from typing import Callable, Awaitable, Dict
from schemas.workflow import TaskGraph, Task
from schemas.agent import AgentStatusUpdate
from services.trace_service import trace_service

logger = logging.getLogger(__name__)

class WorkflowEngine:
    def __init__(self):
        # Maps agent_name to an async function that executes the task
        self.agent_registry: Dict[str, Callable[[Task, str], Awaitable[None]]] = {}
        # Callback for streaming status
        self.status_callback: Callable[[AgentStatusUpdate], Awaitable[None]] = None
        
    def register_agent(self, agent_name: str, handler: Callable[[Task, str], Awaitable[None]]):
        self.agent_registry[agent_name] = handler
        
    def set_status_callback(self, callback: Callable[[AgentStatusUpdate], Awaitable[None]]):
        self.status_callback = callback
        
    async def _emit_status(self, task: Task, status: str, detail: str = None):
        task.status = status
        if self.status_callback:
            await self.status_callback(AgentStatusUpdate(
                agent_name=task.agent_name,
                task_id=task.id,
                status=status,
                detail=detail
            ))
            
    async def execute_graph(self, graph: TaskGraph, workflow_id: str):
        graph.status = "running"
        
        while not graph.is_complete() and not graph.has_failed():
            executable_tasks = graph.get_executable_tasks()
            
            if not executable_tasks:
                # If there are no executable tasks but we aren't complete/failed,
                # we might have a cycle or we're waiting on running tasks.
                # Just wait briefly.
                await asyncio.sleep(0.5)
                continue
                
            # Execute tasks in parallel
            execution_coros = []
            for task in executable_tasks:
                execution_coros.append(self._execute_task(task, workflow_id))
                
            await asyncio.gather(*execution_coros)
            
        if graph.has_failed():
            graph.status = "failed"
        else:
            graph.status = "completed"

    async def _execute_task(self, task: Task, workflow_id: str):
        handler = self.agent_registry.get(task.agent_name)
        if not handler:
            await self._emit_status(task, "failed", f"Agent {task.agent_name} not found")
            return
            
        await self._emit_status(task, "running", "Started execution")
        
        while task.retry_count <= task.max_retries:
            try:
                # Execute agent handler with timeout
                with trace_service.Span(name=f"task_{task.id}_{task.agent_name}", metadata={"workflow_id": workflow_id}):
                    await asyncio.wait_for(handler(task, workflow_id), timeout=task.timeout_seconds)
                await self._emit_status(task, "completed", "Task completed successfully")
                return
            except asyncio.TimeoutError:
                task.retry_count += 1
                logger.warning(f"Task {task.id} timed out. Retry {task.retry_count}/{task.max_retries}")
                await self._emit_status(task, "retrying", "Timeout, retrying...")
            except Exception as e:
                task.retry_count += 1
                logger.error(f"Task {task.id} failed: {e}")
                await self._emit_status(task, "retrying", f"Error: {e}. Retrying...")
                
        # If we exhausted retries
        await self._emit_status(task, "failed", "Exhausted retries")

workflow_engine = WorkflowEngine()
