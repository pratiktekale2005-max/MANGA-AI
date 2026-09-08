"""
Model 3 API Router: Spatial Estimation, Kriging vs IDW vs ML Comparison, and Surface Grids.
"""

from fastapi import APIRouter
from backend.app.services.state_service import state_service

router = APIRouter(prefix="/spatial", tags=["Model 3: Spatial Estimation"])


@router.get("/compare")
def compare_spatial_methods():
    """Returns spatial cross-validation evaluation comparing IDW, Ordinary Kriging, and ML Spatial."""
    df_geo = state_service.get_mine_filtered_df("drillholes")
    comparison = state_service.spatial_engine.evaluate_methods(df_geo, x_col="x", y_col="y", val_col="mn_grade")
    return {
        "active_mine": state_service.get_active_mine(),
        "total_boreholes_used": len(df_geo),
        "comparison": comparison
    }


@router.get("/surface")
def get_surface_grid(grid_resolution: int = 25):
    """Generates continuous interpolated 2D grid surfaces for map heatmaps."""
    df_geo = state_service.get_mine_filtered_df("drillholes")
    min_x, max_x = float(df_geo["x"].min()), float(df_geo["x"].max())
    min_y, max_y = float(df_geo["y"].min()), float(df_geo["y"].max())

    grid_data = state_service.spatial_engine.generate_grid_surface(
        x_range=(min_x, max_x),
        y_range=(min_y, max_y),
        grid_res=grid_resolution
    )

    mine = state_service.get_active_mine()
    c_lat, c_lon = mine["center_lat"], mine["center_lon"]

    # Convert coordinates to lat/lon for Leaflet overlay
    lat_coords = [round(c_lat + (y / 111320.0), 6) for y in grid_data["y_coords"]]
    lon_coords = [round(c_lon + (x / 103000.0), 6) for x in grid_data["x_coords"]]

    return {
        "active_mine": mine,
        "latitudes": lat_coords,
        "longitudes": lon_coords,
        "x_offsets_m": grid_data["x_coords"],
        "y_offsets_m": grid_data["y_coords"],
        "idw_surface": grid_data["idw_surface"],
        "kriging_surface": grid_data["kriging_surface"],
        "kriging_uncertainty": grid_data["kriging_uncertainty"],
        "ml_surface": grid_data["ml_surface"]
    }
