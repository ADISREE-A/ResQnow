import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const AdminLogin = ({ setIsAdminLoggedIn }) => {

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = () => {
    const ADMIN_PASSWORD = "resqnow123"; // change later

    if (password === ADMIN_PASSWORD) {
      localStorage.setItem("adminAuth", "true");
      setIsAdminLoggedIn(true);
      navigate("/admin");
    } else {
      setError("Incorrect Password ❌");
    }
  };

  return (
    <div style={{
      height: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#000"
    }}>

      <div style={{
        width: "350px",
        padding: "40px",
        backgroundColor: "#111",
        borderRadius: "15px",
        boxShadow: "0 0 20px rgba(255,0,0,0.4)",
        textAlign: "center"
      }}>

        <h2 style={{ color: "white", marginBottom: "30px" }}>
          🛡 Admin Login
        </h2>

        <input
          type="password"
          placeholder="Enter Admin Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "15px",
            borderRadius: "8px",
            border: "none",
            fontSize: "14px"
          }}
        />

        {error && (
          <div style={{
            color: "red",
            marginBottom: "15px",
            fontSize: "14px"
          }}>
            {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          style={{
            width: "100%",
            padding: "12px",
            backgroundColor: "red",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            cursor: "pointer"
          }}
        >
          Login
        </button>

      </div>
    </div>
  );
};

export default AdminLogin;