import React from "react";
import { useNavigate } from "react-router-dom";

const Home = ({ darkMode = true, toggleTheme }) => {

  const navigate = useNavigate();

  const bgColor = darkMode ? "#000000" : "#f5f5f5";
  const textColor = darkMode ? "#ffffff" : "#333333";
  const cardBg = darkMode ? "#1a1a2e" : "#ffffff";
  const borderColor = darkMode ? "#333333" : "#cccccc";

  return (
    <div style={{
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: bgColor,
      gap: "30px",
      transition: "all 0.3s ease"
    }}>

      {/* 🎨 Theme Toggle Button */}
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

      <h1 style={{ color: textColor }}>ResQNow</h1>

      {/* 🚨 Panic Button
      <button
        onClick={() => navigate("/survival")}
        style={{
          width: "200px",
          height: "60px",
          backgroundColor: "red",
          color: "white",
          fontSize: "18px",
          border: "none",
          borderRadius: "10px",
          cursor: "pointer",
          boxShadow: "0 4px 15px rgba(255, 0, 0, 0.4)"
        }}
      >
        🚨SURVIVAL MODE
      </button> */}

      {/* 🛡 Admin Login Button */}
      <button
        onClick={() => navigate("/admin-login")}
        style={{
          width: "200px",
          height: "60px",
          backgroundColor: cardBg,
          color: textColor,
          fontSize: "16px",
          border: `2px solid ${borderColor}`,
          borderRadius: "10px",
          cursor: "pointer"
        }}
      >
        🛡 ADMIN LOGIN
      </button>

      {/* 👤 User Login Button */}
      <button
        onClick={() => navigate("/user-login")}
        style={{
          width: "200px",
          height: "60px",
          backgroundColor: cardBg,
          color: textColor,
          fontSize: "16px",
          border: `2px solid ${borderColor}`,
          borderRadius: "10px",
          cursor: "pointer"
        }}
      >
        👤 USER LOGIN
      </button>

    </div>
  );
};

export default Home;
