from abc import ABC, abstractmethod
from typing import AsyncGenerator

class Provider(ABC):
    @abstractmethod
    def initialize(self):
        """Initialize the provider (e.g., set up clients)."""
        pass

    @abstractmethod
    async def generate(self, prompt: str, system_prompt: str, history: list) -> str:
        """Generate a complete response."""
        pass

    @abstractmethod
    async def stream(self, prompt: str, system_prompt: str, history: list) -> AsyncGenerator[str, None]:
        """Stream a response back."""
        pass

    @abstractmethod
    async def health_check(self) -> bool:
        """Check if the provider is healthy/reachable."""
        pass
