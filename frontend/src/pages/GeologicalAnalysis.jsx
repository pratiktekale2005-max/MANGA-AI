import React, { useState, useEffect } from "react";
import { useMine } from "../context/MineContext";
import { GeologyAPI } from "../services/api";
import { Layers, Activity, Search, MapPin, Eye, BarChart2 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

export const GeologicalAnalysis = () => {
  const { activeMine } = useMine();
  const [data, setData] = useState(null);
  const [selectedHole, setSelectedHole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchGeology = async () => {
      try {
        setLoading(true);
        const res = await GeologyAPI.getDrillholes();
        setData(res.data);
        if (res.data.drillholes?.length > 0) {
          setSelectedHole(res.data.drillholes[0]);
        }
      } catch (err) {
        console.error("Geology fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchGeology();
  }, [activeMine]);

  if (loading || !data) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
        <Activity size={32} className="animate-spin" style={{ margin: "0 auto 16px auto", color: "#3b82f6" }} />
        <p>Loading geological borehole logs and lithological intervals...</p>
      </div>
    );
  }

  const { drillholes, total_boreholes, total_intervals, average_mn_grade_pct } = data;
  const filteredHoles = drillholes.filter(h => h.hole_id.toLowerCase().includes(search.toLowerCase()));

  const chartIntervals = selectedHole?.intervals?.map(i => ({
    depth_interval: `${i.depth_from}-${i.depth_to}m`,
    mn_grade: i.mn_grade,
    fe_grade: i.fe_grade,
    sio2: i.sio2,
    density: i.density,
    lithology: i.lithology
  })) || [];

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
            Geological Borehole Logs & Lithological Stratigraphy
          </h1>
          <p style={{ fontSize: "0.82rem", color: "#94a3b8", marginTop: "4px" }}>
            3D Downhole core assays, interval thicknesses, and Mansar formation lithologies for {activeMine?.name}.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <span className="badge badge-info">{total_boreholes} Boreholes</span>
          <span className="badge badge-purple">{average_mn_grade_pct}% Avg Core Mn</span>
        </div>
      </div>

      {/* Main 2-Column Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: "20px" }}>
        {/* Left: Borehole List */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div className="card-header">
            <div className="card-title">
              <Layers size={18} color="#60a5fa" />
              <span>Boreholes Catalog</span>
            </div>
          </div>

          <div style={{ position: "relative" }}>
            <Search size={14} color="#64748b" style={{ position: "absolute", left: "10px", top: "10px" }} />
            <input
              type="text"
              placeholder="Search Hole ID..."
              className="form-input"
              style={{ paddingLeft: "30px", fontSize: "0.8rem" }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ maxHeight: "480px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px" }}>
            {filteredHoles.map((hole) => {
              const isSelected = selectedHole?.hole_id === hole.hole_id;
              const avgHoleGrade = hole.intervals?.length > 0
                ? (hole.intervals.reduce((a, b) => a + b.mn_grade, 0) / hole.intervals.length).toFixed(1)
                : "-";
              return (
                <div
                  key={hole.hole_id}
                  onClick={() => setSelectedHole(hole)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: "8px",
                    background: isSelected ? "linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(147, 51, 234, 0.15) 100%)" : "#0a1020",
                    border: isSelected ? "1px solid #3b82f6" : "1px solid #16243d",
                    cursor: "pointer",
                    transition: "all 0.15s ease"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <b style={{ color: isSelected ? "#93c5fd" : "#f1f5f9", fontSize: "0.85rem" }}>{hole.hole_id}</b>
                    <span className="badge badge-purple">{avgHoleGrade}% Mn</span>
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: "3px" }}>
                    Elev: {hole.collar_elevation}m • {hole.intervals?.length} Core Intervals
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Borehole Stratigraphical Analysis */}
        {selectedHole && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Borehole Header Card */}
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <div>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: "700", color: "#f8fafc" }}>
                    Borehole Profile: {selectedHole.hole_id}
                  </h3>
                  <p style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
                    Coordinates: Lat {selectedHole.latitude.toFixed(6)}, Lon {selectedHole.longitude.toFixed(6)} • Collar Elev: {selectedHole.collar_elevation}m ASL
                  </p>
                </div>
                <span className="badge badge-live">
                  Total Depth: {selectedHole.intervals?.[selectedHole.intervals.length - 1]?.depth_to || 120}m
                </span>
              </div>

              {/* Chemical Assay Bar Chart Downhole */}
              <div style={{ height: "260px", marginTop: "10px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartIntervals}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2e4f" />
                    <XAxis dataKey="depth_interval" stroke="#94a3b8" fontSize={10} />
                    <YAxis stroke="#94a3b8" fontSize={11} unit="%" />
                    <Tooltip
                      contentStyle={{ background: "#0f172a", border: "1px solid #1e2e4f", borderRadius: "8px", fontSize: "0.8rem" }}
                    />
                    <Legend wrapperStyle={{ fontSize: "0.78rem" }} />
                    <Bar dataKey="mn_grade" name="Manganese (Mn%)" fill="#a855f7" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="fe_grade" name="Iron (Fe%)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="sio2" name="Silica (SiO₂%)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Intervals Table */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Downhole Core Intervals & Geotechnical Data</span>
              </div>

              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Depth From</th>
                      <th>Depth To</th>
                      <th>Thickness</th>
                      <th>Lithology Classification</th>
                      <th>Mn Grade (%)</th>
                      <th>Fe Grade (%)</th>
                      <th>SiO₂ (%)</th>
                      <th>P Content (%)</th>
                      <th>Density (g/cm³)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedHole.intervals?.map((iv, idx) => (
                      <tr key={idx}>
                        <td className="mono">{iv.depth_from}m</td>
                        <td className="mono">{iv.depth_to}m</td>
                        <td className="mono">{iv.thickness}m</td>
                        <td style={{ color: iv.lithology.includes("Braunite") ? "#c084fc" : "#cbd5e1", fontWeight: "600" }}>
                          {iv.lithology}
                        </td>
                        <td className="mono" style={{ fontWeight: "700", color: iv.mn_grade >= 38 ? "#c084fc" : (iv.mn_grade >= 25 ? "#60a5fa" : "#f59e0b") }}>
                          {iv.mn_grade}%
                        </td>
                        <td className="mono">{iv.fe_grade}%</td>
                        <td className="mono">{iv.sio2}%</td>
                        <td className="mono">{iv.p_content}</td>
                        <td className="mono">{iv.density}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
