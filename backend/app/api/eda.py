"""
EDA API Router: Statistical Summaries, Correlation Matrix, Distributions, and Depth Profiles.
"""

import numpy as np
import pandas as pd
from fastapi import APIRouter
from backend.app.services.state_service import state_service

router = APIRouter(prefix="/eda", tags=["Exploratory Data Analysis"])


@router.get("/summary")
def get_eda_summary():
    """Returns comprehensive statistical metrics and distributions for active mine."""
    df_geo = state_service.get_mine_filtered_df("drillholes")
    
    num_cols = ["mn_grade", "fe_grade", "sio2", "p_content", "density", "sample_depth", "thickness"]
    available_cols = [c for c in num_cols if c in df_geo.columns]

    stats_table = []
    for col in available_cols:
        series = df_geo[col].dropna()
        stats_table.append({
            "feature": col,
            "count": int(len(series)),
            "mean": round(float(series.mean()), 2),
            "std": round(float(series.std()), 2),
            "min": round(float(series.min()), 2),
            "p25": round(float(series.quantile(0.25)), 2),
            "median": round(float(series.median()), 2),
            "p75": round(float(series.quantile(0.75)), 2),
            "max": round(float(series.max()), 2)
        })

    # Correlation Matrix
    corr_matrix = {}
    if len(available_cols) > 1:
        corr_df = df_geo[available_cols].corr().round(3)
        corr_matrix = {
            "columns": available_cols,
            "values": corr_df.values.tolist()
        }

    # Grade Distribution Bins
    grade_bins = [
        {"bin": "0-15% (Overburden / Waste)", "count": int(((df_geo["mn_grade"] >= 0) & (df_geo["mn_grade"] < 15)).sum())},
        {"bin": "15-25% (Low Grade Gondite)", "count": int(((df_geo["mn_grade"] >= 15) & (df_geo["mn_grade"] < 25)).sum())},
        {"bin": "25-35% (Medium Grade Ore)", "count": int(((df_geo["mn_grade"] >= 25) & (df_geo["mn_grade"] < 35)).sum())},
        {"bin": "35-42% (High Grade Braunite)", "count": int(((df_geo["mn_grade"] >= 35) & (df_geo["mn_grade"] < 42)).sum())},
        {"bin": "42%+ (Premium Braunite/Pyrolusite)", "count": int((df_geo["mn_grade"] >= 42).sum())}
    ]

    # Lithology-wise Grade Boxplots
    litho_boxplots = []
    if "lithology" in df_geo.columns:
        for litho, group in df_geo.groupby("lithology"):
            grades = group["mn_grade"].dropna()
            if len(grades) > 0:
                litho_boxplots.append({
                    "lithology": str(litho),
                    "count": len(grades),
                    "mean_grade": round(float(grades.mean()), 2),
                    "min": round(float(grades.min()), 2),
                    "q1": round(float(grades.quantile(0.25)), 2),
                    "median": round(float(grades.median()), 2),
                    "q3": round(float(grades.quantile(0.75)), 2),
                    "max": round(float(grades.max()), 2)
                })

    # Sample Depth vs Grade Scatter Points
    depth_profile = []
    for _, row in df_geo.head(150).iterrows():
        depth_profile.append({
            "depth_m": float(row.get("sample_depth", 0.0)),
            "mn_grade": float(row.get("mn_grade", 0.0)),
            "fe_grade": float(row.get("fe_grade", 0.0)),
            "lithology": str(row.get("lithology", "Ore"))
        })

    return {
        "active_mine": state_service.get_active_mine(),
        "total_drillhole_samples": len(df_geo),
        "statistics_table": stats_table,
        "correlation_matrix": corr_matrix,
        "grade_distribution_bins": grade_bins,
        "lithology_boxplots": litho_boxplots,
        "depth_profile": depth_profile
    }
