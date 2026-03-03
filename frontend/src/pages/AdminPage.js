import React from "react";
import AdminDashboard from "../components/AdminDashboard";
import EvidenceList from "../components/EvidenceList";

const AdminPage = () => {
  return (
    <div style={styles.container}>
      
      {/* 🔹 Header */}
      <div style={styles.header}>
        <h1>🛡 Admin Control Panel</h1>
        <p>Real-time emergency monitoring & risk analysis</p>
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