import React, { useEffect, useState } from "react";
import DangerZoneMap from "./DangerZoneMap";

const AdminDashboard = ({ darkMode = true }) => {

  const [hazards, setHazards] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState("ALL");
  const [selectedCase, setSelectedCase] = useState(null);

  // Evidence & AI Analysis state
  const [evidence, setEvidence] = useState([]);
  const [selectedEvidence, setSelectedEvidence] = useState(null);
  const [analyzingId, setAnalyzingId] = useState(null);

  // Officers & Assignment state
  const [officers, setOfficers] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignOfficerName, setAssignOfficerName] = useState("");
  const [assignOfficerId, setAssignOfficerId] = useState(null);

  // Police Registration state
  const [showRegisterPoliceModal, setShowRegisterPoliceModal] = useState(false);
  const [registerPoliceData, setRegisterPoliceData] = useState({
    badge_number: "",
    officer_name: "",
    rank: "",
    station: "",
    email: "",
    password: ""
  });
  const [registerPoliceError, setRegisterPoliceError] = useState("");
  const [registerPoliceSuccess, setRegisterPoliceSuccess] = useState("");
  const [registeringPolice, setRegisteringPolice] = useState(false);

  // Dynamic theme colors
  const theme = {
    bg: darkMode ? "#0d0d0d" : "#f5f5f5",
    cardBg: darkMode ? "#222" : "#fff",
    cardBgSelected: darkMode ? "#444" : "#e0e0e0",
    text: darkMode ? "white" : "#333",
    textSecondary: darkMode ? "#aaa" : "#666",
    border: darkMode ? "#333" : "#ddd",
    accent: darkMode ? "#4da6ff" : "#2196F3",
    success: "#00cc00",
    warning: "#ff9933",
    danger: "red",
    dangerBg: darkMode ? "#5c0000" : "#ffcccc",
    dangerSelected: darkMode ? "#990000" : "#ff6666",
    panelBg: darkMode ? "#1a1a1a" : "#ffffff"
  };

  /* ===============================
     FETCH ALL HAZARDS
  ================================= */
  useEffect(() => {
    fetch("http://localhost:5000/api/hazards/all")
      .then(res => res.json())
      .then(data => setHazards(data))
      .catch(err => console.error(err));
    
    // Fetch evidence with AI analysis
    fetchEvidenceWithAnalysis();
    
    // Fetch officers list
    fetchOfficers();

    // Listen for custom event to open Register Police Modal
    const handleOpenRegisterPolice = () => {
      setShowRegisterPoliceModal(true);
    };
    
    window.addEventListener('openRegisterPoliceModal', handleOpenRegisterPolice);
    
    return () => {
      window.removeEventListener('openRegisterPoliceModal', handleOpenRegisterPolice);
    };
  }, []);

  /* ===============================
     FETCH OFFICERS LIST
  ================================= */
  const fetchOfficers = () => {
    fetch("http://localhost:5000/api/officers")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setOfficers(data);
        } else {
          console.error("Error fetching officers:", data);
          setOfficers([]);
        }
      })
      .catch(err => {
        console.error("Error fetching officers:", err);
        setOfficers([]);
      });
  };

  /* ===============================
     ASSIGN OFFICER
  ================================= */
  const assignOfficer = async () => {
    if (!selectedCase) return;
    
    try {
      const res = await fetch(
        `http://localhost:5000/api/hazards/assign-officer/${selectedCase.case_id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            officer_name: assignOfficerName,
            officer_id: assignOfficerId,
            assigned_by: "Admin"
          })
        }
      );
      
      const result = await res.json();
      console.log(result);
      
      // Refresh data
      fetch("http://localhost:5000/api/hazards/all")
        .then(res => res.json())
        .then(data => setHazards(data))
        .catch(err => console.error(err));
      
      setShowAssignModal(false);
      setAssignOfficerName("");
      setAssignOfficerId(null);
      setSelectedCase(null);
      
    } catch (err) {
      console.error("Assign failed", err);
    }
  };

  // Handle officer selection from dropdown
  const handleOfficerSelect = (e) => {
    const selectedId = e.target.value;
    if (selectedId) {
      const selectedOfficer = officers.find(o => o.id === parseInt(selectedId));
      if (selectedOfficer) {
        setAssignOfficerName(selectedOfficer.officer_name);
        setAssignOfficerId(selectedOfficer.id);
      }
    } else {
      setAssignOfficerName("");
      setAssignOfficerId(null);
    }
  };

  /* ===============================
     FETCH EVIDENCE WITH AI ANALYSIS
  ================================= */
  const fetchEvidenceWithAnalysis = () => {
    fetch("http://localhost:5000/api/evidence/with-analysis")
      .then(res => res.json())
      .then(data => {
        // Handle case where API returns error object
        if (Array.isArray(data)) {
          setEvidence(data);
        } else {
          console.error("Error fetching evidence:", data);
          setEvidence([]);
        }
      })
      .catch(err => {
        console.error("Error fetching evidence:", err);
        setEvidence([]);
      });
  };

  /* ===============================
     ANALYZE VIDEO WITH AI
  ================================= */
  const analyzeVideo = async (evidenceId, caseId) => {
    setAnalyzingId(evidenceId);
    
    try {
      const res = await fetch(`http://localhost:5000/api/evidence/analyze/${evidenceId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ case_id: caseId })
      });
      
      const result = await res.json();
      console.log("Analysis result:", result);
      
      // Refresh evidence list
      fetchEvidenceWithAnalysis();
      
      // Show analysis result
      if (result.analysis) {
        alert(`🤖 AI Analysis Complete!\n\n${result.analysis.situation_summary}\n\nHelp Needed: ${result.analysis.help_needed?.join(", ")}\n\nConfidence: ${result.analysis.confidence_score}%`);
      }
    } catch (err) {
      console.error("Analysis failed:", err);
      alert("Failed to analyze video");
    } finally {
      setAnalyzingId(null);
    }
  };

  /* ===============================
     CALCULATIONS
  ================================= */
  const total = hazards.length;
  const open = hazards.filter(h => h.status === "Open").length;
  const critical = hazards.filter(
    h => h.risk_level === "Critical" || h.severity === "Critical"
  ).length;
  const emergency = hazards.filter(
    h => h.type === "Panic Emergency" || h.type?.includes("Panic")
  ).length;

  /* ===============================
     FILTERING
  ================================= */
  const filteredHazards = hazards.filter(hazard => {
    if (selectedFilter === "ALL") return true;
    if (selectedFilter === "OPEN") return hazard.status === "Open";
    if (selectedFilter === "CRITICAL")
      return hazard.risk_level === "Critical" || hazard.severity === "Critical";
    if (selectedFilter === "EMERGENCY")
      return hazard.type === "Panic Emergency" || hazard.type?.includes("Panic");
    return true;
  });

  /* ===============================
     UPDATE STATUS
  ================================= */
  const updateStatus = async (newStatus) => {
    try {
      await fetch(
        `http://localhost:5000/api/hazards/update-status/${selectedCase.case_id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus })
        }
      );

      // Update list instantly
      setHazards(prev =>
        prev.map(h =>
          h.case_id === selectedCase.case_id
            ? { ...h, status: newStatus }
            : h
        )
      );

      // Update modal instantly
      setSelectedCase(prev => ({ ...prev, status: newStatus }));

    } catch (err) {
      console.error("Update failed", err);
    }
  };

  /* ===============================
     STYLES
  ================================= */
  const overlayStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999
  };

  const modalStyle = {
    backgroundColor: darkMode ? "#111" : "#fff",
    padding: "30px",
    borderRadius: "12px",
    width: "500px",
    maxHeight: "80vh",
    overflowY: "auto",
    color: darkMode ? "white" : "#333",
    boxShadow: "0 0 25px rgba(0,0,0,0.6)"
  };

  const closeButtonStyle = {
    marginTop: "20px",
    padding: "10px 20px",
    backgroundColor: darkMode ? "#333" : "#ddd",
    color: darkMode ? "white" : "#333",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer"
  };

  /* ===============================
     REGISTER POLICE OFFICER
  ================================= */
  const handleRegisterPoliceChange = (e) => {
    const { name, value } = e.target;
    setRegisterPoliceData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const registerPoliceOfficer = async () => {
    // Validation
    if (!registerPoliceData.badge_number.trim() || 
        !registerPoliceData.officer_name.trim() || 
        !registerPoliceData.password) {
      setRegisterPoliceError("Badge number, officer name, and password are required");
      return;
    }

    if (registerPoliceData.password.length < 6) {
      setRegisterPoliceError("Password must be at least 6 characters");
      return;
    }

    if (registerPoliceData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(registerPoliceData.email)) {
        setRegisterPoliceError("Invalid email format");
        return;
      }
    }

    setRegisteringPolice(true);
    setRegisterPoliceError("");

    try {
      const token = localStorage.getItem("authToken");
      
      const response = await fetch("http://localhost:5000/api/officers/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          badge_number: registerPoliceData.badge_number.trim(),
          officer_name: registerPoliceData.officer_name.trim(),
          rank: registerPoliceData.rank || null,
          station: registerPoliceData.station || null,
          email: registerPoliceData.email || null,
          password: registerPoliceData.password
        })
      });

      const data = await response.json();

      if (response.ok) {
        setRegisterPoliceSuccess("Police officer registered successfully!");
        // Clear form
        setRegisterPoliceData({
          badge_number: "",
          officer_name: "",
          rank: "",
          station: "",
          email: "",
          password: ""
        });
        // Refresh officers list
        fetchOfficers();
        // Close modal after 2 seconds
        setTimeout(() => {
          setShowRegisterPoliceModal(false);
          setRegisterPoliceSuccess("");
        }, 2000);
      } else {
        setRegisterPoliceError(data.error || "Registration failed");
      }
    } catch (err) {
      console.error("Police registration error:", err);
      setRegisterPoliceError("Server error. Please try again.");
    }

    setRegisteringPolice(false);
  };

  return (
    <div style={{ marginTop: "20px", padding: "20px", color: theme.text }}>

      <h2>📊 Hazard Statistics</h2>

      {/* ===============================
           SUMMARY CARDS
      ================================= */}
      <div
        style={{
          display: "flex",
          gap: "20px",
          marginBottom: "30px",
          flexWrap: "wrap"
        }}
      >
        {/* Total */}
        <div
          onClick={() => setSelectedFilter("ALL")}
          style={{
            flex: 1,
            minWidth: "150px",
            background: selectedFilter === "ALL" ? theme.cardBgSelected : theme.cardBg,
            padding: "20px",
            borderRadius: "10px",
            textAlign: "center",
            cursor: "pointer",
            border: `1px solid ${theme.border}`,
            transition: "all 0.3s ease"
          }}
        >
          <h3 style={{ color: theme.textSecondary }}>Total Cases</h3>
          <h1 style={{ color: theme.accent }}>{total}</h1>
        </div>

        {/* Open */}
        <div
          onClick={() => setSelectedFilter("OPEN")}
          style={{
            flex: 1,
            minWidth: "150px",
            background: selectedFilter === "OPEN" ? theme.cardBgSelected : theme.cardBg,
            padding: "20px",
            borderRadius: "10px",
            textAlign: "center",
            cursor: "pointer",
            border: `1px solid ${theme.border}`,
            transition: "all 0.3s ease"
          }}
        >
          <h3 style={{ color: theme.textSecondary }}>Open Cases</h3>
          <h1 style={{ color: theme.warning }}>{open}</h1>
        </div>

        {/* Critical */}
        <div
          onClick={() => setSelectedFilter("CRITICAL")}
          style={{
            flex: 1,
            minWidth: "150px",
            background: selectedFilter === "CRITICAL" ? theme.dangerSelected : theme.dangerBg,
            padding: "20px",
            borderRadius: "10px",
            textAlign: "center",
            cursor: "pointer",
            border: `1px solid ${theme.danger}`,
            transition: "all 0.3s ease"
          }}
        >
          <h3 style={{ color: theme.text }}>Critical Cases</h3>
          <h1 style={{ color: theme.danger }}>{critical}</h1>
        </div>

        {/* Emergency (Panic Button) */}
        <div
          onClick={() => setSelectedFilter("EMERGENCY")}
          style={{
            flex: 1,
            minWidth: "150px",
            background: selectedFilter === "EMERGENCY" ? "#d32f2f" : "#c62828",
            padding: "20px",
            borderRadius: "10px",
            textAlign: "center",
            cursor: "pointer",
            border: `1px solid #b71c1c`,
            transition: "all 0.3s ease"
          }}
        >
          <h3 style={{ color: "white" }}>🚨 Emergency</h3>
          <h1 style={{ color: "#ff5252" }}>{emergency}</h1>
        </div>
      </div>

      {/* ===============================
           DANGER ZONE HEATMAP
      ================================= */}
      <div style={{ marginBottom: "30px" }}>
        <h2 style={{ marginBottom: "15px", color: theme.text }}>🔥 Danger Zone Heatmap</h2>
        <DangerZoneMap height="400px" showLegend={true} darkMode={darkMode} />
      </div>

      {/* ===============================
           CASE LIST
      ================================= */}
      <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        {filteredHazards.map((hazard) => (
          <div
            key={hazard.case_id}
            style={{
              background: theme.cardBg,
              padding: "15px",
              borderRadius: "8px",
              borderLeft:
                hazard.status === "Closed"
                  ? `5px solid ${theme.success}`
                  : hazard.risk_level === "Critical"
                  ? `5px solid ${theme.danger}`
                  : `5px solid ${theme.border}`,
              border: `1px solid ${theme.border}`,
              transition: "all 0.3s ease"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong
                style={{ cursor: "pointer", color: theme.accent }}
                onClick={() => setSelectedCase(hazard)}
              >
                {hazard.case_id}
              </strong>
              <span style={{ color: "#1565c0", fontSize: "12px" }}>
                {hazard.assigned_officer ? `👤 ${hazard.assigned_officer}` : "Unassigned"}
              </span>
            </div>

            <p style={{ color: theme.textSecondary }}>Status: {hazard.status}</p>
            <p style={{ color: theme.textSecondary }}>Type: {hazard.type}</p>
            <p style={{ color: theme.textSecondary }}>Severity: {hazard.severity}</p>
            <p style={{ color: theme.textSecondary }}>Risk Level: {hazard.risk_level || "N/A"}</p>
          </div>
        ))}
      </div>

      {/* ===============================
           FLOATING CASE DETAILS MODAL
      ================================= */}
      {selectedCase && (
        <div style={overlayStyle} onClick={() => setSelectedCase(null)}>
          <div
            style={modalStyle}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ color: theme.text }}>📄 Case Details</h2>

            <p><strong style={{ color: theme.text }}>Case ID:</strong> {selectedCase.case_id}</p>
            <p><strong style={{ color: theme.text }}>Username:</strong> {selectedCase.username}</p>
            <p><strong style={{ color: theme.text }}>Type:</strong> {selectedCase.type}</p>
            <p><strong style={{ color: theme.text }}>Description:</strong> {selectedCase.description}</p>

            {/* STATUS DROPDOWN */}
            <div style={{ marginTop: "10px" }}>
              <strong style={{ color: theme.text }}>Status:</strong>
              <select
                value={selectedCase.status}
                onChange={(e) => updateStatus(e.target.value)}
                style={{
                  marginLeft: "10px",
                  padding: "6px",
                  borderRadius: "5px",
                  background: theme.cardBg,
                  color: theme.text,
                  border: `1px solid ${theme.border}`
                }}
              >
                <option value="Open">Open</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            <p><strong style={{ color: theme.text }}>User Severity:</strong> {selectedCase.severity}</p>
            <p><strong style={{ color: theme.text }}>Auto Severity:</strong> {selectedCase.auto_severity}</p>
            <p><strong style={{ color: theme.text }}>Risk Score:</strong> {selectedCase.risk_score}</p>
            <p><strong style={{ color: theme.text }}>Risk Level:</strong> {selectedCase.risk_level}</p>
            <p><strong style={{ color: theme.text }}>Confidence:</strong> {selectedCase.confidence}%</p>
            <p><strong style={{ color: theme.text }}>Location:</strong> {selectedCase.latitude}, {selectedCase.longitude}</p>
            <p><strong style={{ color: theme.text }}>Created At:</strong> {selectedCase.created_at}</p>
            
            {/* Assigned Officer Info */}
            <p><strong style={{ color: theme.text }}>Assigned Officer:</strong> {selectedCase.assigned_officer || "Unassigned"}</p>
            <p><strong style={{ color: theme.text }}>Assigned By:</strong> {selectedCase.assigned_by || "System"}</p>

            {/* ASSIGN BUTTON */}
            <div style={{ marginTop: "15px" }}>
              <button
                onClick={() => setShowAssignModal(true)}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#1565c0",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px"
                }}
              >
                📌 Assign Officer
              </button>
            </div>

            <button
              style={closeButtonStyle}
              onClick={() => setSelectedCase(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ===============================
           ASSIGN OFFICER MODAL
      ================================= */}
      {showAssignModal && (
        <div style={overlayStyle} onClick={() => setShowAssignModal(false)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ color: theme.text }}>📌 Assign Officer</h2>
            <p><strong style={{ color: theme.text }}>Case:</strong> {selectedCase?.case_id}</p>
            <p><strong style={{ color: theme.text }}>Assigned By:</strong> Admin</p>
            
            <label style={{ display: "block", marginBottom: "8px", color: theme.text }}>
              Select Officer:
            </label>
            <select
              onChange={handleOfficerSelect}
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: "15px",
                borderRadius: "6px",
                border: `1px solid ${theme.border}`,
                backgroundColor: darkMode ? "#222" : "#fff",
                color: darkMode ? "white" : "#333",
                fontSize: "14px"
              }}
            >
              <option value="">-- Select an Officer --</option>
              {officers.map((officer) => (
                <option key={officer.id} value={officer.id}>
                  {officer.officer_name} ({officer.rank}) - {officer.station}
                </option>
              ))}
            </select>
            
            <label style={{ display: "block", marginBottom: "8px", color: theme.text }}>
              Or Enter Officer Name:
            </label>
            <input
              type="text"
              value={assignOfficerName}
              onChange={(e) => setAssignOfficerName(e.target.value)}
              placeholder="Enter officer name manually"
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: "15px",
                borderRadius: "6px",
                border: `1px solid ${theme.border}`,
                backgroundColor: darkMode ? "#222" : "#fff",
                color: darkMode ? "white" : "#333",
                fontSize: "14px"
              }}
            />
            
            <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
              <button
                onClick={assignOfficer}
                style={{
                  flex: 1,
                  padding: "10px",
                  backgroundColor: "#1565c0",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer"
                }}
              >
                ✅ Assign
              </button>
              <button
                onClick={() => setShowAssignModal(false)}
                style={{
                  flex: 1,
                  padding: "10px",
                  backgroundColor: darkMode ? "#333" : "#ddd",
                  color: darkMode ? "white" : "#333",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===============================
           AI EVIDENCE ANALYSIS SECTION
      ================================= */}
      <div style={{ marginTop: "40px", padding: "20px", backgroundColor: theme.panelBg, borderRadius: "10px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <h2 style={{ margin: 0, color: theme.text }}>🤖 AI Video Analysis</h2>
          <button
            onClick={fetchEvidenceWithAnalysis}
            style={{
              padding: "8px 16px",
              backgroundColor: theme.cardBg,
              color: theme.text,
              border: `1px solid ${theme.border}`,
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "13px"
            }}
          >
            🔄 Refresh
          </button>
        </div>
        <p style={{ color: theme.textSecondary, marginBottom: "20px" }}>
          Analyze uploaded evidence videos using AI to extract key information, detect emergency indicators, and identify what help is needed.
        </p>
        
        {evidence.length === 0 ? (
          <div style={{ padding: "20px", textAlign: "center", color: theme.textSecondary }}>
            No evidence available for analysis. Evidence will appear here after being uploaded in Survival Mode.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            {evidence.map((ev) => (
              <div
                key={ev.id}
                style={{
                  background: darkMode ? "#1a1a1a" : "#f5f5f5",
                  padding: "15px",
                  borderRadius: "8px",
                  borderLeft: ev.ai_analysis ? "5px solid #4da6ff" : `5px solid ${theme.border}`
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <strong style={{ color: theme.text }}>📹 Evidence #{ev.id}</strong>
                    <span style={{ marginLeft: "10px", color: theme.textSecondary }}>
                      {ev.file_path?.split('/').pop()}
                    </span>
                  </div>
                  <div>
                    {ev.ai_analysis ? (
                      <span style={{ color: "#4da6ff", fontSize: "12px" }}>✓ Analyzed</span>
                    ) : (
                      <span style={{ color: "#666", fontSize: "12px" }}>Not analyzed</span>
                    )}
                  </div>
                </div>
                
                <p style={{ margin: "10px 0", fontSize: "13px", color: theme.textSecondary }}>
                  📍 Location: {ev.latitude}, {ev.longitude}
                </p>
                
                {/* AI Analysis Result */}
                {ev.ai_analysis && (
                  <div style={{ marginTop: "15px", padding: "15px", backgroundColor: theme.cardBg, borderRadius: "6px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                      <strong style={{ color: "#4da6ff" }}>🤖 AI Analysis Result</strong>
                      <span style={{ color: "#00cc00", fontSize: "12px" }}>
                        Confidence: {ev.ai_analysis.confidence_score}%
                      </span>
                    </div>
                    
                    <p style={{ marginBottom: "10px", color: theme.text }}>{ev.ai_analysis.situation_summary}</p>
                    
                    {ev.ai_analysis.help_needed && ev.ai_analysis.help_needed.length > 0 && (
                      <div style={{ marginTop: "10px" }}>
                        <strong style={{ color: "#ff9933" }}>🚨 Help Needed:</strong>
                        <div style={{ display: "flex", gap: "10px", marginTop: "5px", flexWrap: "wrap" }}>
                          {ev.ai_analysis.help_needed.map((help, idx) => (
                            <span key={idx} style={{ 
                              backgroundColor: darkMode ? "#333" : "#eee", 
                              padding: "4px 10px", 
                              borderRadius: "15px",
                              fontSize: "12px",
                              color: theme.text
                            }}>
                              {help}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {ev.ai_analysis.video_info && (
                      <div style={{ marginTop: "10px", fontSize: "12px", color: theme.textSecondary }}>
                        Video: {ev.ai_analysis.video_info.duration_seconds}s | {ev.ai_analysis.video_info.resolution}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Analyze Button */}
                <div style={{ marginTop: "15px" }}>
                  <button
                    onClick={() => analyzeVideo(ev.id, ev.case_id)}
                    disabled={analyzingId === ev.id}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: analyzingId === ev.id ? "#444" : "#4da6ff",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: analyzingId === ev.id ? "not-allowed" : "pointer",
                      fontSize: "13px"
                    }}
                  >
                    {analyzingId === ev.id ? "⏳ Analyzing..." : "🤖 Analyze with AI"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===============================
           REGISTER POLICE MODAL
      ================================= */}
      {showRegisterPoliceModal && (
        <div style={overlayStyle} onClick={() => setShowRegisterPoliceModal(false)}>
          <div style={{...modalStyle, width: "550px"}} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ color: theme.text, marginBottom: "20px" }}>👮 Register Police Officer</h2>
            
            {/* Badge Number */}
            <label style={{ display: "block", marginBottom: "8px", color: theme.text }}>
              Badge Number *
            </label>
            <input
              type="text"
              name="badge_number"
              value={registerPoliceData.badge_number}
              onChange={handleRegisterPoliceChange}
              placeholder="e.g., OFF001"
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: "15px",
                borderRadius: "6px",
                border: `1px solid ${theme.border}`,
                backgroundColor: darkMode ? "#222" : "#fff",
                color: darkMode ? "white" : "#333",
                fontSize: "14px"
              }}
            />

            {/* Officer Name */}
            <label style={{ display: "block", marginBottom: "8px", color: theme.text }}>
              Officer Name *
            </label>
            <input
              type="text"
              name="officer_name"
              value={registerPoliceData.officer_name}
              onChange={handleRegisterPoliceChange}
              placeholder="Full name"
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: "15px",
                borderRadius: "6px",
                border: `1px solid ${theme.border}`,
                backgroundColor: darkMode ? "#222" : "#fff",
                color: darkMode ? "white" : "#333",
                fontSize: "14px"
              }}
            />

            {/* Rank and Station Row */}
            <div style={{ display: "flex", gap: "15px" }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", marginBottom: "8px", color: theme.text }}>
                  Rank
                </label>
                <select
                  name="rank"
                  value={registerPoliceData.rank}
                  onChange={handleRegisterPoliceChange}
                  style={{
                    width: "100%",
                    padding: "10px",
                    marginBottom: "15px",
                    borderRadius: "6px",
                    border: `1px solid ${theme.border}`,
                    backgroundColor: darkMode ? "#222" : "#fff",
                    color: darkMode ? "white" : "#333",
                    fontSize: "14px"
                  }}
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
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", marginBottom: "8px", color: theme.text }}>
                  Station
                </label>
                <input
                  type="text"
                  name="station"
                  value={registerPoliceData.station}
                  onChange={handleRegisterPoliceChange}
                  placeholder="Station name"
                  style={{
                    width: "100%",
                    padding: "10px",
                    marginBottom: "15px",
                    borderRadius: "6px",
                    border: `1px solid ${theme.border}`,
                    backgroundColor: darkMode ? "#222" : "#fff",
                    color: darkMode ? "white" : "#333",
                    fontSize: "14px"
                  }}
                />
              </div>
            </div>

            {/* Email */}
            <label style={{ display: "block", marginBottom: "8px", color: theme.text }}>
              Email
            </label>
            <input
              type="email"
              name="email"
              value={registerPoliceData.email}
              onChange={handleRegisterPoliceChange}
              placeholder="officer@police.gov"
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: "15px",
                borderRadius: "6px",
                border: `1px solid ${theme.border}`,
                backgroundColor: darkMode ? "#222" : "#fff",
                color: darkMode ? "white" : "#333",
                fontSize: "14px"
              }}
            />

            {/* Password */}
            <label style={{ display: "block", marginBottom: "8px", color: theme.text }}>
              Password *
            </label>
            <input
              type="password"
              name="password"
              value={registerPoliceData.password}
              onChange={handleRegisterPoliceChange}
              placeholder="Minimum 6 characters"
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: "15px",
                borderRadius: "6px",
                border: `1px solid ${theme.border}`,
                backgroundColor: darkMode ? "#222" : "#fff",
                color: darkMode ? "white" : "#333",
                fontSize: "14px"
              }}
            />

            {/* Error Message */}
            {registerPoliceError && (
              <div style={{
                color: "#ff5252",
                marginBottom: "15px",
                fontSize: "14px",
                padding: "10px",
                backgroundColor: darkMode ? "#3d0f0f" : "#ffebee",
                borderRadius: "6px"
              }}>
                {registerPoliceError}
              </div>
            )}

            {/* Success Message */}
            {registerPoliceSuccess && (
              <div style={{
                color: "#00cc00",
                marginBottom: "15px",
                fontSize: "14px",
                padding: "10px",
                backgroundColor: darkMode ? "#0d3d0d" : "#e8f5e9",
                borderRadius: "6px"
              }}>
                {registerPoliceSuccess}
              </div>
            )}

            {/* Buttons */}
            <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
              <button
                onClick={registerPoliceOfficer}
                disabled={registeringPolice}
                style={{
                  flex: 1,
                  padding: "12px",
                  backgroundColor: registeringPolice ? "#444" : "#1565c0",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: registeringPolice ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  fontWeight: "bold"
                }}
              >
                {registeringPolice ? "Registering..." : "✅ Register Officer"}
              </button>
              <button
                onClick={() => {
                  setShowRegisterPoliceModal(false);
                  setRegisterPoliceError("");
                  setRegisterPoliceSuccess("");
                }}
                style={{
                  flex: 1,
                  padding: "12px",
                  backgroundColor: darkMode ? "#333" : "#ddd",
                  color: darkMode ? "white" : "#333",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px"
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;

