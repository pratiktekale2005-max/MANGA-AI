import React, { useState } from "react";
import { MineProvider, useMine } from "./context/MineContext";
import { Navbar } from "./components/common/Navbar";
import { Sidebar } from "./components/common/Sidebar";
import { LandingModal } from "./components/common/LandingModal";

// Core 5 Views for the Streamlined AI Mining Workflow
import { Dashboard } from "./pages/Dashboard";
import { AIAnalysisWorkflow } from "./pages/AIAnalysisWorkflow";
import { BlockModelExplorer } from "./pages/BlockModelExplorer";
import { RiskAnalysisConsolidated } from "./pages/RiskAnalysisConsolidated";
import { Reports } from "./pages/Reports";

const ToastContainer = () => {
  const { toast } = useMine();
  if (!toast) return null;

  return (
    <div style={{
      position: "fixed",
      bottom: "24px",
      right: "24px",
      zIndex: 3000,
      background: toast.type === "danger" ? "rgba(244, 63, 94, 0.95)" : (toast.type === "live" ? "rgba(16, 185, 129, 0.95)" : "rgba(37, 99, 235, 0.95)"),
      color: "#ffffff",
      padding: "12px 20px",
      borderRadius: "10px",
      boxShadow: "0 8px 30px rgba(0,0,0,0.6)",
      fontSize: "0.86rem",
      fontWeight: "600",
      display: "flex",
      alignItems: "center",
      gap: "10px",
      backdropFilter: "blur(6px)"
    }}>
      <span>{toast.message}</span>
    </div>
  );
};

const MainContent = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isLandingOpen, setIsLandingOpen] = useState(false);

  const renderActiveView = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard setActiveTab={setActiveTab} />;
      case "ai_analysis":
        return <AIAnalysisWorkflow setActiveTab={setActiveTab} />;
      case "block_model":
      case "map":
      case "reserves":
      case "spatial":
        return <BlockModelExplorer />;
      case "risk_analysis":
      case "risk":
        return <RiskAnalysisConsolidated />;
      case "reports":
        return <Reports />;
      default:
        return <Dashboard setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#070b14" }}>
      <Navbar onOpenLanding={() => setIsLandingOpen(true)} activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <main style={{ flex: 1, overflowY: "auto", background: "#070b14" }}>
          {renderActiveView()}
        </main>
      </div>

      <LandingModal
        isOpen={isLandingOpen}
        onClose={() => setIsLandingOpen(false)}
        onLaunch={() => {
          setIsLandingOpen(false);
          setActiveTab("dashboard");
        }}
      />

      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <MineProvider>
      <MainContent />
    </MineProvider>
  );
}
