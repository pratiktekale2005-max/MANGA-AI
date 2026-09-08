"""
Model 6 API Router: Equipment Fleet Health, Availability, Utilization, and OEE Metrics.
"""

from fastapi import APIRouter
from backend.app.services.state_service import state_service
from ml.models.equipment_analyzer import EquipmentAnalyzer

router = APIRouter(prefix="/equipment", tags=["Model 6: Equipment Intelligence"])


@router.get("/fleet")
def get_equipment_fleet():
    """Returns complete equipment fleet telemetry, OEE, availability, and health rankings."""
    df_eq = state_service.get_mine_filtered_df("equipment")
    summary = EquipmentAnalyzer.analyze_fleet(df_eq)
    summary["active_mine"] = state_service.get_active_mine()
    return summary


@router.get("/critical")
def get_critical_equipment():
    """Returns list of machines with critical breakdown risk or inspection due."""
    df_eq = state_service.get_mine_filtered_df("equipment")
    summary = EquipmentAnalyzer.analyze_fleet(df_eq)
    return {
        "active_mine": state_service.get_active_mine(),
        "critical_units_count": summary["critical_risk_count"],
        "critical_units": summary["critical_units"],
        "warning_units": summary["warning_units"]
    }
