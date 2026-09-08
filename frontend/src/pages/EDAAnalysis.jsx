import React, { useState, useEffect } from "react";
import { useMine } from "../context/MineContext";
import { EDAAPI } from "../services/api";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis, Cell, Legend
} from "recharts";
import { BarChart3, ScatterChart as ScatterIcon, Activity, Percent, ArrowUpDown } from "lucide-react";

export const EDAAnalysis = () => {
  const { activeMine } = useMine();
  const [edaData, setEdaData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEDA = async () => {
      try {
        setLoading(true);
        const res = await EDAAPI.getSummary();
        setEdaData(res.data);
      } catch (err) {
        console.error("EDA fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEDA();
  }, [activeMine]);

  if (loading || !edaData) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
        <Activity size={32} className="animate-spin" style={{ margin: "0 auto 16px auto", color: "#3b82f6" }} />
        <p>Computing statistical metrics, correlation matrices, and distributions...</p>
      </div>
    );
  }

  const { statistics_table, grade_distribution_bins, correlation_matrix, lithology_boxplots, depth_profile } = edaData;

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
          <h1 style={{ fontSize: "1.45rem", fontWeight: "800", color: "#f8fafc" }}>
            Exploratory Data Analysis & Statistical Profiling
          </h1>
          <p style={{ fontSize: "0.82rem", color: "#94a3b8", marginTop: "4px" }}>
            Geochemical distributions, elemental correlations (Mn, Fe, SiO₂, P), and depth profiles for {activeMine?.name}.
          </p>
        </div>
        <span className="badge badge-info">{edaData.total_drillhole_samples} Core Samples Evaluated</span>
      </div>

      {/* Row 1: Statistical Summary Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <BarChart3 size={18} color="#60a5fa" />
            <span>Descriptive Statistics of Chemical Assays & Geotechnical Variables</span>
          </div>
          <span className="badge badge-purple">Parametric Summary</span>
        </div>

        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Feature / Variable</th>
                <th>Sample Count</th>
                <th>Mean (&mu;)</th>
                <th>Std Dev (&sigma;)</th>
                <th>Min</th>
                <th>25th Pct</th>
                <th>Median (50th)</th>
                <th>75th Pct</th>
                <th>Max</th>
              </tr>
            </thead>
            <tbody>
              {statistics_table?.map((row) => (
                <tr key={row.feature}>
                  <td style={{ fontWeight: "600", color: "#38bdf8" }}>{row.feature}</td>
                  <td>{row.count}</td>
                  <td className="mono">{row.mean}</td>
                  <td className="mono">{row.std}</td>
                  <td className="mono">{row.min}</td>
                  <td className="mono">{row.p25}</td>
                  <td className="mono" style={{ fontWeight: "700", color: "#34d399" }}>{row.median}</td>
                  <td className="mono">{row.p75}</td>
                  <td className="mono" style={{ fontWeight: "700", color: "#f59e0b" }}>{row.max}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Row 2: Grade Distribution Histogram & Correlation Heatmap */}
      <div className="grid-2">
        {/* Grade Distribution Bins */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Percent size={18} color="#c084fc" />
              <span>Manganese (Mn%) Grade Distribution</span>
            </div>
            <span className="badge badge-purple">Histogram</span>
          </div>

          <div style={{ height: "280px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={grade_distribution_bins}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2e4f" />
                <XAxis dataKey="bin" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{ background: "#0f172a", border: "1px solid #1e2e4f", borderRadius: "8px", fontSize: "0.8rem" }}
                />
                <Bar dataKey="count" fill="#9333ea" radius={[6, 6, 0, 0]}>
                  {grade_distribution_bins?.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === 3 || index === 4 ? "#9333ea" : (index === 2 ? "#2563eb" : "#d97706")}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Correlation Heatmap Grid */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <ArrowUpDown size={18} color="#34d399" />
              <span>Multi-Element Pearson Correlation Matrix</span>
            </div>
            <span className="badge badge-live">Correlation</span>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "center", fontSize: "0.8rem" }}>
              <thead>
                <tr>
                  <th style={{ padding: "8px", color: "#64748b" }}></th>
                  {correlation_matrix.columns?.map((c) => (
                    <th key={c} style={{ padding: "8px", color: "#cbd5e1", fontWeight: "600" }}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {correlation_matrix.columns?.map((rowCol, rIdx) => (
                  <tr key={rowCol}>
                    <td style={{ padding: "8px", fontWeight: "600", color: "#cbd5e1", textAlign: "right" }}>{rowCol}</td>
                    {correlation_matrix.values?.[rIdx]?.map((val, cIdx) => {
                      const isHighPos = val > 0.5;
                      const isHighNeg = val < -0.4;
                      const isDiag = rIdx === cIdx;
                      return (
                        <td
                          key={cIdx}
                          style={{
                            padding: "8px",
                            fontFamily: "var(--font-mono)",
                            background: isDiag
                              ? "rgba(59, 130, 246, 0.2)"
                              : isHighPos
                              ? `rgba(16, 185, 129, ${Math.abs(val) * 0.4})`
                              : isHighNeg
                              ? `rgba(244, 63, 94, ${Math.abs(val) * 0.4})`
                              : "transparent",
                            color: isDiag ? "#93c5fd" : (isHighPos ? "#34d399" : (isHighNeg ? "#fb7185" : "#94a3b8")),
                            fontWeight: isHighPos || isHighNeg ? "700" : "400",
                            border: "1px solid #142038"
                          }}
                        >
                          {val.toFixed(2)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Row 3: Depth vs Grade Scatter Profile */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <ScatterIcon size={18} color="#38bdf8" />
            <span>Depth vs. Manganese Assay Grade Dispersion</span>
          </div>
          <span className="badge badge-info">Depth Stratigraphy</span>
        </div>

        <div style={{ height: "300px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2e4f" />
              <XAxis type="number" dataKey="depth_m" name="Sample Depth" unit="m" stroke="#94a3b8" />
              <YAxis type="number" dataKey="mn_grade" name="Mn Grade" unit="%" stroke="#94a3b8" />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                contentStyle={{ background: "#0f172a", border: "1px solid #1e2e4f", borderRadius: "8px", fontSize: "0.8rem" }}
              />
              <Scatter name="Core Assays" data={depth_profile} fill="#3b82f6" fillOpacity={0.8}>
                {depth_profile?.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.mn_grade >= 38.0 ? "#9333ea" : (entry.mn_grade >= 25.0 ? "#2563eb" : "#f59e0b")}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
