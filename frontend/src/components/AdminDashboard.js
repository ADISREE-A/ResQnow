import React, { useEffect, useState } from "react";

const AdminDashboard = () => {

  const [hazards, setHazards] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState("ALL");
  const [selectedCase, setSelectedCase] = useState(null);

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
    backgroundColor: "#111",
    padding: "30px",
    borderRadius: "12px",
    width: "500px",
    maxHeight: "80vh",
    overflowY: "auto",
    color: "white",
    boxShadow: "0 0 25px rgba(0,0,0,0.6)"
  };

  const closeButtonStyle = {
    marginTop: "20px",
    padding: "10px 20px",
    backgroundColor: "#333",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer"
  };

  return (
    <div style={{ marginTop: "20px", padding: "20px", color: "white" }}>

      <h2>📊 Hazard Statistics</h2>

      {/* ===============================
           SUMMARY CARDS
      ================================= */}
      <div
        style={{
          display: "flex",
          gap: "20px",
          marginBottom: "30px"
        }}
      >
        {/* Total */}
        <div
          onClick={() => setSelectedFilter("ALL")}
          style={{
            flex: 1,
            background: selectedFilter === "ALL" ? "#444" : "#222",
            padding: "20px",
            borderRadius: "10px",
            textAlign: "center",
            cursor: "pointer"
          }}
        >
          <h3>Total Cases</h3>
          <h1 style={{ color: "#4da6ff" }}>{total}</h1>
        </div>

        {/* Open */}
        <div
          onClick={() => setSelectedFilter("OPEN")}
          style={{
            flex: 1,
            background: selectedFilter === "OPEN" ? "#555" : "#333",
            padding: "20px",
            borderRadius: "10px",
            textAlign: "center",
            cursor: "pointer"
          }}
        >
          <h3>Open Cases</h3>
          <h1 style={{ color: "#ff9933" }}>{open}</h1>
        </div>

        {/* Critical */}
        <div
          onClick={() => setSelectedFilter("CRITICAL")}
          style={{
            flex: 1,
            background: selectedFilter === "CRITICAL" ? "#990000" : "#5c0000",
            padding: "20px",
            borderRadius: "10px",
            textAlign: "center",
            cursor: "pointer"
          }}
        >
          <h3>Critical Cases</h3>
          <h1 style={{ color: "red" }}>{critical}</h1>
        </div>
      </div>

      {/* ===============================
           CASE LIST
      ================================= */}
      <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        {filteredHazards.map((hazard) => (
          <div
            key={hazard.case_id}
            style={{
              background: "#1a1a1a",
              padding: "15px",
              borderRadius: "8px",
              borderLeft:
                hazard.status === "Closed"
                  ? "5px solid green"
                  : hazard.risk_level === "Critical"
                  ? "5px solid red"
                  : "5px solid gray"
            }}
          >
            <strong
              style={{ cursor: "pointer", color: "#4da6ff" }}
              onClick={() => setSelectedCase(hazard)}
            >
              {hazard.case_id}
            </strong>

            <p>Status: {hazard.status}</p>
            <p>Severity: {hazard.severity}</p>
            <p>Risk Level: {hazard.risk_level || "N/A"}</p>
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
            <h2>📄 Case Details</h2>

            <p><strong>Case ID:</strong> {selectedCase.case_id}</p>
            <p><strong>Username:</strong> {selectedCase.username}</p>
            <p><strong>Type:</strong> {selectedCase.type}</p>
            <p><strong>Description:</strong> {selectedCase.description}</p>

            {/* STATUS DROPDOWN */}
            <div style={{ marginTop: "10px" }}>
              <strong>Status:</strong>
              <select
                value={selectedCase.status}
                onChange={(e) => updateStatus(e.target.value)}
                style={{
                  marginLeft: "10px",
                  padding: "6px",
                  borderRadius: "5px",
                  background: "#222",
                  color: "white",
                  border: "1px solid #555"
                }}
              >
                <option value="Open">Open</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            <p><strong>User Severity:</strong> {selectedCase.severity}</p>
            <p><strong>Auto Severity:</strong> {selectedCase.auto_severity}</p>
            <p><strong>Risk Score:</strong> {selectedCase.risk_score}</p>
            <p><strong>Risk Level:</strong> {selectedCase.risk_level}</p>
            <p><strong>Confidence:</strong> {selectedCase.confidence}%</p>
            <p><strong>Location:</strong> {selectedCase.latitude}, {selectedCase.longitude}</p>
            <p><strong>Created At:</strong> {selectedCase.created_at}</p>

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