import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PoliceDashboard from "../components/PoliceDashboard";

const PolicePage = ({ handleLogout }) => {
  const navigate = useNavigate();
  const [officerName, setOfficerName] = useState("");
  const [officerRank, setOfficerRank] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard, assigned, all

  useEffect(() => {
    // Get officer name and rank from localStorage
    const storedOfficerName = localStorage.getItem("officerName");
    const storedOfficerRank = localStorage.getItem("officerRank");
    if (storedOfficerName) {
      setOfficerName(storedOfficerName);
    }
    if (storedOfficerRank) {
      setOfficerRank(storedOfficerRank);
    }
  }, []);

  const onLogout = () => {
    handleLogout();
    navigate("/admin-login");
  };

  return (
    <div style={styles.container}>
      
      {/* 🔹 Header */}
      <div style={styles.header}>
        <h1>👮 Police Control Panel</h1>
        <p>Emergency Response & Case Management System</p>
        {officerName && (
          <p style={styles.officerBadge}>Officer: {officerName}</p>
        )}
        
        {/* Navigation Buttons */}
        <div style={styles.navButtons}>
          <button 
            onClick={() => setActiveTab("dashboard")}
            style={{
              ...styles.navBtn,
              backgroundColor: activeTab === "dashboard" ? "#1565c0" : "#333"
            }}
          >
            📊 Dashboard
          </button>
          <button 
            onClick={() => setActiveTab("assigned")}
            style={{
              ...styles.navBtn,
              backgroundColor: activeTab === "assigned" ? "#1565c0" : "#333"
            }}
          >
            🎯 My Cases
          </button>
          <button 
            onClick={() => setActiveTab("all")}
            style={{
              ...styles.navBtn,
              backgroundColor: activeTab === "all" ? "#1565c0" : "#333"
            }}
          >
            📋 All Cases
          </button>
          <button 
            onClick={onLogout}
            style={{...styles.navBtn, backgroundColor: "#ff4444"}}
          >
            🚪 Logout
          </button>
        </div>
      </div>

      {/* 🔹 Dashboard Section */}
      <div style={styles.section}>
        <PoliceDashboard 
          officerName={officerName} 
          officerRank={officerRank}
          viewMode={activeTab}
        />
      </div>

    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#0d0d0d",
    color: "white",
    padding: "30px",
    fontFamily: "Arial, sans-serif"
  },

  header: {
    textAlign: "center",
    marginBottom: "40px"
  },

  officerBadge: {
    color: "#4da6ff",
    fontWeight: "bold",
    fontSize: "16px",
    marginTop: "5px"
  },

  navButtons: {
    display: "flex",
    justifyContent: "center",
    gap: "15px",
    marginTop: "20px",
    flexWrap: "wrap"
  },

  navBtn: {
    padding: "10px 25px",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "bold"
  },

  section: {
    backgroundColor: "#1a1a1a",
    padding: "25px",
    borderRadius: "12px",
    marginBottom: "30px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.4)"
  }
};

export default PolicePage;

