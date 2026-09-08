import React, { useState, useEffect } from "react";
import { useMine } from "../context/MineContext";
import { OptimizationAPI } from "../services/api";
import { SlidersHorizontal, Zap, CheckCircle2, AlertTriangle, Layers, Percent, Activity } from "lucide-react";

export const ProductionOptimization = () => {
  const { activeMine, showToast } = useMine();
  const [params, setParams] = useState({
    target_production_tonnes: 35000.0,
    equipment_capacity_tonnes: 45000.0,
    min_blend_grade_pct: 32.0,
    planning_period_months: 1
  });

  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleRunOptimizer = async () => {
    try {
      setLoading(true);
      const res = await OptimizationAPI.generatePlan(params);
      setPlan(res.data);
      showToast("Generated optimal bench extraction schedule!", "live");
    } catch (err) {
      console.error("Optimization error:", err);
      showToast("Error running optimization solver.", "danger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleRunOptimizer();
  }, [activeMine]);

  return (
    <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header Banner */}
      <div style={{
        background: "linear-gradient(135deg, rgba(37, 99, 235, 0.18) 0%, rgba(15, 23, 42, 0.9) 100%)",
        border: "1px solid rgba(37, 99, 235, 0.35)",
        borderRadius: "14px",
        padding: "20px 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <SlidersHorizontal size={26} color="#3b82f6" />
            <h1 style={{ fontSize: "1.45rem", fontWeight: "800", color: "#f8fafc" }}>
              Production Planning & Extraction Optimization Engine
            </h1>
          </div>
          <p style={{ fontSize: "0.82rem", color: "#94a3b8", marginTop: "4px" }}>
            Model 10: Constrained linear programming extraction scheduler maximizing recoverable manganese and grade blending for {activeMine?.name}.
          </p>
        </div>
        <span className="badge badge-info">Constrained Solver</span>
      </div>

      {/* Inputs & Optimizer Controls Card */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Zap size={18} color="#38bdf8" />
            <span>Target & Operational Constraints Configuration</span>
          </div>
          <button className="btn btn-primary" onClick={handleRunOptimizer} disabled={loading}>
            <Zap size={16} />
            {loading ? "Solving Extraction Schedule..." : "Re-Optimize Extraction Schedule"}
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
          <div className="form-group">
            <label className="form-label">Target Production (Tonnes/Month):</label>
            <input
              type="number"
              step="1000"
              className="form-input"
              value={params.target_production_tonnes}
              onChange={(e) => setParams({ ...params, target_production_tonnes: parseFloat(e.target.value) || 0 })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Fleet Handling Capacity (Tonnes):</label>
            <input
              type="number"
              step="1000"
              className="form-input"
              value={params.equipment_capacity_tonnes}
              onChange={(e) => setParams({ ...params, equipment_capacity_tonnes: parseFloat(e.target.value) || 0 })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Minimum Blend Grade Target (% Mn):</label>
            <input
              type="number"
              step="0.5"
              className="form-input"
              value={params.min_blend_grade_pct}
              onChange={(e) => setParams({ ...params, min_blend_grade_pct: parseFloat(e.target.value) || 0 })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Planning Horizon (Months):</label>
            <select
              className="form-select"
              value={params.planning_period_months}
              onChange={(e) => setParams({ ...params, planning_period_months: parseInt(e.target.value) || 1 })}
            >
              <option value="1">1 Month (Operational Schedule)</option>
              <option value="3">3 Months (Quarterly Bench Plan)</option>
              <option value="6">6 Months (Half-Yearly Strategy)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Solver Summary KPIs */}
      {plan && (
        <div className="grid-4">
          <div className="card">
            <span className="metric-label">Scheduled Production</span>
            <div className="metric-value" style={{ color: "#34d399" }}>
              {plan.scheduled_production_tonnes?.toLocaleString()} <span style={{ fontSize: "0.9rem", color: "#94a3b8" }}>t</span>
            </div>
            <div className="metric-sub">
              <span>Target Fulfillment: <b>{plan.target_fulfillment_pct}%</b></span>
            </div>
          </div>

          <div className="card">
            <span className="metric-label">Blended Ore Grade</span>
            <div className="metric-value" style={{ color: "#c084fc" }}>
              {plan.blended_mn_grade_pct}% <span style={{ fontSize: "0.9rem", color: "#94a3b8" }}>Mn</span>
            </div>
            <div className="metric-sub">
              <span>Constraint Target: &ge; {plan.min_required_grade_pct}% Mn</span>
            </div>
          </div>

          <div className="card">
            <span className="metric-label">Scheduled Contained Mn</span>
            <div className="metric-value" style={{ color: "#f59e0b" }}>
              {plan.scheduled_contained_mn_tonnes?.toLocaleString()} <span style={{ fontSize: "0.9rem", color: "#94a3b8" }}>t</span>
            </div>
            <div className="metric-sub">
              <span>Total Metallic Manganese Yield</span>
            </div>
          </div>

          <div className="card">
            <span className="metric-label">Scheduled Blocks Count</span>
            <div className="metric-value" style={{ color: "#38bdf8" }}>
              {plan.blocks_scheduled_count} <span style={{ fontSize: "0.9rem", color: "#94a3b8" }}>Blocks</span>
            </div>
            <div className="metric-sub">
              <span>Status: <b style={{ color: "#34d399" }}>{plan.status}</b></span>
            </div>
          </div>
        </div>
      )}

      {/* Scheduled Extraction Sequence Table */}
      {plan && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Layers size={18} color="#60a5fa" />
              <span>Step-by-Step Optimized Block Extraction Schedule</span>
            </div>
            <span className="badge badge-live">{plan.scheduled_blocks?.length} Extraction Steps</span>
          </div>

          <div className="data-table-wrapper" style={{ maxHeight: "360px" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Sequence Step</th>
                  <th>Block ID</th>
                  <th>Scheduled Tonnage (t)</th>
                  <th>Block Mn Grade (%)</th>
                  <th>Contained Mn (t)</th>
                  <th>Elevation / Bench</th>
                  <th>Depth (m)</th>
                  <th>Geological Classification</th>
                  <th>Extraction Priority</th>
                </tr>
              </thead>
              <tbody>
                {plan.scheduled_blocks?.map((b) => (
                  <tr key={b.sequence_step}>
                    <td className="mono" style={{ fontWeight: "700", color: "#38bdf8" }}>#{b.sequence_step}</td>
                    <td style={{ fontWeight: "600", color: "#f8fafc" }}>{b.block_id}</td>
                    <td className="mono">{b.scheduled_tonnage?.toLocaleString()} t</td>
                    <td className="mono" style={{ fontWeight: "700", color: b.mn_grade_pct >= 36 ? "#c084fc" : "#60a5fa" }}>
                      {b.mn_grade_pct}% Mn
                    </td>
                    <td className="mono" style={{ color: "#f59e0b" }}>{b.contained_mn_tonnes?.toLocaleString()} t</td>
                    <td className="mono">{b.z_elevation}m ASL</td>
                    <td className="mono">{b.depth_m}m</td>
                    <td>{b.geological_category}</td>
                    <td>
                      <span className={`badge ${b.extraction_priority === "High Priority" ? "badge-danger" : "badge-info"}`}>
                        {b.extraction_priority}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
