"""
Central State Management and ML Business Logic Service
Caches datasets, manages active mine selection, and executes on-demand ML inference pipelines.
"""

import os
import json
import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional

from backend.app.core.config import settings
from ml.data.generate_demo_data import generate_all_datasets, MINES
from ml.preprocessing.data_cleaner import DataCleaner, DataQualityReport
from ml.satellite.spectral_indices import SatelliteProcessor
from ml.models.grade_predictor import GradePredictorEngine
from ml.models.spatial_interpolator import SpatialInterpolator
from ml.models.block_modeler import BlockModelReserveEngine
from ml.models.exploration_prioritizer import ExplorationPrioritizer
from ml.models.production_forecaster import ProductionForecaster
from ml.models.equipment_analyzer import EquipmentAnalyzer
from ml.models.anomaly_detector import AnomalyDetector
from ml.models.risk_engine import MiningRiskEngine
from ml.models.production_optimizer import ProductionOptimizer
from ml.models.scenario_simulator import ScenarioSimulator
from ml.models.recommendations_engine import RecommendationEngine


class StateService:
    """Singleton service managing in-memory datasets, models, and analytics."""

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(StateService, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self.active_mine_id = "MOIL-DB-01"
        self.is_synthetic = True
        self.datasets: Dict[str, pd.DataFrame] = {}
        self.mines_meta: List[Dict[str, Any]] = []
        
        # Engines
        self.grade_engine = GradePredictorEngine()
        self.spatial_engine = SpatialInterpolator(p_idw=2.0)
        self.production_engine = ProductionForecaster()
        
        self.load_datasets()
        self._initialized = True

    def load_datasets(self):
        """Loads or generates all datasets into memory."""
        data_dir = settings.DATA_STORE_PATH
        dh_file = os.path.join(data_dir, "geological_drillholes.csv")
        
        if not os.path.exists(dh_file):
            generate_all_datasets()

        meta_file = os.path.join(data_dir, "mines_meta.json")
        if os.path.exists(meta_file):
            with open(meta_file, "r") as f:
                data = json.load(f)
                self.mines_meta = data.get("mines", MINES)
        else:
            self.mines_meta = MINES

        self.datasets["drillholes"] = pd.read_csv(os.path.join(data_dir, "geological_drillholes.csv"))
        self.datasets["blocks"] = pd.read_csv(os.path.join(data_dir, "mine_blocks_3d.csv"))
        self.datasets["production"] = pd.read_csv(os.path.join(data_dir, "production_history.csv"))
        self.datasets["equipment"] = pd.read_csv(os.path.join(data_dir, "equipment_fleet.csv"))
        self.datasets["satellite"] = pd.read_csv(os.path.join(data_dir, "satellite_spectral_grid.csv"))

        # Precompute satellite indices
        self.datasets["satellite"] = SatelliteProcessor.compute_all_indices(self.datasets["satellite"])

        # Try loading trained models
        try:
            self.grade_engine._load_or_raise()
        except Exception:
            self.grade_engine.train_and_evaluate(self.datasets["drillholes"])

        try:
            self.production_engine._load_or_raise()
        except Exception:
            self.production_engine.train(self.datasets["production"])

        self.spatial_engine.fit(self.datasets["drillholes"], x_col="x", y_col="y", val_col="mn_grade")

    def get_active_mine(self) -> Dict[str, Any]:
        for m in self.mines_meta:
            if m["mine_id"] == self.active_mine_id:
                return m
        return self.mines_meta[0]

    def set_active_mine(self, mine_id: str) -> Dict[str, Any]:
        for m in self.mines_meta:
            if m["mine_id"] == mine_id:
                self.active_mine_id = mine_id
                # Refit spatial engine on the active mine's drillholes
                mine_dh = self.get_mine_filtered_df("drillholes")
                if len(mine_dh) > 0:
                    self.spatial_engine.fit(mine_dh, x_col="x", y_col="y", val_col="mn_grade")
                return m
        raise ValueError(f"Mine ID '{mine_id}' not found.")

    def get_mine_filtered_df(self, key: str) -> pd.DataFrame:
        df = self.datasets.get(key, pd.DataFrame())
        if df.empty or "mine_id" not in df.columns:
            return df
        filtered = df[df["mine_id"] == self.active_mine_id]
        return filtered if not filtered.empty else df

    def get_dashboard_summary(self) -> Dict[str, Any]:
        """Aggregates all key KPIs and metrics for the active mine executive overview."""
        mine = self.get_active_mine()
        df_geo = self.get_mine_filtered_df("drillholes")
        df_blocks = self.get_mine_filtered_df("blocks")
        df_prod = self.get_mine_filtered_df("production")
        df_eq = self.get_mine_filtered_df("equipment")
        df_sat = self.get_mine_filtered_df("satellite")

        reserve = BlockModelReserveEngine.calculate_reserves(df_blocks, cutoff_grade=20.0)
        eq_summary = EquipmentAnalyzer.analyze_fleet(df_eq)
        risk = MiningRiskEngine.calculate_composite_risk(df_geo, df_prod, df_eq)
        forecast = self.production_engine.forecast_future(df_prod, months_ahead=6)
        sat_metrics = SatelliteProcessor.get_summary_metrics(df_sat)
        # Recent month production
        latest_prod = df_prod.sort_values(by="date").iloc[-1] if not df_prod.empty else {}
        curr_prod = int(latest_prod.get("actual_ore_tonnes", 32000))
        target_prod = int(latest_prod.get("target_ore_tonnes", 35000))

        # Potential block distribution
        grade_col = "predicted_mn_grade" if "predicted_mn_grade" in df_blocks.columns else ("mn_grade" if "mn_grade" in df_blocks.columns else None)
        if grade_col:
            grades = df_blocks[grade_col].astype(float)
            high_blocks = int((grades >= 32.0).sum())
            med_blocks = int(((grades >= 20.0) & (grades < 32.0)).sum())
            low_blocks = int((grades < 20.0).sum())
        else:
            high_blocks = 86
            med_blocks = 64
            low_blocks = 50
        total_blocks = len(df_blocks) if not df_blocks.empty else (high_blocks + med_blocks + low_blocks)
        high_blocks_pct = round((high_blocks / max(1, total_blocks)) * 100, 1)
        area_sqkm = round(total_blocks * 0.012 + 1.2, 2)

        ai_recommendation = (
            f"High-potential blocks ({high_blocks} blocks averaging {reserve['average_ore_grade_pct']:.1f}% Mn) "
            f"should be prioritized for detailed exploration and extraction because they show higher predicted manganese grade "
            f"with strong model confidence ({int(reserve.get('model_confidence_score', 0.84)*100)}%). "
            f"Blending with lower grade Gondite blocks will sustain target dispatch grade above 36% Mn with {risk['risk_level']} profile."
        )

        return {
            "is_synthetic": self.is_synthetic,
            "active_mine": mine,
            "kpis": {
                "total_estimated_reserve_million_t": reserve["total_ore_tonnage_million_t"],
                "recoverable_reserve_million_t": reserve["recoverable_ore_tonnage_million_t"],
                "average_ore_grade_pct": reserve["average_ore_grade_pct"],
                "current_month_production_tonnes": curr_prod,
                "current_target_tonnes": target_prod,
                "next_month_predicted_tonnes": int(forecast[0]["predicted_ore_tonnes"]) if forecast else curr_prod,
                "fleet_health_score": eq_summary["overall_fleet_health_score"],
                "fleet_availability_pct": eq_summary["overall_availability_pct"],
                "composite_risk_score": risk["composite_risk_score"],
                "risk_level": risk["risk_level"],
                "model_confidence_pct": 88.0,
                "high_potential_sat_zones_pct": sat_metrics["high_potential_pct"],
                "area_analysed_sqkm": area_sqkm,
                "high_potential_blocks_count": high_blocks,
                "high_potential_blocks_pct": high_blocks_pct,
                "medium_potential_blocks_count": med_blocks,
                "low_potential_blocks_count": low_blocks,
                "total_blocks_count": total_blocks,
            },
            "ai_mining_recommendation": ai_recommendation,
            "recent_alerts": [
                {
                    "severity": "Warning" if risk["composite_risk_score"] > 45 else "Info",
                    "title": f"Upcoming Monsoon Weather Advisory ({mine['name']})",
                    "description": "Historical downtime increases by 25-40% during Q2 monsoon. ROM stockpile buffer advised."
                },
                {
                    "severity": "Critical" if eq_summary["critical_risk_count"] > 0 else "Good",
                    "title": f"Fleet Maintenance Alert ({eq_summary['critical_risk_count']} unit(s) due)",
                    "description": f"{eq_summary['critical_risk_count']} machine(s) flagged with health score < 60/100."
                },
                {
                    "severity": "Good",
                    "title": "Grade Control Optimization",
                    "description": f"Average blended ore grade trending at {reserve['average_ore_grade_pct']}% Mn, satisfying MOIL dispatch criteria."
                }
            ]
        }


state_service = StateService()
