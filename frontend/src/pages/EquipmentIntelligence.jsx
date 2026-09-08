import React, { useState, useEffect } from "react";
import { useMine } from "../context/MineContext";
import { EquipmentAPI } from "../services/api";
import { Wrench, AlertTriangle, ShieldCheck, Activity, CheckCircle2, Clock, Gauge } from "lucide-react";

export const EquipmentIntelligence = () => {
  const { activeMine } = useMine();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("ALL");

  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        setLoading(true);
        const res = await EquipmentAPI.getFleet();
        setData(res.data);
      } catch (err) {
        console.error("Equipment fleet error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEquipment();
  }, [activeMine]);

  if (loading || !data) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
        <Activity size={32} className="animate-spin" style={{ margin: "0 auto 16px auto", color: "#f59e0b" }} />
        <p>Analyzing mining fleet telemetry, availability %, and OEE reliability indices...</p>
      </div>
    );
  }

  const {
    fleet_size, overall_fleet_health_score, overall_availability_pct, overall_utilization_pct,
    overall_oee_pct, total_monthly_lost_tonnes, critical_risk_count, warning_count, healthy_count,
    type_breakdown, all_units
  } = data;

  const filteredUnits = filterStatus === "ALL"
    ? all_units
    : (filterStatus === "CRITICAL" ? all_units.filter(u => u.status.includes("High Breakdown")) : all_units.filter(u => u.status.includes("Healthy")));

  return (
    <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header Banner */}
      <div style={{
        background: "linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(15, 23, 42, 0.9) 100%)",
        border: "1px solid rgba(245, 158, 11, 0.35)",
        borderRadius: "14px",
        padding: "20px 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Wrench size={26} color="#f59e0b" />
            <h1 style={{ fontSize: "1.45rem", fontWeight: "800", color: "#f8fafc" }}>
              Mining Equipment Intelligence & Reliability Engine
            </h1>
          </div>
          <p style={{ fontSize: "0.82rem", color: "#94a3b8", marginTop: "4px" }}>
            Model 6: HEMM fleet availability, OEE, MTBF/MTTR tracking, and predictive breakdown impact for {activeMine?.name}.
          </p>
        </div>
        <span className="badge badge-demo">{fleet_size} Active HEMM Units</span>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid-4">
        <div className="card">
          <span className="metric-label">Fleet Health Score</span>
          <div className="metric-value" style={{ color: overall_fleet_health_score > 70 ? "#10b981" : "#f59e0b" }}>
            {overall_fleet_health_score}<span style={{ fontSize: "0.9rem", color: "#94a3b8" }}>/100</span>
          </div>
          <div className="metric-sub">
            <span>{critical_risk_count} Units In High Breakdown Risk</span>
          </div>
        </div>

        <div className="card">
          <span className="metric-label">Fleet Availability</span>
          <div className="metric-value" style={{ color: "#38bdf8" }}>
            {overall_availability_pct}%
          </div>
          <div className="metric-sub">
            <span>Target Benchmark: &ge; 85%</span>
          </div>
        </div>

        <div className="card">
          <span className="metric-label">Overall Equipment Effectiveness (OEE)</span>
          <div className="metric-value" style={{ color: "#a855f7" }}>
            {overall_oee_pct}%
          </div>
          <div className="metric-sub">
            <span>Utilization Rate: <b>{overall_utilization_pct}%</b></span>
          </div>
        </div>

        <div className="card">
          <span className="metric-label">Monthly Lost Production</span>
          <div className="metric-value" style={{ color: "#ef4444" }}>
            {total_monthly_lost_tonnes?.toLocaleString()} <span style={{ fontSize: "0.9rem", color: "#94a3b8" }}>t</span>
          </div>
          <div className="metric-sub">
            <span>Lost Due to Unscheduled Breakdowns</span>
          </div>
        </div>
      </div>

      {/* Fleet Table */}
      <div className="card">
        <div className="card-header" style={{ flexWrap: "wrap", gap: "12px" }}>
          <div className="card-title">
            <Gauge size={18} color="#f59e0b" />
            <span>Heavy Earth Moving Machinery (HEMM) Fleet Inventory</span>
          </div>

          <div style={{ display: "flex", gap: "6px" }}>
            {["ALL", "CRITICAL", "HEALTHY"].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                style={{
                  padding: "5px 12px",
                  borderRadius: "6px",
                  border: "none",
                  background: filterStatus === st ? "#f59e0b" : "#0f1a30",
                  color: filterStatus === st ? "#000" : "#94a3b8",
                  fontSize: "0.78rem",
                  fontWeight: "700",
                  cursor: "pointer"
                }}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="data-table-wrapper" style={{ maxHeight: "380px" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Unit ID</th>
                <th>Equipment Model</th>
                <th>Age (Years)</th>
                <th>Availability (%)</th>
                <th>Utilization (%)</th>
                <th>MTBF (Hrs)</th>
                <th>MTTR (Hrs)</th>
                <th>Health Score</th>
                <th>Status</th>
                <th>Estimated Lost Ore (t)</th>
              </tr>
            </thead>
            <tbody>
              {filteredUnits.map((u) => (
                <tr key={u.equipment_id}>
                  <td style={{ fontWeight: "700", color: "#38bdf8" }}>{u.equipment_id}</td>
                  <td>{u.equipment_model}</td>
                  <td className="mono">{u.age_years} yrs</td>
                  <td className="mono" style={{ fontWeight: "600", color: u.availability_pct >= 85 ? "#34d399" : "#f59e0b" }}>
                    {u.availability_pct}%
                  </td>
                  <td className="mono">{u.utilization_pct}%</td>
                  <td className="mono">{u.mtbf_hours}h</td>
                  <td className="mono" style={{ color: u.mttr_hours > 10 ? "#fb7185" : "#cbd5e1" }}>{u.mttr_hours}h</td>
                  <td className="mono" style={{ fontWeight: "700", color: u.health_score >= 80 ? "#34d399" : (u.health_score >= 60 ? "#f59e0b" : "#ef4444") }}>
                    {u.health_score}/100
                  </td>
                  <td>
                    <span className={`badge ${u.status === "Healthy" ? "badge-live" : (u.status.includes("Warning") ? "badge-demo" : "badge-danger")}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="mono" style={{ color: u.lost_production_tonnes > 0 ? "#fb7185" : "#94a3b8" }}>
                    {u.lost_production_tonnes > 0 ? `${u.lost_production_tonnes.toLocaleString()} t` : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
