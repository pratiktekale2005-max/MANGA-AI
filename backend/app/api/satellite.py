"""
Satellite Remote Sensing API Router: Spectral Indices, Iron/Clay Anomaly Layers, and Potential Classification.
"""

from fastapi import APIRouter
from backend.app.services.state_service import state_service
from ml.satellite.spectral_indices import SatelliteProcessor

router = APIRouter(prefix="/satellite", tags=["Satellite Remote Sensing"])


@router.get("/indices")
def get_satellite_indices():
    """Returns multi-spectral reflectance pixels, indices, and exploration potential classifications."""
    df_sat = state_service.get_mine_filtered_df("satellite")
    if "iron_oxide_index" not in df_sat.columns:
        df_sat = SatelliteProcessor.compute_all_indices(df_sat)

    metrics = SatelliteProcessor.get_summary_metrics(df_sat)

    # Format points for map visualization
    grid_points = []
    for _, row in df_sat.iterrows():
        grid_points.append({
            "latitude": float(row.get("latitude", 21.54)),
            "longitude": float(row.get("longitude", 79.70)),
            "grid_x": float(row.get("grid_x", 0.0)),
            "grid_y": float(row.get("grid_y", 0.0)),
            "NDVI": round(float(row.get("NDVI", 0.2)), 3),
            "NDWI": round(float(row.get("NDWI", -0.1)), 3),
            "NDBI": round(float(row.get("NDBI", 0.1)), 3),
            "iron_oxide_index": round(float(row.get("iron_oxide_index", 1.5)), 2),
            "clay_mineral_index": round(float(row.get("clay_mineral_index", 1.2)), 2),
            "ferrous_index": round(float(row.get("ferrous_index", 1.8)), 2),
            "exploration_potential_score": float(row.get("exploration_potential_score", 50.0)),
            "potential_class": str(row.get("potential_class", "Medium Potential Zone")),
            "spectral_zone_type": str(row.get("spectral_zone_type", "Outcrop"))
        })

    return {
        "disclaimer": "Satellite remote sensing outputs are exploration-support indicators and do not confirm mineralization without ground-truth drilling validation.",
        "active_mine": state_service.get_active_mine(),
        "summary_metrics": metrics,
        "spectral_pixels": grid_points
    }
