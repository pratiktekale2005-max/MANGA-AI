import React, { useState, useEffect } from "react";
import { useMine } from "../context/MineContext";
import { ReserveAPI, GeologyAPI } from "../services/api";
import { MapContainer, TileLayer, CircleMarker, Rectangle, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { MAP_TILE_PROVIDERS } from "../utils/mapTiles";
import {
  Box,
  Sliders,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Info,
  ShieldCheck,
  Activity,
  Layers,
  MapPin,
  TrendingUp
} from "lucide-react";

export const BlockModelExplorer = () => {
  const { activeMine } = useMine();
  const [blocks, setBlocks] = useState([]);
  const [drillholes, setDrillholes] = useState([]);
  const [reserveSummary, setReserveSummary] = useState(null);
  const [cutoffGrade, setCutoffGrade] = useState(20.0);
  const [basemapMode, setBasemapMode] = useState("satellite");
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [potentialFilter, setPotentialFilter] = useState("ALL"); // ALL, HIGH, MEDIUM, LOW
  const [showDrillholes, setShowDrillholes] = useState(true);
  const [loading, setLoading] = useState(true);

  const centerLat = activeMine?.center_lat || 21.5478;
  const centerLon = activeMine?.center_lon || 79.7042;

  const loadData = async (cVal = cutoffGrade) => {
    try {
      setLoading(true);
      const [blkRes, resRes, dhRes] = await Promise.all([
        ReserveAPI.getBlocks(250),
        ReserveAPI.estimateReserves(cVal),
        GeologyAPI.getDrillholes().catch(() => ({ data: { drillholes: [] } }))
      ]);

      const blks = blkRes.data.blocks || [];
      setBlocks(blks);
      setReserveSummary(resRes.data);
      setDrillholes(dhRes.data.drillholes || []);
      if (blks.length > 0 && !selectedBlock) {
        setSelectedBlock(blks[0]);
      }
    } catch (err) {
      console.error("Block model load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(cutoffGrade);
  }, [activeMine]);

  const handleCutoffChange = (newVal) => {
    setCutoffGrade(newVal);
    loadData(newVal);
  };

  const getBlockPotential = (grade) => {
    if (grade >= 32.0) return { label: "High Potential", color: "#10b981", code: "HIGH" };
    if (grade >= 20.0) return { label: "Medium Potential", color: "#f59e0b", code: "MEDIUM" };
    return { label: "Low Potential / Risk", color: "#ef4444", code: "LOW" };
  };

  const filteredBlocks = blocks.filter((b) => {
    const grade = parseFloat(b.predicted_mn_grade || b.mn_grade || 25.0);
    const pot = getBlockPotential(grade);
    if (potentialFilter === "HIGH") return pot.code === "HIGH";
    if (potentialFilter === "MEDIUM") return pot.code === "MEDIUM";
    if (potentialFilter === "LOW") return pot.code === "LOW";
    return true;
  });

  const highCount = blocks.filter((b) => parseFloat(b.predicted_mn_grade || b.mn_grade || 0) >= 32.0).length;
  const medCount = blocks.filter((b) => {
    const g = parseFloat(b.predicted_mn_grade || b.mn_grade || 0);
    return g >= 20.0 && g < 32.0;
  }).length;
  const lowCount = blocks.filter((b) => parseFloat(b.predicted_mn_grade || b.mn_grade || 0) < 20.0).length;

  return (
    <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px", height: "calc(100vh - 61px)" }}>
      {/* Top Banner & Stats Summary */}
      <div style={{
        background: "linear-gradient(135deg, #0d1527 0%, #090f1e 100%)",
        border: "1px solid #1e2e4f",
        borderRadius: "12px",
        padding: "14px 20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "12px"
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Box size={22} color="#60a5fa" />
            <h1 style={{ fontSize: "1.25rem", fontWeight: "800", color: "#f8fafc" }}>
              3D/2D Mining Block Model & Resource Potential Explorer
            </h1>
            <span className="badge badge-purple">{activeMine?.name}</span>
          </div>
          <p style={{ fontSize: "0.76rem", color: "#94a3b8", marginTop: "2px" }}>
            Visual categorization: 🟢 High Potential (&gt;32% Mn) • 🟡 Medium Potential (20-32% Mn) • 🔴 Low Potential (&lt;20% Mn)
          </p>
        </div>

        {/* Potential Counts Pills */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.3)", padding: "5px 10px", borderRadius: "6px", fontSize: "0.74rem", color: "#34d399", fontWeight: "700" }}>
            🟢 High: {highCount} blocks
          </div>
          <div style={{ background: "rgba(245, 158, 11, 0.15)", border: "1px solid rgba(245, 158, 11, 0.3)", padding: "5px 10px", borderRadius: "6px", fontSize: "0.74rem", color: "#fbbf24", fontWeight: "700" }}>
            🟡 Medium: {medCount} blocks
          </div>
          <div style={{ background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", padding: "5px 10px", borderRadius: "6px", fontSize: "0.74rem", color: "#f87171", fontWeight: "700" }}>
            🔴 Low: {lowCount} blocks
          </div>
        </div>
      </div>

      {/* Main Content: Controls + Map + Inspector */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "16px", flex: 1, minHeight: 0 }}>
        {/* Left: Map & Controls */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", height: "100%" }}>
          {/* Controls Bar */}
          <div style={{
            background: "#080e1b",
            border: "1px solid #1a2742",
            borderRadius: "10px",
            padding: "10px 14px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px"
          }}>
            {/* Filter Pills */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "700" }}>FILTER:</span>
              {[
                { id: "ALL", label: `All (${blocks.length})` },
                { id: "HIGH", label: `🟢 High (${highCount})` },
                { id: "MEDIUM", label: `🟡 Medium (${medCount})` },
                { id: "LOW", label: `🔴 Low (${lowCount})` }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setPotentialFilter(f.id)}
                  style={{
                    background: potentialFilter === f.id ? "#2563eb" : "#0d172a",
                    color: potentialFilter === f.id ? "#ffffff" : "#94a3b8",
                    border: potentialFilter === f.id ? "1px solid #3b82f6" : "1px solid #1e2e4f",
                    borderRadius: "6px",
                    padding: "4px 10px",
                    fontSize: "0.74rem",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Cutoff Slider */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Sliders size={14} color="#38bdf8" />
              <span style={{ fontSize: "0.74rem", color: "#cbd5e1" }}>Cut-off: <b>{cutoffGrade.toFixed(1)}%</b></span>
              <input
                type="range"
                min="10.0"
                max="40.0"
                step="1.0"
                value={cutoffGrade}
                onChange={(e) => handleCutoffChange(parseFloat(e.target.value))}
                style={{ width: "110px", accentColor: "#3b82f6", cursor: "pointer" }}
              />
            </div>

            {/* Drillholes Toggle */}
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.74rem", color: "#cbd5e1", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={showDrillholes}
                onChange={(e) => setShowDrillholes(e.target.checked)}
              />
              <span>Show Boreholes ({drillholes.length})</span>
            </label>

            {/* Watermark-Free Basemap Switcher */}
            <div style={{ display: "flex", background: "#0b1329", padding: "2px", borderRadius: "6px", border: "1px solid #1e2e4f", marginLeft: "auto" }}>
              <button
                style={{
                  padding: "3px 8px",
                  fontSize: "0.72rem",
                  fontWeight: basemapMode === "satellite" ? "700" : "500",
                  background: basemapMode === "satellite" ? "#2563eb" : "transparent",
                  color: basemapMode === "satellite" ? "#ffffff" : "#94a3b8",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
                onClick={() => setBasemapMode("satellite")}
                title="Esri Satellite Imagery"
              >
                🛰️ Satellite
              </button>
              <button
                style={{
                  padding: "3px 8px",
                  fontSize: "0.72rem",
                  fontWeight: basemapMode === "dark" ? "700" : "500",
                  background: basemapMode === "dark" ? "#2563eb" : "transparent",
                  color: basemapMode === "dark" ? "#ffffff" : "#94a3b8",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
                onClick={() => setBasemapMode("dark")}
                title="Esri Tactical Dark Gray Canvas"
              >
                🌑 Dark GIS
              </button>
            </div>
          </div>

          {/* Interactive Leaflet Map */}
          <div style={{
            flex: 1,
            borderRadius: "10px",
            overflow: "hidden",
            border: "1px solid #1e2e4f",
            position: "relative"
          }}>
            <MapContainer
              center={[centerLat, centerLon]}
              zoom={14}
              style={{ width: "100%", height: "100%", background: "#050a14" }}
            >
              <TileLayer
                key={basemapMode}
                url={MAP_TILE_PROVIDERS[basemapMode].url}
                attribution={MAP_TILE_PROVIDERS[basemapMode].attribution}
              />

              {/* Render Block Voxels */}
              {filteredBlocks.map((blk) => {
                const lat = blk.latitude || centerLat;
                const lon = blk.longitude || centerLon;
                const grade = parseFloat(blk.predicted_mn_grade || blk.mn_grade || 25.0);
                const pot = getBlockPotential(grade);
                const isSelected = selectedBlock?.block_id === blk.block_id;

                // 100m x 100m footprint
                const bounds = [
                  [lat - 0.00045, lon - 0.0005],
                  [lat + 0.00045, lon + 0.0005]
                ];

                return (
                  <Rectangle
                    key={blk.block_id}
                    bounds={bounds}
                    pathOptions={{
                      color: isSelected ? "#ffffff" : pot.color,
                      weight: isSelected ? 2 : 1,
                      fillColor: pot.color,
                      fillOpacity: isSelected ? 0.75 : 0.45
                    }}
                    eventHandlers={{
                      click: () => setSelectedBlock(blk)
                    }}
                  >
                    <Popup>
                      <div style={{ color: "#000", fontSize: "0.8rem" }}>
                        <b>{blk.block_id}</b><br />
                        Grade: <b>{grade.toFixed(1)}% Mn</b><br />
                        Status: <b>{pot.label}</b><br />
                        Depth: {blk.depth_below_surface || 30}m
                      </div>
                    </Popup>
                  </Rectangle>
                );
              })}

              {/* Render Boreholes */}
              {showDrillholes && drillholes.slice(0, 40).map((dh, dIdx) => (
                <CircleMarker
                  key={dIdx}
                  center={[dh.latitude || centerLat, dh.longitude || centerLon]}
                  radius={4}
                  pathOptions={{
                    color: "#ffffff",
                    fillColor: "#38bdf8",
                    fillOpacity: 0.9,
                    weight: 1.5
                  }}
                >
                  <Popup>
                    <div style={{ color: "#000", fontSize: "0.8rem" }}>
                      <b>Borehole {dh.hole_id}</b><br />
                      Assay: {dh.mn_grade}% Mn<br />
                      Depth: {dh.sample_depth}m
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
        </div>

        {/* Right: Block Inspector Panel */}
        <div style={{
          background: "#080e1b",
          border: "1px solid #1e2e4f",
          borderRadius: "10px",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
          overflowY: "auto"
        }}>
          <div style={{ borderBottom: "1px solid #1a2742", paddingBottom: "10px" }}>
            <span style={{ fontSize: "0.72rem", fontWeight: "800", color: "#64748b", textTransform: "uppercase" }}>
              Block Inspector
            </span>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "800", color: "#f8fafc", marginTop: "2px" }}>
              {selectedBlock?.block_id || "Select a Block"}
            </h3>
          </div>

          {selectedBlock ? (
            <>
              {/* Potential Badge */}
              {(() => {
                const g = parseFloat(selectedBlock.predicted_mn_grade || selectedBlock.mn_grade || 25.0);
                const pot = getBlockPotential(g);
                return (
                  <div style={{
                    background: `${pot.color}15`,
                    border: `1px solid ${pot.color}40`,
                    padding: "10px",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}>
                    <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: pot.color }}></div>
                    <span style={{ fontSize: "0.88rem", fontWeight: "800", color: pot.color }}>
                      {pot.label} ({g.toFixed(1)}% Mn)
                    </span>
                  </div>
                );
              })()}

              {/* Attributes Grid */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.8rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #142036", paddingBottom: "6px" }}>
                  <span style={{ color: "#64748b" }}>Coordinates (X, Y):</span>
                  <span style={{ color: "#f8fafc", fontWeight: "600" }}>{selectedBlock.x}m, {selectedBlock.y}m</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #142036", paddingBottom: "6px" }}>
                  <span style={{ color: "#64748b" }}>Z Elevation / Bench:</span>
                  <span style={{ color: "#f8fafc", fontWeight: "600" }}>{selectedBlock.z_elevation || 280}m MSL</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #142036", paddingBottom: "6px" }}>
                  <span style={{ color: "#64748b" }}>Depth Below Surface:</span>
                  <span style={{ color: "#f8fafc", fontWeight: "600" }}>{selectedBlock.depth_below_surface || 40}m</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #142036", paddingBottom: "6px" }}>
                  <span style={{ color: "#64748b" }}>AI Confidence Score:</span>
                  <span style={{ color: "#34d399", fontWeight: "700" }}>{((selectedBlock.confidence_score || 0.86) * 100).toFixed(0)}%</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #142036", paddingBottom: "6px" }}>
                  <span style={{ color: "#64748b" }}>Rock Density:</span>
                  <span style={{ color: "#cbd5e1" }}>{selectedBlock.rock_density_tpm3 || 3.45} t/m³</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #142036", paddingBottom: "6px" }}>
                  <span style={{ color: "#64748b" }}>Total Block Tonnage:</span>
                  <span style={{ color: "#60a5fa", fontWeight: "700" }}>
                    {selectedBlock.total_tonnage ? `${(selectedBlock.total_tonnage / 1000).toFixed(0)} kt` : "517 kt"}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #142036", paddingBottom: "6px" }}>
                  <span style={{ color: "#64748b" }}>Stripping Ratio:</span>
                  <span style={{ color: "#cbd5e1" }}>{selectedBlock.stripping_ratio || 1.85}:1</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #142036", paddingBottom: "6px" }}>
                  <span style={{ color: "#64748b" }}>UNFC Classification:</span>
                  <span style={{ color: "#c084fc", fontWeight: "600" }}>{selectedBlock.resource_classification || "111 (Measured)"}</span>
                </div>
              </div>

              {/* Extraction Recommendation */}
              <div style={{
                background: "#0b1426",
                border: "1px solid #1a2942",
                borderRadius: "8px",
                padding: "10px",
                fontSize: "0.74rem",
                color: "#94a3b8"
              }}>
                <b style={{ color: "#38bdf8" }}>Extraction Advice: </b>
                {parseFloat(selectedBlock.predicted_mn_grade || 25) >= 32.0
                  ? "Priority target for immediate bench stripping. Direct dispatch to ferro-manganese blend."
                  : "Suitable for blending buffer stockpiling or secondary processing."}
              </div>
            </>
          ) : (
            <p style={{ fontSize: "0.8rem", color: "#64748b" }}>Click any block on the map to inspect its parameters.</p>
          )}
        </div>
      </div>
    </div>
  );
};
