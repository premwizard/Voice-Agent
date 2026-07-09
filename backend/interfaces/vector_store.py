from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional

class VectorStore(ABC):
    @abstractmethod
    async def add_documents(
        self, 
        texts: List[str], 
        metadatas: List[Dict[str, Any]], 
        ids: List[str]
    ):
        """Add chunks (texts) with metadata to the vector store."""
        pass

    @abstractmethod
    async def delete_document(self, document_id: str):
        """Delete all chunks associated with a specific document_id."""
        pass

    @abstractmethod
    async def similarity_search(
        self, 
        query: str, 
        top_k: int = 4, 
        filter: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Search for most similar chunks.
        Should return a list of dicts with keys: 'id', 'text', 'metadata', 'score'
        """
        pass
