from openai import AsyncOpenAI
from .base import Provider
from config.settings import settings
from typing import AsyncGenerator

class OpenRouterProvider(Provider):
    def __init__(self):
        self.client = None
        self.model_name = "google/gemini-2.5-flash" # High performance model

    def initialize(self):
        if not settings.openrouter_api_key:
            raise ValueError("OPENROUTER_API_KEY is missing")
        self.client = AsyncOpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=settings.openrouter_api_key,
        )

    async def generate(self, prompt: str, system_prompt: str, history: list) -> str:
        messages = [{"role": "system", "content": system_prompt}]
        messages.extend(history)
        messages.append({"role": "user", "content": prompt})
        
        models_to_try = [
            "google/gemini-2.5-flash",
            "google/gemma-4-31b-it:free",
            "meta-llama/llama-3.2-3b-instruct:free"
        ]
        
        last_exception = None
        for model in models_to_try:
            try:
                response = await self.client.chat.completions.create(
                    model=model,
                    messages=messages,
                    temperature=settings.temperature,
                    max_tokens=settings.max_tokens,
                )
                return response.choices[0].message.content
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.warning(f"Model {model} failed in generate: {e}")
                last_exception = e
                continue
                
        return "I'm sorry, but my AI provider is currently overloaded and rate-limiting free models. Please try again in a few minutes."

    async def stream(self, prompt: str, system_prompt: str, history: list) -> AsyncGenerator[str, None]:
        messages = [{"role": "system", "content": system_prompt}]
        messages.extend(history)
        messages.append({"role": "user", "content": prompt})
        
        models_to_try = [
            "google/gemini-2.5-flash",
            "google/gemma-4-31b-it:free",
            "meta-llama/llama-3.2-3b-instruct:free"
        ]
        
        last_exception = None
        for model in models_to_try:
            try:
                stream_resp = await self.client.chat.completions.create(
                    model=model,
                    messages=messages,
                    temperature=settings.temperature,
                    max_tokens=settings.max_tokens,
                    stream=True,
                )
                async for chunk in stream_resp:
                    content = chunk.choices[0].delta.content
                    if content:
                        yield content
                return  # Exit successfully
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.warning(f"Model {model} failed in stream: {e}")
                last_exception = e
                continue
                
        # If all free models fail, yield a graceful response instead of crashing
        error_msg = "I'm sorry, but my AI provider is currently overloaded and rate-limiting free models. Please try again in a few minutes, or add a paid OpenRouter API key to the backend env file."
        yield error_msg

    async def health_check(self) -> bool:
        return self.client is not None
