// import React from "react";
// import AdminDashboard from "../components/AdminDashboard";

// const AdminPage = () => {
//   return (
//     <div style={{
//       minHeight: "100vh",
//       backgroundColor: "#000",
//       color: "white",
//       padding: "30px"
//     }}>
//       <h1>🛠 Admin Control Panel</h1>
//       <AdminDashboard />
    
     
//     </div>
//   );
// };

// export default AdminPage;
import React from "react";
import AdminDashboard from "../components/AdminDashboard";
import EvidenceList from "../components/EvidenceList";

const AdminPage = () => {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>🛠 Admin Control Panel</h1>
        <p>Monitor emergencies and uploaded evidence</p>
      </div>

      <div style={styles.dashboardWrapper}>
        <AdminDashboard />
      </div>
      <div style={{ background: "#111", minHeight: "100vh", color: "white" }}>
      <h1 style={{ textAlign: "center", padding: "20px" }}>
        🛡 Admin Dashboard
      </h1>

      <EvidenceList />
    </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#000",
    color: "white",
    padding: "30px",
    fontFamily: "Arial"
  },
  header: {
    textAlign: "center",
    marginBottom: "30px"
  },
  dashboardWrapper: {
    backgroundColor: "#111",
    padding: "20px",
    borderRadius: "12px"
  }
};

export default AdminPage;