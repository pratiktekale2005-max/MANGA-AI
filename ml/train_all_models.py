"""
Master ML Training & Evaluation Script
Trains, evaluates, and registers all 9 machine learning models and analytical engines.
"""

import os
import json
import pandas as pd
import numpy as np

from ml.data.generate_demo_data import DATA_DIR, generate_all_datasets
from ml.preprocessing.data_cleaner import DataCleaner
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


def run_full_training_pipeline() -> dict:
    print("=" * 70)
    print("STARTING MOIL AI/ML TRAINING & REGISTRY PIPELINE")
    print("=" * 70)

    # 1. Ensure Data exists
    dh_file = os.path.join(DATA_DIR, "geological_drillholes.csv")
    if not os.path.exists(dh_file):
        print("Demo data not found. Generating synthetic MOIL mining datasets...")
        generate_all_datasets()

    # Load datasets
    df_geo_raw = pd.read_csv(os.path.join(DATA_DIR, "geological_drillholes.csv"))
    df_blocks_raw = pd.read_csv(os.path.join(DATA_DIR, "mine_blocks_3d.csv"))
    df_prod_raw = pd.read_csv(os.path.join(DATA_DIR, "production_history.csv"))
    df_eq_raw = pd.read_csv(os.path.join(DATA_DIR, "equipment_fleet.csv"))
    df_sat_raw = pd.read_csv(os.path.join(DATA_DIR, "satellite_spectral_grid.csv"))

    # 2. Data Cleaning & Validation
    print("\n[Phase 1 & 2] Cleaning & Validating Datasets...")
    df_geo, geo_report = DataCleaner.validate_and_clean_geological_data(df_geo_raw)
    df_prod, prod_report = DataCleaner.validate_and_clean_production_data(df_prod_raw)
    df_eq, eq_report = DataCleaner.validate_and_clean_equipment_data(df_eq_raw)
    print(f" -> Geological Quality Score: {geo_report.quality_score}/100 ({geo_report.total_rows} rows)")
    print(f" -> Production Quality Score: {prod_report.quality_score}/100 ({prod_report.total_rows} rows)")
    print(f" -> Equipment Quality Score: {eq_report.quality_score}/100 ({eq_report.total_rows} rows)")

    # 3. Satellite Spectral Indices
    print("\n[Phase 3] Processing Satellite Remote Sensing Spectral Indices...")
    df_sat = SatelliteProcessor.compute_all_indices(df_sat_raw)
    sat_summary = SatelliteProcessor.get_summary_metrics(df_sat)
    print(f" -> Calculated NDVI, NDWI, NDBI, Iron Oxide & Clay Indices for {sat_summary['total_pixels']} pixels.")
    print(f" -> High Exploration Potential Pixels: {sat_summary['high_potential_pixels']} ({sat_summary['high_potential_pct']}%)")

    # 4. Model 1: Manganese Grade Prediction
    print("\n[Phase 4] Training Model 1: Manganese Grade Predictor (Random Forest, Gradient Boosting, Extra Trees, Ridge)...")
    grade_engine = GradePredictorEngine()
    grade_meta = grade_engine.train_and_evaluate(df_geo)
    print(f" -> Best Algorithm: {grade_meta['best_algorithm']}")
    print(f" -> Test R2 Score: {grade_meta['test_r2']} | RMSE: {grade_meta['test_rmse']}% Mn | MAE: {grade_meta['test_mae']}% Mn")

    # 5. Model 3: Spatial Interpolation Comparison
    print("\n[Phase 5] Fitting Model 3: Spatial Estimation (IDW vs. Ordinary Kriging vs. ML Spatial)...")
    spatial_engine = SpatialInterpolator(p_idw=2.0)
    spatial_engine.fit(df_geo, x_col="x", y_col="y", val_col="mn_grade")
    spatial_comparison = spatial_engine.evaluate_methods(df_geo, x_col="x", y_col="y", val_col="mn_grade")
    for method, metrics in spatial_comparison.items():
        print(f" -> {method}: R2 = {metrics['r2_score']}, RMSE = {metrics['rmse']}")

    # 6. Model 2: 3D Block Model Reserve Estimation
    print("\n[Phase 6] Computing Model 2: 3D Block Model Reserve & Resource Estimation (UNFC 111/122/333)...")
    # Apply grade predictions to block model
    df_blocks_pred = grade_engine.predict(df_blocks_raw)
    reserve_summary = BlockModelReserveEngine.calculate_reserves(df_blocks_pred, cutoff_grade=20.0)
    print(f" -> Total In-Situ Ore Tonnage: {reserve_summary['total_ore_tonnage_million_t']} Million Tonnes")
    print(f" -> Average In-Situ Grade: {reserve_summary['average_ore_grade_pct']}% Mn")
    print(f" -> Recoverable Manganese: {reserve_summary['recoverable_manganese_thousand_t']:,} Thousand Tonnes")

    # 7. Model 4: Exploration Target Prioritization
    print("\n[Phase 7] Running Model 4: AI Exploration Target Prioritization & Drilling Recommendations...")
    exploration_summary = ExplorationPrioritizer.prioritize_targets(df_sat, top_k=5)
    print(f" -> Very High Priority Zones: {exploration_summary['very_high_priority_count']}")
    print(f" -> Top Target: {exploration_summary['top_recommended_targets'][0]['target_id']} (Priority Score: {exploration_summary['top_recommended_targets'][0]['priority_score']})")

    # 8. Model 5 & 7: Production Forecasting & Shortfall
    print("\n[Phase 8] Training Model 5 & 7: Time-Series Production Forecaster & Shortfall Engine...")
    prod_engine = ProductionForecaster()
    prod_meta = prod_engine.train(df_prod)
    future_forecast = prod_engine.forecast_future(df_prod, months_ahead=12)
    print(f" -> Forecast Model R2: {prod_meta['r2_score']} | MAPE: {prod_meta['mape_pct']}%")
    print(f" -> 12-Month Future Projected Ore: {sum(f['predicted_ore_tonnes'] for f in future_forecast):,.0f} Tonnes")

    # 9. Model 6: Equipment Fleet Intelligence
    print("\n[Phase 9] Running Model 6: Equipment Health Scoring & Reliability Analysis...")
    eq_summary = EquipmentAnalyzer.analyze_fleet(df_eq)
    print(f" -> Fleet Size: {eq_summary['fleet_size']} units | Overall Health: {eq_summary['overall_fleet_health_score']}/100")
    print(f" -> High Breakdown Risk Units: {eq_summary['critical_risk_count']}")

    # 10. Model 8: Anomaly Detection
    print("\n[Phase 10] Running Model 8: Isolation Forest Anomaly Detection...")
    geo_anomalies = AnomalyDetector.detect_geological_anomalies(df_geo)
    prod_anomalies = AnomalyDetector.detect_production_anomalies(df_prod)
    print(f" -> Geological Assay Anomalies Flagged: {geo_anomalies['anomalies_detected']}")
    print(f" -> Production Shock Anomalies Flagged: {prod_anomalies['production_anomalies_detected']}")

    # 11. Model 9: Composite Mining Risk Engine
    print("\n[Phase 11] Computing Model 9: Multi-Pillar Composite Risk Radar...")
    risk_summary = MiningRiskEngine.calculate_composite_risk(df_geo, df_prod, df_eq)
    print(f" -> Composite Risk Score: {risk_summary['composite_risk_score']}/100 ({risk_summary['risk_level']})")

    # 12. Model 10: Production Planning Optimization
    print("\n[Phase 12] Solving Model 10: Constrained Block Extraction Optimization...")
    opt_plan = ProductionOptimizer.optimize_plan(df_blocks_pred, target_production_tonnes=35000.0, min_blend_grade_pct=32.0)
    print(f" -> Scheduled Production: {opt_plan['scheduled_production_tonnes']:,} Tonnes ({opt_plan['target_fulfillment_pct']}% of Target)")
    print(f" -> Blended Mn Grade: {opt_plan['blended_mn_grade_pct']}% Mn (Constraint Met: {opt_plan['meets_grade_constraint']})")

    # 13. Model 11: Scenario Simulator
    print("\n[Phase 13] Running Model 11: What-If Operational Scenario Simulator...")
    scenario_res = ScenarioSimulator.simulate_scenarios(base_target_tonnes=35000.0, base_grade=40.5)
    print(f" -> Evaluated 4 Scenarios: Baseline, High Fleet Avail, Monsoon Delay, High-Grade Selective.")

    # 14. Model 12: AI Recommendation Engine
    print("\n[Phase 14] Synthesizing Model 12: AI Actionable Recommendations...")
    recs = RecommendationEngine.generate_recommendations(
        geo_report.to_dict(), sat_summary, reserve_summary, exploration_summary,
        future_forecast, eq_summary, risk_summary
    )
    print(f" -> Generated {len(recs)} evidence-backed recommendations across Exploration, Production, Fleet & Risk.")

    # Save complete pipeline summary to registry
    summary = {
        "pipeline_status": "SUCCESS",
        "models_trained": [
            "Manganese Grade Predictor (Random Forest / Gradient Boosting)",
            "Spatial Estimator (IDW, Kriging, ML)",
            "3D Block Model Reserve Engine",
            "Exploration Target Prioritizer",
            "Production Time-Series Forecaster",
            "Equipment Health & Reliability Analyzer",
            "Isolation Forest Anomaly Detector",
            "Composite Mining Risk Engine",
            "Constrained Extraction Optimizer",
            "What-If Scenario Simulator",
            "AI Actionable Recommendation Engine"
        ],
        "grade_model": grade_meta,
        "spatial_comparison": spatial_comparison,
        "production_model": prod_meta,
        "reserve_summary": {k: v for k, v in reserve_summary.items() if k != "grade_tonnage_curve"},
        "risk_summary": risk_summary,
        "optimization_summary": {k: v for k, v in opt_plan.items() if k != "scheduled_blocks"},
        "recommendations_count": len(recs)
    }

    registry_path = os.path.join(os.path.dirname(__file__), "model_registry", "pipeline_summary.json")
    with open(registry_path, "w") as f:
        json.dump(summary, f, indent=2)

    print("\n" + "=" * 70)
    print("ALL MODELS TRAINED, VALIDATED, EVALUATED, AND SAVED TO REGISTRY!")
    print("=" * 70)
    return summary


if __name__ == "__main__":
    run_full_training_pipeline()
