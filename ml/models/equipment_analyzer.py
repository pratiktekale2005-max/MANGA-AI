"""
Model 6: Equipment Intelligence, Health Scoring & Reliability Analysis Engine
Analyzes mining fleet telemetry, availability, utilization, MTBF/MTTR,
and predicts production bottlenecks and breakdown risks.
"""

import numpy as np
import pandas as pd
from typing import Dict, Any, List


class EquipmentAnalyzer:
    """Analyzes equipment telemetry, OEE, MTBF/MTTR, and computes unit health scores."""

    @staticmethod
    def analyze_fleet(df_equipment: pd.DataFrame) -> Dict[str, Any]:
        """Processes fleet metrics and returns holistic health analysis & risk rankings."""
        df = df_equipment.copy()

        # Compute or validate metrics
        if "availability_pct" not in df.columns:
            df["availability_pct"] = ((720.0 - df.get("monthly_downtime_hours", 40.0)) / 720.0 * 100.0).clip(0, 100).round(1)

        if "utilization_pct" not in df.columns:
            df["utilization_pct"] = (df.get("monthly_operating_hours", 480.0) / (720.0 - df.get("monthly_downtime_hours", 40.0)) * 100.0).clip(0, 100).round(1)

        # OEE (Overall Equipment Effectiveness) = Availability * Performance * Quality (assuming 95% quality)
        df["oee_pct"] = ((df["availability_pct"] / 100.0) * (df["utilization_pct"] / 100.0) * 0.95 * 100.0).round(1)

        # Health score calculation (0 - 100)
        if "health_score" not in df.columns:
            age = df.get("age_years", 3.0)
            down = df.get("breakdown_hours", 10.0)
            df["health_score"] = (100.0 - (age * 3.8) - (down * 1.2)).clip(25, 99).astype(int)

        # Production impact of downtime (tonnes lost)
        capacity = df.get("hourly_capacity_tph", 200.0)
        breakdown = df.get("breakdown_hours", 12.0)
        df["lost_production_tonnes"] = (breakdown * capacity * 0.75).round(0)

        # Status categorization
        conditions = [
            df["health_score"] >= 80,
            df["health_score"] >= 60
        ]
        choices = ["Healthy", "Warning / Inspection Due"]
        df["status"] = np.select(conditions, choices, default="High Breakdown Risk")

        # Fleet-wide Aggregates
        fleet_size = len(df)
        avg_health = round(float(df["health_score"].mean()), 1)
        avg_availability = round(float(df["availability_pct"].mean()), 1)
        avg_utilization = round(float(df["utilization_pct"].mean()), 1)
        avg_oee = round(float(df["oee_pct"].mean()), 1)
        total_lost_tonnes = int(df["lost_production_tonnes"].sum())

        critical_units = df[df["status"] == "High Breakdown Risk"].to_dict(orient="records")
        warning_units = df[df["status"] == "Warning / Inspection Due"].to_dict(orient="records")
        healthy_units = df[df["status"] == "Healthy"].to_dict(orient="records")

        # Type-wise breakdown
        type_summary = []
        if "equipment_type" in df.columns:
            grouped = df.groupby("equipment_type").agg(
                count=("equipment_id", "count"),
                avg_health=("health_score", "mean"),
                avg_avail=("availability_pct", "mean"),
                lost_tonnes=("lost_production_tonnes", "sum")
            ).reset_index()
            for _, r in grouped.iterrows():
                type_summary.append({
                    "equipment_type": str(r["equipment_type"]),
                    "count": int(r["count"]),
                    "avg_health_score": round(float(r["avg_health"]), 1),
                    "avg_availability_pct": round(float(r["avg_avail"]), 1),
                    "total_lost_tonnes": int(r["lost_tonnes"])
                })

        return {
            "fleet_size": fleet_size,
            "overall_fleet_health_score": avg_health,
            "overall_availability_pct": avg_availability,
            "overall_utilization_pct": avg_utilization,
            "overall_oee_pct": avg_oee,
            "total_monthly_lost_tonnes": total_lost_tonnes,
            "critical_risk_count": len(critical_units),
            "warning_count": len(warning_units),
            "healthy_count": len(healthy_units),
            "type_breakdown": type_summary,
            "critical_units": critical_units,
            "all_units": df.to_dict(orient="records")
        }
