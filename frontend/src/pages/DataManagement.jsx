import React, { useState, useEffect } from "react";
import { useMine } from "../context/MineContext";
import { DataAPI } from "../services/api";
import {
  UploadCloud,
  FileCheck,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Database,
  Table,
  Search
} from "lucide-react";

export const DataManagement = () => {
  const { isSynthetic, resetDemoData, refreshData, showToast } = useMine();
  const [datasetKey, setDatasetKey] = useState("drillholes");
  const [preview, setPreview] = useState({ columns: [], sample_data: [], total_rows: 0 });
  const [loading, setLoading] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadType, setUploadType] = useState("drillholes");
  const [uploadResult, setUploadResult] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchPreview = async (key) => {
    try {
      setLoading(true);
      const res = await DataAPI.getPreview(key, 25);
      setPreview(res.data);
    } catch (err) {
      console.error("Preview fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreview(datasetKey);
  }, [datasetKey]);

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      showToast("Please select a CSV or Excel file to upload.", "danger");
      return;
    }

    const formData = new FormData();
    formData.append("file", uploadFile);
    formData.append("dataset_type", uploadType);

    try {
      setLoading(true);
      const res = await DataAPI.uploadDataset(formData);
      setUploadResult(res.data);
      showToast(`Successfully uploaded ${res.data.filename} (${res.data.rows_processed} rows)!`, "live");
      await refreshData();
      await fetchPreview(datasetKey);
    } catch (err) {
      console.error("Upload error:", err);
      showToast("Failed to upload dataset: " + (err.response?.data?.detail || err.message), "danger");
    } finally {
      setLoading(false);
    }
  };

  const filteredRows = preview.sample_data?.filter((row) =>
    Object.values(row).some((val) =>
      String(val).toLowerCase().includes(searchQuery.toLowerCase())
    )
  ) || [];

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
            Data Ingestion & Dataset Validation Wizard
          </h1>
          <p style={{ fontSize: "0.82rem", color: "#94a3b8", marginTop: "4px" }}>
            Upload raw mining logs or inspect pre-calibrated Sausar Group synthetic demo datasets.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button className="btn btn-secondary btn-sm" onClick={resetDemoData}>
            <RotateCcw size={14} />
            Reset to Demo Baseline
          </button>
        </div>
      </div>

      {/* Upload Wizard & Quality Score Grid */}
      <div className="grid-2">
        {/* Upload Form Card */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <UploadCloud size={18} color="#38bdf8" />
              <span>Upload Mine Dataset (CSV / Excel)</span>
            </div>
            <span className="badge badge-info">Real or Prototype</span>
          </div>

          <form onSubmit={handleUploadSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div className="form-group">
              <label className="form-label">Select Dataset Domain:</label>
              <select
                className="form-select"
                value={uploadType}
                onChange={(e) => setUploadType(e.target.value)}
              >
                <option value="drillholes">Geological Boreholes & Core Assays (Mn%, Fe%, SiO2%)</option>
                <option value="production">Monthly Production History & Working Hours</option>
                <option value="equipment">Equipment Fleet Performance & Maintenance Logs</option>
                <option value="satellite">Sentinel-2 Multi-Spectral Reflectance Grids</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Choose CSV / Excel File:</label>
              <input
                type="file"
                accept=".csv, .xlsx, .xls"
                className="form-input"
                onChange={(e) => setUploadFile(e.target.files[0])}
                style={{ padding: "8px" }}
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading || !uploadFile}>
              <FileCheck size={16} />
              Validate & Ingest Dataset
            </button>
          </form>

          {/* Validation Result Box */}
          {uploadResult && (
            <div style={{
              marginTop: "16px",
              padding: "14px",
              background: "#080e1b",
              borderRadius: "8px",
              border: "1px solid #16243d"
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "0.84rem", fontWeight: "700", color: "#34d399", display: "flex", alignItems: "center", gap: "6px" }}>
                  <CheckCircle2 size={16} color="#34d399" />
                  Dataset Verified & Ingested
                </span>
                <span className="badge badge-live">
                  Quality Score: {uploadResult.validation_report?.quality_score || 95}/100
                </span>
              </div>
              <p style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
                {uploadResult.rows_processed} rows processed • File: {uploadResult.filename}
              </p>
            </div>
          )}
        </div>

        {/* Dataset Schema & Data Quality Standards Card */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Database size={18} color="#a855f7" />
              <span>Active Dataset Profiles & Standards</span>
            </div>
            <span className="badge badge-purple">UNFC Compliant</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "0.8rem", color: "#cbd5e1" }}>
            <div style={{ background: "#0b1222", padding: "12px", borderRadius: "8px", border: "1px solid #152238" }}>
              <b style={{ color: "#38bdf8" }}>Geological Assays Standard:</b>
              <p style={{ fontSize: "0.76rem", color: "#94a3b8", marginTop: "2px" }}>
                Required: <code>hole_id, depth_from, depth_to, mn_grade</code> • Optional: <code>lithology, density, fe_grade, sio2, p_content</code>.
              </p>
            </div>

            <div style={{ background: "#0b1222", padding: "12px", borderRadius: "8px", border: "1px solid #152238" }}>
              <b style={{ color: "#34d399" }}>Production History Standard:</b>
              <p style={{ fontSize: "0.76rem", color: "#94a3b8", marginTop: "2px" }}>
                Required: <code>date, actual_ore_tonnes</code> • Optional: <code>target_ore_tonnes, actual_mn_grade, operating_hours, downtime_hours</code>.
              </p>
            </div>

            <div style={{ background: "#0b1222", padding: "12px", borderRadius: "8px", border: "1px solid #152238" }}>
              <b style={{ color: "#f59e0b" }}>Equipment Fleet Standard:</b>
              <p style={{ fontSize: "0.76rem", color: "#94a3b8", marginTop: "2px" }}>
                Required: <code>equipment_id, availability_pct, health_score</code> • Optional: <code>mtbf_hours, mttr_hours, hourly_capacity_tph</code>.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Dataset Preview Table */}
      <div className="card">
        <div className="card-header" style={{ flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Table size={18} color="#60a5fa" />
            <span className="card-title">Live In-Memory Dataset Inspection</span>
            <span className="badge badge-info">{preview.total_rows} Total Records</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* Domain Switcher */}
            <div style={{ display: "flex", gap: "4px", background: "#080e1b", padding: "3px", borderRadius: "8px", border: "1px solid #1a2742" }}>
              {["drillholes", "production", "equipment", "blocks", "satellite"].map((key) => (
                <button
                  key={key}
                  onClick={() => setDatasetKey(key)}
                  style={{
                    padding: "5px 10px",
                    borderRadius: "6px",
                    border: "none",
                    background: datasetKey === key ? "#2563eb" : "transparent",
                    color: datasetKey === key ? "#fff" : "#94a3b8",
                    fontSize: "0.76rem",
                    fontWeight: "600",
                    cursor: "pointer",
                    textTransform: "capitalize"
                  }}
                >
                  {key}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div style={{ position: "relative" }}>
              <Search size={14} color="#64748b" style={{ position: "absolute", left: "10px", top: "10px" }} />
              <input
                type="text"
                placeholder="Filter rows..."
                className="form-input"
                style={{ paddingLeft: "30px", width: "160px", fontSize: "0.8rem", padding: "6px 10px 6px 30px" }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="data-table-wrapper" style={{ maxHeight: "360px" }}>
          <table className="data-table">
            <thead>
              <tr>
                {preview.columns?.map((col) => (
                  <th key={col}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.length > 0 ? (
                filteredRows.map((row, rIdx) => (
                  <tr key={rIdx}>
                    {preview.columns?.map((col) => (
                      <td key={col}>
                        {typeof row[col] === "number" ? Number(row[col]).toFixed(2) : String(row[col] ?? "-")}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={preview.columns?.length || 1} style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
                    No records found matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
