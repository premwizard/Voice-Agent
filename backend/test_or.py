import asyncio
from providers.openrouter import OpenRouterProvider
from config.settings import settings

async def test_openrouter():
    provider = OpenRouterProvider()
    provider.initialize()
    
    print("Testing OpenRouter generation...")
    try:
        response = ""
        async for chunk in provider.stream(
            prompt="Hello, this is a test.",
            system_prompt="You are a helpful assistant.",
            history=[]
        ):
            print(chunk, end="")
            response += chunk
        print("\n\nSuccess! Response length:", len(response))
    except Exception as e:
        print("\n\nError:", str(e))

if __name__ == "__main__":
    asyncio.run(test_openrouter())
