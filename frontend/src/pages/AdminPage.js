import React from "react";
import AdminDashboard from "../components/AdminDashboard";

const AdminPage = () => {
  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#000",
      color: "white",
      padding: "30px"
    }}>
      <h1>🛠 Admin Control Panel</h1>
      <AdminDashboard />
    </div>
  );
};

export default AdminPage;