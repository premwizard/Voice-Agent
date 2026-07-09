from typing import Dict, Any, List
from repositories.analytics_repository import AnalyticsRepository

_analytics_repo = AnalyticsRepository()

class AnalyticsService:
    async def get_dashboard_metrics(self, workspace_id: str, days: int = 7) -> Dict[str, Any]:
        overview = await _analytics_repo.get_overview_metrics(workspace_id, days)
        trends = await _analytics_repo.get_daily_trends(workspace_id, days)
        
        return {
            "overview": overview,
            "trends": trends
        }

analytics_service = AnalyticsService()
