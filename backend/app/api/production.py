"""
Model 5 & 7 API Router: Production Forecasting, Historical Trends, and Shortfall Analysis.
"""

from fastapi import APIRouter, Query
from backend.app.services.state_service import state_service

router = APIRouter(prefix="/production", tags=["Model 5 & 7: Production Forecasting"])


@router.get("/forecast")
def get_production_forecast(months_ahead: int = Query(12, ge=1, le=24)):
    """Generates future month-by-month production projections and shortfall risk classifications."""
    df_prod = state_service.get_mine_filtered_df("production")
    forecasts = state_service.production_engine.forecast_future(df_prod, months_ahead=months_ahead)
    return {
        "active_mine": state_service.get_active_mine(),
        "forecast_horizon_months": months_ahead,
        "forecasts": forecasts
    }


@router.get("/history")
def get_production_history(limit: int = 36):
    """Returns historical monthly production records, actual vs target tonnage, and stripping ratio."""
    df_prod = state_service.get_mine_filtered_df("production")
    records = df_prod.tail(limit).to_dict(orient="records")
    return {
        "active_mine": state_service.get_active_mine(),
        "total_records": len(df_prod),
        "history": records
    }


@router.get("/metadata")
def get_forecast_metadata():
    """Returns regression model evaluation metrics (R2, RMSE, MAPE) and feature importances."""
    return state_service.production_engine.metadata
