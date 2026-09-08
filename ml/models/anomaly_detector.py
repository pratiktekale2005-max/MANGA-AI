"""
Model 8: Geological & Production Anomaly Detection Engine
Uses Isolation Forest and Statistical Z-Score / IQR methods to flag
erroneous assay records, spatial outliers, and production anomalies.
"""

import numpy as np
import pandas as pd
from typing import Dict, Any, List
from sklearn.ensemble import IsolationForest


class AnomalyDetector:
    """Detects multi-variate anomalies in geological assays and production time-series."""

    @staticmethod
    def detect_geological_anomalies(df_geo: pd.DataFrame, contamination: float = 0.05) -> Dict[str, Any]:
        """Detects anomalous borehole assays (grade outliers, abnormal depth/thickness, density mismatch)."""
        df = df_geo.copy()

        features = [c for c in ["mn_grade", "fe_grade", "sio2", "density", "sample_depth", "thickness"] if c in df.columns]
        if len(features) < 2:
            return {"anomalies_detected": 0, "anomalous_records": []}

        X = df[features].fillna(df[features].median()).values

        # Isolation Forest
        iso = IsolationForest(contamination=contamination, random_state=42)
        preds = iso.fit_predict(X)
        scores = iso.decision_function(X)

        df["is_anomaly"] = (preds == -1)
        # Convert decision function to 0-100 anomaly severity score
        df["anomaly_severity"] = np.clip((0.5 - scores) * 100.0, 10.0, 99.0).round(1)

        anomalies = df[df["is_anomaly"]].copy()
        anomaly_list = []

        for _, row in anomalies.iterrows():
            reasons = []
            mn = float(row.get("mn_grade", 0.0))
            fe = float(row.get("fe_grade", 0.0))
            sio2 = float(row.get("sio2", 0.0))
            density = float(row.get("density", 3.0))

            if mn > 48.0 and density < 3.2:
                reasons.append("Unusually high Mn grade with low rock density (potential assay error)")
            if mn < 5.0 and fe < 4.0 and sio2 < 15.0:
                reasons.append("Missing mineral composition sum (total assay components < 25%)")
            if mn > 50.0:
                reasons.append(f"Super-high grade anomaly ({mn}% Mn)")
            if not reasons:
                reasons.append("Multi-variate statistical outlier across assay chemistry and depth")

            anomaly_list.append({
                "hole_id": str(row.get("hole_id", "Unknown")),
                "sample_depth": float(row.get("sample_depth", 0.0)),
                "mn_grade": mn,
                "fe_grade": fe,
                "sio2": sio2,
                "density": density,
                "anomaly_severity_score": float(row["anomaly_severity"]),
                "flagged_reason": "; ".join(reasons)
            })

        return {
            "total_samples_analyzed": len(df),
            "anomalies_detected": len(anomalies),
            "anomaly_rate_pct": round(len(anomalies) / max(1, len(df)) * 100.0, 2),
            "anomalous_records": anomaly_list
        }

    @staticmethod
    def detect_production_anomalies(df_prod: pd.DataFrame) -> Dict[str, Any]:
        """Detects unexpected drops, downtime spikes, or yield shocks in monthly production logs."""
        df = df_prod.copy().sort_values(by="date")

        anomalies = []
        mean_prod = df["actual_ore_tonnes"].mean()
        std_prod = df["actual_ore_tonnes"].std()
        mean_down = df.get("downtime_hours", pd.Series(50, index=df.index)).mean()
        std_down = df.get("downtime_hours", pd.Series(50, index=df.index)).std()

        for _, row in df.iterrows():
            prod = float(row["actual_ore_tonnes"])
            target = float(row.get("target_ore_tonnes", prod))
            downtime = float(row.get("downtime_hours", 0.0))
            date_str = str(row.get("date", ""))

            # Z-score test
            z_prod = (prod - mean_prod) / max(1.0, std_prod)
            z_down = (downtime - mean_down) / max(1.0, std_down)

            is_anomaly = False
            reasons = []

            if z_prod < -2.0:
                is_anomaly = True
                reasons.append(f"Severe production plunge ({int(prod):,} t vs avg {int(mean_prod):,} t)")
            if z_down > 2.2:
                is_anomaly = True
                reasons.append(f"Abnormal equipment downtime spike ({downtime:.1f} hrs)")
            if target > 0 and (target - prod) / target > 0.25:
                is_anomaly = True
                reasons.append(f"Catastrophic production shortfall (>25% target deficit)")

            if is_anomaly:
                anomalies.append({
                    "date": date_str,
                    "actual_ore_tonnes": prod,
                    "target_ore_tonnes": target,
                    "downtime_hours": downtime,
                    "z_score": round(float(z_prod), 2),
                    "anomaly_type": "Production Shock",
                    "severity": "Critical" if z_prod < -2.5 or z_down > 2.5 else "Warning",
                    "flagged_reason": "; ".join(reasons)
                })

        return {
            "total_months_analyzed": len(df),
            "production_anomalies_detected": len(anomalies),
            "anomalous_records": anomalies
        }
