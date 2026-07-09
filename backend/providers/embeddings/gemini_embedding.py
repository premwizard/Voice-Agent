from typing import List
from interfaces.embedding_provider import EmbeddingProvider
from google import genai
from config.settings import settings

class GeminiEmbeddingProvider(EmbeddingProvider):
    def __init__(self):
        # We can reuse the genai client configured similarly to the llm_service
        self.client = genai.Client()
        self.model = "text-embedding-004"
        
    async def embed_query(self, text: str) -> List[float]:
        response = self.client.models.embed_content(
            model=self.model,
            contents=text,
        )
        # Handle depending on google-genai version. Usually response.embeddings[0].values
        return response.embeddings[0].values

    async def embed_documents(self, texts: List[str]) -> List[List[float]]:
        response = self.client.models.embed_content(
            model=self.model,
            contents=texts,
        )
        return [embedding.values for embedding in response.embeddings]
