import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const PoliceSignup = ({ darkMode = true }) => {
  const [formData, setFormData] = useState({
    badge_number: "",
    officer_name: "",
    rank: "",
    station: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
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
    accent: "#1565c0",
    inputBg: darkMode ? "#222" : "#fff"
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSignup = async () => {
    setError("");
    setSuccess("");
    
    // Validation
    if (!formData.badge_number.trim() || 
        !formData.officer_name.trim() || 
        !formData.password.trim() || 
        !formData.confirmPassword.trim()) {
      setError("Badge number, officer name, and password are required");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    // Email validation if provided
    if (formData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError("Invalid email format");
        return;
      }
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/police/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          badge_number: formData.badge_number.trim(),
          officer_name: formData.officer_name.trim(),
          rank: formData.rank || null,
          station: formData.station || null,
          email: formData.email || null,
          password: formData.password
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Police officer registered successfully!");
        // Clear form
        setFormData({
          badge_number: "",
          officer_name: "",
          rank: "",
          station: "",
          email: "",
          password: "",
          confirmPassword: ""
        });
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate("/admin-login");
        }, 2000);
      } else {
        setError(data.error || "Registration failed");
      }
    } catch (err) {
      console.error("Police signup error:", err);
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
        width: "450px",
        padding: "40px",
        backgroundColor: theme.cardBg,
        borderRadius: "15px",
        boxShadow: "0 0 30px rgba(21, 101, 192, 0.3)",
        textAlign: "center"
      }}>

        <h2 style={{ color: theme.text, marginBottom: "10px" }}>
          👮 Police Registration
        </h2>
        
        <p style={{ color: theme.textSecondary, marginBottom: "30px", fontSize: "14px" }}>
          Register as a police officer
        </p>

        {/* Badge Number */}
        <input
          type="text"
          name="badge_number"
          placeholder="Badge Number * (e.g., OFF001)"
          value={formData.badge_number}
          onChange={handleChange}
          style={inputStyle}
        />

        {/* Officer Name */}
        <input
          type="text"
          name="officer_name"
          placeholder="Officer Name *"
          value={formData.officer_name}
          onChange={handleChange}
          style={inputStyle}
        />

        {/* Rank */}
        <select
          name="rank"
          value={formData.rank}
          onChange={handleChange}
          style={inputStyle}
        >
          <option value="">Select Rank</option>
          <option value="Constable">Constable</option>
          <option value="Patrol">Patrol</option>
          <option value="Sergeant">Sergeant</option>
          <option value="Detective">Detective</option>
          <option value="Lieutenant">Lieutenant</option>
          <option value="Captain">Captain</option>
          <option value="Chief">Chief</option>
        </select>

        {/* Station */}
        <input
          type="text"
          name="station"
          placeholder="Station"
          value={formData.station}
          onChange={handleChange}
          style={inputStyle}
        />

        {/* Email */}
        <input
          type="email"
          name="email"
          placeholder="Email (optional)"
          value={formData.email}
          onChange={handleChange}
          style={inputStyle}
        />

        {/* Password */}
        <input
          type="password"
          name="password"
          placeholder="Password *"
          value={formData.password}
          onChange={handleChange}
          style={inputStyle}
        />

        {/* Confirm Password */}
        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirm Password *"
          value={formData.confirmPassword}
          onChange={handleChange}
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
          {loading ? "Registering..." : "Register Officer"}
        </button>

        {/* Back to Login */}
        <button
          onClick={() => navigate("/admin-login")}
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
          ← Back to Login
        </button>

      </div>
    </div>
  );
};

export default PoliceSignup;

