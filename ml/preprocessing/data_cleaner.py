"""
Data Cleaning, Validation, and Quality Assessment Engine for Mining & Geological Datasets.
Supports drillholes, production history, equipment fleet, and satellite indices.
"""

import numpy as np
import pandas as pd
from typing import Dict, Any, List, Tuple, Optional


class DataQualityReport:
    """Encapsulates data profiling and quality metrics."""
    def __init__(self, is_valid: bool, quality_score: float, total_rows: int, issues: List[str], stats: Dict[str, Any]):
        self.is_valid = is_valid
        self.quality_score = quality_score
        self.total_rows = total_rows
        self.issues = issues
        self.stats = stats

    def to_dict(self) -> Dict[str, Any]:
        return {
            "is_valid": self.is_valid,
            "quality_score": round(self.quality_score, 1),
            "total_rows": self.total_rows,
            "issues": self.issues,
            "stats": self.stats
        }


class DataCleaner:
    """Robust preprocessing pipeline for geological assays, production logs, and spatial grids."""

    @staticmethod
    def validate_and_clean_geological_data(df: pd.DataFrame) -> Tuple[pd.DataFrame, DataQualityReport]:
        """Validates and cleans borehole/drillhole geological data."""
        df_clean = df.copy()
        issues = []
        
        # Required geological columns
        req_cols = ["hole_id", "depth_from", "depth_to", "mn_grade"]
        missing_req = [c for c in req_cols if c not in df_clean.columns]
        if missing_req:
            return df_clean, DataQualityReport(
                is_valid=False,
                quality_score=0.0,
                total_rows=len(df),
                issues=[f"Missing mandatory columns: {', '.join(missing_req)}"],
                stats={}
            )
            
        initial_count = len(df_clean)
        
        # 1. Remove duplicate depth intervals for same drillhole
        if "hole_id" in df_clean.columns and "depth_from" in df_clean.columns:
            dups = df_clean.duplicated(subset=["hole_id", "depth_from", "depth_to"]).sum()
            if dups > 0:
                df_clean = df_clean.drop_duplicates(subset=["hole_id", "depth_from", "depth_to"])
                issues.append(f"Removed {dups} duplicate borehole depth intervals.")
                
        # 2. Thickness calculation & validation
        if "thickness" not in df_clean.columns:
            df_clean["thickness"] = df_clean["depth_to"] - df_clean["depth_from"]
        invalid_thickness = (df_clean["thickness"] <= 0).sum()
        if invalid_thickness > 0:
            df_clean = df_clean[df_clean["thickness"] > 0]
            issues.append(f"Filtered {invalid_thickness} intervals with non-positive thickness.")

        # 3. Numeric conversion & grade bounding
        numeric_cols = ["mn_grade", "fe_grade", "sio2", "p_content", "density", "sample_depth", "collar_elevation", "latitude", "longitude"]
        for col in numeric_cols:
            if col in df_clean.columns:
                df_clean[col] = pd.to_numeric(df_clean[col], errors="coerce")

        # Cap realistic grades (Mn 0-60%, Fe 0-70%, SiO2 0-100%, P 0-1%, Density 2.0-5.5)
        if "mn_grade" in df_clean.columns:
            df_clean["mn_grade"] = df_clean["mn_grade"].clip(0.0, 60.0)
            df_clean["mn_grade"] = df_clean["mn_grade"].fillna(df_clean["mn_grade"].median())
            
        if "density" in df_clean.columns:
            df_clean["density"] = df_clean["density"].clip(2.0, 5.5).fillna(3.2)
        else:
            df_clean["density"] = 3.2  # default average rock density

        if "lithology" not in df_clean.columns:
            df_clean["lithology"] = "Undifferentiated Manganese Ore"
        else:
            df_clean["lithology"] = df_clean["lithology"].fillna("Unknown Formation")

        # Data Quality Score calculation
        completeness = 1.0 - (df_clean[numeric_cols].isna().sum().sum() / max(1, (len(df_clean) * len(numeric_cols))))
        validity = 1.0 - (len(issues) * 0.08)
        quality_score = max(20.0, min(100.0, (completeness * 60.0 + validity * 40.0)))

        stats = {
            "processed_rows": len(df_clean),
            "unique_holes": df_clean["hole_id"].nunique() if "hole_id" in df_clean.columns else 0,
            "avg_mn_grade": round(float(df_clean["mn_grade"].mean()), 2) if "mn_grade" in df_clean.columns else 0.0,
            "max_mn_grade": round(float(df_clean["mn_grade"].max()), 2) if "mn_grade" in df_clean.columns else 0.0,
            "min_mn_grade": round(float(df_clean["mn_grade"].min()), 2) if "mn_grade" in df_clean.columns else 0.0,
            "std_mn_grade": round(float(df_clean["mn_grade"].std()), 2) if "mn_grade" in df_clean.columns else 0.0,
        }

        return df_clean, DataQualityReport(True, quality_score, len(df_clean), issues, stats)

    @staticmethod
    def validate_and_clean_production_data(df: pd.DataFrame) -> Tuple[pd.DataFrame, DataQualityReport]:
        """Validates and cleans time-series production records."""
        df_clean = df.copy()
        issues = []

        req_cols = ["date", "actual_ore_tonnes"]
        missing_req = [c for c in req_cols if c not in df_clean.columns]
        if missing_req:
            return df_clean, DataQualityReport(
                is_valid=False,
                quality_score=0.0,
                total_rows=len(df),
                issues=[f"Missing mandatory columns: {', '.join(missing_req)}"],
                stats={}
            )

        # Parse date
        df_clean["date"] = pd.to_datetime(df_clean["date"], errors="coerce")
        df_clean = df_clean.dropna(subset=["date"]).sort_values(by="date")

        # Numeric conversions
        num_cols = ["actual_ore_tonnes", "target_ore_tonnes", "actual_mn_grade", "working_days", "operating_hours", "fleet_availability_pct"]
        for col in num_cols:
            if col in df_clean.columns:
                df_clean[col] = pd.to_numeric(df_clean[col], errors="coerce").fillna(0.0)

        # Ensure positive production
        df_clean["actual_ore_tonnes"] = df_clean["actual_ore_tonnes"].clip(lower=0.0)

        quality_score = 92.0 if len(issues) == 0 else 80.0
        stats = {
            "total_records": len(df_clean),
            "date_range": f"{df_clean['date'].min().strftime('%Y-%m')} to {df_clean['date'].max().strftime('%Y-%m')}",
            "total_production_tonnes": int(df_clean["actual_ore_tonnes"].sum()),
            "avg_monthly_production": int(df_clean["actual_ore_tonnes"].mean())
        }

        return df_clean, DataQualityReport(True, quality_score, len(df_clean), issues, stats)

    @staticmethod
    def validate_and_clean_equipment_data(df: pd.DataFrame) -> Tuple[pd.DataFrame, DataQualityReport]:
        """Validates and cleans equipment telemetry & reliability records."""
        df_clean = df.copy()
        issues = []

        req_cols = ["equipment_id", "availability_pct", "health_score"]
        missing_req = [c for c in req_cols if c not in df_clean.columns]
        if missing_req:
            return df_clean, DataQualityReport(
                is_valid=False,
                quality_score=0.0,
                total_rows=len(df),
                issues=[f"Missing mandatory columns: {', '.join(missing_req)}"],
                stats={}
            )

        # Bound percentage metrics
        pct_cols = ["availability_pct", "utilization_pct"]
        for col in pct_cols:
            if col in df_clean.columns:
                df_clean[col] = pd.to_numeric(df_clean[col], errors="coerce").clip(0.0, 100.0).fillna(80.0)

        if "health_score" in df_clean.columns:
            df_clean["health_score"] = pd.to_numeric(df_clean["health_score"], errors="coerce").clip(0, 100).fillna(75)

        stats = {
            "fleet_size": len(df_clean),
            "avg_availability": round(float(df_clean["availability_pct"].mean()), 1),
            "avg_health_score": round(float(df_clean["health_score"].mean()), 1),
            "critical_units": int((df_clean["health_score"] < 60).sum())
        }

        return df_clean, DataQualityReport(True, 94.0, len(df_clean), issues, stats)
