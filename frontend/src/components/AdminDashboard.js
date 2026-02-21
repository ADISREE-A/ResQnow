import React, { useEffect, useState } from "react";

const AdminDashboard = () => {

  const [hazards, setHazards] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/hazards/all")
      .then(res => res.json())
      .then(data => setHazards(data));
  }, []);

  const total = hazards.length;
  const open = hazards.filter(h => h.status === "Open").length;
  const critical = hazards.filter(h => h.severity === "Critical").length;

  return (
    <div style={{ marginTop: "20px" }}>

      <h2>📊 Hazard Statistics</h2>

      <div style={{
        display: "flex",
        gap: "20px",
        marginBottom: "20px"
      }}>

        <div style={{ background:"#222", padding:"20px" }}>
          <h3>Total Cases</h3>
          <p>{total}</p>
        </div>

        <div style={{ background:"#333", padding:"20px" }}>
          <h3>Open Cases</h3>
          <p>{open}</p>
        </div>

        <div style={{ background:"#5c0000", padding:"20px" }}>
          <h3>Critical Cases</h3>
          <p>{critical}</p>
        </div>

      </div>

    </div>
  );
};

export default AdminDashboard;