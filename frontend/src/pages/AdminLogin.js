import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const AdminLogin = ({ setIsAdminLoggedIn, setIsPoliceLoggedIn }) => {

  const [password, setPassword] = useState("");
  const [officerName, setOfficerName] = useState("");
  const [badgeNumber, setBadgeNumber] = useState("");
  const [loginType, setLoginType] = useState("admin"); // "admin" or "police"
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError("");
    setLoading(true);

    if (loginType === "admin") {
      // Use secure admin API
      try {
        const response = await fetch("http://localhost:5000/api/auth/admin/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: officerName || "admin",
            password: password
          }),
        });

        const data = await response.json();

        if (response.ok) {
          // Store token and user info
          localStorage.setItem("adminAuth", "true");
          localStorage.setItem("authToken", data.token);
          localStorage.setItem("userRole", "admin");
          localStorage.setItem("username", data.user.username);
          localStorage.removeItem("policeAuth");
          localStorage.removeItem("officerName");
          setIsAdminLoggedIn(true);
          navigate("/admin");
        } else {
          setError(data.error || "Login failed");
        }
      } catch (err) {
        setError("Server error. Please try again.");
        console.error("Admin login error:", err);
      }
    } else {
      // Police login - use badge_number + password from API
      if (!badgeNumber.trim()) {
        setError("Please enter your badge number");
        setLoading(false);
        return;
      }

      if (!password.trim()) {
        setError("Please enter your password");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("http://localhost:5000/api/auth/police/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            badge_number: badgeNumber.trim(),
            password: password
          }),
        });

        const data = await response.json();

        if (response.ok) {
          // Store token and user info
          localStorage.setItem("policeAuth", "true");
          localStorage.setItem("authToken", data.token);
          localStorage.setItem("userRole", "police");
          localStorage.setItem("officerName", data.user.username);
          localStorage.setItem("officerRank", data.user.rank || "Officer");
          localStorage.setItem("badgeNumber", data.user.badge_number);
          localStorage.removeItem("adminAuth");
          setIsPoliceLoggedIn(true);
          navigate("/police");
        } else {
          setError(data.error || "Invalid credentials");
        }
      } catch (err) {
        setError("Server error. Please try again.");
        console.error("Police login error:", err);
      }
    }

    setLoading(false);
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
        boxShadow: loginType === "admin" 
          ? "0 0 20px rgba(255,0,0,0.4)" 
          : "0 0 20px rgba(0,100,255,0.4)",
        textAlign: "center"
      }}>

        <h2 style={{ color: "white", marginBottom: "20px" }}>
          {loginType === "admin" ? "🛡 Admin Login" : "👮 Police Login"}
        </h2>

        {/* Login Type Toggle */}
        <div style={{
          display: "flex",
          gap: "10px",
          marginBottom: "25px"
        }}>
          <button
            onClick={() => {
              setLoginType("admin");
              setError("");
            }}
            style={{
              flex: 1,
              padding: "10px",
              backgroundColor: loginType === "admin" ? "#d32f2f" : "#333",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "bold"
            }}
          >
            Admin
          </button>
          <button
            onClick={() => {
              setLoginType("police");
              setError("");
            }}
            style={{
              flex: 1,
              padding: "10px",
              backgroundColor: loginType === "police" ? "#1565c0" : "#333",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "bold"
            }}
          >
            Police
          </button>
        </div>

        {/* Admin: Username Input */}
        {loginType === "admin" && (
          <input
            type="text"
            placeholder="Enter Admin Username"
            value={officerName}
            onChange={(e) => setOfficerName(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              marginBottom: "15px",
              borderRadius: "8px",
              border: "none",
              fontSize: "14px"
            }}
          />
        )}

        {/* Police: Badge Number Input */}
        {loginType === "police" && (
          <input
            type="text"
            placeholder="Enter Badge Number (e.g., OFF001)"
            value={badgeNumber}
            onChange={(e) => setBadgeNumber(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              marginBottom: "15px",
              borderRadius: "8px",
              border: "none",
              fontSize: "14px"
            }}
          />
        )}

        <input
          type="password"
          placeholder={loginType === "admin" ? "Enter Admin Password" : "Enter Police Password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
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
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            backgroundColor: loginType === "admin" ? "#d32f2f" : "#1565c0",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? "Logging in..." : (loginType === "admin" ? "Admin Login" : "Police Login")}
        </button>

        {/* Hint for demo credentials */}
        <div style={{
          marginTop: "20px",
          color: "#666",
          fontSize: "12px"
        }}>
          {loginType === "admin" 
            ? "Use admin credentials from database" 
            : "Use badge number + password from officers table"}
        </div>

        {/* Signup Links */}
        <div style={{
          marginTop: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "10px"
        }}>
          {loginType === "police" && (
            <button
              onClick={() => navigate("/police-signup")}
              style={{
                width: "100%",
                padding: "10px",
                backgroundColor: "transparent",
                color: "#4da6ff",
                border: "1px solid #4da6ff",
                borderRadius: "8px",
                fontSize: "14px",
                cursor: "pointer"
              }}
            >
              👮 Register as Police Officer
            </button>
          )}
          
          <button
            onClick={() => navigate("/admin-signup")}
            style={{
              width: "100%",
              padding: "10px",
              backgroundColor: "transparent",
              color: "#d32f2f",
              border: "1px solid #d32f2f",
              borderRadius: "8px",
              fontSize: "14px",
              cursor: "pointer"
            }}
          >
            🛡 Register New Admin
          </button>
        </div>

      </div>
    </div>
  );
};

export default AdminLogin;
