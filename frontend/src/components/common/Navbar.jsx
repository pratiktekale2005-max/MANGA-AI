import React from "react";
import { useMine } from "../../context/MineContext";
import { 
  Mountain, 
  Database, 
  RotateCcw, 
  FileText, 
  Sparkles, 
  Info, 
  ShieldCheck,
  ChevronDown
} from "lucide-react";
import { ReportsAPI } from "../../services/api";

export const Navbar = ({ onOpenLanding, activeTab, setActiveTab }) => {
  const { mines, activeMine, isSynthetic, switchMine, resetDemoData, loading } = useMine();

  const handleExportPDF = () => {
    window.open(ReportsAPI.getExportPdfUrl(), "_blank");
  };

  return (
    <header style={{
      background: "linear-gradient(180deg, #0d1527 0%, #090f1e 100%)",
      borderBottom: "1px solid #1e2e4f",
      padding: "10px 24px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      position: "sticky",
      top: 0,
      zIndex: 1000,
      boxShadow: "0 4px 25px rgba(0, 0, 0, 0.5)"
    }}>
      {/* Brand & Subtitle */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          cursor: "pointer"
        }} onClick={() => setActiveTab("dashboard")}>
          <div style={{
            width: "38px",
            height: "38px",
            borderRadius: "10px",
            background: "linear-gradient(135deg, #9333ea 0%, #3b82f6 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 15px rgba(147, 51, 234, 0.5)"
          }}>
            <Mountain size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "1.15rem", fontWeight: "800", letterSpacing: "-0.02em", color: "#f8fafc" }}>
                MOIL <span style={{ color: "#a855f7" }}>MineAI</span>
              </span>
            </div>
            <p style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: "500" }}>
              AI + Space Technology Manganese Reserve & Production Intelligence
            </p>
          </div>
        </div>

        {/* Dataset Status Badge (CRITICAL REQUIREMENT) */}
        {isSynthetic ? (
          <div className="badge badge-demo" title="Currently displaying synthetic analogue data calibrated to Mansar / Sausar Group geology.">
            <span className="status-dot warning"></span>
            Demo / Synthetic Dataset
          </div>
        ) : (
          <div className="badge badge-live" title="Operating with user-uploaded mine exploration logs.">
            <span className="status-dot active"></span>
            Live Operational Data
          </div>
        )}
      </div>

      {/* Center / Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {/* Active Mine Selector */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: "600", textTransform: "uppercase" }}>
            Active Mine:
          </span>
          <select
            className="form-select"
            style={{ width: "230px", padding: "7px 12px", fontSize: "0.84rem", fontWeight: "600", background: "#0b1222" }}
            value={activeMine?.mine_id || ""}
            onChange={(e) => switchMine(e.target.value)}
            disabled={loading}
          >
            {mines.map((m) => (
              <option key={m.mine_id} value={m.mine_id}>
                {m.name} ({m.district})
              </option>
            ))}
          </select>
        </div>

        {/* Reset Demo Data Button */}
        <button
          className="btn btn-secondary btn-sm"
          onClick={resetDemoData}
          title="Reset database to clean MOIL demo datasets"
          disabled={loading}
        >
          <RotateCcw size={14} />
          Reset Demo
        </button>

        {/* Export Executive PDF Report */}
        <button
          className="btn btn-emerald btn-sm"
          onClick={handleExportPDF}
          title="Download Executive PDF Mineral Reserve Report"
        >
          <FileText size={14} />
          Export PDF
        </button>

        {/* About / Landing Overview Button */}
        <button
          className="btn btn-secondary btn-sm"
          onClick={onOpenLanding}
          style={{ background: "rgba(59, 130, 246, 0.1)", borderColor: "rgba(59, 130, 246, 0.3)", color: "#93c5fd" }}
        >
          <Info size={14} />
          System Docs
        </button>
      </div>
    </header>
  );
};
