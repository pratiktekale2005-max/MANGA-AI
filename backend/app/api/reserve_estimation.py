"""
Model 2 API Router: 3D Block Model Reserve & Resource Estimation.
"""

from fastapi import APIRouter, Query
from backend.app.services.state_service import state_service
from ml.models.block_modeler import BlockModelReserveEngine

router = APIRouter(prefix="/reserve", tags=["Model 2: Reserve & Resource Estimation"])


@router.get("/estimate")
def estimate_reserves(cutoff_grade: float = Query(20.0, ge=5.0, le=45.0)):
    """Computes reserve tonnage, contained manganese, and Grade-Tonnage curve at chosen cut-off."""
    df_blocks = state_service.get_mine_filtered_df("blocks")
    res = BlockModelReserveEngine.calculate_reserves(df_blocks, cutoff_grade=cutoff_grade)
    res["active_mine"] = state_service.get_active_mine()
    return res


@router.get("/blocks")
def get_block_model(limit: int = 400):
    """Returns 3D voxel blocks with spatial coordinates, tonnage, and predicted Mn grade for map/3D view."""
    df_blocks = state_service.get_mine_filtered_df("blocks")
    sample_blocks = df_blocks.head(limit).to_dict(orient="records")
    return {
        "active_mine": state_service.get_active_mine(),
        "total_blocks": len(df_blocks),
        "displayed_blocks": len(sample_blocks),
        "blocks": sample_blocks
    }
