import React, { useState, useEffect } from "react";
import { useMine } from "../context/MineContext";
import { ProductionAPI } from "../services/api";
import { TrendingUp, Activity, AlertTriangle, CheckCircle2, Percent, Calendar, ShieldCheck } from "lucide-react";
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

export const ProductionForecast = () => {
  const { activeMine } = useMine();
  const [forecasts, setForecasts] = useState([]);
  const [history, setHistory] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProductionData = async () => {
      try {
        setLoading(true);
        const [fRes, hRes, mRes] = await Promise.all([
          ProductionAPI.getForecast(12),
          ProductionAPI.getHistory(24),
          ProductionAPI.getMetadata()
        ]);
        setForecasts(fRes.data.forecasts || []);
        setHistory(hRes.data.history || []);
        setMeta(mRes.data);
      } catch (err) {
        console.error("Production fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProductionData();
  }, [activeMine]);

  if (loading && forecasts.length === 0) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
        <Activity size={32} className="animate-spin" style={{ margin: "0 auto 16px auto", color: "#34d399" }} />
        <p>Training time-series production forecaster and calculating shortfall risk radar...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header Banner */}
      <div style={{
        background: "linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(15, 23, 42, 0.9) 100%)",
        border: "1px solid rgba(16, 185, 129, 0.35)",
        borderRadius: "14px",
        padding: "20px 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <TrendingUp size={26} color="#34d399" />
            <h1 style={{ fontSize: "1.45rem", fontWeight: "800", color: "#f8fafc" }}>
              Time-Series Production Forecasting & Shortfall Intelligence
            </h1>
          </div>
          <p style={{ fontSize: "0.82rem", color: "#94a3b8", marginTop: "4px" }}>
            Model 5 & 7: Lagged operational regression forecasting 12-month future ore output with shortfall root causes for {activeMine?.name}.
          </p>
        </div>
        <span className="badge badge-live">Forecaster R²: {meta?.r2_score || 0.906} | MAPE: {meta?.mape_pct || 11.4}%</span>
      </div>

      {/* Row 1: 12-Month Future Production Projections Chart */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <TrendingUp size={18} color="#34d399" />
            <span>12-Month Projected Ore Production vs. Planned Target (With Confidence Bands)</span>
          </div>
          <span className="badge badge-live">Future Horizon</span>
        </div>

        <div style={{ height: "300px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={forecasts}>
              <defs>
                <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2e4f" />
              <XAxis dataKey="forecast_month" stroke="#94a3b8" fontSize={10} />
              <YAxis stroke="#94a3b8" fontSize={11} unit=" t" />
              <Tooltip
                contentStyle={{ background: "#0f172a", border: "1px solid #1e2e4f", borderRadius: "8px", fontSize: "0.8rem" }}
              />
              <Legend wrapperStyle={{ fontSize: "0.78rem" }} />
              <Area type="monotone" dataKey="predicted_ore_tonnes" name="Predicted Ore (Tonnes)" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorProd)" />
              <Line type="monotone" dataKey="target_ore_tonnes" name="Planned Target (Tonnes)" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" />
              <Line type="monotone" dataKey="lower_bound_tonnes" name="Lower Confidence Bound (95%)" stroke="#64748b" strokeWidth={1} strokeDasharray="3 3" />
              <Line type="monotone" dataKey="upper_bound_tonnes" name="Upper Confidence Bound (95%)" stroke="#64748b" strokeWidth={1} strokeDasharray="3 3" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2: Month-by-Month Shortfall & Risk Attribution Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <AlertTriangle size={18} color="#f59e0b" />
            <span>Monthly Shortfall Risk Radar & Root Cause Factor Attribution</span>
          </div>
          <span className="badge badge-demo">Shortfall Engine</span>
        </div>

        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Forecast Month</th>
                <th>Target (Tonnes)</th>
                <th>Predicted Output (Tonnes)</th>
                <th>Shortfall / Variance</th>
                <th>Expected Grade (%)</th>
                <th>Shortfall Status</th>
                <th>Attributed Root Cause Factor</th>
              </tr>
            </thead>
            <tbody>
              {forecasts.map((f, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: "700", color: "#f8fafc" }}>{f.month_name}</td>
                  <td className="mono">{f.target_ore_tonnes?.toLocaleString()} t</td>
                  <td className="mono" style={{ fontWeight: "700", color: "#34d399" }}>{f.predicted_ore_tonnes?.toLocaleString()} t</td>
                  <td className="mono" style={{ color: f.shortfall_tonnes > 0 ? "#fb7185" : "#34d399" }}>
                    {f.shortfall_tonnes > 0 ? `-${f.shortfall_tonnes?.toLocaleString()} t (${f.shortfall_pct}%)` : `+${Math.abs(f.shortfall_tonnes)?.toLocaleString()} t`}
                  </td>
                  <td className="mono" style={{ color: "#c084fc", fontWeight: "600" }}>{f.expected_mn_grade_pct}% Mn</td>
                  <td>
                    <span className={`badge ${f.shortfall_risk_status === "Critical Risk" ? "badge-danger" : (f.shortfall_risk_status === "Warning" ? "badge-demo" : "badge-live")}`}>
                      {f.shortfall_risk_status}
                    </span>
                  </td>
                  <td style={{ fontSize: "0.76rem", color: "#cbd5e1" }}>{f.root_cause_factor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
