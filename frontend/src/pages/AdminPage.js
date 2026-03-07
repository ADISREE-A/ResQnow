import React from "react";
import { useNavigate } from "react-router-dom";
import AdminDashboard from "../components/AdminDashboard";
import EvidenceList from "../components/EvidenceList";

const AdminPage = () => {
  const navigate = useNavigate();
  
  return (
    <div style={styles.container}>
      
      {/* 🔹 Header */}
      <div style={styles.header}>
        <h1>🛡 Admin Control Panel</h1>
        <p>Real-time emergency monitoring & risk analysis</p>
        
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
            style={{...styles.navBtn, backgroundColor: "#4da6ff"}}
          >
            📈 Analytics
          </button>
          <button 
            onClick={() => {
              localStorage.removeItem("adminAuth");
              window.location.href = "/admin-login";
            }} 
            style={{...styles.navBtn, backgroundColor: "#ff4444"}}
          >
            🚪 Logout
          </button>
        </div>
      </div>

      {/* 🔹 Dashboard Section */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>🚨 Hazard & Risk Dashboard</h2>
        <AdminDashboard />
      </div>

      {/* 🔹 Evidence Section */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>📁 Uploaded Evidence</h2>
        <EvidenceList />
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

  navButtons: {
    display: "flex",
    justifyContent: "center",
    gap: "15px",
    marginTop: "20px"
  },

  navBtn: {
    padding: "10px 25px",
    backgroundColor: "#333",
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
  },

  sectionTitle: {
    marginBottom: "20px",
    borderBottom: "2px solid #333",
    paddingBottom: "10px"
  }
};

export default AdminPage;