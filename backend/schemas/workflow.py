from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class Task(BaseModel):
    id: str
    agent_name: str
    instruction: str
    dependencies: List[str] = Field(default_factory=list) # IDs of tasks that must complete first
    context_keys: List[str] = Field(default_factory=list) # Keys to pull from shared context
    status: str = "pending" # pending, running, completed, failed
    result: Optional[Any] = None
    retry_count: int = 0
    max_retries: int = 3
    timeout_seconds: int = 60

class TaskGraph(BaseModel):
    id: str
    tasks: Dict[str, Task] = Field(default_factory=dict)
    status: str = "pending" # pending, running, completed, failed
    
    def get_executable_tasks(self) -> List[Task]:
        """Returns tasks that are pending and have all dependencies completed."""
        executable = []
        for task in self.tasks.values():
            if task.status == "pending":
                can_run = all(self.tasks[dep].status == "completed" for dep in task.dependencies)
                if can_run:
                    executable.append(task)
        return executable

    def is_complete(self) -> bool:
        return all(t.status == "completed" for t in self.tasks.values())
        
    def has_failed(self) -> bool:
        return any(t.status == "failed" for t in self.tasks.values())
