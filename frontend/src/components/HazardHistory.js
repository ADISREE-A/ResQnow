import React, { useState, useEffect } from "react";

const HazardHistory = ({ onClose }) => {

  const [hazards, setHazards] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/hazards/all")
      .then(res => res.json())
      .then(data => setHazards(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>

        <div style={styles.header}>
          <h2>📜 Hazard History</h2>
          <button onClick={onClose} style={styles.closeBtn}>✖</button>
        </div>

        <div style={styles.content}>
          {hazards.length === 0 ? (
            <p>No hazards reported.</p>
          ) : (
            hazards.map((hazard, index) => (
              <div key={index} style={styles.card}>
                <p><b>Type:</b> {hazard.type}</p>
                <p><b>Severity:</b> {hazard.severity}</p>
                <p><b>Description:</b> {hazard.description}</p>
                <p><b>Status:</b> {hazard.status}</p>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0,0,0,0.8)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999
  },
  modal: {
    backgroundColor: "#1a1a1a",
    padding: "20px",
    width: "500px",
    maxHeight: "80vh",
    overflowY: "auto",
    borderRadius: "10px",
    color: "white"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  closeBtn: {
    background: "red",
    border: "none",
    color: "white",
    padding: "5px 10px",
    cursor: "pointer",
    borderRadius: "5px"
  },
  content: {
    marginTop: "15px"
  },
  card: {
    backgroundColor: "#111",
    padding: "10px",
    borderRadius: "8px",
    marginBottom: "10px"
  }
};

export default HazardHistory;