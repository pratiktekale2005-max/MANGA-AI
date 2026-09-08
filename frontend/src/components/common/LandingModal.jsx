import React from "react";
import { Mountain, CheckCircle2, Satellite, Cpu, Layers, ShieldCheck, X } from "lucide-react";

export const LandingModal = ({ isOpen, onClose, onLaunch }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(3, 7, 18, 0.85)",
      backdropFilter: "blur(8px)",
      zIndex: 2000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px"
    }}>
      <div style={{
        background: "linear-gradient(180deg, #0f172a 0%, #090f1e 100%)",
        border: "1px solid #1e2e4f",
        borderRadius: "16px",
        maxWidth: "800px",
        width: "100%",
        maxHeight: "90vh",
        overflowY: "auto",
        padding: "32px",
        boxShadow: "0 20px 60px rgba(0, 0, 0, 0.9)",
        position: "relative"
      }}>
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            background: "transparent",
            border: "none",
            color: "#94a3b8",
            cursor: "pointer"
          }}
        >
          <X size={22} />
        </button>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
          <div style={{
            width: "56px",
            height: "56px",
            borderRadius: "14px",
            background: "linear-gradient(135deg, #9333ea 0%, #3b82f6 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 25px rgba(147, 51, 234, 0.6)"
          }}>
            <Mountain size={32} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h2 style={{ fontSize: "1.45rem", fontWeight: "800", color: "#f8fafc" }}>
                MOIL AI Mine Intelligence Platform
              </h2>
            </div>
            <p style={{ fontSize: "0.88rem", color: "#94a3b8", marginTop: "4px" }}>
              Using AI/ML and Space Technology to Identify Manganese Reserves & Optimize Production Planning
            </p>
          </div>
        </div>

        {/* Core Pillars */}
        <div className="grid-3" style={{ marginBottom: "24px" }}>
          <div style={{ background: "#0b1222", padding: "16px", borderRadius: "10px", border: "1px solid #1a2742" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#38bdf8", fontWeight: "600", marginBottom: "8px" }}>
              <Satellite size={18} />
              <span>Space Remote Sensing</span>
            </div>
            <p style={{ fontSize: "0.78rem", color: "#94a3b8", lineHeight: "1.4" }}>
              Sentinel-2 12-band spectral analysis: Iron Oxide Index, Hydroxyl/Clay Alteration, NDVI, and Crosta PCA potential mapping.
            </p>
          </div>

          <div style={{ background: "#0b1222", padding: "16px", borderRadius: "10px", border: "1px solid #1a2742" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#a855f7", fontWeight: "600", marginBottom: "8px" }}>
              <Cpu size={18} />
              <span>Geological AI Models</span>
            </div>
            <p style={{ fontSize: "0.78rem", color: "#94a3b8", lineHeight: "1.4" }}>
              Random Forest & Gradient Boosting Mn grade predictors, Ordinary Kriging spatial interpolation, and 3D Voxel Reserve modeling.
            </p>
          </div>

          <div style={{ background: "#0b1222", padding: "16px", borderRadius: "10px", border: "1px solid #1a2742" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#34d399", fontWeight: "600", marginBottom: "8px" }}>
              <Layers size={18} />
              <span>Production & Fleet Plan</span>
            </div>
            <p style={{ fontSize: "0.78rem", color: "#94a3b8", lineHeight: "1.4" }}>
              12-month lagged time-series forecasting, shortfall attribution, fleet OEE/MTBF health tracking, and constrained extraction solver.
            </p>
          </div>
        </div>

        {/* Workflow Checklist */}
        <div style={{ background: "#080e1b", padding: "18px", borderRadius: "10px", border: "1px solid #152238", marginBottom: "24px" }}>
          <h4 style={{ fontSize: "0.92rem", color: "#e2e8f0", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
            <ShieldCheck size={18} color="#10b981" />
            Full-Stack Decision Support Workflow
          </h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "0.8rem", color: "#cbd5e1" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <CheckCircle2 size={15} color="#10b981" />
              <span>Real & Synthetic MOIL Datasets</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <CheckCircle2 size={15} color="#10b981" />
              <span>Interactive Leaflet GIS Mine Map</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <CheckCircle2 size={15} color="#10b981" />
              <span>3D Block Grade-Tonnage Curves</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <CheckCircle2 size={15} color="#10b981" />
              <span>AI Exploration Target Prioritizer</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <CheckCircle2 size={15} color="#10b981" />
              <span>Isolation Forest Anomaly Radar</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <CheckCircle2 size={15} color="#10b981" />
              <span>Automated Executive PDF Reports</span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
          <button className="btn btn-primary" onClick={onLaunch} style={{ padding: "10px 24px" }}>
            Launch Executive Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
