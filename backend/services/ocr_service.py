from interfaces.ocr_provider import OCRProvider
from schemas.ocr import OCRResult
from config.settings import settings
import logging

logger = logging.getLogger(__name__)

class OCRService:
    def __init__(self):
        self.provider: OCRProvider | None = None

    def register_provider(self, provider: OCRProvider):
        self.provider = provider

    async def extract_text(self, media_id: str, file_path: str) -> OCRResult:
        if not settings.enable_ocr:
            logger.info("OCR is disabled in settings.")
            return OCRResult(media_id=media_id, full_text="OCR disabled.")
            
        if not self.provider:
            logger.warning("No OCR provider registered.")
            return OCRResult(media_id=media_id, full_text="No OCR provider configured.")
            
        return await self.provider.extract_text(media_id, file_path)

ocr_service = OCRService()
