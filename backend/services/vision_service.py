from interfaces.vision_provider import VisionProvider
from schemas.image import VisionAnalysisRequest, VisionAnalysisResponse
from config.settings import settings
import logging

logger = logging.getLogger(__name__)

class VisionService:
    def __init__(self):
        self.provider: VisionProvider | None = None

    def register_provider(self, provider: VisionProvider):
        self.provider = provider

    async def analyze_image(self, media_id: str, file_path: str, prompt: str = None) -> VisionAnalysisResponse:
        if not settings.enable_vision:
            logger.info("Vision is disabled in settings.")
            return VisionAnalysisResponse(media_id=media_id, description="Vision disabled.")
            
        if not self.provider:
            logger.warning("No vision provider registered.")
            return VisionAnalysisResponse(media_id=media_id, description="No vision provider configured.")
            
        request = VisionAnalysisRequest(media_id=media_id, prompt=prompt)
        return await self.provider.analyze_image(request, file_path)

vision_service = VisionService()
