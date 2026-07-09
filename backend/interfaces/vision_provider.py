from abc import ABC, abstractmethod
from schemas.image import VisionAnalysisRequest, VisionAnalysisResponse

class VisionProvider(ABC):
    @abstractmethod
    async def analyze_image(self, request: VisionAnalysisRequest, file_path: str) -> VisionAnalysisResponse:
        """Analyze an image and return a description and labels."""
        pass
