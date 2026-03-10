import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const AdminSignup = ({ darkMode = true }) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Dynamic theme colors
  const theme = {
    bg: darkMode ? "#0d0d0d" : "#f5f5f5",
    cardBg: darkMode ? "#1a1a1a" : "#ffffff",
    text: darkMode ? "white" : "#333",
    textSecondary: darkMode ? "#aaa" : "#666",
    border: darkMode ? "#333" : "#ddd",
    accent: "#d32f2f",
    inputBg: darkMode ? "#222" : "#fff"
  };

  const handleSignup = async () => {
    setError("");
    setSuccess("");
    
    // Validation
    if (!username.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError("All fields are required");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Invalid email format");
      return;
    }

    setLoading(true);

    try {
      // Use public signup endpoint (no token required)
      const response = await fetch("http://localhost:5000/api/auth/admin/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim(),
          password: password
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Admin registered successfully! You can now login.");
        // Clear form
        setUsername("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate("/admin-login");
        }, 2000);
      } else {
        setError(data.error || "Registration failed");
      }
    } catch (err) {
      console.error("Admin signup error:", err);
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
        boxShadow: "0 0 30px rgba(211, 47, 47, 0.3)",
        textAlign: "center"
      }}>

        <h2 style={{ color: theme.text, marginBottom: "10px" }}>
          🛡 Register New Admin
        </h2>
        
        <p style={{ color: theme.textSecondary, marginBottom: "30px", fontSize: "14px" }}>
          Create a new admin account
        </p>

        {/* Username */}
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={inputStyle}
        />

        {/* Email */}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />

        {/* Password */}
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
        />

        {/* Confirm Password */}
        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSignup()}
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

        {/* Success Message */}
        {success && (
          <div style={{
            color: "#00cc00",
            marginBottom: "15px",
            fontSize: "14px",
            padding: "10px",
            backgroundColor: darkMode ? "#0d3d0d" : "#e8f5e9",
            borderRadius: "6px"
          }}>
            {success}
          </div>
        )}

        {/* Signup Button */}
        <button
          onClick={handleSignup}
          disabled={loading}
          style={{
            width: "100%",
            padding: "14px",
            backgroundColor: theme.accent,
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
            marginBottom: "20px"
          }}
        >
          {loading ? "Registering..." : "Register Admin"}
        </button>

        {/* Back to Dashboard */}
        <button
          onClick={() => navigate("/admin")}
          style={{
            width: "100%",
            padding: "12px",
            backgroundColor: "transparent",
            color: theme.textSecondary,
            border: `1px solid ${theme.border}`,
            borderRadius: "8px",
            fontSize: "14px",
            cursor: "pointer"
          }}
        >
          ← Back to Dashboard
        </button>

        {/* Security Note */}
        <div style={{
          marginTop: "20px",
          color: theme.textSecondary,
          fontSize: "12px"
        }}>
          🔒 This action is restricted to admins only
        </div>

      </div>
    </div>
  );
};

export default AdminSignup;

