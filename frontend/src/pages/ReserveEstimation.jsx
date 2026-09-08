import React, { useState, useEffect } from "react";
import { useMine } from "../context/MineContext";
import { ReserveAPI } from "../services/api";
import { Box, Layers, Percent, TrendingUp, ShieldAlert, Sliders, ShieldCheck, Activity } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

export const ReserveEstimation = () => {
  const { activeMine } = useMine();
  const [cutoff, setCutoff] = useState(20.0);
  const [reserves, setReserves] = useState(null);
  const [blocksData, setBlocksData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReserves = async (cVal) => {
    try {
      setLoading(true);
      const [resRes, blkRes] = await Promise.all([
        ReserveAPI.estimateReserves(cVal),
        ReserveAPI.getBlocks(100)
      ]);
      setReserves(resRes.data);
      setBlocksData(blkRes.data);
    } catch (err) {
      console.error("Reserve fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReserves(cutoff);
  }, [activeMine]);

  const handleCutoffChange = (e) => {
    const val = parseFloat(e.target.value);
    setCutoff(val);
    fetchReserves(val);
  };

  if (loading && !reserves) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
        <Activity size={32} className="animate-spin" style={{ margin: "0 auto 16px auto", color: "#60a5fa" }} />
        <p>Computing 3D voxel block model and grade-tonnage sensitivity curves...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header Banner */}
      <div style={{
        background: "linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)",
        border: "1px solid #1e2e4f",
        borderRadius: "14px",
        padding: "20px 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Box size={26} color="#60a5fa" />
            <h1 style={{ fontSize: "1.45rem", fontWeight: "800", color: "#f8fafc" }}>
              3D Block Model Manganese Reserve & Resource Estimation
            </h1>
          </div>
          <p style={{ fontSize: "0.82rem", color: "#94a3b8", marginTop: "4px" }}>
            Model 2: Voxel-based mineral inventory, grade-tonnage sensitivity, and UNFC classification for {activeMine?.name}.
          </p>
        </div>
        <span className="badge badge-purple">Confidence: 84% (UNFC Aligned)</span>
      </div>

      {/* Mandatory Scientific Disclaimer */}
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
          <b>Scientific Disclaimer:</b> {reserves?.disclaimer}
        </span>
      </div>

      {/* Interactive Cut-Off Grade Slider Card */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Sliders size={18} color="#38bdf8" />
            <span style={{ fontWeight: "700", color: "#f8fafc", fontSize: "0.95rem" }}>
              Interactive Cut-Off Grade Sensitivity Slider:
            </span>
            <span className="badge badge-live" style={{ fontSize: "0.9rem", padding: "4px 12px" }}>
              {cutoff.toFixed(1)}% Mn Cut-Off
            </span>
          </div>
          <span style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
            Slide to dynamically evaluate mineral recovery vs stripping ratio
          </span>
        </div>

        <input
          type="range"
          min="10.0"
          max="35.0"
          step="1.0"
          value={cutoff}
          onChange={handleCutoffChange}
          style={{ width: "100%", accentColor: "#3b82f6", cursor: "pointer" }}
        />
      </div>

      {/* KPI Cards Grid */}
      <div className="grid-4">
        <div className="card">
          <span className="metric-label">In-Situ Ore Tonnage</span>
          <div className="metric-value" style={{ color: "#60a5fa" }}>
            {reserves?.total_ore_tonnage_million_t} <span style={{ fontSize: "0.9rem", color: "#94a3b8" }}>Mt</span>
          </div>
          <div className="metric-sub">
            <span>{reserves?.ore_blocks_count} Ore Blocks Above Cut-Off</span>
          </div>
        </div>

        <div className="card">
          <span className="metric-label">Recoverable Ore Tonnage</span>
          <div className="metric-value" style={{ color: "#34d399" }}>
            {reserves?.recoverable_ore_tonnage_million_t} <span style={{ fontSize: "0.9rem", color: "#94a3b8" }}>Mt</span>
          </div>
          <div className="metric-sub">
            <span>Assuming 85% Mining Recovery</span>
          </div>
        </div>

        <div className="card">
          <span className="metric-label">Average Ore Grade</span>
          <div className="metric-value" style={{ color: "#c084fc" }}>
            {reserves?.average_ore_grade_pct} <span style={{ fontSize: "0.9rem", color: "#94a3b8" }}>% Mn</span>
          </div>
          <div className="metric-sub">
            <span>Cut-Off: &ge; {cutoff}% Mn</span>
          </div>
        </div>

        <div className="card">
          <span className="metric-label">Contained Manganese</span>
          <div className="metric-value" style={{ color: "#f59e0b" }}>
            {reserves?.contained_manganese_thousand_t?.toLocaleString()} <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>kt Mn</span>
          </div>
          <div className="metric-sub">
            <span>Recoverable: {reserves?.recoverable_manganese_thousand_t?.toLocaleString()} kt</span>
          </div>
        </div>
      </div>

      {/* Row 2: Grade-Tonnage Curve & UNFC Resource Classification Table */}
      <div className="grid-2">
        {/* Grade-Tonnage Sensitivity Curve */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <TrendingUp size={18} color="#34d399" />
              <span>Grade-Tonnage Sensitivity Curve</span>
            </div>
            <span className="badge badge-live">Sensitivity</span>
          </div>

          <div style={{ height: "260px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={reserves?.grade_tonnage_curve || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2e4f" />
                <XAxis dataKey="cutoff_grade_pct" stroke="#94a3b8" unit="%" fontSize={10} name="Cut-Off Grade" />
                <YAxis yAxisId="left" stroke="#60a5fa" fontSize={11} unit="Mt" />
                <YAxis yAxisId="right" orientation="right" stroke="#c084fc" fontSize={11} unit="%" />
                <Tooltip
                  contentStyle={{ background: "#0f172a", border: "1px solid #1e2e4f", borderRadius: "8px", fontSize: "0.8rem" }}
                />
                <Legend wrapperStyle={{ fontSize: "0.78rem" }} />
                <Line yAxisId="left" type="monotone" dataKey="tonnage_million_t" name="Ore Tonnage (Mt)" stroke="#60a5fa" strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="avg_grade_pct" name="Average Grade (% Mn)" stroke="#c084fc" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* UNFC Classification Table */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <ShieldCheck size={18} color="#60a5fa" />
              <span>UNFC / JORC Resource Breakdown</span>
            </div>
            <span className="badge badge-purple">Standard 111/122/333</span>
          </div>

          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Resource Category</th>
                  <th>Tonnage (Mt)</th>
                  <th>Grade (% Mn)</th>
                  <th>Contained Mn (kt)</th>
                </tr>
              </thead>
              <tbody>
                {reserves?.resource_classification?.map((r, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: "600", color: "#38bdf8" }}>{r.category}</td>
                    <td className="mono">{r.tonnage_million_t} Mt</td>
                    <td className="mono" style={{ color: "#c084fc", fontWeight: "700" }}>{r.avg_grade_pct}%</td>
                    <td className="mono" style={{ color: "#f59e0b" }}>{r.contained_mn_thousand_t} kt</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
