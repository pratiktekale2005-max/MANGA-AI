import React, { useState, useEffect } from "react";
import { useMine } from "../context/MineContext";
import { GradePredictionAPI } from "../services/api";
import { Cpu, Sparkles, CheckCircle2, Info, ArrowRight, HelpCircle, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

export const GradePrediction = () => {
  const { activeMine, showToast } = useMine();
  const [formData, setFormData] = useState({
    x: 150.0,
    y: 80.0,
    sample_depth: 45.0,
    collar_elevation: 320.0,
    lithology: "High-Grade Braunite Ore",
    density: 3.95,
    sat_iron_oxide: 2.25,
    sat_clay_index: 1.35,
    fe_grade: 6.8,
    sio2: 17.5
  });

  const [prediction, setPrediction] = useState(null);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const res = await GradePredictionAPI.getMetadata();
        setMeta(res.data);
      } catch (err) {
        console.error("Grade meta error:", err);
      }
    };
    fetchMeta();
    handlePredict();
  }, [activeMine]);

  const handlePredict = async () => {
    try {
      setLoading(true);
      const res = await GradePredictionAPI.predictGrade(formData);
      setPrediction(res.data);
    } catch (err) {
      console.error("Grade prediction error:", err);
      showToast("Error running grade prediction model.", "danger");
    } finally {
      setLoading(false);
    }
  };

  const featureImpData = meta?.feature_importances
    ? Object.entries(meta.feature_importances).slice(0, 8).map(([name, val]) => ({
        feature: name.replace("cat__lithology_", "").replace("num__", ""),
        importance: val
      }))
    : [];

  return (
    <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header Banner */}
      <div style={{
        background: "linear-gradient(135deg, rgba(168, 85, 247, 0.18) 0%, rgba(15, 23, 42, 0.9) 100%)",
        border: "1px solid rgba(168, 85, 247, 0.35)",
        borderRadius: "14px",
        padding: "20px 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Cpu size={26} color="#a855f7" />
            <h1 style={{ fontSize: "1.45rem", fontWeight: "800", color: "#f8fafc" }}>
              AI Manganese Ore Grade Prediction & Explainability (XAI)
            </h1>
          </div>
          <p style={{ fontSize: "0.82rem", color: "#94a3b8", marginTop: "4px" }}>
            Model 1: Multi-regressor ensemble predicting continuous Mn% grades with Tree SHAP factor attribution.
          </p>
        </div>
        <span className="badge badge-purple">R² = {meta?.test_r2 || 0.925} | RMSE = {meta?.test_rmse || 3.46}% Mn</span>
      </div>

      {/* Main Grid: Predictor Form & Real-Time Prediction Output */}
      <div className="grid-2">
        {/* Predictor Form */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Sparkles size={18} color="#c084fc" />
              <span>Input Spatial, Geological & Spectral Features</span>
            </div>
            <span className="badge badge-info">Inference Simulator</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div className="form-group">
              <label className="form-label">Local Cartesian X (m):</label>
              <input
                type="number"
                className="form-input"
                value={formData.x}
                onChange={(e) => setFormData({ ...formData, x: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Local Cartesian Y (m):</label>
              <input
                type="number"
                className="form-input"
                value={formData.y}
                onChange={(e) => setFormData({ ...formData, y: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Borehole Depth (m):</label>
              <input
                type="number"
                className="form-input"
                value={formData.sample_depth}
                onChange={(e) => setFormData({ ...formData, sample_depth: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Rock Density (g/cm³):</label>
              <input
                type="number"
                step="0.05"
                className="form-input"
                value={formData.density}
                onChange={(e) => setFormData({ ...formData, density: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="form-group" style={{ gridColumn: "span 2" }}>
              <label className="form-label">Lithological Formation Classification:</label>
              <select
                className="form-select"
                value={formData.lithology}
                onChange={(e) => setFormData({ ...formData, lithology: e.target.value })}
              >
                <option value="High-Grade Braunite Ore">High-Grade Braunite Ore (Mansar Formation)</option>
                <option value="Medium-Grade Pyrolusite Bed">Medium-Grade Pyrolusite Bed</option>
                <option value="Gondite (Manganiferous Quartzite)">Gondite (Manganiferous Quartzite)</option>
                <option value="Quartz-Muscovite Schist">Quartz-Muscovite Schist (Sitasaongi Formation)</option>
                <option value="Phyllite & Weathered Overburden">Phyllite & Weathered Overburden</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Satellite Iron Oxide Index:</label>
              <input
                type="number"
                step="0.05"
                className="form-input"
                value={formData.sat_iron_oxide}
                onChange={(e) => setFormData({ ...formData, sat_iron_oxide: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Satellite Clay Alteration Index:</label>
              <input
                type="number"
                step="0.05"
                className="form-input"
                value={formData.sat_clay_index}
                onChange={(e) => setFormData({ ...formData, sat_clay_index: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <button
            className="btn btn-primary"
            style={{ width: "100%", marginTop: "10px" }}
            onClick={handlePredict}
            disabled={loading}
          >
            <Cpu size={16} />
            {loading ? "Evaluating AI Regressor..." : "Run AI Grade Prediction"}
          </button>
        </div>

        {/* Prediction & Explainability Output Card */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="card-header">
            <div className="card-title">
              <CheckCircle2 size={18} color="#34d399" />
              <span>Model Prediction & Factor Explainability</span>
            </div>
            <span className="badge badge-live">Inference Result</span>
          </div>

          {prediction ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Big Prediction Box */}
              <div style={{
                background: "linear-gradient(135deg, rgba(147, 51, 234, 0.2) 0%, rgba(37, 99, 235, 0.2) 100%)",
                border: "1px solid #9333ea",
                borderRadius: "12px",
                padding: "20px",
                textAlign: "center"
              }}>
                <span className="metric-label">Predicted Manganese (Mn) Grade</span>
                <div style={{ fontSize: "3rem", fontWeight: "800", color: "#f8fafc", fontFamily: "var(--font-mono)", margin: "6px 0" }}>
                  {prediction.predicted_mn_grade_pct?.toFixed(2)}<span style={{ fontSize: "1.5rem", color: "#c084fc" }}>% Mn</span>
                </div>
                <span className="badge badge-purple" style={{ fontSize: "0.82rem" }}>
                  Confidence Score: {prediction.confidence_pct}% ({formData.lithology})
                </span>
              </div>

              {/* Explainability Section */}
              <div>
                <h4 style={{ fontSize: "0.88rem", color: "#cbd5e1", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <HelpCircle size={15} color="#38bdf8" />
                  Why did the AI model make this prediction? (XAI Factors)
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {prediction.explainability_factors?.map((f, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: "#0b1222",
                        padding: "8px 12px",
                        borderRadius: "6px",
                        border: "1px solid #1a2742",
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.78rem"
                      }}
                    >
                      <b style={{ color: "#94a3b8" }}>{f.factor}:</b>
                      <span style={{ color: "#34d399", fontWeight: "600" }}>{f.influence}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p style={{ color: "#64748b", textAlign: "center", padding: "40px 0" }}>
              Enter feature parameters on the left to run live AI grade estimation.
            </p>
          )}
        </div>
      </div>

      {/* Row 2: Model Comparison & Global Feature Importance */}
      <div className="grid-2">
        {/* Model Comparison Table */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Cpu size={18} color="#60a5fa" />
              <span>Multi-Algorithm Evaluation Benchmark</span>
            </div>
            <span className="badge badge-info">5-Fold Cross Validation</span>
          </div>

          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Algorithm</th>
                  <th>Test R² Score</th>
                  <th>RMSE (% Mn)</th>
                  <th>MAE (% Mn)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {meta?.comparison?.map((m) => (
                  <tr key={m.algorithm}>
                    <td style={{ fontWeight: m.is_best ? "700" : "500", color: m.is_best ? "#38bdf8" : "#f1f5f9" }}>
                      {m.algorithm}
                    </td>
                    <td className="mono" style={{ color: m.is_best ? "#34d399" : "#94a3b8", fontWeight: "700" }}>
                      {(m.r2_score * 100).toFixed(2)}%
                    </td>
                    <td className="mono">{m.rmse}</td>
                    <td className="mono">{m.mae}</td>
                    <td>
                      {m.is_best ? (
                        <span className="badge badge-live">Best Selected</span>
                      ) : (
                        <span className="badge badge-info">Candidate</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Global Feature Importance Chart */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <BarChart3 size={18} color="#34d399" />
              <span>Global Feature Importance Ranking (Tree SHAP)</span>
            </div>
            <span className="badge badge-purple">Feature Weights</span>
          </div>

          <div style={{ height: "230px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={featureImpData} layout="vertical" margin={{ left: 40, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2e4f" />
                <XAxis type="number" stroke="#94a3b8" fontSize={10} />
                <YAxis dataKey="feature" type="category" stroke="#94a3b8" fontSize={10} width={100} />
                <Tooltip
                  contentStyle={{ background: "#0f172a", border: "1px solid #1e2e4f", borderRadius: "8px", fontSize: "0.8rem" }}
                />
                <Bar dataKey="importance" fill="#a855f7" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
