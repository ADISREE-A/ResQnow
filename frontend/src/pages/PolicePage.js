import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PoliceDashboard from "../components/PoliceDashboard";

const PolicePage = ({ handleLogout, darkMode = true, toggleTheme }) => {
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

  // Dynamic styles based on theme
  const styles = {
    container: {
      minHeight: "100vh",
      backgroundColor: darkMode ? "#0d0d0d" : "#f5f5f5",
      color: darkMode ? "white" : "#333333",
      padding: "30px",
      fontFamily: "Arial, sans-serif",
      transition: "all 0.3s ease"
    },
    header: {
      textAlign: "center",
      marginBottom: "40px"
    },
    title: {
      color: darkMode ? "white" : "#333333"
    },
    subtitle: {
      color: darkMode ? "#aaa" : "#666"
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
      backgroundColor: darkMode ? "#1a1a1a" : "#ffffff",
      padding: "25px",
      borderRadius: "12px",
      marginBottom: "30px",
      boxShadow: darkMode ? "0 4px 10px rgba(0,0,0,0.4)" : "0 4px 10px rgba(0,0,0,0.1)",
      transition: "all 0.3s ease"
    }
  };

  return (
    <div style={styles.container}>
      
      {/* 🔹 Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>👮 Police Control Panel</h1>
        <p style={styles.subtitle}>Emergency Response & Case Management System</p>
        {officerName && (
          <p style={styles.officerBadge}>Officer: {officerName}</p>
        )}

        {/* Theme Toggle Button */}
        {toggleTheme && (
          <button
            onClick={toggleTheme}
            style={{
              position: "fixed",
              top: "20px",
              right: "20px",
              width: "50px",
              height: "50px",
              borderRadius: "50%",
              backgroundColor: darkMode ? "#4ecca3" : "#2196F3",
              color: darkMode ? "#000" : "#fff",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
              boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
              zIndex: 1000
            }}
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {darkMode ? "☀️" : "🌙"}
          </button>
        )}
        
        {/* Navigation Buttons */}
        <div style={styles.navButtons}>
          <button 
            onClick={() => setActiveTab("dashboard")}
            style={{
              ...styles.navBtn,
              backgroundColor: activeTab === "dashboard" ? "#1565c0" : (darkMode ? "#333" : "#ddd")
            }}
          >
            📊 Dashboard
          </button>
          <button 
            onClick={() => setActiveTab("assigned")}
            style={{
              ...styles.navBtn,
              backgroundColor: activeTab === "assigned" ? "#1565c0" : (darkMode ? "#333" : "#ddd")
            }}
          >
            🎯 My Cases
          </button>
          <button 
            onClick={() => setActiveTab("all")}
            style={{
              ...styles.navBtn,
              backgroundColor: activeTab === "all" ? "#1565c0" : (darkMode ? "#333" : "#ddd")
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
          darkMode={darkMode}
        />
      </div>

    </div>
  );
};

export default PolicePage;

