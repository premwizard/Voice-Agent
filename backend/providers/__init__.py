from .base import Provider
from .openrouter import OpenRouterProvider

def get_provider() -> Provider:
    return OpenRouterProvider()
