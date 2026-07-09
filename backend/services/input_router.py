import logging
from typing import Dict, Any, List
from services.media_manager import media_manager
from services.vision_service import vision_service
from services.ocr_service import ocr_service

logger = logging.getLogger(__name__)

class InputRouter:
    async def process_inputs(self, conversation_id: str, text_content: str, media_ids: List[str]) -> Dict[str, Any]:
        """
        Takes raw text and media IDs, fetches the media metadata, routes them to
        Vision or OCR services if needed, and returns the unified context and results.
        """
        vision_results = []
        ocr_results = []
        
        for media_id in media_ids:
            media_item = await media_manager.get_media_item(media_id)
            if not media_item:
                logger.warning(f"Media item {media_id} not found.")
                continue
                
            mime_type = media_item.mime_type
            file_path = media_item.file_path
            
            # Simple routing logic based on mime type
            if mime_type.startswith("image/"):
                logger.info(f"Routing {media_id} to Vision Service")
                # Trigger vision
                v_res = await vision_service.analyze_image(media_id, file_path, prompt=text_content)
                vision_results.append(v_res)
                
                # Also trigger OCR on images if auto_ocr is true (could be configured)
                o_res = await ocr_service.extract_text(media_id, file_path)
                ocr_results.append(o_res)
                
            elif mime_type == "application/pdf" or mime_type.startswith("text/"):
                logger.info(f"Routing {media_id} to OCR/Document Service")
                o_res = await ocr_service.extract_text(media_id, file_path)
                ocr_results.append(o_res)
                
        return {
            "vision_results": vision_results,
            "ocr_results": ocr_results
        }

input_router = InputRouter()
