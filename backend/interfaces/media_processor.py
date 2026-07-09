from abc import ABC, abstractmethod
from typing import Any

class MediaProcessor(ABC):
    @abstractmethod
    async def process(self, file_path: str, metadata: dict) -> Any:
        """Process a media file and return relevant data."""
        pass
