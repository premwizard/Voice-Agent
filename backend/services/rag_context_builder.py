from typing import List, Dict, Any
from config.settings import settings
from providers.embeddings.gemini_embedding import GeminiEmbeddingProvider
from providers.vector_stores.chroma_store import ChromaVectorStore
import logging

logger = logging.getLogger(__name__)

class RAGContextBuilder:
    def __init__(self):
        self.embedding_provider = GeminiEmbeddingProvider()
        self.vector_store = ChromaVectorStore(self.embedding_provider)

    async def build_context(self, query: str) -> str:
        """
        Retrieves relevant chunks and builds a formatted context string.
        """
        if not settings.enable_rag:
            return ""
            
        try:
            results = await self.vector_store.similarity_search(
                query=query,
                top_k=settings.top_k
            )
            
            if not results:
                return ""
                
            # Filter by similarity threshold if supported by score
            filtered_results = []
            for r in results:
                # ChromaDB cosine distance: lower is more similar. 
                # Be careful with thresholds depending on the distance metric used.
                # Assuming simple inclusion for now
                filtered_results.append(r)
                
            if not filtered_results:
                return ""

            # Format context with citations
            context_parts = []
            for i, res in enumerate(filtered_results):
                doc_name = res["metadata"].get("filename", "Unknown Document")
                chunk_idx = res["metadata"].get("chunk_index", 0)
                text = res["text"]
                
                citation = f"[Source: {doc_name}, Chunk: {chunk_idx}]"
                context_parts.append(f"{citation}\n{text}")
                
            merged_context = "\n\n".join(context_parts)
            
            final_context = (
                "--- BACKGROUND CONTEXT ---\n"
                "The following excerpts from uploaded documents may be relevant to the user's query.\n"
                "When using this information, ALWAYS cite the source using the provided bracket notation (e.g., [Source: filename.pdf, Chunk: 0]).\n\n"
                f"{merged_context}\n"
                "--------------------------\n"
            )
            return final_context

        except Exception as e:
            logger.error(f"Error building RAG context: {e}")
            return ""
