import abc
import logging
from typing import Dict, Any
from schemas.workflow import Task
from services.shared_context import shared_context
from providers import get_provider

class BaseAgent(abc.ABC):
    def __init__(self, name: str):
        self.name = name
        self.logger = logging.getLogger(f"Agent.{name}")
        
    async def execute(self, task: Task, workflow_id: str):
        self.logger.info(f"Executing task {task.id}")
        
        # Pull context from shared memory
        context_data = {key: shared_context.get(workflow_id, key) for key in task.context_keys}
        
        # Execute subclass logic
        result = await self.run(task.instruction, context_data, workflow_id)
        
        # Save result
        task.result = result
        # Also store output back into shared context
        shared_context.set(workflow_id, f"{task.id}_result", result)

    @abc.abstractmethod
    async def run(self, instruction: str, context: Dict[str, Any], workflow_id: str) -> Any:
        pass
        
    def get_provider(self):
        return get_provider()
