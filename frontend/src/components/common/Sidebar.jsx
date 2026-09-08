import React from "react";
import {
  LayoutDashboard,
  Cpu,
  Box,
  AlertTriangle,
  FileText,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Database,
  Layers,
  ShieldCheck
} from "lucide-react";

export const Sidebar = ({ activeTab, setActiveTab }) => {
  const navItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      subtitle: "Executive Overview & Map",
      icon: LayoutDashboard,
      badge: "Summary"
    },
    {
      id: "ai_analysis",
      label: "AI Analysis",
      subtitle: "Guided 4-Step Pipeline",
      icon: Cpu,
      badge: "Core AI"
    },
    {
      id: "block_model",
      label: "Block Model",
      subtitle: "3D/2D Potential Explorer",
      icon: Box,
      badge: "Spatial"
    },
    {
      id: "risk_analysis",
      label: "Risk Analysis",
      subtitle: "4-Pillar Risk & Anomalies",
      icon: AlertTriangle,
      badge: "4 Pillars"
    },
    {
      id: "reports",
      label: "Reports",
      subtitle: "Executive PDF & Export",
      icon: FileText,
      badge: "Export"
    }
  ];

  const workflowSteps = [
    { num: "1", label: "Mine Selection" },
    { num: "2", label: "Data Input (6 Layers)" },
    { num: "3", label: "AI Processing" },
    { num: "4", label: "Grade & Reserves" },
    { num: "5", label: "Risk & Recommendation" }
  ];

  return (
    <aside style={{
      width: "260px",
      minWidth: "260px",
      background: "#080e1b",
      borderRight: "1px solid #1a2742",
      height: "calc(100vh - 61px)",
      overflowY: "auto",
      padding: "20px 14px",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      gap: "20px"
    }}>
      {/* Top: Navigation Menu */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <div style={{
          fontSize: "0.68rem",
          fontWeight: "800",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: "#64748b",
          padding: "0 10px 8px 10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <span>Platform Navigation</span>
          <span style={{ color: "#38bdf8", fontWeight: "700" }}>5 Views</span>
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "11px 12px",
                borderRadius: "10px",
                color: isActive ? "#ffffff" : "#94a3b8",
                background: isActive 
                  ? "linear-gradient(135deg, rgba(59, 130, 246, 0.25) 0%, rgba(147, 51, 234, 0.2) 100%)" 
                  : "transparent",
                border: isActive ? "1px solid rgba(59, 130, 246, 0.45)" : "1px solid transparent",
                cursor: "pointer",
                transition: "all 0.15s ease",
                textAlign: "left",
                boxShadow: isActive ? "0 4px 15px rgba(59, 130, 246, 0.15)" : "none"
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "#0f1a30";
                  e.currentTarget.style.color = "#f1f5f9";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#94a3b8";
                }
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  background: isActive ? "#2563eb" : "#131f37",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background 0.15s ease"
                }}>
                  <Icon size={16} color={isActive ? "#ffffff" : "#60a5fa"} />
                </div>
                <div>
                  <div style={{ fontSize: "0.86rem", fontWeight: isActive ? "700" : "600" }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: "0.7rem", color: isActive ? "#cbd5e1" : "#64748b" }}>
                    {item.subtitle}
                  </div>
                </div>
              </div>
              <span style={{
                fontSize: "0.64rem",
                padding: "2px 6px",
                borderRadius: "4px",
                fontWeight: "700",
                background: isActive ? "rgba(96, 165, 250, 0.2)" : "rgba(30, 41, 59, 0.6)",
                color: isActive ? "#93c5fd" : "#64748b"
              }}>
                {item.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bottom Card: AI Workflow Journey Guide */}
      <div style={{
        background: "linear-gradient(180deg, #0b1426 0%, #070d1a 100%)",
        border: "1px solid #1e2e4f",
        borderRadius: "12px",
        padding: "14px",
        display: "flex",
        flexDirection: "column",
        gap: "10px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Sparkles size={15} color="#38bdf8" />
          <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "#f8fafc", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            AI Mining Journey
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.73rem", color: "#94a3b8" }}>
          {workflowSteps.map((s, idx) => (
            <div key={idx} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{
                width: "16px",
                height: "16px",
                borderRadius: "50%",
                background: "#1e293b",
                color: "#60a5fa",
                fontSize: "0.62rem",
                fontWeight: "800",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                {s.num}
              </span>
              <span>{s.label}</span>
            </div>
          ))}
        </div>

        <button
          onClick={() => setActiveTab("ai_analysis")}
          style={{
            marginTop: "4px",
            background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            padding: "8px 12px",
            fontSize: "0.76rem",
            fontWeight: "700",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            transition: "opacity 0.15s ease"
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = "0.9"}
          onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
        >
          <span>Run Analysis Flow</span>
          <ArrowRight size={13} />
        </button>
      </div>
    </aside>
  );
};
