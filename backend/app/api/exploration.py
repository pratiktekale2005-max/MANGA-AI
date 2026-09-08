"""
Model 4 API Router: Exploration Target Prioritization and Drilling Recommendations.
"""

from fastapi import APIRouter, Query
from backend.app.services.state_service import state_service
from ml.models.exploration_prioritizer import ExplorationPrioritizer

router = APIRouter(prefix="/exploration", tags=["Model 4: Exploration Target Prioritization"])


@router.get("/prioritize")
def prioritize_exploration_targets(top_k: int = Query(6, ge=1, le=20)):
    """Ranks exploration zones and recommends highest-priority exploratory drilling borehole locations."""
    df_sat = state_service.get_mine_filtered_df("satellite")
    summary = ExplorationPrioritizer.prioritize_targets(df_sat, top_k=top_k)
    summary["active_mine"] = state_service.get_active_mine()
    return summary
