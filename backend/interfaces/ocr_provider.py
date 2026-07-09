from abc import ABC, abstractmethod
from schemas.ocr import OCRResult

class OCRProvider(ABC):
    @abstractmethod
    async def extract_text(self, media_id: str, file_path: str) -> OCRResult:
        """Extract text from an image or document."""
        pass
