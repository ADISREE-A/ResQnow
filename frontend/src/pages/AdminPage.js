import React from "react";
import { useNavigate } from "react-router-dom";
import AdminDashboard from "../components/AdminDashboard";
import EvidenceList from "../components/EvidenceList";

const AdminPage = ({ darkMode = true, toggleTheme }) => {
  const navigate = useNavigate();
  
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
    navButtons: {
      display: "flex",
      justifyContent: "center",
      gap: "15px",
      marginTop: "20px"
    },
    navBtn: {
      padding: "10px 25px",
      backgroundColor: darkMode ? "#333" : "#ddd",
      color: darkMode ? "white" : "#333",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "bold"
    },
    analyticsBtn: {
      padding: "10px 25px",
      backgroundColor: "#4da6ff",
      color: "white",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "bold"
    },
    logoutBtn: {
      padding: "10px 25px",
      backgroundColor: "#ff4444",
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
    },
    sectionTitle: {
      marginBottom: "20px",
      borderBottom: darkMode ? "2px solid #333" : "2px solid #ddd",
      paddingBottom: "10px",
      color: darkMode ? "white" : "#333"
    }
  };
  
  return (
    <div style={styles.container}>
      
      {/* 🔹 Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>🛡 Admin Control Panel</h1>
        <p style={styles.subtitle}>Real-time emergency monitoring & risk analysis</p>
        
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
            onClick={() => navigate("/admin")} 
            style={styles.navBtn}
          >
            📊 Dashboard
          </button>
          <button 
            onClick={() => navigate("/analytics")} 
            style={styles.analyticsBtn}
          >
            📈 Analytics
          </button>
          <button 
            onClick={() => navigate("/admin-signup")} 
            style={{
              ...styles.navBtn,
              backgroundColor: "#d32f2f"
            }}
          >
            🛡 Add Admin
          </button>
          <button 
            onClick={() => {
              // Trigger the register police modal by dispatching a custom event
              window.dispatchEvent(new CustomEvent('openRegisterPoliceModal'));
            }} 
            style={{
              ...styles.navBtn,
              backgroundColor: "#1565c0"
            }}
          >
            👮 Add Police
          </button>
          <button 
            onClick={() => {
              localStorage.removeItem("adminAuth");
              window.location.href = "/admin-login";
            }} 
            style={styles.logoutBtn}
          >
            🚪 Logout
          </button>
        </div>
      </div>

      {/* 🔹 Dashboard Section */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>🚨 Hazard & Risk Dashboard</h2>
        <AdminDashboard darkMode={darkMode} />
      </div>

      {/* 🔹 Evidence Section */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>📁 Uploaded Evidence</h2>
        <EvidenceList darkMode={darkMode} />
      </div>

    </div>
  );
};

export default AdminPage;

