"""
Model 10 API Router: Production Planning and Mine Extraction Optimization.
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from backend.app.services.state_service import state_service
from ml.models.production_optimizer import ProductionOptimizer

router = APIRouter(prefix="/optimization", tags=["Model 10: Production Planning Optimization"])


class OptimizeRequest(BaseModel):
    target_production_tonnes: float = 35000.0
    equipment_capacity_tonnes: float = 45000.0
    min_blend_grade_pct: float = 32.0
    planning_period_months: int = 1


@router.post("/plan")
def generate_optimal_plan(req: OptimizeRequest):
    """Generates an optimal block extraction schedule maximizing contained Mn subject to equipment capacity."""
    df_blocks = state_service.get_mine_filtered_df("blocks")
    plan = ProductionOptimizer.optimize_plan(
        df_blocks,
        target_production_tonnes=req.target_production_tonnes,
        equipment_capacity_tonnes=req.equipment_capacity_tonnes,
        min_blend_grade_pct=req.min_blend_grade_pct,
        planning_period_months=req.planning_period_months
    )
    plan["active_mine"] = state_service.get_active_mine()
    return plan
