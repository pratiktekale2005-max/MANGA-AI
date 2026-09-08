import React, { useState, useEffect } from "react";
import { useMine } from "../context/MineContext";
import { ExplorationAPI } from "../services/api";
import { Target, Compass, ShieldAlert, Activity, CheckCircle2, Crosshair, ArrowUpRight } from "lucide-react";

export const ExplorationPriority = () => {
  const { activeMine } = useMine();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTargets = async () => {
      try {
        setLoading(true);
        const res = await ExplorationAPI.prioritizeTargets(8);
        setData(res.data);
      } catch (err) {
        console.error("Exploration targets error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTargets();
  }, [activeMine]);

  if (loading || !data) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
        <Activity size={32} className="animate-spin" style={{ margin: "0 auto 16px auto", color: "#ef4444" }} />
        <p>Prioritizing mineralized exploration targets and computing Bayesian drilling ranks...</p>
      </div>
    );
  }

  const { top_recommended_targets, disclaimer, total_evaluated_zones } = data;

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
            <Target size={26} color="#ef4444" />
            <h1 style={{ fontSize: "1.45rem", fontWeight: "800", color: "#f8fafc" }}>
              AI Exploration Target Prioritization & Core Drilling Engine
            </h1>
          </div>
          <p style={{ fontSize: "0.82rem", color: "#94a3b8", marginTop: "4px" }}>
            Model 4: Multi-criteria Bayesian decision engine combining space spectral iron/clay alteration, structural strike, and depth uncertainty for {activeMine?.name}.
          </p>
        </div>
        <span className="badge badge-danger">{top_recommended_targets?.length} Top Drilling Targets</span>
      </div>

      {/* Mandatory Disclaimer */}
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
          <b>Exploration Target Protocol:</b> {disclaimer}
        </span>
      </div>

      {/* Targets Grid */}
      <div className="grid-2">
        {top_recommended_targets?.map((tgt, idx) => (
          <div key={tgt.target_id} className="card card-interactive" style={{ borderLeft: `4px solid ${idx === 0 ? "#ef4444" : "#f59e0b"}` }}>
            <div className="card-header">
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Crosshair size={18} color={idx === 0 ? "#ef4444" : "#f59e0b"} />
                <span className="card-title">{tgt.target_id}</span>
              </div>
              <span className={`badge ${tgt.priority_score > 75 ? "badge-danger" : "badge-demo"}`}>
                Priority Score: {tgt.priority_score}%
              </span>
            </div>

            {/* Target Parameters */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", margin: "10px 0", fontSize: "0.8rem" }}>
              <div style={{ background: "#0b1222", padding: "8px 12px", borderRadius: "6px" }}>
                <span style={{ color: "#94a3b8", fontSize: "0.72rem" }}>Target Coordinates:</span>
                <div className="mono" style={{ color: "#f8fafc", fontWeight: "600" }}>
                  {tgt.latitude.toFixed(5)}&deg;N, {tgt.longitude.toFixed(5)}&deg;E
                </div>
              </div>

              <div style={{ background: "#0b1222", padding: "8px 12px", borderRadius: "6px" }}>
                <span style={{ color: "#94a3b8", fontSize: "0.72rem" }}>Recommended Hole Depth:</span>
                <div className="mono" style={{ color: "#34d399", fontWeight: "700" }}>
                  {tgt.recommended_hole_depth_m}m at {tgt.recommended_dip_angle}&deg; Dip
                </div>
              </div>

              <div style={{ background: "#0b1222", padding: "8px 12px", borderRadius: "6px" }}>
                <span style={{ color: "#94a3b8", fontSize: "0.72rem" }}>Drilling Azimuth:</span>
                <div className="mono" style={{ color: "#38bdf8", fontWeight: "600" }}>
                  {tgt.recommended_azimuth_deg}&deg; (Orthogonal to Strike)
                </div>
              </div>

              <div style={{ background: "#0b1222", padding: "8px 12px", borderRadius: "6px" }}>
                <span style={{ color: "#94a3b8", fontSize: "0.72rem" }}>Target Lithology:</span>
                <div style={{ color: "#c084fc", fontWeight: "600", fontSize: "0.75rem" }}>
                  {tgt.target_lithology}
                </div>
              </div>
            </div>

            {/* Geological Rationale */}
            <div style={{
              background: "#070c18",
              padding: "10px 12px",
              borderRadius: "6px",
              border: "1px solid #142038",
              fontSize: "0.76rem",
              color: "#cbd5e1",
              lineHeight: "1.4"
            }}>
              <b>Geological Rationale:</b> {tgt.geological_rationale}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
