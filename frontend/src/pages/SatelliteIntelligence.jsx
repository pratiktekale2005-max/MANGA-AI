import React, { useState, useEffect } from "react";
import { useMine } from "../context/MineContext";
import { SatelliteAPI } from "../services/api";
import { Satellite, Info, ShieldAlert, Sparkles, Activity, Layers, Filter } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

export const SatelliteIntelligence = () => {
  const { activeMine } = useMine();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState("ALL");

  useEffect(() => {
    const fetchSatellite = async () => {
      try {
        setLoading(true);
        const res = await SatelliteAPI.getIndices();
        setData(res.data);
      } catch (err) {
        console.error("Satellite fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSatellite();
  }, [activeMine]);

  if (loading || !data) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
        <Activity size={32} className="animate-spin" style={{ margin: "0 auto 16px auto", color: "#06b6d4" }} />
        <p>Extracting multi-spectral Sentinel-2 indices and alteration signatures...</p>
      </div>
    );
  }

  const { summary_metrics, spectral_pixels, disclaimer } = data;

  const filteredPixels = selectedClass === "ALL"
    ? spectral_pixels
    : spectral_pixels.filter(p => p.potential_class.includes(selectedClass));

  return (
    <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header Banner */}
      <div style={{
        background: "linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(15, 23, 42, 0.9) 100%)",
        border: "1px solid rgba(6, 182, 212, 0.3)",
        borderRadius: "14px",
        padding: "20px 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Satellite size={26} color="#06b6d4" />
            <h1 style={{ fontSize: "1.45rem", fontWeight: "800", color: "#f8fafc" }}>
              Space Remote Sensing & Multi-Spectral Intelligence
            </h1>
          </div>
          <p style={{ fontSize: "0.82rem", color: "#94a3b8", marginTop: "4px" }}>
            Sentinel-2 (12-Band) mineralogical alteration indices, Iron Oxide gossans, and Hydroxyl/Clay proxies for {activeMine?.name}.
          </p>
        </div>
        <span className="badge badge-info">{summary_metrics.total_pixels} Grid Pixels Processed</span>
      </div>

      {/* Scientific Disclaimer (MANDATORY REQUIREMENT) */}
      <div style={{
        background: "rgba(245, 158, 11, 0.08)",
        border: "1px solid rgba(245, 158, 11, 0.3)",
        borderRadius: "10px",
        padding: "14px 18px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        fontSize: "0.8rem",
        color: "#fbbf24"
      }}>
        <ShieldAlert size={20} color="#f59e0b" style={{ flexShrink: 0 }} />
        <span>
          <b>Scientific Disclaimer:</b> {disclaimer} Spectral alteration anomalies signify potential exposed gossan/manganiferous quartzite outcrops and must be verified by field geological sampling.
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid-4">
        <div className="card">
          <span className="metric-label">High Alteration Coverage</span>
          <div className="metric-value" style={{ color: "#ef4444" }}>
            {summary_metrics.high_potential_pct}%
          </div>
          <div className="metric-sub">
            <span>{summary_metrics.high_potential_pixels} Target Pixels Identified</span>
          </div>
        </div>

        <div className="card">
          <span className="metric-label">Mean Iron Oxide Index</span>
          <div className="metric-value" style={{ color: "#f59e0b" }}>
            {summary_metrics.avg_iron_oxide_index}
          </div>
          <div className="metric-sub">
            <span>Ratio: Red (B4) / Blue (B2)</span>
          </div>
        </div>

        <div className="card">
          <span className="metric-label">Mean Clay/Hydroxyl Index</span>
          <div className="metric-value" style={{ color: "#38bdf8" }}>
            {summary_metrics.avg_clay_index}
          </div>
          <div className="metric-sub">
            <span>Ratio: SWIR1 (B11) / SWIR2 (B12)</span>
          </div>
        </div>

        <div className="card">
          <span className="metric-label">Mean Canopy NDVI</span>
          <div className="metric-value" style={{ color: "#10b981" }}>
            {summary_metrics.avg_ndvi}
          </div>
          <div className="metric-sub">
            <span>Low NDVI indicates exposed rock/pit floor</span>
          </div>
        </div>
      </div>

      {/* Spectral Indices Reference & Table */}
      <div className="card">
        <div className="card-header" style={{ flexWrap: "wrap", gap: "12px" }}>
          <div className="card-title">
            <Layers size={18} color="#38bdf8" />
            <span>Sentinel-2 Spectral Pixel Registry</span>
          </div>

          <div style={{ display: "flex", gap: "6px" }}>
            {["ALL", "High", "Medium", "Low"].map((cls) => (
              <button
                key={cls}
                onClick={() => setSelectedClass(cls)}
                style={{
                  padding: "5px 12px",
                  borderRadius: "6px",
                  border: "none",
                  background: selectedClass === cls ? "#06b6d4" : "#0f1a30",
                  color: selectedClass === cls ? "#000" : "#94a3b8",
                  fontSize: "0.78rem",
                  fontWeight: "700",
                  cursor: "pointer"
                }}
              >
                {cls}
              </button>
            ))}
          </div>
        </div>

        <div className="data-table-wrapper" style={{ maxHeight: "360px" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Latitude</th>
                <th>Longitude</th>
                <th>Iron Oxide (B4/B2)</th>
                <th>Clay Ratio (B11/B12)</th>
                <th>Ferrous Index</th>
                <th>NDVI</th>
                <th>Exploration Score</th>
                <th>Classification</th>
                <th>Surface Feature</th>
              </tr>
            </thead>
            <tbody>
              {filteredPixels.slice(0, 50).map((px, idx) => (
                <tr key={idx}>
                  <td className="mono">{px.latitude.toFixed(5)}</td>
                  <td className="mono">{px.longitude.toFixed(5)}</td>
                  <td className="mono" style={{ color: px.iron_oxide_index > 2.0 ? "#f59e0b" : "#94a3b8" }}>{px.iron_oxide_index}</td>
                  <td className="mono">{px.clay_mineral_index}</td>
                  <td className="mono">{px.ferrous_index}</td>
                  <td className="mono">{px.NDVI}</td>
                  <td className="mono" style={{ fontWeight: "700", color: px.exploration_potential_score > 70 ? "#ef4444" : "#34d399" }}>
                    {px.exploration_potential_score}%
                  </td>
                  <td>
                    <span className={`badge ${px.potential_class.includes("High") ? "badge-danger" : (px.potential_class.includes("Medium") ? "badge-demo" : "badge-live")}`}>
                      {px.potential_class}
                    </span>
                  </td>
                  <td style={{ fontSize: "0.76rem", color: "#94a3b8" }}>{px.spectral_zone_type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
