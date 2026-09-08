import React, { useState, useEffect } from "react";
import { useMine } from "../context/MineContext";
import { RecommendationsAPI } from "../services/api";
import { Lightbulb, CheckCircle2, AlertTriangle, Target, Wrench, ShieldCheck, Activity, ArrowRight } from "lucide-react";

export const AIRecommendations = () => {
  const { activeMine } = useMine();
  const [recommendations, setRecommendations] = useState([]);
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecs = async () => {
      try {
        setLoading(true);
        const res = await RecommendationsAPI.getRecommendations();
        setRecommendations(res.data.recommendations || []);
      } catch (err) {
        console.error("Recommendations error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecs();
  }, [activeMine]);

  if (loading && recommendations.length === 0) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
        <Activity size={32} className="animate-spin" style={{ margin: "0 auto 16px auto", color: "#f59e0b" }} />
        <p>Synthesizing geological, fleet, remote sensing, and shortfall intelligence into actionable recommendations...</p>
      </div>
    );
  }

  const filteredRecs = filterCategory === "ALL"
    ? recommendations
    : recommendations.filter(r => r.category.toLowerCase().includes(filterCategory.toLowerCase()));

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
            <Lightbulb size={26} color="#f59e0b" />
            <h1 style={{ fontSize: "1.45rem", fontWeight: "800", color: "#f8fafc" }}>
              AI Mining Recommendation Engine & XAI Synthesizer
            </h1>
          </div>
          <p style={{ fontSize: "0.82rem", color: "#94a3b8", marginTop: "4px" }}>
            Model 12: Contextual, evidence-backed operational, exploration, and reliability guidance for {activeMine?.name}.
          </p>
        </div>
        <span className="badge badge-demo">{recommendations.length} Active AI Directives</span>
      </div>

      {/* Category Filter Pills */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {["ALL", "Exploration", "Production", "Maintenance", "Risk", "Remote Sensing"].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            style={{
              padding: "6px 14px",
              borderRadius: "8px",
              border: "none",
              background: filterCategory === cat ? "#f59e0b" : "#0d1527",
              color: filterCategory === cat ? "#000" : "#94a3b8",
              fontSize: "0.8rem",
              fontWeight: "700",
              cursor: "pointer",
              transition: "all 0.15s ease"
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Recommendations List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {filteredRecs.map((rec) => (
          <div
            key={rec.id}
            className="card card-interactive"
            style={{
              borderLeft: `4px solid ${rec.priority.includes("Critical") ? "#ef4444" : (rec.priority.includes("High") ? "#f59e0b" : "#3b82f6")}`
            }}
          >
            {/* Header */}
            <div className="card-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span className="card-title" style={{ fontSize: "1.1rem" }}>{rec.title}</span>
                <span className="badge badge-purple">{rec.category}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span className={`badge ${rec.priority.includes("Critical") ? "badge-danger" : (rec.priority.includes("High") ? "badge-demo" : "badge-live")}`}>
                  {rec.priority}
                </span>
                <span className="badge badge-info">
                  Confidence: {rec.confidence_pct}%
                </span>
              </div>
            </div>

            {/* Target & Reason */}
            <div style={{ margin: "10px 0", fontSize: "0.84rem", color: "#e2e8f0", lineHeight: "1.5" }}>
              <div style={{ marginBottom: "6px" }}>
                <b style={{ color: "#38bdf8" }}>Target Horizon / Unit: </b>
                <span>{rec.target_entity}</span>
              </div>
              <p style={{ color: "#cbd5e1" }}>
                {rec.reason}
              </p>
            </div>

            {/* Supporting Factors */}
            <div style={{
              background: "#080e1b",
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid #16243d",
              margin: "10px 0"
            }}>
              <span style={{ fontSize: "0.78rem", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Supporting Evidence & Quantitative Factors:
              </span>
              <ul style={{ margin: "6px 0 0 18px", fontSize: "0.78rem", color: "#cbd5e1", display: "flex", flexDirection: "column", gap: "4px" }}>
                {rec.supporting_factors?.map((f, fIdx) => (
                  <li key={fIdx}>{f}</li>
                ))}
              </ul>
            </div>

            {/* Actionable Step Directive Banner */}
            <div style={{
              background: "rgba(16, 185, 129, 0.1)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              borderRadius: "8px",
              padding: "10px 14px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "0.8rem",
              color: "#34d399",
              fontWeight: "600"
            }}>
              <CheckCircle2 size={16} color="#34d399" style={{ flexShrink: 0 }} />
              <span><b>Immediate Action Directive:</b> {rec.actionable_step}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
