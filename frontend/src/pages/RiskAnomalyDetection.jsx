import React, { useState, useEffect } from "react";
import { useMine } from "../context/MineContext";
import { RiskAPI } from "../services/api";
import { AlertTriangle, ShieldAlert, Activity, CheckCircle2, ShieldCheck, HelpCircle } from "lucide-react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip
} from "recharts";

export const RiskAnomalyDetection = () => {
  const { activeMine } = useMine();
  const [riskData, setRiskData] = useState(null);
  const [geoAnomalies, setGeoAnomalies] = useState([]);
  const [prodAnomalies, setProdAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRisk = async () => {
      try {
        setLoading(true);
        const [rRes, gRes, pRes] = await Promise.all([
          RiskAPI.getCompositeRisk(),
          RiskAPI.getGeologicalAnomalies(),
          RiskAPI.getProductionAnomalies()
        ]);
        setRiskData(rRes.data);
        setGeoAnomalies(gRes.data.anomalous_records || []);
        setProdAnomalies(pRes.data.anomalous_records || []);
      } catch (err) {
        console.error("Risk fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRisk();
  }, [activeMine]);

  if (loading && !riskData) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
        <Activity size={32} className="animate-spin" style={{ margin: "0 auto 16px auto", color: "#ef4444" }} />
        <p>Evaluating multi-pillar risk radar and running Isolation Forest anomaly detectors...</p>
      </div>
    );
  }

  const radarChartData = [
    { subject: "Shortfall Risk", value: riskData?.radar_metrics?.production_shortfall || 50 },
    { subject: "Geological Uncertainty", value: riskData?.radar_metrics?.geological_uncertainty || 45 },
    { subject: "Fleet Vulnerability", value: riskData?.radar_metrics?.equipment_health || 60 },
    { subject: "Data Quality Risk", value: riskData?.radar_metrics?.data_quality || 20 },
    { subject: "Environmental Factor", value: riskData?.radar_metrics?.environmental || 35 },
  ];

  return (
    <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header Banner */}
      <div style={{
        background: "linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(15, 23, 42, 0.9) 100%)",
        border: "1px solid rgba(239, 68, 68, 0.35)",
        borderRadius: "14px",
        padding: "20px 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <AlertTriangle size={26} color="#ef4444" />
            <h1 style={{ fontSize: "1.45rem", fontWeight: "800", color: "#f8fafc" }}>
              Mining Risk Engine & Multi-Variate Anomaly Detection
            </h1>
          </div>
          <p style={{ fontSize: "0.82rem", color: "#94a3b8", marginTop: "4px" }}>
            Model 8 & 9: Multi-pillar risk radar and Isolation Forest anomaly detector for {activeMine?.name}.
          </p>
        </div>
        <span className="badge badge-danger">
          Composite Risk: {riskData?.composite_risk_score}/100 ({riskData?.risk_level})
        </span>
      </div>

      {/* Row 1: Multi-Pillar Risk Radar & Pillars Breakdown */}
      <div className="grid-2">
        {/* Radar Chart */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <ShieldAlert size={18} color="#ef4444" />
              <span>Multi-Pillar Operational & Geological Risk Radar</span>
            </div>
            <span className="badge badge-danger">Risk Radar</span>
          </div>

          <div style={{ height: "280px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarChartData}>
                <PolarGrid stroke="#1e2e4f" />
                <PolarAngleAxis dataKey="subject" stroke="#94a3b8" fontSize={11} />
                <PolarRadiusAxis stroke="#64748b" angle={30} domain={[0, 100]} />
                <Radar name="Risk Score (0-100)" dataKey="value" stroke="#ef4444" fill="#ef4444" fillOpacity={0.4} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e2e4f", borderRadius: "8px", fontSize: "0.8rem" }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Pillars Detail */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div className="card-header">
            <div className="card-title">
              <ShieldCheck size={18} color="#f59e0b" />
              <span>Weighted Risk Pillars & Mitigation Rationale</span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {riskData?.pillars?.map((p, idx) => (
              <div
                key={idx}
                style={{
                  background: "#0b1222",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: "1px solid #1a2742"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <span style={{ fontSize: "0.84rem", fontWeight: "700", color: "#f8fafc" }}>
                    {p.pillar}
                  </span>
                  <span className={`badge ${p.score > 65 ? "badge-danger" : (p.score > 40 ? "badge-demo" : "badge-live")}`}>
                    {p.score}/100 ({p.status})
                  </span>
                </div>
                <p style={{ fontSize: "0.76rem", color: "#94a3b8" }}>
                  {p.description} (Weight: {p.weight_pct}%)
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Isolation Forest Geological Assay Anomalies */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <AlertTriangle size={18} color="#f59e0b" />
            <span>Isolation Forest Flagged Assay Outliers & Geochemical Discrepancies</span>
          </div>
          <span className="badge badge-demo">{geoAnomalies.length} Outliers Detected</span>
        </div>

        <div className="data-table-wrapper" style={{ maxHeight: "280px" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Borehole ID</th>
                <th>Sample Depth</th>
                <th>Mn Grade (%)</th>
                <th>Fe Grade (%)</th>
                <th>SiO₂ (%)</th>
                <th>Density (g/cm³)</th>
                <th>Severity</th>
                <th>Flagged Anomaly Rationale</th>
              </tr>
            </thead>
            <tbody>
              {geoAnomalies.slice(0, 20).map((a, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: "700", color: "#38bdf8" }}>{a.hole_id}</td>
                  <td className="mono">{a.sample_depth}m</td>
                  <td className="mono" style={{ fontWeight: "700", color: "#ef4444" }}>{a.mn_grade}%</td>
                  <td className="mono">{a.fe_grade}%</td>
                  <td className="mono">{a.sio2}%</td>
                  <td className="mono">{a.density}</td>
                  <td>
                    <span className="badge badge-danger">{a.anomaly_severity_score}%</span>
                  </td>
                  <td style={{ fontSize: "0.76rem", color: "#cbd5e1" }}>{a.flagged_reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
