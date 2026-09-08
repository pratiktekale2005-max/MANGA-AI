"""
Model 8 & 9 API Router: Anomaly Detection and Composite Mining Risk Matrix.
"""

from fastapi import APIRouter
from backend.app.services.state_service import state_service
from ml.models.anomaly_detector import AnomalyDetector
from ml.models.risk_engine import MiningRiskEngine

router = APIRouter(prefix="/risk", tags=["Model 8 & 9: Anomaly & Risk Detection"])


@router.get("/composite")
def get_composite_risk():
    """Calculates multi-pillar risk radar scores and overall mine risk level."""
    df_geo = state_service.get_mine_filtered_df("drillholes")
    df_prod = state_service.get_mine_filtered_df("production")
    df_eq = state_service.get_mine_filtered_df("equipment")

    risk_data = MiningRiskEngine.calculate_composite_risk(df_geo, df_prod, df_eq)
    risk_data["active_mine"] = state_service.get_active_mine()
    return risk_data


@router.get("/anomalies/geological")
def get_geological_anomalies():
    """Returns detected assay outliers and suspicious core sample records."""
    df_geo = state_service.get_mine_filtered_df("drillholes")
    res = AnomalyDetector.detect_geological_anomalies(df_geo)
    res["active_mine"] = state_service.get_active_mine()
    return res


@router.get("/anomalies/production")
def get_production_anomalies():
    """Returns detected historical production plunge anomalies and downtime spikes."""
    df_prod = state_service.get_mine_filtered_df("production")
    res = AnomalyDetector.detect_production_anomalies(df_prod)
    res["active_mine"] = state_service.get_active_mine()
    return res
