"""
Model 11 API Router: What-If Scenario Simulation and Sensitivity Analysis.
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, Dict, Any
from backend.app.services.state_service import state_service
from ml.models.scenario_simulator import ScenarioSimulator

router = APIRouter(prefix="/scenarios", tags=["Model 11: Scenario Simulation"])


class ScenarioSimulateRequest(BaseModel):
    base_target_tonnes: float = 35000.0
    base_grade: float = 40.5
    base_fleet_avail: float = 84.0
    base_working_days: int = 26
    base_recovery_pct: float = 88.0
    custom_params: Optional[Dict[str, Any]] = None


@router.post("/simulate")
def simulate_scenarios(req: ScenarioSimulateRequest):
    """Simulates multi-scenario mining operational trade-offs and user-defined slider sensitivity."""
    res = ScenarioSimulator.simulate_scenarios(
        base_target_tonnes=req.base_target_tonnes,
        base_grade=req.base_grade,
        base_fleet_avail=req.base_fleet_avail,
        base_working_days=req.base_working_days,
        base_recovery_pct=req.base_recovery_pct,
        custom_params=req.custom_params
    )
    res["active_mine"] = state_service.get_active_mine()
    return res
