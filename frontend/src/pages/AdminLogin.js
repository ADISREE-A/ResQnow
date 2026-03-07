import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const AdminLogin = ({ setIsAdminLoggedIn, setIsPoliceLoggedIn }) => {

  const [password, setPassword] = useState("");
  const [officerName, setOfficerName] = useState("");
  const [loginType, setLoginType] = useState("admin"); // "admin" or "police"
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = () => {
    const ADMIN_PASSWORD = "resqnow123";
    const POLICE_PASSWORD = "police123";

    if (loginType === "admin") {
      if (password === ADMIN_PASSWORD) {
        localStorage.setItem("adminAuth", "true");
        localStorage.removeItem("policeAuth"); // Clear police auth if any
        localStorage.removeItem("officerName");
        setIsAdminLoggedIn(true);
        navigate("/admin");
      } else {
        setError("Incorrect Admin Password ❌");
      }
    } else {
      // Police login
      if (password === POLICE_PASSWORD) {
        if (!officerName.trim()) {
          setError("Please enter your officer name/badge number");
          return;
        }
        
        // Get officer details from database to get rank
        fetch("http://localhost:5000/api/officers")
          .then(res => res.json())
          .then(officers => {
            // Find matching officer by name
            const officer = officers.find(o => o.officer_name === officerName.trim());
            const officerRank = officer ? officer.rank : "Officer";
            
            localStorage.setItem("policeAuth", "true");
            localStorage.setItem("officerName", officerName.trim());
            localStorage.setItem("officerRank", officerRank); // Store rank
            localStorage.removeItem("adminAuth"); // Clear admin auth if any
            setIsPoliceLoggedIn(true);
            navigate("/police");
          })
          .catch(err => {
            // If API fails, still allow login with default rank
            localStorage.setItem("policeAuth", "true");
            localStorage.setItem("officerName", officerName.trim());
            localStorage.setItem("officerRank", "Officer");
            localStorage.removeItem("adminAuth");
            setIsPoliceLoggedIn(true);
            navigate("/police");
          });
      } else {
        setError("Incorrect Police Password ❌");
      }
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

        {/* Police: Officer Name Input */}
        {loginType === "police" && (
          <input
            type="text"
            placeholder="Enter Officer Name / Badge Number"
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

        <input
          type="password"
          placeholder={loginType === "admin" ? "Enter Admin Password" : "Enter Police Password"}
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
            backgroundColor: loginType === "admin" ? "red" : "#1565c0",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            cursor: "pointer"
          }}
        >
          {loginType === "admin" ? "Admin Login" : "Police Login"}
        </button>

        {/* Hint for passwords */}
        <div style={{
          marginTop: "20px",
          color: "#666",
          fontSize: "12px"
        }}>
          {loginType === "admin" 
            ? "Hint: resqnow123" 
            : "Hint: police123 + Officer Name"}
        </div>

      </div>
    </div>
  );
};

export default AdminLogin;
