"""
Satellite Remote Sensing & Multi-Spectral Feature Extraction Module
Calculates Mineralogical & Alteration Indices for Manganese Exploration.
"""

import numpy as np
import pandas as pd
from typing import Dict, Any, List, Tuple


class SatelliteProcessor:
    """Processes multi-spectral bands (Sentinel-2 / Landsat-8) and extracts exploration indices."""

    @staticmethod
    def compute_all_indices(df_bands: pd.DataFrame) -> pd.DataFrame:
        """
        Computes mineralogical, vegetation, and alteration indices from multi-spectral bands.
        Expected columns: B02_Blue, B03_Green, B04_Red, B08_NIR, B11_SWIR1, B12_SWIR2 (or aliases).
        """
        df = df_bands.copy()
        
        # Standardize column naming
        col_map = {
            "blue": "B02_Blue", "green": "B03_Green", "red": "B04_Red",
            "nir": "B08_NIR", "swir1": "B11_SWIR1", "swir2": "B12_SWIR2"
        }
        for k, v in col_map.items():
            for c in df.columns:
                if c.lower() == k:
                    df = df.rename(columns={c: v})

        b2 = df.get("B02_Blue", pd.Series(0.1, index=df.index)).astype(float).clip(1e-4, 1.0)
        b3 = df.get("B03_Green", pd.Series(0.1, index=df.index)).astype(float).clip(1e-4, 1.0)
        b4 = df.get("B04_Red", pd.Series(0.1, index=df.index)).astype(float).clip(1e-4, 1.0)
        b8 = df.get("B08_NIR", pd.Series(0.2, index=df.index)).astype(float).clip(1e-4, 1.0)
        b11 = df.get("B11_SWIR1", pd.Series(0.25, index=df.index)).astype(float).clip(1e-4, 1.0)
        b12 = df.get("B12_SWIR2", pd.Series(0.2, index=df.index)).astype(float).clip(1e-4, 1.0)

        # 1. NDVI (Normalized Difference Vegetation Index)
        df["NDVI"] = ((b8 - b4) / (b8 + b4)).clip(-1.0, 1.0)

        # 2. NDWI (Normalized Difference Water Index)
        df["NDWI"] = ((b3 - b8) / (b3 + b8)).clip(-1.0, 1.0)

        # 3. NDBI (Normalized Difference Built-up / Bare soil Index)
        df["NDBI"] = ((b11 - b8) / (b11 + b8)).clip(-1.0, 1.0)

        # 4. Iron Oxide Index (Red / Blue & SWIR1/NIR * Red/Green)
        df["iron_oxide_index"] = (b4 / b2).clip(0.1, 10.0)
        df["kaufmann_iron"] = ((b11 / b8) * (b4 / b3)).clip(0.1, 10.0)

        # 5. Clay Mineral Index (SWIR1 / SWIR2) - Proxy for hydroxyl alteration & pelitic host rocks
        df["clay_mineral_index"] = (b11 / b12).clip(0.1, 8.0)

        # 6. Ferrous Mineral Index
        df["ferrous_index"] = ((b11 / b8) + (b3 / b4)).clip(0.1, 10.0)

        # 7. Composite Exploration Potential Score (0 - 100)
        # Higher iron & clay indices with low vegetation indicate exposed gossan/manganese alteration outcrops
        norm_iron = ((df["iron_oxide_index"] - 1.0) / 3.0).clip(0.0, 1.0)
        norm_clay = ((df["clay_mineral_index"] - 0.8) / 1.5).clip(0.0, 1.0)
        norm_veg_suppression = (1.0 - df["NDVI"].clip(0.0, 0.8) / 0.8).clip(0.0, 1.0)

        score = (norm_iron * 45.0 + norm_clay * 35.0 + norm_veg_suppression * 20.0)
        df["exploration_potential_score"] = score.clip(5.0, 98.0).round(1)

        # Potential classification
        conditions = [
            df["exploration_potential_score"] >= 72.0,
            df["exploration_potential_score"] >= 45.0
        ]
        choices = ["High Potential Exploration Zone", "Medium Potential Zone"]
        df["potential_class"] = np.select(conditions, choices, default="Low Potential / Barren")

        return df

    @staticmethod
    def get_summary_metrics(df: pd.DataFrame) -> Dict[str, Any]:
        """Calculates remote sensing statistical summary for dashboard."""
        return {
            "total_pixels": len(df),
            "high_potential_pixels": int((df["exploration_potential_score"] >= 72).sum()),
            "avg_iron_oxide_index": round(float(df["iron_oxide_index"].mean()), 2),
            "avg_clay_index": round(float(df["clay_mineral_index"].mean()), 2),
            "avg_ndvi": round(float(df["NDVI"].mean()), 3),
            "high_potential_pct": round(float((df["exploration_potential_score"] >= 72).sum() / max(1, len(df)) * 100.0), 1)
        }
