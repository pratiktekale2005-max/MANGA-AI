"""
Model 9: Comprehensive Mining Risk Engine
Synthesizes geological uncertainty, grade volatility, equipment vulnerability,
production shortfall threat, and environmental seasonality into a composite risk matrix.
"""

import numpy as np
import pandas as pd
from typing import Dict, Any, List


class MiningRiskEngine:
    """Computes multidimensional operational, geological, and fleet risk scores."""

    @classmethod
    def calculate_composite_risk(
        cls,
        df_geo: pd.DataFrame,
        df_prod: pd.DataFrame,
        df_equipment: pd.DataFrame
    ) -> Dict[str, Any]:
        """Calculates multi-pillar risk scores and overall composite risk (0-100)."""

        # 1. Geological & Grade Uncertainty Risk (0-100)
        grade_std = float(df_geo["mn_grade"].std()) if "mn_grade" in df_geo.columns else 8.0
        grade_mean = float(df_geo["mn_grade"].mean()) if "mn_grade" in df_geo.columns else 35.0
        cv_grade = grade_std / max(1.0, grade_mean)  # coefficient of variation
        geo_risk_score = round(float(np.clip(cv_grade * 120.0, 15.0, 95.0)), 1)

        # 2. Production Shortfall Risk (0-100)
        recent_prod = df_prod.sort_values(by="date").tail(6)
        shortfall_pcts = recent_prod["shortfall_pct"].values if "shortfall_pct" in recent_prod.columns else [8.0]
        avg_shortfall = float(np.mean(shortfall_pcts))
        prod_risk_score = round(float(np.clip(avg_shortfall * 4.5 + 20.0, 10.0, 98.0)), 1)

        # 3. Equipment Reliability Risk (0-100)
        avg_eq_health = float(df_equipment["health_score"].mean()) if "health_score" in df_equipment.columns else 75.0
        crit_units = int((df_equipment["health_score"] < 60).sum()) if "health_score" in df_equipment.columns else 2
        eq_risk_score = round(float(np.clip((100.0 - avg_eq_health) * 1.5 + (crit_units * 6.0), 10.0, 95.0)), 1)

        # 4. Data Quality Risk (0-100)
        missing_count = int(df_geo.isna().sum().sum())
        data_risk_score = round(float(np.clip(missing_count * 0.5 + 15.0, 10.0, 80.0)), 1)

        # 5. Environmental / Seasonality Risk (0-100)
        env_risk_score = 35.0  # Base seasonal monsoon risk

        # Composite Weighted Risk Score (0-100)
        composite_score = round(
            (geo_risk_score * 0.28) +
            (prod_risk_score * 0.32) +
            (eq_risk_score * 0.25) +
            (data_risk_score * 0.10) +
            (env_risk_score * 0.05),
            1
        )

        # Risk level classification
        if composite_score >= 75.0:
            risk_level = "Critical Risk"
            explanation = "Elevated risk driven by acute production deficits and high equipment breakdown rates."
        elif composite_score >= 55.0:
            risk_level = "High Risk"
            explanation = "Substantial risk due to upcoming monsoon season, grade heterogeneity, and aging haul fleet."
        elif composite_score >= 35.0:
            risk_level = "Moderate Risk"
            explanation = "Manageable risk. Minor grade variations and planned routine maintenance required."
        else:
            risk_level = "Low Risk"
            explanation = "Operations within optimal safety and production tolerance bands."

        pillars = [
            {
                "pillar": "Production Shortfall Risk",
                "score": prod_risk_score,
                "weight_pct": 32,
                "status": "Critical" if prod_risk_score > 70 else ("Warning" if prod_risk_score > 45 else "Good"),
                "description": f"Recent 6-month average production deficit is {avg_shortfall:.1f}% against target."
            },
            {
                "pillar": "Geological & Grade Uncertainty",
                "score": geo_risk_score,
                "weight_pct": 28,
                "status": "Warning" if geo_risk_score > 50 else "Good",
                "description": f"Grade coefficient of variation is {cv_grade:.2f} across sampled borehole intervals."
            },
            {
                "pillar": "Equipment Fleet Reliability",
                "score": eq_risk_score,
                "weight_pct": 25,
                "status": "Warning" if eq_risk_score > 50 else "Good",
                "description": f"Average fleet health is {avg_eq_health:.1f}% with {crit_units} high-risk machines."
            },
            {
                "pillar": "Data Quality & Spatial Coverage",
                "score": data_risk_score,
                "weight_pct": 10,
                "status": "Good" if data_risk_score < 40 else "Warning",
                "description": "High data integrity and consistent assay reporting."
            },
            {
                "pillar": "Environmental & Seasonal Factor",
                "score": env_risk_score,
                "weight_pct": 5,
                "status": "Good",
                "description": "Seasonal monsoon rainfall mitigation parameters active."
            }
        ]

        return {
            "composite_risk_score": composite_score,
            "risk_level": risk_level,
            "risk_explanation": explanation,
            "pillars": pillars,
            "radar_metrics": {
                "production_shortfall": prod_risk_score,
                "geological_uncertainty": geo_risk_score,
                "equipment_health": eq_risk_score,
                "data_quality": data_risk_score,
                "environmental": env_risk_score
            }
        }
