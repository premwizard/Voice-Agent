# ==============================================================================
# FILE: llm_service.py
# WHAT THIS FILE IS: LLM AI Service Module.
# WHY IT IS USED: Handles communication with Google Gemini LLM API, managing 
#                 streaming response generation token-by-token and fallback 
#                 handling if an API key is missing or invalid.
# ==============================================================================

# Import AsyncGenerator to type hint streaming token functions
from typing import AsyncGenerator
# Import Google GenAI SDK client
from google import genai
# Import settings object to fetch configured API keys and model options
from config import settings

class LLMService:
    def __init__(self):
        # Store the active AI provider name from settings (e.g. "gemini")
        self.provider = settings.AI_PROVIDER
        # Store the API key from settings
        self.api_key = settings.GEMINI_API_KEY
        
        # Initialize Google GenAI client if an API key is present
        if self.api_key and self.api_key != "your_gemini_api_key_here":
            # Instantiate official google.genai Client with the provided API key
            self.client = genai.Client(api_key=self.api_key)
        else:
            # Set client to None if no valid key is provided (triggers fallback mode)
            self.client = None

    async def stream_response(self, prompt: str) -> AsyncGenerator[str, None]:
        """
        Generates and streams response text chunks token-by-token asynchronously.
        If a valid Gemini API key is configured, calls Google Gemini API.
        Otherwise, yields simulated streaming chunks to allow testing without an API key.
        """
        # Check if a real client is available and configured
        if self.client:
            try:
                # Call Gemini API with streaming enabled using modern gemini-2.5-flash model
                response = self.client.models.generate_content_stream(
                    model="gemini-2.5-flash",
                    contents=prompt,
                )
                
                # Iterate through incoming streaming chunks from Gemini API
                for chunk in response:
                    # Yield each text token chunk to the caller as soon as it arrives
                    if chunk.text:
                        yield chunk.text
            except Exception as e:
                # Yield error message chunk if API call fails (e.g. quota/invalid key)
                yield f"[AI ERROR]: Failed to generate response from Gemini API - {str(e)}"
        else:
            # Fallback mock streaming generator for testing without an API key
            mock_tokens = [
                f"[AI Fallback Stream (No API key set)]: You said: '{prompt}'. ",
                "I am your real-time Voice Agent AI assistant! ",
                "Once you add a real GEMINI_API_KEY in backend/.env, ",
                "I will generate real live AI answers from Google Gemini!"
            ]
            
            # Yield mock token chunks sequentially
            for token in mock_tokens:
                yield token

# Create a single global instance of LLMService to reuse across WebSocket connections
llm_service = LLMService()
