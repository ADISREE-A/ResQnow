import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";

import Home from "./pages/Home";
import SurvivalMode from "./pages/SurvivalMode";
import AdminPage from "./pages/AdminPage";
import AdminLogin from "./pages/AdminLogin";

/* 🔐 Protected Route Component */
function ProtectedRoute({ isLoggedIn, children }) {
  if (!isLoggedIn) {
    return <Navigate to="/admin-login" replace />;
  }
  return children;
}

function App() {

  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  /* 🔄 Sync with localStorage on load */
  useEffect(() => {
    const storedAuth = localStorage.getItem("adminAuth");
    if (storedAuth === "true") {
      setIsAdminLoggedIn(true);
    }
  }, []);

  /* 🚪 Logout Function */
  const handleLogout = () => {
    localStorage.removeItem("adminAuth");
    setIsAdminLoggedIn(false);
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
            />
          }
        />

        {/* 🛡 Protected Admin Dashboard */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute isLoggedIn={isAdminLoggedIn}>
              <AdminPage handleLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

      </Routes>
    </Router>
  );
}

export default App;