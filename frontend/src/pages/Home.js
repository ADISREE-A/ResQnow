import React from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {

  const navigate = useNavigate();

  return (
    <div style={{
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#000",
      gap: "30px"
    }}>

      <h1 style={{ color: "white" }}>🚑 ResQNow</h1>

      {/* 🚨 Panic Button */}
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
          cursor: "pointer"
        }}
      >
        🚨 PANIC
      </button>

      {/* 🛡 Admin Login Button */}
      <button
        onClick={() => navigate("/admin-login")}
        style={{
          width: "200px",
          height: "60px",
          backgroundColor: "#222",
          color: "white",
          fontSize: "16px",
          border: "2px solid white",
          borderRadius: "10px",
          cursor: "pointer"
        }}
      >
        🛡 ADMIN LOGIN
      </button>

    </div>
  );
};

export default Home;