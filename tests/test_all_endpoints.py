"""
Automated Test Suite for MOIL AI Mine Intelligence Platform
Validates ML models, data validation pipelines, spatial interpolation, and API endpoints.
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "HEALTHY"
    assert data["models_loaded"] is True


def test_mines_list():
    response = client.get("/api/data/mines")
    assert response.status_code == 200
    data = response.json()
    assert len(data["mines"]) >= 4
    assert any(m["mine_id"] == "MOIL-DB-01" for m in data["mines"])


def test_dashboard_summary():
    response = client.get("/api/dashboard/summary")
    assert response.status_code == 200
    data = response.json()
    assert "kpis" in data
    assert "total_estimated_reserve_million_t" in data["kpis"]
    assert "recoverable_reserve_million_t" in data["kpis"]
    assert "composite_risk_score" in data["kpis"]
    assert len(data["recent_alerts"]) > 0


def test_eda_summary():
    response = client.get("/api/eda/summary")
    assert response.status_code == 200
    data = response.json()
    assert len(data["statistics_table"]) > 0
    assert "correlation_matrix" in data
    assert len(data["grade_distribution_bins"]) == 5


def test_satellite_indices():
    response = client.get("/api/satellite/indices")
    assert response.status_code == 200
    data = response.json()
    assert "summary_metrics" in data
    assert len(data["spectral_pixels"]) > 0
    first_px = data["spectral_pixels"][0]
    assert "NDVI" in first_px
    assert "iron_oxide_index" in first_px
    assert "clay_mineral_index" in first_px
    assert "exploration_potential_score" in first_px


def test_geology_drillholes():
    response = client.get("/api/geology/drillholes")
    assert response.status_code == 200
    data = response.json()
    assert data["total_boreholes"] > 0
    assert len(data["drillholes"]) > 0
    assert len(data["drillholes"][0]["intervals"]) > 0


def test_grade_prediction_model():
    payload = {
        "x": 120.0,
        "y": -80.0,
        "sample_depth": 45.0,
        "collar_elevation": 320.0,
        "lithology": "High-Grade Braunite Ore",
        "density": 4.1,
        "sat_iron_oxide": 2.4,
        "sat_clay_index": 1.4,
        "fe_grade": 7.0,
        "sio2": 16.5
    }
    response = client.post("/api/models/grade/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "predicted_mn_grade_pct" in data
    assert data["predicted_mn_grade_pct"] > 25.0
    assert "confidence_score" in data
    assert len(data["explainability_factors"]) > 0


def test_spatial_estimation_comparison():
    response = client.get("/api/spatial/compare")
    assert response.status_code == 200
    data = response.json()
    assert "IDW (Inverse Distance Weighting)" in data["comparison"]
    assert "Ordinary Kriging (Gaussian Process)" in data["comparison"]
    assert "ML Spatial Regressor" in data["comparison"]


def test_reserve_estimation():
    response = client.get("/api/reserve/estimate?cutoff_grade=20.0")
    assert response.status_code == 200
    data = response.json()
    assert data["total_ore_tonnage_million_t"] > 0
    assert data["average_ore_grade_pct"] > 15.0
    assert len(data["grade_tonnage_curve"]) > 0
    assert "disclaimer" in data


def test_exploration_prioritization():
    response = client.get("/api/exploration/prioritize?top_k=5")
    assert response.status_code == 200
    data = response.json()
    assert len(data["top_recommended_targets"]) > 0
    top = data["top_recommended_targets"][0]
    assert "target_id" in top
    assert "priority_score" in top
    assert "recommended_hole_depth_m" in top
    assert "geological_rationale" in top


def test_production_forecasting():
    response = client.get("/api/production/forecast?months_ahead=12")
    assert response.status_code == 200
    data = response.json()
    assert len(data["forecasts"]) == 12
    f1 = data["forecasts"][0]
    assert "predicted_ore_tonnes" in f1
    assert "target_ore_tonnes" in f1
    assert "shortfall_risk_status" in f1


def test_equipment_intelligence():
    response = client.get("/api/equipment/fleet")
    assert response.status_code == 200
    data = response.json()
    assert data["fleet_size"] > 0
    assert data["overall_fleet_health_score"] > 0
    assert len(data["all_units"]) > 0


def test_risk_and_anomalies():
    resp_risk = client.get("/api/risk/composite")
    assert resp_risk.status_code == 200
    data_risk = resp_risk.json()
    assert "composite_risk_score" in data_risk
    assert len(data_risk["pillars"]) == 5

    resp_anom_geo = client.get("/api/risk/anomalies/geological")
    assert resp_anom_geo.status_code == 200
    assert "anomalies_detected" in resp_anom_geo.json()

    resp_anom_prod = client.get("/api/risk/anomalies/production")
    assert resp_anom_prod.status_code == 200


def test_production_optimization():
    payload = {
        "target_production_tonnes": 35000.0,
        "equipment_capacity_tonnes": 45000.0,
        "min_blend_grade_pct": 30.0,
        "planning_period_months": 1
    }
    response = client.post("/api/optimization/plan", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["scheduled_production_tonnes"] > 0
    assert len(data["scheduled_blocks"]) > 0


def test_scenario_simulator():
    payload = {
        "base_target_tonnes": 35000.0,
        "base_grade": 40.5,
        "base_fleet_avail": 85.0,
        "base_working_days": 26,
        "base_recovery_pct": 88.0
    }
    response = client.post("/api/scenarios/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert len(data["scenarios"]) == 4


def test_ai_recommendations():
    response = client.get("/api/recommendations")
    assert response.status_code == 200
    data = response.json()
    assert data["total_recommendations"] > 0
    rec = data["recommendations"][0]
    assert "title" in rec
    assert "reason" in rec
    assert "supporting_factors" in rec
    assert "actionable_step" in rec


def test_report_export_pdf():
    response = client.get("/api/reports/export/pdf")
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert len(response.content) > 1000
