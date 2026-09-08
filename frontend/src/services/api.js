/**
 * Unified Axios API Client for MOIL Mine Intelligence System
 */

import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor for handling errors gracefully
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const DataAPI = {
  getMines: () => api.get("/data/mines"),
  switchActiveMine: (mine_id) => api.post("/data/active-mine", { mine_id }),
  getPreview: (key, limit = 15) => api.get(`/data/preview/${key}?limit=${limit}`),
  uploadDataset: (formData) => api.post("/data/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  }),
  resetDemoData: () => api.post("/data/reset-demo"),
};

export const DashboardAPI = {
  getSummary: () => api.get("/dashboard/summary"),
  getRegistry: () => api.get("/dashboard/registry"),
};

export const EDAAPI = {
  getSummary: () => api.get("/eda/summary"),
};

export const SatelliteAPI = {
  getIndices: () => api.get("/satellite/indices"),
};

export const GeologyAPI = {
  getDrillholes: () => api.get("/geology/drillholes"),
};

export const GradePredictionAPI = {
  predictGrade: (data) => api.post("/models/grade/predict", data),
  getMetadata: () => api.get("/models/grade/metadata"),
};

export const SpatialAPI = {
  compareMethods: () => api.get("/spatial/compare"),
  getSurface: (gridRes = 25) => api.get(`/spatial/surface?grid_resolution=${gridRes}`),
};

export const ReserveAPI = {
  estimateReserves: (cutoff = 20.0) => api.get(`/reserve/estimate?cutoff_grade=${cutoff}`),
  getBlocks: (limit = 400) => api.get(`/reserve/blocks?limit=${limit}`),
};

export const ExplorationAPI = {
  prioritizeTargets: (topK = 6) => api.get(`/exploration/prioritize?top_k=${topK}`),
};

export const ProductionAPI = {
  getForecast: (monthsAhead = 12) => api.get(`/production/forecast?months_ahead=${monthsAhead}`),
  getHistory: (limit = 36) => api.get(`/production/history?limit=${limit}`),
  getMetadata: () => api.get("/production/metadata"),
};

export const EquipmentAPI = {
  getFleet: () => api.get("/equipment/fleet"),
  getCriticalUnits: () => api.get("/equipment/critical"),
};

export const RiskAPI = {
  getCompositeRisk: () => api.get("/risk/composite"),
  getGeologicalAnomalies: () => api.get("/risk/anomalies/geological"),
  getProductionAnomalies: () => api.get("/risk/anomalies/production"),
};

export const OptimizationAPI = {
  generatePlan: (params) => api.post("/optimization/plan", params),
};

export const ScenarioAPI = {
  simulate: (params) => api.post("/scenarios/simulate", params),
};

export const RecommendationsAPI = {
  getRecommendations: () => api.get("/recommendations"),
};

export const ReportsAPI = {
  getSummary: () => api.get("/reports/summary"),
  getExportPdfUrl: () => `${API_BASE_URL}/reports/export/pdf`,
  getExportCsvUrl: () => `${API_BASE_URL}/reports/export/csv`,
};

export default api;
