import React, { useState } from "react";

const HazardReport = () => {
  const [type, setType] = useState("Fire");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const reportHazard = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };

          const response = await fetch("http://localhost:5000/api/hazards/report", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type,
              description,
              location
            })
          });

          const data = await response.json();

          if (response.ok) {
            alert("Hazard reported successfully 🚨");
            setDescription("");
          } else {
            alert(data.message || "Failed to report hazard");
          }

        } catch (error) {
          console.error("Error:", error);
          alert("Server error. Please try again.");
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        alert("Location permission denied");
        setLoading(false);
      }
    );
  };

  return (
    <div style={{
      backgroundColor: "#1a1a1a",
      padding: "20px",
      borderRadius: "10px",
      marginTop: "20px"
    }}>
      <h2>⚠ Report Hazard</h2>

      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        style={{ padding: "8px", marginBottom: "10px", width: "100%" }}
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
        <option>Building Collapse</option>
        <option>Wild Animal Threat</option>
        <option>Other</option>
      </select>

      <textarea
        placeholder="Describe the hazard..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        style={{
          width: "100%",
          padding: "10px",
          marginBottom: "10px"
        }}
      />

      <button
        onClick={reportHazard}
        disabled={loading}
        style={{
          padding: "10px 20px",
          backgroundColor: loading ? "gray" : "orange",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer"
        }}
      >
        {loading ? "Reporting..." : "🚨 Report"}
      </button>
    </div>
  );
};

export default HazardReport;