import logging
import json
import uuid
import asyncio
from typing import Dict, Any

from providers import get_provider
from repositories.evaluation_repository import EvaluationRepository
from database.models import Evaluation

logger = logging.getLogger(__name__)

_eval_repo = EvaluationRepository()

class EvaluationService:
    def __init__(self):
        pass

    async def evaluate_trace(self, trace_id: str, workspace_id: str, user_input: str, assistant_response: str) -> None:
        """Runs LLM-as-a-judge to evaluate an interaction."""
        logger.info(f"Starting async evaluation for trace {trace_id}")
        
        provider = get_provider()
        
        # LLM-as-a-judge prompt
        prompt = f"""
You are an expert AI evaluator. Assess the following response based on the user's input.
Provide a JSON object with scores between 0.0 and 1.0 for these metrics:
- correctness: How accurate is the response to the user's request?
- hallucination_risk: 1.0 means high risk of hallucination (unsupported claims), 0.0 means completely grounded.
- completeness: Does the response fully address the input?

User Input: {user_input}
Assistant Response: {assistant_response}

Output only valid JSON. Example: {{"correctness": 0.9, "hallucination_risk": 0.1, "completeness": 0.8}}
"""
        
        try:
            # We call the provider directly, assuming it supports simple completion
            # (Note: In a real app we might use a specific evaluation model, here we use the configured provider)
            from schemas.llm import LLMRequest, Message
            
            req = LLMRequest(
                messages=[Message(role="user", content=prompt)],
                temperature=0.0
            )
            
            response = await provider.generate_response(req)
            
            # Extract JSON block
            import re
            json_str = response.content
            match = re.search(r'\{.*\}', json_str, re.DOTALL)
            if match:
                json_str = match.group(0)
                
            metrics = json.loads(json_str)
            
            evaluation = Evaluation(
                id=str(uuid.uuid4()),
                workspace_id=workspace_id,
                trace_id=trace_id,
                metrics=json.dumps(metrics)
            )
            
            await _eval_repo.create(evaluation)
            logger.info(f"Evaluation complete for trace {trace_id}: {metrics}")
            
        except Exception as e:
            logger.error(f"Failed to evaluate trace {trace_id}: {e}")

evaluation_service = EvaluationService()
