import React, { useState, useEffect } from "react";
import { useMine } from "../context/MineContext";
import { ScenarioAPI } from "../services/api";
import { GitFork, Sliders, Activity, TrendingUp, AlertTriangle, ShieldCheck, DollarSign } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

export const ScenarioSimulator = () => {
  const { activeMine, showToast } = useMine();
  const [customParams, setCustomParams] = useState({
    target_tonnes: 35000.0,
    ore_grade_pct: 40.5,
    fleet_availability_pct: 88.0,
    working_days: 26,
    recovery_pct: 88.0
  });

  const [simResults, setSimResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const runSimulation = async () => {
    try {
      setLoading(true);
      const res = await ScenarioAPI.simulate({
        base_target_tonnes: 35000.0,
        base_grade: activeMine?.avg_mn_grade || 40.5,
        base_fleet_avail: 84.0,
        base_working_days: 26,
        base_recovery_pct: 88.0,
        custom_params: customParams
      });
      setSimResults(res.data);
    } catch (err) {
      console.error("Scenario simulation error:", err);
      showToast("Error running scenario simulation.", "danger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSimulation();
  }, [activeMine]);

  const chartData = simResults?.scenarios?.map((s) => ({
    name: s.scenario_name.split(":")[0],
    production: s.expected_production_tonnes,
    target: s.target_ore_tonnes,
    contained_mn: s.contained_mn_tonnes,
    shortfall: s.shortfall_tonnes > 0 ? s.shortfall_tonnes : 0,
    revenue: s.revenue_crores_inr
  })) || [];

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
            <GitFork size={26} color="#c084fc" />
            <h1 style={{ fontSize: "1.45rem", fontWeight: "800", color: "#f8fafc" }}>
              What-If Mining Scenario Simulator & Sensitivity Engine
            </h1>
          </div>
          <p style={{ fontSize: "0.82rem", color: "#94a3b8", marginTop: "4px" }}>
            Model 11: Multi-scenario sensitivity analysis across fleet availability, weather delays, and cutoff grade strategies for {activeMine?.name}.
          </p>
        </div>
        <span className="badge badge-purple">{simResults?.scenarios?.length || 4} Scenarios Evaluated</span>
      </div>

      {/* Interactive Custom Scenario Sliders */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Sliders size={18} color="#38bdf8" />
            <span>Interactive Custom Scenario Parameters</span>
          </div>
          <button className="btn btn-primary" onClick={runSimulation} disabled={loading}>
            <GitFork size={16} />
            {loading ? "Simulating Trade-offs..." : "Simulate Scenario"}
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "16px" }}>
          <div>
            <label className="form-label">Target (t): {customParams.target_tonnes.toLocaleString()}</label>
            <input
              type="range"
              min="15000"
              max="60000"
              step="1000"
              value={customParams.target_tonnes}
              onChange={(e) => setCustomParams({ ...customParams, target_tonnes: parseFloat(e.target.value) })}
              style={{ width: "100%", accentColor: "#3b82f6" }}
            />
          </div>

          <div>
            <label className="form-label">Ore Grade: {customParams.ore_grade_pct}% Mn</label>
            <input
              type="range"
              min="20.0"
              max="50.0"
              step="0.5"
              value={customParams.ore_grade_pct}
              onChange={(e) => setCustomParams({ ...customParams, ore_grade_pct: parseFloat(e.target.value) })}
              style={{ width: "100%", accentColor: "#a855f7" }}
            />
          </div>

          <div>
            <label className="form-label">Fleet Avail: {customParams.fleet_availability_pct}%</label>
            <input
              type="range"
              min="50.0"
              max="98.0"
              step="1.0"
              value={customParams.fleet_availability_pct}
              onChange={(e) => setCustomParams({ ...customParams, fleet_availability_pct: parseFloat(e.target.value) })}
              style={{ width: "100%", accentColor: "#10b981" }}
            />
          </div>

          <div>
            <label className="form-label">Working Days: {customParams.working_days} Days</label>
            <input
              type="range"
              min="15"
              max="30"
              step="1"
              value={customParams.working_days}
              onChange={(e) => setCustomParams({ ...customParams, working_days: parseInt(e.target.value) })}
              style={{ width: "100%", accentColor: "#f59e0b" }}
            />
          </div>

          <div>
            <label className="form-label">Recovery: {customParams.recovery_pct}%</label>
            <input
              type="range"
              min="70.0"
              max="96.0"
              step="0.5"
              value={customParams.recovery_pct}
              onChange={(e) => setCustomParams({ ...customParams, recovery_pct: parseFloat(e.target.value) })}
              style={{ width: "100%", accentColor: "#06b6d4" }}
            />
          </div>
        </div>
      </div>

      {/* Comparative Scenario Bar Chart */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <TrendingUp size={18} color="#34d399" />
            <span>Comparative Scenario Production vs Shortfall Impact</span>
          </div>
          <span className="badge badge-live">Sensitivity Chart</span>
        </div>

        <div style={{ height: "280px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2e4f" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} unit=" t" />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e2e4f", borderRadius: "8px", fontSize: "0.8rem" }} />
              <Legend wrapperStyle={{ fontSize: "0.78rem" }} />
              <Bar dataKey="production" name="Expected Output (Tonnes)" fill="#34d399" radius={[4, 4, 0, 0]} />
              <Bar dataKey="target" name="Target (Tonnes)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="shortfall" name="Shortfall (Tonnes)" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Scenario Cards Grid */}
      <div className="grid-2">
        {simResults?.scenarios?.map((s, idx) => (
          <div key={idx} className="card card-interactive" style={{ borderLeft: `4px solid ${s.risk_level === "Low" ? "#10b981" : (s.risk_level === "Moderate" ? "#f59e0b" : "#ef4444")}` }}>
            <div className="card-header">
              <span className="card-title">{s.scenario_name}</span>
              <span className={`badge ${s.risk_level === "Low" ? "badge-live" : (s.risk_level === "Moderate" ? "badge-demo" : "badge-danger")}`}>
                {s.risk_level} Risk
              </span>
            </div>

            <p style={{ fontSize: "0.78rem", color: "#94a3b8", marginBottom: "12px" }}>
              {s.description}
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "0.78rem" }}>
              <div style={{ background: "#0b1222", padding: "8px", borderRadius: "6px" }}>
                <span style={{ color: "#94a3b8" }}>Expected Production:</span>
                <div className="mono" style={{ color: "#34d399", fontWeight: "700" }}>{s.expected_production_tonnes.toLocaleString()} t</div>
              </div>
              <div style={{ background: "#0b1222", padding: "8px", borderRadius: "6px" }}>
                <span style={{ color: "#94a3b8" }}>Contained Mn Output:</span>
                <div className="mono" style={{ color: "#f59e0b", fontWeight: "700" }}>{s.contained_mn_tonnes.toLocaleString()} t</div>
              </div>
              <div style={{ background: "#0b1222", padding: "8px", borderRadius: "6px" }}>
                <span style={{ color: "#94a3b8" }}>Ore Grade:</span>
                <div className="mono" style={{ color: "#c084fc", fontWeight: "700" }}>{s.ore_grade_pct}% Mn</div>
              </div>
              <div style={{ background: "#0b1222", padding: "8px", borderRadius: "6px" }}>
                <span style={{ color: "#94a3b8" }}>Projected Revenue:</span>
                <div className="mono" style={{ color: "#38bdf8", fontWeight: "700" }}>₹ {s.revenue_crores_inr} Cr</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
