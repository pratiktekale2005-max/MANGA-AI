"""
Dashboard API Router: Aggregated Executive KPIs, Active Alerts, and Model Registry Summary.
"""

import os
import json
from fastapi import APIRouter
from backend.app.services.state_service import state_service
from backend.app.core.config import settings

router = APIRouter(prefix="/dashboard", tags=["Executive Dashboard"])


@router.get("/summary")
def get_dashboard_summary():
    """Returns real-time aggregated executive KPIs and alerts for active mine."""
    return state_service.get_dashboard_summary()


@router.get("/registry")
def get_model_registry():
    """Returns model registry status and evaluation metrics from model registry."""
    pipeline_file = os.path.join(settings.REGISTRY_PATH, "pipeline_summary.json")
    if os.path.exists(pipeline_file):
        with open(pipeline_file, "r") as f:
            return json.load(f)
    return {
        "status": "READY",
        "models_count": 11,
        "active_mine": state_service.get_active_mine()
    }
