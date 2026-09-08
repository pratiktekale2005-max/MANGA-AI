# MOIL AI Mine Intelligence Platform

### AI/ML + Satellite-Based Manganese Reserve Intelligence & Production Planning System for MOIL Limited

[![Python 3.11](https://img.shields.io/badge/Python-3.11-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%200.110-009688.svg)](https://fastapi.tiangolo.com/)
[![React 18](https://img.shields.io/badge/Frontend-React%2018%20+%20Vite-61dafb.svg)](https://reactjs.org/)
[![Scikit-Learn](https://img.shields.io/badge/ML-Scikit--Learn%201.4-F7931E.svg)](https://scikit-learn.org/)
[![Sentinel-2](https://img.shields.io/badge/Remote%20Sensing-Sentinel--2%2012--Band-3b82f6.svg)](https://sentinel.esa.int/)
[![UNFC Code](https://img.shields.io/badge/Standard-UNFC%20111%2F122%2F333-purple.svg)](https://unece.org/sustainable-energy/unfc-and-unrms)
[![Tests Passing](https://img.shields.io/badge/Tests-17%2F17%20Passed-10b981.svg)]()

---

## 1. Project Overview & Problem Statement

This platform addresses the strategic imperative of modernizing manganese exploration and production planning for **MOIL Limited** (India's premier manganese ore producer). 

This platform unifies:
1. **Space Technology & Remote Sensing:** 12-band Sentinel-2 spectral indices (Iron Oxide Index, Clay Mineral Alteration, Ferrous Ratio, NDVI).
2. **Geological & 3D Borehole Modeling:** 1,825+ core assay intervals across major Sausar Group formations (*Dongri Buzurg, Balaghat, Gumgaon, Ukwa*).
3. **AI/ML Grade Estimation & Explainability:** Multi-regressor ensemble with Tree SHAP factor attribution predicting in-situ Mn grade ($R^2 = 0.925$).
4. **3D Block Resource & Reserve Inventory:** UNFC 111/122/333 aligned voxel tonnage, cut-off grade sensitivity curves, and contained metallic manganese.
5. **Time-Series Production Forecaster & Shortfall Intelligence:** 12-month future projected output with automatic operational shortfall root cause attribution.
6. **Fleet Reliability & Equipment Health:** Tracking availability, utilization, OEE, MTBF/MTTR, and breakdown impact.
7. **Constrained Mine Extraction Optimizer:** Mathematical scheduler maximizing recoverable manganese subject to fleet handling limits and minimum blended dispatch grade.
8. **Interactive GIS Exploration Map & Executive Reporting:** Leaflet-based multi-layer GIS with automated PDF report generation.

---

## 2. Machine Learning Benchmark & Validation Results

All models are trained, evaluated with 5-fold cross-validation, and registered in `ml/model_registry/`:

| Model / Engine | Algorithm / Methodology | Primary Evaluation Metric | Benchmark Value |
| :--- | :--- | :--- | :--- |
| **Model 1: Manganese Grade Predictor** | Random Forest / Ridge Ensemble | Test $R^2$ Score / RMSE | **$R^2 = 0.9247$** • $\text{RMSE} = 3.46\%$ Mn |
| **Model 3: Spatial Estimation** | Ordinary Kriging (Gaussian Process) | Spatial $R^2$ / RMSE | **$R^2 = 0.3977$** • $\text{RMSE} = 9.68\%$ Mn |
| **Model 2: 3D Block Reserve Engine** | Voxel Block Density & Cut-Off Model | Total In-Situ Reserve | **997.92 Mt Ore** (26.51% avg Mn) |
| **Model 4: Exploration Prioritizer** | Bayesian Alteration-Grade Ranker | Top Target Priority Score | **Target EXP-TGT-01 (69.8%)** |
| **Model 5 & 7: Production Forecaster** | Lagged Gradient Boosting Regressor | Forecaster $R^2$ / MAPE | **$R^2 = 0.9055$** • $\text{MAPE} = 11.36\%$ |
| **Model 6: Equipment Intelligence** | OEE / MTBF / Health Scoring | Fleet Reliability Score | **64.5/100 Avg Health** |
| **Model 8: Anomaly Detector** | Multi-variate Isolation Forest | Assay / Yield Outliers Flagged | **92 Geological • 36 Yield Shocks** |
| **Model 9: Composite Mining Risk** | Multi-Pillar Radar Engine | Composite Risk Score | **62.5/100 (High Risk)** |
| **Model 10: Extraction Optimizer** | Constrained LP / Knapsack Solver | Monthly Scheduled Production | **40,250 Tonnes** |

---

## 3. Technology Stack

- **Backend:** Python 3.11, FastAPI, Uvicorn, Pydantic, Passlib/Bcrypt, SQLite, ReportLab.
- **AI / ML & Spatial:** Scikit-Learn, NumPy, SciPy, Pandas, Joblib, Shapely.
- **Frontend:** React 18, Vite, Leaflet, React-Leaflet, Recharts, Lucide Icons.
- **Design System:** Custom dark theme, glassmorphism, glowing telemetry, responsive layout.

---

## 4. Quickstart Guide

### 1. Clone & Install Dependencies
```bash
# Install Python dependencies
pip install -r requirements.txt

# Install Frontend dependencies
cd frontend
npm install
cd ..
```

### 2. Train & Register All ML Models
```bash
python -m ml.train_all_models
```

### 3. Run Automated Test Suite (17 Tests)
```bash
python -m pytest tests/test_all_endpoints.py -v
```

### 4. Start the Application (Single Command)
You can start both the FastAPI backend and React frontend concurrently with one command:
```bash
python run_app.py
```
* **Frontend Dashboard:** `http://localhost:5173`
* **FastAPI Backend & Swagger Docs:** `http://localhost:8000/docs`

Alternatively, you can run them in separate terminals:
- **FastAPI Backend:**
  ```bash
  uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
  ```
- **React Frontend:**
  ```bash
  cd frontend
  npm run dev
  ```

---

## 5. Unified 5-Step AI Mining User Journey

The prototype features a streamlined, intuitive workflow designed for an executive demonstration:

1. **Dashboard:** Executive KPI overview (Area Analysed, Estimated Resource, Average Grade, High-Potential Blocks, AI Confidence), interactive map with 🟢/🟡/🔴 block classification, grade histogram, and AI recommendation.
2. **AI Analysis (Pipeline):**
   - **Step 1 (Mine & Area Selection):** Select lease block and survey area parameters.
   - **Step 2 (Data Input):** Verify all 6 data layers (Satellite, Geological, Drillholes, DEM, Production, Block Model) showing `Status → Ready`.
   - **Step 3 (AI Processing):** Live visible 6-stage data processing pipeline.
   - **Step 4 (AI Analysis Results):** Mineral & grade prediction (38.6% Mn, 88% confidence), 3D block model distribution, and reserve estimation with interactive cut-off slider.
3. **Block Model:** Dedicated spatial explorer with 🟢 High / 🟡 Medium / 🔴 Low potential voxel mapping, cut-off grade slider, and block inspector panel.
4. **Risk Analysis:** Consolidated single-screen evaluation across 4 pillars: Geological Risk, Grade Uncertainty, Mining Risk, and Environmental Risk, plus anomaly radar.
5. **Reports:** Complete executive report summary and one-click **Generate Mining Report** (PDF export) and CSV export.

---

## 6. Scientific Disclaimer

> **AI-Assisted Decision-Support System:** Outputs generated by this system (including mineral inventory estimates, satellite alteration indicators, and production forecasts) are mathematical model projections intended for engineering decision support. They do not constitute legally certified mineral reserves under statutory mining codes (UNFC/JORC/CRIRSCO) and must be verified by certified competent geological persons and field drilling validation.
