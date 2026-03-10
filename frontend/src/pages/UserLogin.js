import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const UserLogin = ({ darkMode = true }) => {
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Dynamic theme colors
  const theme = {
    bg: darkMode ? "#0d0d0d" : "#f5f5f5",
    cardBg: darkMode ? "#1a1a1a" : "#ffffff",
    text: darkMode ? "white" : "#333",
    textSecondary: darkMode ? "#aaa" : "#666",
    border: darkMode ? "#333" : "#ddd",
    accent: "#4ecca3",
    inputBg: darkMode ? "#222" : "#fff"
  };

  const handleLogin = async () => {
    setError("");
    setLoading(true);

    if (!usernameOrEmail.trim() || !password.trim()) {
      setError("Username/Email and password are required");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usernameOrEmail: usernameOrEmail.trim(),
          password: password
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store user info
        localStorage.setItem("userToken", data.token);
        localStorage.setItem("username", data.user.username);
        localStorage.setItem("userEmail", data.user.email);
        localStorage.setItem("userRole", data.user.role);
        
        // Navigate to survival mode
        navigate("/survival");
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err) {
      console.error("User login error:", err);
      setError("Server error. Please try again.");
    }

    setLoading(false);
  };

  const inputStyle = {
    width: "100%",
    padding: "12px",
    marginBottom: "15px",
    borderRadius: "8px",
    border: `1px solid ${theme.border}`,
    backgroundColor: theme.inputBg,
    color: theme.text,
    fontSize: "14px"
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.bg,
      padding: "20px"
    }}>
      <div style={{
        width: "400px",
        padding: "40px",
        backgroundColor: theme.cardBg,
        borderRadius: "15px",
        boxShadow: "0 0 30px rgba(78, 204, 163, 0.3)",
        textAlign: "center"
      }}>

        <h2 style={{ color: theme.text, marginBottom: "10px" }}>
          🚨 Survival Mode Login
        </h2>
        
        <p style={{ color: theme.textSecondary, marginBottom: "30px", fontSize: "14px" }}>
          Login to access emergency features
        </p>

        {/* Username/Email */}
        <input
          type="text"
          placeholder="Username or Email"
          value={usernameOrEmail}
          onChange={(e) => setUsernameOrEmail(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
          style={inputStyle}
        />

        {/* Password */}
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
          style={inputStyle}
        />

        {/* Error Message */}
        {error && (
          <div style={{
            color: "#ff5252",
            marginBottom: "15px",
            fontSize: "14px",
            padding: "10px",
            backgroundColor: darkMode ? "#3d0f0f" : "#ffebee",
            borderRadius: "6px"
          }}>
            {error}
          </div>
        )}

        {/* Login Button */}
        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: "100%",
            padding: "14px",
            backgroundColor: theme.accent,
            color: darkMode ? "#000" : "#fff",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
            marginBottom: "20px"
          }}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        {/* Signup Link */}
        <button
          onClick={() => navigate("/user-signup")}
          style={{
            width: "100%",
            padding: "12px",
            backgroundColor: "transparent",
            color: theme.textSecondary,
            border: `1px solid ${theme.border}`,
            borderRadius: "8px",
            fontSize: "14px",
            cursor: "pointer",
            marginBottom: "10px"
          }}
        >
          Don't have an account? Sign Up
        </button>

        {/* Back to Home */}
        <button
          onClick={() => navigate("/")}
          style={{
            width: "100%",
            padding: "12px",
            backgroundColor: "transparent",
            color: theme.textSecondary,
            border: "none",
            fontSize: "14px",
            cursor: "pointer"
          }}
        >
          ← Back to Home
        </button>

      </div>
    </div>
  );
};

export default UserLogin;

