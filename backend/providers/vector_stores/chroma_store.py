from typing import List, Dict, Any, Optional
import chromadb
from chromadb.config import Settings
from interfaces.vector_store import VectorStore
from interfaces.embedding_provider import EmbeddingProvider
from config.settings import settings
import logging

logger = logging.getLogger(__name__)

class ChromaVectorStore(VectorStore):
    def __init__(self, embedding_provider: EmbeddingProvider):
        self.embedding_provider = embedding_provider
        # Persistent storage in ./chroma_db
        self.client = chromadb.PersistentClient(path="./chroma_db")
        self.collection = self.client.get_or_create_collection(
            name="documents",
            metadata={"hnsw:space": "cosine"}
        )

    async def add_documents(
        self, 
        texts: List[str], 
        metadatas: List[Dict[str, Any]], 
        ids: List[str]
    ):
        try:
            # Generate embeddings
            embeddings = await self.embedding_provider.embed_documents(texts)
            
            # Add to Chroma
            self.collection.add(
                documents=texts,
                embeddings=embeddings,
                metadatas=metadatas,
                ids=ids
            )
            logger.info(f"Successfully added {len(texts)} chunks to ChromaDB.")
        except Exception as e:
            logger.error(f"Error adding documents to ChromaDB: {e}")
            raise

    async def delete_document(self, document_id: str):
        try:
            # Delete chunks matching the document_id
            self.collection.delete(
                where={"document_id": document_id}
            )
            logger.info(f"Deleted vector chunks for document_id={document_id}.")
        except Exception as e:
            logger.error(f"Error deleting document from ChromaDB: {e}")
            raise

    async def similarity_search(
        self, 
        query: str, 
        top_k: int = 4, 
        filter: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        try:
            query_embedding = await self.embedding_provider.embed_query(query)
            
            # Query chroma
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=top_k,
                where=filter
            )
            
            output = []
            if results['ids'] and len(results['ids']) > 0:
                for idx in range(len(results['ids'][0])):
                    output.append({
                        "id": results['ids'][0][idx],
                        "text": results['documents'][0][idx],
                        "metadata": results['metadatas'][0][idx],
                        "score": results['distances'][0][idx] if results['distances'] else None
                    })
            return output
            
        except Exception as e:
            logger.error(f"Error searching ChromaDB: {e}")
            return []
