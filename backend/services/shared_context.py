from typing import Dict, Any

class SharedContext:
    def __init__(self):
        # Maps workflow_id -> context dictionary
        self._contexts: Dict[str, Dict[str, Any]] = {}
        
    def init_workflow(self, workflow_id: str, initial_data: Dict[str, Any] = None):
        self._contexts[workflow_id] = initial_data or {}
        
    def get(self, workflow_id: str, key: str) -> Any:
        return self._contexts.get(workflow_id, {}).get(key)
        
    def set(self, workflow_id: str, key: str, value: Any):
        if workflow_id not in self._contexts:
            self._contexts[workflow_id] = {}
        self._contexts[workflow_id][key] = value
        
    def get_all(self, workflow_id: str) -> Dict[str, Any]:
        return self._contexts.get(workflow_id, {})
        
    def cleanup(self, workflow_id: str):
        if workflow_id in self._contexts:
            del self._contexts[workflow_id]

shared_context = SharedContext()
