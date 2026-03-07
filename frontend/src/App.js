import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect, createContext, useContext } from "react";

import Home from "./pages/Home";
import SurvivalMode from "./pages/SurvivalMode";
import AdminPage from "./pages/AdminPage";
import AdminLogin from "./pages/AdminLogin";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import PolicePage from "./pages/PolicePage";

// Theme Context for dark/light mode
export const ThemeContext = createContext();

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
  const [darkMode, setDarkMode] = useState(true);

  /* 🔄 Sync with localStorage on load */
  useEffect(() => {
    const storedAdminAuth = localStorage.getItem("adminAuth");
    const storedPoliceAuth = localStorage.getItem("policeAuth");
    const storedTheme = localStorage.getItem("darkMode");
    
    if (storedAdminAuth === "true") {
      setIsAdminLoggedIn(true);
    }
    if (storedPoliceAuth === "true") {
      setIsPoliceLoggedIn(true);
    }
    if (storedTheme !== null) {
      setDarkMode(storedTheme === "true");
    }
  }, []);

  /* 🎨 Toggle Theme */
  const toggleTheme = () => {
    setDarkMode(!darkMode);
    localStorage.setItem("darkMode", !darkMode);
  };

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

  // Theme styles
  const themeStyles = {
    backgroundColor: darkMode ? "#0d0d0d" : "#f5f5f5",
    color: darkMode ? "#ffffff" : "#333333",
    minHeight: "100vh",
    transition: "all 0.3s ease"
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleTheme, themeStyles }}>
      <div style={themeStyles}>
        <Router>
          <Routes>

            <Route path="/" element={<Home darkMode={darkMode} toggleTheme={toggleTheme} />} />

            <Route path="/survival" element={<SurvivalMode darkMode={darkMode} toggleTheme={toggleTheme} />} />

            {/* 🔐 Admin Login */}
            <Route
              path="/admin-login"
              element={
                <AdminLogin
                  setIsAdminLoggedIn={setIsAdminLoggedIn}
                  setIsPoliceLoggedIn={setIsPoliceLoggedIn}
                  darkMode={darkMode}
                />
              }
            />

            {/* 🛡 Protected Admin Dashboard */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute isLoggedIn={isAdminLoggedIn}>
                  <AdminPage handleLogout={handleAdminLogout} darkMode={darkMode} toggleTheme={toggleTheme} />
                </ProtectedRoute>
              }
            />

            {/* 📊 Analytics Dashboard (Protected - Admin only) */}
            <Route
              path="/analytics"
              element={
                <ProtectedRoute isLoggedIn={isAdminLoggedIn}>
                  <AnalyticsDashboard darkMode={darkMode} />
                </ProtectedRoute>
              }
            />

            {/* 👮 Police Dashboard (Protected) */}
            <Route
              path="/police"
              element={
                <ProtectedRoute isLoggedIn={isPoliceLoggedIn}>
                  <PolicePage handleLogout={handlePoliceLogout} darkMode={darkMode} toggleTheme={toggleTheme} />
                </ProtectedRoute>
              }
            />

          </Routes>
        </Router>
      </div>
    </ThemeContext.Provider>
  );
}

export default App;
