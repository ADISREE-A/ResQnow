import React, { useState } from "react";

const HazardReport = () => {

  const [username, setUsername] = useState("Adi"); // Later make dynamic
  const [type, setType] = useState("Fire");
  const [severity, setSeverity] = useState("Medium");
  const [description, setDescription] = useState("");

  const reportHazard = () => {

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
            username,
            type,
            severity,
            description,
            location
          })
        });

        if (response.ok) {
          alert("Hazard reported successfully 🚨");
          setDescription("");
        } else {
          alert("Failed to report hazard");
        }
      } catch (error) {
        alert("Server error");
      }

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