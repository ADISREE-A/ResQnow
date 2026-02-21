import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";

import Home from "./pages/Home";
import SurvivalMode from "./pages/SurvivalMode";
import AdminPage from "./pages/AdminPage";
import AdminLogin from "./pages/AdminLogin";

function App() {

  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(
    localStorage.getItem("adminAuth") === "true"
  );

  return (
    <Router>
      <Routes>

        <Route path="/" element={<Home />} />

        <Route path="/survival" element={<SurvivalMode />} />

        {/* 🔐 Admin Login */}
        <Route
          path="/admin-login"
          element={<AdminLogin setIsAdminLoggedIn={setIsAdminLoggedIn} />}
        />

        {/* 🛡 Protected Admin Dashboard */}
        <Route
          path="/admin"
          element={
            isAdminLoggedIn ? (
              <AdminPage />
            ) : (
              <Navigate to="/admin-login" replace />
            )
          }
        />

      </Routes>
    </Router>
  );
}

export default App;