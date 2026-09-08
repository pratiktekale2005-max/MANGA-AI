import React, { useState, useEffect } from "react";
import { useMine } from "../context/MineContext";
import { GeologyAPI, SatelliteAPI, SpatialAPI, ExplorationAPI, ReserveAPI } from "../services/api";
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, Rectangle, LayerGroup, LayersControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { MAP_TILE_PROVIDERS } from "../utils/mapTiles";
import { Map as MapIcon, Layers, Target, Eye, EyeOff, Info, Compass } from "lucide-react";
import L from "leaflet";

// Custom Leaflet target icon
const targetIcon = L.divIcon({
  className: "custom-target-marker",
  html: `<div style="background:#ef4444; width:18px; height:18px; border-radius:50%; border:3px solid #ffffff; box-shadow:0 0 10px #ef4444; display:flex; align-items:center; justify-content:center;">
          <div style="width:4px; height:4px; background:#fff; border-radius:50%;"></div>
         </div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9]
});

export const MineMap = () => {
  const { activeMine } = useMine();
  const [drillholes, setDrillholes] = useState([]);
  const [satPixels, setSatPixels] = useState([]);
  const [targets, setTargets] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [basemapMode, setBasemapMode] = useState("satellite");

  // Layer Visibility Toggles
  const [showDrillholes, setShowDrillholes] = useState(true);
  const [showSatellitePotential, setShowSatellitePotential] = useState(true);
  const [showTargets, setShowTargets] = useState(true);
  const [showBlocks, setShowBlocks] = useState(true);
  const [showBoundary, setShowBoundary] = useState(true);

  const centerLat = activeMine?.center_lat || 21.5478;
  const centerLon = activeMine?.center_lon || 79.7042;

  useEffect(() => {
    const fetchMapData = async () => {
      try {
        setLoading(true);
        const [dhRes, satRes, tgtRes, blkRes] = await Promise.all([
          GeologyAPI.getDrillholes(),
          SatelliteAPI.getIndices(),
          ExplorationAPI.prioritizeTargets(6),
          ReserveAPI.getBlocks(150)
        ]);

        setDrillholes(dhRes.data.drillholes || []);
        setSatPixels(satRes.data.spectral_pixels || []);
        setTargets(tgtRes.data.top_recommended_targets || []);
        setBlocks(blkRes.data.blocks || []);
      } catch (err) {
        console.error("Map data fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMapData();
  }, [activeMine]);

  const getGradeColor = (grade) => {
    if (grade >= 40.0) return "#9333ea"; // Premium Braunite Purple
    if (grade >= 32.0) return "#2563eb"; // High Grade Blue
    if (grade >= 22.0) return "#059669"; // Medium Grade Emerald
    if (grade >= 12.0) return "#f59e0b"; // Low Grade Gondite Amber
    return "#64748b"; // Country rock slate
  };

  const getSatColor = (score) => {
    if (score >= 72.0) return "#ef4444"; // High Alteration Red
    if (score >= 45.0) return "#f59e0b"; // Medium Alteration Amber
    return "#10b981"; // Low Alteration Green
  };

  return (
    <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px", height: "calc(100vh - 80px)" }}>
      {/* Top Controls Bar */}
      <div style={{
        background: "#0d1527",
        border: "1px solid #1e2e4f",
        borderRadius: "10px",
        padding: "12px 18px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "12px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <MapIcon size={20} color="#60a5fa" />
          <span style={{ fontWeight: "700", color: "#f8fafc", fontSize: "0.95rem" }}>
            {activeMine?.name} GIS Spatial Exploration & Reserve Map
          </span>
          <span className="badge badge-info">{drillholes.length} Boreholes</span>
          <span className="badge badge-purple">{targets.length} Exploration Targets</span>
        </div>

        {/* Layer Toggles */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.78rem", color: "#cbd5e1", cursor: "pointer" }}>
            <input type="checkbox" checked={showBoundary} onChange={(e) => setShowBoundary(e.target.checked)} />
            Mine Boundary
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.78rem", color: "#cbd5e1", cursor: "pointer" }}>
            <input type="checkbox" checked={showDrillholes} onChange={(e) => setShowDrillholes(e.target.checked)} />
            Drillhole Assays
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.78rem", color: "#cbd5e1", cursor: "pointer" }}>
            <input type="checkbox" checked={showSatellitePotential} onChange={(e) => setShowSatellitePotential(e.target.checked)} />
            Satellite Alteration Grid
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.78rem", color: "#cbd5e1", cursor: "pointer" }}>
            <input type="checkbox" checked={showTargets} onChange={(e) => setShowTargets(e.target.checked)} />
            Exploration Drill Targets
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.78rem", color: "#cbd5e1", cursor: "pointer" }}>
            <input type="checkbox" checked={showBlocks} onChange={(e) => setShowBlocks(e.target.checked)} />
            3D Reserve Blocks
          </label>

          {/* Watermark-Free Basemap Switcher */}
          <div style={{ display: "flex", background: "#0b1329", padding: "2px", borderRadius: "6px", border: "1px solid #1e2e4f", marginLeft: "10px" }}>
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
      </div>

      {/* Main Map Container */}
      <div style={{ flex: 1, position: "relative", borderRadius: "12px", overflow: "hidden", border: "1px solid #1e2e4f" }}>
        <MapContainer
          key={`${centerLat}-${centerLon}`}
          center={[centerLat, centerLon]}
          zoom={14}
          style={{ height: "100%", width: "100%" }}
        >
          {/* Base Map Tile */}
          <TileLayer
            key={basemapMode}
            attribution={MAP_TILE_PROVIDERS[basemapMode].attribution}
            url={MAP_TILE_PROVIDERS[basemapMode].url}
          />

          {/* Mine Lease Boundary Box */}
          {showBoundary && (
            <Rectangle
              bounds={[
                [centerLat - 0.012, centerLon - 0.012],
                [centerLat + 0.012, centerLon + 0.012]
              ]}
              pathOptions={{ color: "#3b82f6", weight: 2, dashArray: "6, 6", fillOpacity: 0.03 }}
            >
              <Popup>
                <b>{activeMine?.name} Statutory Lease Perimeter</b><br />
                Area: ~2.5 km &times; 2.5 km<br />
                Formation: {activeMine?.formation}
              </Popup>
            </Rectangle>
          )}

          {/* Satellite Alteration Potential Raster Pixels */}
          {showSatellitePotential && satPixels.map((px, idx) => (
            <CircleMarker
              key={`sat-${idx}`}
              center={[px.latitude, px.longitude]}
              radius={7}
              pathOptions={{
                color: "transparent",
                fillColor: getSatColor(px.exploration_potential_score),
                fillOpacity: px.exploration_potential_score > 70 ? 0.65 : (px.exploration_potential_score > 45 ? 0.35 : 0.15)
              }}
            >
              <Popup>
                <b>Sentinel-2 Alteration Pixel</b><br />
                Iron Oxide Index: {px.iron_oxide_index}<br />
                Clay Mineral Index: {px.clay_mineral_index}<br />
                NDVI (Vegetation): {px.NDVI}<br />
                Exploration Score: <b>{px.exploration_potential_score}%</b><br />
                Zone: {px.potential_class}
              </Popup>
            </CircleMarker>
          ))}

          {/* 3D Voxel Reserve Blocks */}
          {showBlocks && blocks.map((blk, idx) => (
            <Rectangle
              key={`blk-${idx}`}
              bounds={[
                [blk.latitude - 0.0004, blk.longitude - 0.0004],
                [blk.latitude + 0.0004, blk.longitude + 0.0004]
              ]}
              pathOptions={{
                color: "#1e2e4f",
                weight: 1,
                fillColor: getGradeColor(blk.predicted_mn_grade || 25),
                fillOpacity: 0.45
              }}
            >
              <Popup>
                <b>Block ID: {blk.block_id}</b><br />
                Depth: {blk.depth_below_surface}m (Elev: {blk.z_elevation}m)<br />
                Predicted Grade: <b>{blk.predicted_mn_grade}% Mn</b><br />
                Tonnage: {blk.total_tonnage?.toLocaleString()} t<br />
                Contained Mn: {blk.contained_mn_tonnes?.toLocaleString()} t<br />
                Classification: {blk.resource_classification}
              </Popup>
            </Rectangle>
          ))}

          {/* Drillhole Assays */}
          {showDrillholes && drillholes.map((dh) => {
            const avgGrade = dh.intervals?.length > 0
              ? (dh.intervals.reduce((acc, i) => acc + i.mn_grade, 0) / dh.intervals.length)
              : 25.0;
            return (
              <CircleMarker
                key={dh.hole_id}
                center={[dh.latitude, dh.longitude]}
                radius={6}
                pathOptions={{
                  color: "#ffffff",
                  weight: 1.5,
                  fillColor: getGradeColor(avgGrade),
                  fillOpacity: 0.95
                }}
              >
                <Popup>
                  <div style={{ fontSize: "0.82rem" }}>
                    <b style={{ color: "#38bdf8" }}>{dh.hole_id}</b><br />
                    Collar Elevation: {dh.collar_elevation}m ASL<br />
                    Intervals Sampled: {dh.intervals?.length}<br />
                    Average Mn Grade: <b style={{ color: getGradeColor(avgGrade) }}>{avgGrade.toFixed(1)}% Mn</b><br />
                    Top Lithology: {dh.intervals?.[0]?.lithology || "Gondite"}
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

          {/* Prioritized AI Exploration Targets */}
          {showTargets && targets.map((tgt) => (
            <Marker
              key={tgt.target_id}
              position={[tgt.latitude, tgt.longitude]}
              icon={targetIcon}
            >
              <Popup>
                <div style={{ fontSize: "0.82rem" }}>
                  <b style={{ color: "#ef4444" }}>AI Target: {tgt.target_id}</b><br />
                  Priority Score: <b style={{ color: "#ef4444" }}>{tgt.priority_score}% ({tgt.priority_class})</b><br />
                  Recommended Depth: {tgt.recommended_hole_depth_m}m at {tgt.recommended_dip_angle}&deg; dip<br />
                  Target Horizon: {tgt.target_lithology}<br />
                  <p style={{ marginTop: "4px", fontSize: "0.74rem", color: "#94a3b8" }}>
                    {tgt.geological_rationale}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Interactive Floating Legend */}
        <div style={{
          position: "absolute",
          bottom: "20px",
          right: "20px",
          background: "rgba(13, 21, 39, 0.92)",
          backdropFilter: "blur(6px)",
          border: "1px solid #1e2e4f",
          borderRadius: "10px",
          padding: "12px 16px",
          zIndex: 1000,
          fontSize: "0.78rem",
          color: "#cbd5e1",
          boxShadow: "0 8px 30px rgba(0,0,0,0.6)"
        }}>
          <div style={{ fontWeight: "700", marginBottom: "8px", color: "#f8fafc", display: "flex", alignItems: "center", gap: "6px" }}>
            <Compass size={14} color="#60a5fa" />
            <span>GIS Map Legend</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#9333ea" }}></span>
              <span>Premium Braunite Ore (&ge; 40% Mn)</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#2563eb" }}></span>
              <span>High Grade Ore (32 - 40% Mn)</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#059669" }}></span>
              <span>Medium Grade Gondite (22 - 32% Mn)</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#f59e0b" }}></span>
              <span>Low Grade / Quartzite (&lt; 22% Mn)</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px", borderTop: "1px solid #1e2e4f", paddingTop: "4px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ef4444", border: "1px solid #fff" }}></span>
              <span>AI Prioritized Drilling Target</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
