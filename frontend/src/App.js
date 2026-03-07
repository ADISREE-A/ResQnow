import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";

import Home from "./pages/Home";
import SurvivalMode from "./pages/SurvivalMode";
import AdminPage from "./pages/AdminPage";
import AdminLogin from "./pages/AdminLogin";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import PolicePage from "./pages/PolicePage";

/* 🔐 Protected Route Component */
function ProtectedRoute({ isLoggedIn, children }) {
  if (!isLoggedIn) {
    return <Navigate to="/admin-login" replace />;
  }
  return children;
}

function App() {

  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isPoliceLoggedIn, setIsPoliceLoggedIn] = useState(false);

  /* 🔄 Sync with localStorage on load */
  useEffect(() => {
    const storedAdminAuth = localStorage.getItem("adminAuth");
    const storedPoliceAuth = localStorage.getItem("policeAuth");
    
    if (storedAdminAuth === "true") {
      setIsAdminLoggedIn(true);
    }
    if (storedPoliceAuth === "true") {
      setIsPoliceLoggedIn(true);
    }
  }, []);

  /* 🚪 Logout Function for Admin */
  const handleAdminLogout = () => {
    localStorage.removeItem("adminAuth");
    setIsAdminLoggedIn(false);
  };

  /* 🚪 Logout Function for Police */
  const handlePoliceLogout = () => {
    localStorage.removeItem("policeAuth");
    localStorage.removeItem("officerName");
    setIsPoliceLoggedIn(false);
  };

  return (
    <Router>
      <Routes>

        <Route path="/" element={<Home />} />

        <Route path="/survival" element={<SurvivalMode />} />

        {/* 🔐 Admin Login */}
        <Route
          path="/admin-login"
          element={
            <AdminLogin
              setIsAdminLoggedIn={setIsAdminLoggedIn}
              setIsPoliceLoggedIn={setIsPoliceLoggedIn}
            />
          }
        />

        {/* 🛡 Protected Admin Dashboard */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute isLoggedIn={isAdminLoggedIn}>
              <AdminPage handleLogout={handleAdminLogout} />
            </ProtectedRoute>
          }
        />

        {/* 📊 Analytics Dashboard (Protected - Admin only) */}
        <Route
          path="/analytics"
          element={
            <ProtectedRoute isLoggedIn={isAdminLoggedIn}>
              <AnalyticsDashboard />
            </ProtectedRoute>
          }
        />

        {/* 👮 Police Dashboard (Protected) */}
        <Route
          path="/police"
          element={
            <ProtectedRoute isLoggedIn={isPoliceLoggedIn}>
              <PolicePage handleLogout={handlePoliceLogout} />
            </ProtectedRoute>
          }
        />

      </Routes>
    </Router>
  );
}

export default App;
