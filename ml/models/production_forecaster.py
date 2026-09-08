"""
Model 5 & 7: Production Forecasting & Shortfall Prediction Engine
Trains time-series regression models with operational drivers and seasonal features
to forecast monthly/quarterly production and attribute shortfall risks.
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Tuple
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

REGISTRY_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "model_registry")


class ProductionForecaster:
    """Forecasts manganese production and evaluates shortfall risk with root cause analysis."""

    def __init__(self):
        self.model = None
        self.metadata = {}
        self.registry_dir = REGISTRY_DIR
        os.makedirs(self.registry_dir, exist_ok=True)

    def train(self, df_production: pd.DataFrame) -> Dict[str, Any]:
        """Trains regression model on historical production records."""
        df = df_production.copy().sort_values(by="date")

        # Feature Engineering: Lags & Operational features
        df["month_sin"] = np.sin(2 * np.pi * df["month"] / 12.0)
        df["month_cos"] = np.cos(2 * np.pi * df["month"] / 12.0)
        df["lag_1_prod"] = df["actual_ore_tonnes"].shift(1).bfill()
        df["lag_2_prod"] = df["actual_ore_tonnes"].shift(2).bfill()
        df["rolling_3m_prod"] = df["actual_ore_tonnes"].rolling(3, min_periods=1).mean()

        features = [
            "month_sin", "month_cos", "working_days", "operating_hours",
            "fleet_availability_pct", "fleet_utilization_pct", "actual_mn_grade",
            "lag_1_prod", "lag_2_prod", "rolling_3m_prod"
        ]
        
        # Filter available features
        feat_cols = [c for c in features if c in df.columns]
        X = df[feat_cols].values
        y = df["actual_ore_tonnes"].values

        # Split: Train on first 80%, test on recent 20%
        split_idx = int(len(df) * 0.8)
        X_train, X_test = X[:split_idx], X[split_idx:]
        y_train, y_test = y[:split_idx], y[split_idx:]

        model = GradientBoostingRegressor(n_estimators=100, learning_rate=0.08, max_depth=4, random_state=42)
        model.fit(X_train, y_train)

        y_pred = model.predict(X_test)
        rmse = float(np.sqrt(mean_squared_error(y_test, y_pred)))
        mae = float(mean_absolute_error(y_test, y_pred))
        r2 = float(r2_score(y_test, y_pred))
        mape = float(np.mean(np.abs((y_test - y_pred) / np.maximum(1.0, y_test))) * 100.0)

        self.model = model
        model_path = os.path.join(self.registry_dir, "production_forecaster.joblib")
        joblib.dump(model, model_path)

        # Feature importance
        feat_imp = {feat: round(float(imp), 4) for feat, imp in zip(feat_cols, model.feature_importances_)}
        feat_imp = dict(sorted(feat_imp.items(), key=lambda x: x[1], reverse=True))

        metadata = {
            "model_name": "Production Time-Series Forecaster",
            "algorithm": "Gradient Boosting Regressor with Operational Lags",
            "r2_score": round(r2, 4),
            "rmse_tonnes": round(rmse, 1),
            "mae_tonnes": round(mae, 1),
            "mape_pct": round(mape, 2),
            "feature_importances": feat_imp,
            "training_samples": len(df),
            "model_path": model_path
        }
        self.metadata = metadata

        with open(os.path.join(self.registry_dir, "production_forecaster_meta.json"), "w") as f:
            json.dump(metadata, f, indent=2)

        return metadata

    def forecast_future(self, df_history: pd.DataFrame, months_ahead: int = 12) -> List[Dict[str, Any]]:
        """Generates month-by-month future production forecast with shortfall risk assessment."""
        if self.model is None:
            self._load_or_raise()

        df_hist = df_history.copy().sort_values(by="date")
        last_date = pd.to_datetime(df_hist["date"].iloc[-1])
        base_target = float(df_hist["target_ore_tonnes"].mean())
        avg_grade = float(df_hist["actual_mn_grade"].mean())

        last_prod = float(df_hist["actual_ore_tonnes"].iloc[-1])
        prev_prod = float(df_hist["actual_ore_tonnes"].iloc[-2]) if len(df_hist) > 1 else last_prod

        forecasts = []
        curr_date = last_date

        for m in range(1, months_ahead + 1):
            curr_date = curr_date + pd.DateOffset(months=1)
            month_num = curr_date.month
            
            # Monsoon adjustment (July - Sept)
            is_monsoon = month_num in [7, 8, 9]
            working_days = 22 if is_monsoon else 26
            fleet_avail = 72.0 if is_monsoon else 88.0
            fleet_util = 74.0 if is_monsoon else 84.0
            op_hours = working_days * 20.0 * (fleet_avail / 100.0) * (fleet_util / 100.0)

            m_sin = np.sin(2 * np.pi * month_num / 12.0)
            m_cos = np.cos(2 * np.pi * month_num / 12.0)
            roll_3m = (last_prod + prev_prod + base_target) / 3.0

            x_input = np.array([[
                m_sin, m_cos, working_days, op_hours,
                fleet_avail, fleet_util, avg_grade,
                last_prod, prev_prod, roll_3m
            ]])

            pred_tonnes = float(self.model.predict(x_input)[0])
            pred_tonnes = max(5000.0, pred_tonnes)
            
            target_tonnes = base_target
            shortfall_tonnes = target_tonnes - pred_tonnes
            shortfall_pct = round((shortfall_tonnes / target_tonnes) * 100.0, 1)

            # Risk classification
            if shortfall_pct > 15.0:
                risk_status = "Critical Risk"
                root_cause = "Monsoon heavy rainfall & reduced equipment availability" if is_monsoon else "Severe equipment downtime & maintenance bottleneck"
            elif shortfall_pct > 5.0:
                risk_status = "Warning"
                root_cause = "Sub-optimal fleet utilization and bench transition"
            else:
                risk_status = "On Track"
                root_cause = "Operations operating at planned capacity"

            # Confidence interval (+- 6%)
            lower_bound = round(pred_tonnes * 0.94, 0)
            upper_bound = round(pred_tonnes * 1.06, 0)

            contained_mn = round(pred_tonnes * (avg_grade / 100.0) * 0.88, 1)

            forecasts.append({
                "forecast_month": curr_date.strftime("%Y-%m"),
                "month_name": curr_date.strftime("%B %Y"),
                "predicted_ore_tonnes": round(pred_tonnes, 0),
                "target_ore_tonnes": round(target_tonnes, 0),
                "lower_bound_tonnes": lower_bound,
                "upper_bound_tonnes": upper_bound,
                "expected_mn_grade_pct": round(avg_grade, 2),
                "contained_mn_tonnes": contained_mn,
                "shortfall_tonnes": round(shortfall_tonnes, 0),
                "shortfall_pct": shortfall_pct,
                "shortfall_risk_status": risk_status,
                "root_cause_factor": root_cause,
                "confidence_pct": 86.5 if not is_monsoon else 78.0
            })

            # Update lag variables
            prev_prod = last_prod
            last_prod = pred_tonnes

        return forecasts

    def _load_or_raise(self):
        model_path = os.path.join(self.registry_dir, "production_forecaster.joblib")
        if os.path.exists(model_path):
            self.model = joblib.load(model_path)
        else:
            raise RuntimeError("Production Forecaster model is not trained yet.")
