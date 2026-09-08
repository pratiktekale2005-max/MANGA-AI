import React, { useState, useEffect } from "react";
import { useMine } from "../context/MineContext";
import { SpatialAPI } from "../services/api";
import { Compass, Activity, CheckCircle2, Layers, Cpu, Eye } from "lucide-react";

export const SpatialInterpolation = () => {
  const { activeMine } = useMine();
  const [data, setData] = useState(null);
  const [surfaceData, setSurfaceData] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState("kriging_surface");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSpatial = async () => {
      try {
        setLoading(true);
        const [compRes, surfRes] = await Promise.all([
          SpatialAPI.compareMethods(),
          SpatialAPI.getSurface(20)
        ]);
        setData(compRes.data);
        setSurfaceData(surfRes.data);
      } catch (err) {
        console.error("Spatial fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSpatial();
  }, [activeMine]);

  if (loading || !data) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
        <Activity size={32} className="animate-spin" style={{ margin: "0 auto 16px auto", color: "#60a5fa" }} />
        <p>Computing geostatistical variograms and ordinary kriging spatial surfaces...</p>
      </div>
    );
  }

  const comparison = data.comparison || {};

  const getHeatmapColor = (val, isUncertainty = false) => {
    if (isUncertainty) {
      const alpha = Math.min(1.0, val / 15.0);
      return `rgba(239, 68, 68, ${alpha})`;
    }
    if (val >= 40.0) return "#9333ea";
    if (val >= 32.0) return "#2563eb";
    if (val >= 22.0) return "#059669";
    if (val >= 12.0) return "#f59e0b";
    return "#334155";
  };

  const activeSurface = surfaceData?.[selectedMethod] || [];
  const isUncertaintyView = selectedMethod === "kriging_uncertainty";

  return (
    <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header Banner */}
      <div style={{
        background: "linear-gradient(135deg, rgba(59, 130, 246, 0.18) 0%, rgba(15, 23, 42, 0.9) 100%)",
        border: "1px solid rgba(59, 130, 246, 0.35)",
        borderRadius: "14px",
        padding: "20px 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Compass size={26} color="#60a5fa" />
            <h1 style={{ fontSize: "1.45rem", fontWeight: "800", color: "#f8fafc" }}>
              Spatial Estimation & Geostatistical Interpolation
            </h1>
          </div>
          <p style={{ fontSize: "0.82rem", color: "#94a3b8", marginTop: "4px" }}>
            Model 3: Comparative spatial surface modeling (Ordinary Kriging vs. IDW vs. Nonlinear ML Neighborhood) for {activeMine?.name}.
          </p>
        </div>
        <span className="badge badge-info">{data.total_boreholes_used} Borehole Assays Interpolated</span>
      </div>

      {/* Comparison Cards Grid */}
      <div className="grid-3">
        {Object.entries(comparison).map(([method, stats]) => (
          <div key={method} className="card">
            <div className="card-header">
              <span className="metric-label">{method}</span>
              <span className="badge badge-purple">{stats.method_type}</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "10px 0" }}>
              <div>
                <span style={{ fontSize: "0.72rem", color: "#94a3b8", textTransform: "uppercase" }}>Spatial R²</span>
                <div className="metric-value" style={{ color: stats.r2_score > 0.3 ? "#34d399" : "#60a5fa", fontSize: "1.4rem" }}>
                  {(stats.r2_score * 100).toFixed(1)}%
                </div>
              </div>

              <div>
                <span style={{ fontSize: "0.72rem", color: "#94a3b8", textTransform: "uppercase" }}>RMSE</span>
                <div className="metric-value" style={{ color: "#f59e0b", fontSize: "1.4rem" }}>
                  {stats.rmse} <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>% Mn</span>
                </div>
              </div>

              <div>
                <span style={{ fontSize: "0.72rem", color: "#94a3b8", textTransform: "uppercase" }}>MAE</span>
                <div className="metric-value" style={{ color: "#c084fc", fontSize: "1.4rem" }}>
                  {stats.mae} <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>% Mn</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 2D Interpolated Continuous Surface Grid Viewer */}
      <div className="card">
        <div className="card-header" style={{ flexWrap: "wrap", gap: "12px" }}>
          <div className="card-title">
            <Layers size={18} color="#38bdf8" />
            <span>Continuous Spatial Grade Surface Raster (20 &times; 20 Grid)</span>
          </div>

          <div style={{ display: "flex", gap: "6px" }}>
            {[
              { id: "kriging_surface", label: "Ordinary Kriging (Gaussian Process)" },
              { id: "idw_surface", label: "IDW (Inverse Distance)" },
              { id: "ml_surface", label: "ML Spatial Estimator" },
              { id: "kriging_uncertainty", label: "Kriging Spatial Uncertainty (&sigma;)" }
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedMethod(m.id)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  border: "none",
                  background: selectedMethod === m.id ? "#2563eb" : "#0f1a30",
                  color: selectedMethod === m.id ? "#fff" : "#94a3b8",
                  fontSize: "0.78rem",
                  fontWeight: "600",
                  cursor: "pointer"
                }}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* 20x20 Grid Display */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "16px",
          background: "#080e1b",
          borderRadius: "10px",
          border: "1px solid #16243d"
        }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: `repeat(${activeSurface[0]?.length || 20}, 20px)`,
            gap: "2px",
            background: "#050a14",
            padding: "8px",
            borderRadius: "6px",
            border: "1px solid #1a2742"
          }}>
            {activeSurface.map((row, rIdx) =>
              row.map((cellVal, cIdx) => (
                <div
                  key={`${rIdx}-${cIdx}`}
                  title={`Grid Cell [${rIdx}, ${cIdx}]: ${cellVal}${isUncertaintyView ? " std dev" : "% Mn"}`}
                  style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "2px",
                    backgroundColor: getHeatmapColor(cellVal, isUncertaintyView),
                    cursor: "pointer",
                    transition: "transform 0.1s ease"
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.3)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1.0)"; }}
                />
              ))
            )}
          </div>

          <div style={{ marginTop: "14px", display: "flex", alignItems: "center", gap: "20px", fontSize: "0.78rem", color: "#94a3b8" }}>
            <span>Low (&lt; 15% Mn / Low &sigma;)</span>
            <div style={{
              width: "160px",
              height: "10px",
              borderRadius: "5px",
              background: isUncertaintyView ? "linear-gradient(90deg, #10b981, #ef4444)" : "linear-gradient(90deg, #334155, #f59e0b, #059669, #2563eb, #9333ea)"
            }}></div>
            <span>High (&ge; 40% Mn / High &sigma;)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
