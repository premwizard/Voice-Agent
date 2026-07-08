from openai import AsyncOpenAI, APIError, APIConnectionError, RateLimitError, AuthenticationError
from .base import Provider
from config.settings import settings
from typing import AsyncGenerator
import logging
import asyncio

logger = logging.getLogger(__name__)

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

    async def _execute_with_retry(self, operation, is_stream=False):
        max_retries = 3
        base_delay = 1
        
        for attempt in range(max_retries + 1):
            try:
                if is_stream:
                    # For streams, we just return the generator
                    return await operation()
                else:
                    return await operation()
            except AuthenticationError as e:
                # Fatal error, do not retry
                logger.error(f"Authentication failed: {e}")
                raise ValueError("Authentication Failed. Please check the OpenRouter API Key.") from e
            except (RateLimitError, APIConnectionError, APIError) as e:
                if attempt == max_retries:
                    logger.error(f"Provider failed after {max_retries} retries. Error: {e}")
                    raise RuntimeError(f"The AI service is temporarily unavailable. Please try again. ({type(e).__name__})") from e
                
                # Exponential backoff
                delay = base_delay * (2 ** attempt)
                logger.warning(f"Provider error: {e}. Retrying in {delay} seconds (Attempt {attempt + 1}/{max_retries})...")
                await asyncio.sleep(delay)
            except Exception as e:
                if attempt == max_retries:
                    logger.error(f"Unexpected provider error after {max_retries} retries: {e}")
                    raise RuntimeError(f"An unexpected error occurred with the AI service. Please try again.") from e
                
                delay = base_delay * (2 ** attempt)
                logger.warning(f"Unexpected error: {e}. Retrying in {delay} seconds (Attempt {attempt + 1}/{max_retries})...")
                await asyncio.sleep(delay)

    async def generate(self, prompt: str, system_prompt: str, history: list) -> str:
        messages = [{"role": "system", "content": system_prompt}]
        messages.extend(history)
        messages.append({"role": "user", "content": prompt})
        
        async def _op():
            response = await self.client.chat.completions.create(
                model=self.model_name,
                messages=messages,
                temperature=settings.temperature,
                max_tokens=settings.max_tokens,
            )
            content = response.choices[0].message.content
            if not content or not isinstance(content, str):
                raise ValueError("Received empty or invalid response from provider.")
            return content

        return await self._execute_with_retry(_op)

    async def stream(self, prompt: str, system_prompt: str, history: list) -> AsyncGenerator[str, None]:
        messages = [{"role": "system", "content": system_prompt}]
        messages.extend(history)
        messages.append({"role": "user", "content": prompt})
        
        async def _op():
            return await self.client.chat.completions.create(
                model=self.model_name,
                messages=messages,
                temperature=settings.temperature,
                max_tokens=settings.max_tokens,
                stream=True,
            )

        stream_resp = await self._execute_with_retry(_op, is_stream=True)
        
        # When streaming, we also need to catch errors during the iteration
        has_yielded = False
        try:
            async for chunk in stream_resp:
                content = chunk.choices[0].delta.content
                if content:
                    has_yielded = True
                    yield content
        except Exception as e:
            logger.error(f"Error during stream iteration: {e}")
            if not has_yielded:
                # If we haven't yielded anything yet, we can safely raise the error
                raise RuntimeError(f"The AI service is temporarily unavailable. Please try again.") from e
            else:
                # If we already yielded partial data, raising an error will just abruptly stop it
                # We log it, but we can't easily retry mid-stream. 
                logger.error("Stream interrupted mid-generation.")
                raise RuntimeError("Stream was interrupted due to a network error.") from e

    async def health_check(self) -> bool:
        return self.client is not None
