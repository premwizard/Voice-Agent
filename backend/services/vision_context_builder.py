from schemas.image import VisionAnalysisResponse
from schemas.ocr import OCRResult

class VisionContextBuilder:
    def build_context_from_vision(self, vision_responses: list[VisionAnalysisResponse]) -> str:
        if not vision_responses:
            return ""
            
        context_parts = ["\n[Image Context Provided by Vision System]"]
        for idx, resp in enumerate(vision_responses):
            context_parts.append(f"Image {idx+1}: {resp.description}")
            if resp.labels:
                context_parts.append(f"Detected Labels: {', '.join(resp.labels)}")
                
        return "\n".join(context_parts)

    def build_context_from_ocr(self, ocr_responses: list[OCRResult]) -> str:
        if not ocr_responses:
            return ""
            
        context_parts = ["\n[Document/OCR Context]"]
        for idx, resp in enumerate(ocr_responses):
            context_parts.append(f"Document {idx+1} Text Extract:\n{resp.full_text}")
            
        return "\n".join(context_parts)
        
vision_context_builder = VisionContextBuilder()
