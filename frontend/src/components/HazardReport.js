import React, { useState } from "react";

const HazardReport = ({ caseId, onHazardReported }) => {

  const [username, setUsername] = useState("");
  const [type, setType] = useState("");
  const [severity, setSeverity] = useState("");
  const [description, setDescription] = useState("");

  const reportHazard = () => {

    // ✅ Proper Validation
    if (!username.trim()) {
      alert("Please enter username");
      return;
    }

    if (!type) {
      alert("Please select hazard type");
      return;
    }

    if (!severity) {
      alert("Please select severity level");
      return;
    }

    if (!description.trim()) {
      alert("Please describe the hazard");
      return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {

      const location = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      try {
        const response = await fetch("http://localhost:5000/api/hazards/report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            case_id: caseId,
            username,
            type,
            severity,
            description,
            location
          })
        });

        const data = await response.json();

        if (response.ok) {
          alert(`Hazard reported 🚨\nCase ID: ${data.case_id}`);

          // ✅ Send hazard info to SurvivalMode (for AI guidance)
          if (onHazardReported) {
            onHazardReported({ type, severity });
          }

          setDescription("");
        } else {
          alert(data.error || "Failed to report hazard");
        }

      } catch (error) {
        console.error(error);
        alert("Server error");
      }

    }, () => {
      alert("Location permission denied");
    });
  };

  return (
    <div style={{
      backgroundColor: "#1a1a1a",
      padding: "25px",
      borderRadius: "12px",
      marginTop: "20px",
      maxWidth: "500px",
      marginLeft: "auto",
      marginRight: "auto",
      color: "white"
    }}>

      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
        ⚠ Hazard Report
      </h2>

      {/* Username */}
      <label>👤 Username</label>
      <input
        type="text"
        placeholder="Enter username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        style={inputStyle}
      />

      {/* Hazard Type */}
      <label>🔥 Hazard Type</label>
      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        style={inputStyle}
      >
        <option value="">Select hazard</option>
        <option>Fire</option>
        <option>Flood</option>
        <option>Accident</option>
        <option>Earthquake</option>
        <option>Gas Leak</option>
        <option>Medical Emergency</option>
        <option>Trapped</option>
        <option>Kidnapped</option>
        <option>Lost Path</option>
        <option>Suspicious Activity</option>
        <option>Other</option>
      </select>

      {/* Severity */}
      <label>🚨 Severity Level</label>
      <select
        value={severity}
        onChange={(e) => setSeverity(e.target.value)}
        style={inputStyle}
      >
        <option value="">Select severity</option>
        <option>Low</option>
        <option>Medium</option>
        <option>High</option>
        <option>Critical</option>
      </select>

      {/* Description */}
      <label>📝 Description</label>
      <textarea
        placeholder="Describe the hazard..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        style={{
          ...inputStyle,
          height: "80px",
          resize: "none"
        }}
      />

      {/* Button */}
      <button
        onClick={reportHazard}
        style={{
          marginTop: "15px",
          width: "100%",
          padding: "12px",
          backgroundColor: "orange",
          border: "none",
          borderRadius: "8px",
          fontWeight: "bold",
          cursor: "pointer"
        }}
      >
        🚨 Submit Hazard
      </button>
    </div>
  );
};

const inputStyle = {
  width: "100%",
  padding: "10px",
  marginBottom: "12px",
  borderRadius: "6px",
  border: "none",
  marginTop: "5px"
};

export default HazardReport;