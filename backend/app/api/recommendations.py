"""
Model 12 API Router: AI Actionable Mining Recommendations.
"""

from fastapi import APIRouter
from backend.app.services.state_service import state_service
from ml.models.block_modeler import BlockModelReserveEngine
from ml.models.exploration_prioritizer import ExplorationPrioritizer
from ml.models.equipment_analyzer import EquipmentAnalyzer
from ml.models.risk_engine import MiningRiskEngine
from ml.models.recommendations_engine import RecommendationEngine
from ml.satellite.spectral_indices import SatelliteProcessor

router = APIRouter(prefix="/recommendations", tags=["Model 12: AI Recommendations"])


@router.get("")
def get_recommendations():
    """Returns synthesized AI recommendations with quantified evidence and confidence scores."""
    df_geo = state_service.get_mine_filtered_df("drillholes")
    df_blocks = state_service.get_mine_filtered_df("blocks")
    df_prod = state_service.get_mine_filtered_df("production")
    df_eq = state_service.get_mine_filtered_df("equipment")
    df_sat = state_service.get_mine_filtered_df("satellite")

    reserve_summary = BlockModelReserveEngine.calculate_reserves(df_blocks, cutoff_grade=20.0)
    exploration_summary = ExplorationPrioritizer.prioritize_targets(df_sat, top_k=5)
    future_forecast = state_service.production_engine.forecast_future(df_prod, months_ahead=6)
    eq_summary = EquipmentAnalyzer.analyze_fleet(df_eq)
    risk_summary = MiningRiskEngine.calculate_composite_risk(df_geo, df_prod, df_eq)
    sat_summary = SatelliteProcessor.get_summary_metrics(df_sat)

    recs = RecommendationEngine.generate_recommendations(
        geo_summary={"total_samples": len(df_geo)},
        sat_summary=sat_summary,
        reserve_summary=reserve_summary,
        exploration_summary=exploration_summary,
        prod_forecast=future_forecast,
        equipment_summary=eq_summary,
        risk_summary=risk_summary
    )

    return {
        "active_mine": state_service.get_active_mine(),
        "total_recommendations": len(recs),
        "recommendations": recs
    }
