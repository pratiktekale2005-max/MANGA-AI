"""
Geology API Router: Drillhole Logs, 3D Assays, Lithology Formations, and Cross-Sections.
"""

from fastapi import APIRouter
from backend.app.services.state_service import state_service

router = APIRouter(prefix="/geology", tags=["Geological Data & Boreholes"])


@router.get("/drillholes")
def get_drillholes():
    """Returns all borehole records for the active mine with 3D coordinates and assay intervals."""
    df_geo = state_service.get_mine_filtered_df("drillholes")

    holes_dict = {}
    for _, row in df_geo.iterrows():
        hid = str(row["hole_id"])
        if hid not in holes_dict:
            holes_dict[hid] = {
                "hole_id": hid,
                "mine_id": str(row.get("mine_id", state_service.active_mine_id)),
                "latitude": float(row.get("latitude", 21.54)),
                "longitude": float(row.get("longitude", 79.70)),
                "collar_x": float(row.get("x", 0.0)),
                "collar_y": float(row.get("y", 0.0)),
                "collar_elevation": float(row.get("collar_elevation", 320.0)),
                "intervals": []
            }

        holes_dict[hid]["intervals"].append({
            "depth_from": float(row.get("depth_from", 0.0)),
            "depth_to": float(row.get("depth_to", 10.0)),
            "sample_depth": float(row.get("sample_depth", 5.0)),
            "sample_elevation": float(row.get("sample_elevation", 315.0)),
            "thickness": float(row.get("thickness", 10.0)),
            "lithology": str(row.get("lithology", "Gondite")),
            "mn_grade": float(row.get("mn_grade", 0.0)),
            "fe_grade": float(row.get("fe_grade", 0.0)),
            "sio2": float(row.get("sio2", 0.0)),
            "p_content": float(row.get("p_content", 0.0)),
            "density": float(row.get("density", 3.2))
        })

    # Summary metrics
    unique_holes = list(holes_dict.values())
    total_intervals = len(df_geo)
    avg_grade = round(float(df_geo["mn_grade"].mean()), 2) if not df_geo.empty else 0.0

    return {
        "active_mine": state_service.get_active_mine(),
        "total_boreholes": len(unique_holes),
        "total_intervals": total_intervals,
        "average_mn_grade_pct": avg_grade,
        "drillholes": unique_holes
    }
