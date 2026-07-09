from typing import List, Dict, Any
from langchain_text_splitters import RecursiveCharacterTextSplitter, CharacterTextSplitter
from config.settings import settings
import logging

logger = logging.getLogger(__name__)

class ChunkingService:
    @staticmethod
    def chunk_text(text: str, chunk_size: int = None, chunk_overlap: int = None, strategy: str = "recursive") -> List[str]:
        """
        Split text into chunks using Langchain splitters.
        Supports 'recursive' or 'character' strategy.
        """
        c_size = chunk_size or settings.chunk_size
        c_overlap = chunk_overlap or settings.chunk_overlap
        
        try:
            if strategy == "recursive":
                splitter = RecursiveCharacterTextSplitter(
                    chunk_size=c_size,
                    chunk_overlap=c_overlap,
                    separators=["\n\n", "\n", " ", ""]
                )
            else:
                # Fixed size fallback
                splitter = CharacterTextSplitter(
                    separator="\n",
                    chunk_size=c_size,
                    chunk_overlap=c_overlap
                )
                
            chunks = splitter.split_text(text)
            logger.info(f"Split text into {len(chunks)} chunks.")
            return chunks
        except Exception as e:
            logger.error(f"Failed to chunk text: {e}")
            # Fallback to simple split if splitter fails
            return [text[i:i+c_size] for i in range(0, len(text), c_size - c_overlap)]

