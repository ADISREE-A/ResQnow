import React, { useEffect, useState } from "react";

const HazardHistory = () => {

  const [hazards, setHazards] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/hazards/all")
      .then(res => res.json())
      .then(data => setHazards(data));
  }, []);

  return (
    <div style={{ marginTop: "20px" }}>
      <h2>📜 Emergency History</h2>

      {hazards.map(h => (
        <div key={h.id} style={{
          padding: "10px",
          marginBottom: "10px",
          backgroundColor:
            h.severity === "Critical" ? "#5c0000" :
            h.severity === "High" ? "#4d2600" :
            "#222"
        }}>
          <strong>{h.username}</strong>  
          <div>Type: {h.type}</div>
          <div>Severity: {h.severity}</div>
          <div>Status: {h.status}</div>
          <div>{h.description}</div>
          <div>{new Date(h.created_at).toLocaleString()}</div>
        </div>
      ))}
    </div>
  );
};

export default HazardHistory;