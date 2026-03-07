import React, { useEffect, useState } from "react";
import DangerZoneMap from "./DangerZoneMap";

const AdminDashboard = ({ darkMode = true }) => {

  const [hazards, setHazards] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState("ALL");
  const [selectedCase, setSelectedCase] = useState(null);

  // Dynamic theme colors
  const theme = {
    bg: darkMode ? "#0d0d0d" : "#f5f5f5",
    cardBg: darkMode ? "#222" : "#fff",
    cardBgSelected: darkMode ? "#444" : "#e0e0e0",
    text: darkMode ? "white" : "#333",
    textSecondary: darkMode ? "#aaa" : "#666",
    border: darkMode ? "#333" : "#ddd",
    accent: darkMode ? "#4da6ff" : "#2196F3",
    success: "#00cc00",
    warning: "#ff9933",
    danger: "red",
    dangerBg: darkMode ? "#5c0000" : "#ffcccc",
    dangerSelected: darkMode ? "#990000" : "#ff6666"
  };

  /* ===============================
     FETCH ALL HAZARDS
  ================================= */
  useEffect(() => {
    fetch("http://localhost:5000/api/hazards/all")
      .then(res => res.json())
      .then(data => setHazards(data))
      .catch(err => console.error(err));
  }, []);

  /* ===============================
     CALCULATIONS
  ================================= */
  const total = hazards.length;
  const open = hazards.filter(h => h.status === "Open").length;
  const critical = hazards.filter(
    h => h.risk_level === "Critical" || h.severity === "Critical"
  ).length;

  /* ===============================
     FILTERING
  ================================= */
  const filteredHazards = hazards.filter(hazard => {
    if (selectedFilter === "ALL") return true;
    if (selectedFilter === "OPEN") return hazard.status === "Open";
    if (selectedFilter === "CRITICAL")
      return hazard.risk_level === "Critical" || hazard.severity === "Critical";
    return true;
  });

  /* ===============================
     UPDATE STATUS
  ================================= */
  const updateStatus = async (newStatus) => {
    try {
      await fetch(
        `http://localhost:5000/api/hazards/update-status/${selectedCase.case_id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus })
        }
      );

      // Update list instantly
      setHazards(prev =>
        prev.map(h =>
          h.case_id === selectedCase.case_id
            ? { ...h, status: newStatus }
            : h
        )
      );

      // Update modal instantly
      setSelectedCase(prev => ({ ...prev, status: newStatus }));

    } catch (err) {
      console.error("Update failed", err);
    }
  };

  /* ===============================
     STYLES
  ================================= */
  const overlayStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999
  };

  const modalStyle = {
    backgroundColor: darkMode ? "#111" : "#fff",
    padding: "30px",
    borderRadius: "12px",
    width: "500px",
    maxHeight: "80vh",
    overflowY: "auto",
    color: darkMode ? "white" : "#333",
    boxShadow: "0 0 25px rgba(0,0,0,0.6)"
  };

  const closeButtonStyle = {
    marginTop: "20px",
    padding: "10px 20px",
    backgroundColor: darkMode ? "#333" : "#ddd",
    color: darkMode ? "white" : "#333",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer"
  };

  return (
    <div style={{ marginTop: "20px", padding: "20px", color: theme.text }}>

      <h2>📊 Hazard Statistics</h2>

      {/* ===============================
           SUMMARY CARDS
      ================================= */}
      <div
        style={{
          display: "flex",
          gap: "20px",
          marginBottom: "30px",
          flexWrap: "wrap"
        }}
      >
        {/* Total */}
        <div
          onClick={() => setSelectedFilter("ALL")}
          style={{
            flex: 1,
            minWidth: "150px",
            background: selectedFilter === "ALL" ? theme.cardBgSelected : theme.cardBg,
            padding: "20px",
            borderRadius: "10px",
            textAlign: "center",
            cursor: "pointer",
            border: `1px solid ${theme.border}`,
            transition: "all 0.3s ease"
          }}
        >
          <h3 style={{ color: theme.textSecondary }}>Total Cases</h3>
          <h1 style={{ color: theme.accent }}>{total}</h1>
        </div>

        {/* Open */}
        <div
          onClick={() => setSelectedFilter("OPEN")}
          style={{
            flex: 1,
            minWidth: "150px",
            background: selectedFilter === "OPEN" ? theme.cardBgSelected : theme.cardBg,
            padding: "20px",
            borderRadius: "10px",
            textAlign: "center",
            cursor: "pointer",
            border: `1px solid ${theme.border}`,
            transition: "all 0.3s ease"
          }}
        >
          <h3 style={{ color: theme.textSecondary }}>Open Cases</h3>
          <h1 style={{ color: theme.warning }}>{open}</h1>
        </div>

        {/* Critical */}
        <div
          onClick={() => setSelectedFilter("CRITICAL")}
          style={{
            flex: 1,
            minWidth: "150px",
            background: selectedFilter === "CRITICAL" ? theme.dangerSelected : theme.dangerBg,
            padding: "20px",
            borderRadius: "10px",
            textAlign: "center",
            cursor: "pointer",
            border: `1px solid ${theme.danger}`,
            transition: "all 0.3s ease"
          }}
        >
          <h3 style={{ color: theme.text }}>Critical Cases</h3>
          <h1 style={{ color: theme.danger }}>{critical}</h1>
        </div>
      </div>

      {/* ===============================
           DANGER ZONE HEATMAP
      ================================= */}
      <div style={{ marginBottom: "30px" }}>
        <h2 style={{ marginBottom: "15px", color: theme.text }}>🔥 Danger Zone Heatmap</h2>
        <DangerZoneMap height="400px" showLegend={true} darkMode={darkMode} />
      </div>

      {/* ===============================
           CASE LIST
      ================================= */}
      <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        {filteredHazards.map((hazard) => (
          <div
            key={hazard.case_id}
            style={{
              background: theme.cardBg,
              padding: "15px",
              borderRadius: "8px",
              borderLeft:
                hazard.status === "Closed"
                  ? `5px solid ${theme.success}`
                  : hazard.risk_level === "Critical"
                  ? `5px solid ${theme.danger}`
                  : `5px solid ${theme.border}`,
              border: `1px solid ${theme.border}`,
              transition: "all 0.3s ease"
            }}
          >
            <strong
              style={{ cursor: "pointer", color: theme.accent }}
              onClick={() => setSelectedCase(hazard)}
            >
              {hazard.case_id}
            </strong>

            <p style={{ color: theme.textSecondary }}>Status: {hazard.status}</p>
            <p style={{ color: theme.textSecondary }}>Severity: {hazard.severity}</p>
            <p style={{ color: theme.textSecondary }}>Risk Level: {hazard.risk_level || "N/A"}</p>
          </div>
        ))}
      </div>

      {/* ===============================
           FLOATING CASE DETAILS MODAL
      ================================= */}
      {selectedCase && (
        <div style={overlayStyle} onClick={() => setSelectedCase(null)}>
          <div
            style={modalStyle}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ color: theme.text }}>📄 Case Details</h2>

            <p><strong style={{ color: theme.text }}>Case ID:</strong> {selectedCase.case_id}</p>
            <p><strong style={{ color: theme.text }}>Username:</strong> {selectedCase.username}</p>
            <p><strong style={{ color: theme.text }}>Type:</strong> {selectedCase.type}</p>
            <p><strong style={{ color: theme.text }}>Description:</strong> {selectedCase.description}</p>

            {/* STATUS DROPDOWN */}
            <div style={{ marginTop: "10px" }}>
              <strong style={{ color: theme.text }}>Status:</strong>
              <select
                value={selectedCase.status}
                onChange={(e) => updateStatus(e.target.value)}
                style={{
                  marginLeft: "10px",
                  padding: "6px",
                  borderRadius: "5px",
                  background: theme.cardBg,
                  color: theme.text,
                  border: `1px solid ${theme.border}`
                }}
              >
                <option value="Open">Open</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            <p><strong style={{ color: theme.text }}>User Severity:</strong> {selectedCase.severity}</p>
            <p><strong style={{ color: theme.text }}>Auto Severity:</strong> {selectedCase.auto_severity}</p>
            <p><strong style={{ color: theme.text }}>Risk Score:</strong> {selectedCase.risk_score}</p>
            <p><strong style={{ color: theme.text }}>Risk Level:</strong> {selectedCase.risk_level}</p>
            <p><strong style={{ color: theme.text }}>Confidence:</strong> {selectedCase.confidence}%</p>
            <p><strong style={{ color: theme.text }}>Location:</strong> {selectedCase.latitude}, {selectedCase.longitude}</p>
            <p><strong style={{ color: theme.text }}>Created At:</strong> {selectedCase.created_at}</p>

            <button
              style={closeButtonStyle}
              onClick={() => setSelectedCase(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;

