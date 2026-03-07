import React, { useEffect, useState } from "react";
import DangerZoneMap from "./DangerZoneMap";

const PoliceDashboard = ({ officerName, officerRank, viewMode = "dashboard" }) => {

  const [hazards, setHazards] = useState([]);
  const [myHazards, setMyHazards] = useState([]);
  const [officers, setOfficers] = useState([]); // List of officers for dropdown
  const [selectedFilter, setSelectedFilter] = useState("ALL");
  const [selectedCase, setSelectedCase] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [assignOfficerName, setAssignOfficerName] = useState("");
  const [assignOfficerId, setAssignOfficerId] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [actionsTaken, setActionsTaken] = useState("");
  
  // Evidence & AI Analysis state
  const [evidence, setEvidence] = useState([]);
  const [selectedEvidence, setSelectedEvidence] = useState(null);
  const [analyzingId, setAnalyzingId] = useState(null);

  // Rank hierarchy (higher index = higher rank)
  const rankHierarchy = ["Constable", "Patrol", "Sergeant", "Detective", "Lieutenant", "Captain", "Chief"];
  
  // Check if current officer can assign cases (must be Sergeant or higher)
  const canAssign = rankHierarchy.indexOf(officerRank) >= rankHierarchy.indexOf("Sergeant");
  
  // Check if current officer can assign to a specific officer
  const canAssignTo = (targetOfficerRank) => {
    return rankHierarchy.indexOf(officerRank) > rankHierarchy.indexOf(targetOfficerRank);
  };

  /* ===============================
     FETCH OFFICERS LIST
  ================================= */
  useEffect(() => {
    fetchOfficers();
  }, []);

  const fetchOfficers = () => {
    fetch("http://localhost:5000/api/officers")
      .then(res => res.json())
      .then(data => {
        // Handle case where API returns error object instead of array
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
     FETCH ALL HAZARDS
  ================================= */
  useEffect(() => {
    fetchAllHazards();
    fetchEvidenceWithAnalysis();
    if (officerName) {
      fetchMyCases();
    }
  }, [officerName]);

  const fetchAllHazards = () => {
    fetch("http://localhost:5000/api/hazards/all")
      .then(res => res.json())
      .then(data => setHazards(data))
      .catch(err => console.error(err));
  };

  const fetchMyCases = () => {
    fetch(`http://localhost:5000/api/hazards/my-cases?officer_name=${encodeURIComponent(officerName)}`)
      .then(res => res.json())
      .then(data => setMyHazards(data))
      .catch(err => console.error(err));
  };

  /* ===============================
     FETCH EVIDENCE WITH AI ANALYSIS
  ================================= */
  const fetchEvidenceWithAnalysis = () => {
    fetch("http://localhost:5000/api/evidence/with-analysis")
      .then(res => res.json())
      .then(data => setEvidence(data))
      .catch(err => console.error("Error fetching evidence:", err));
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
     DETERMINE WHICH DATA TO SHOW
  ================================= */
  const displayHazards = viewMode === "assigned" ? myHazards : hazards;
  
  /* ===============================
     CALCULATIONS
  ================================= */
  const total = displayHazards.length;
  const open = displayHazards.filter(h => h.status === "Open").length;
  const closed = displayHazards.filter(h => h.status === "Closed").length;
  const myAssigned = myHazards.length;
  const myOpen = myHazards.filter(h => h.status === "Open").length;

  /* ===============================
     FILTERING
  ================================= */
  const filteredHazards = displayHazards.filter(hazard => {
    if (selectedFilter === "ALL") return true;
    if (selectedFilter === "OPEN") return hazard.status === "Open";
    if (selectedFilter === "CLOSED") return hazard.status === "Closed";
    if (selectedFilter === "CRITICAL")
      return hazard.risk_level === "Critical" || hazard.severity === "Critical";
    if (selectedFilter === "UNASSIGNED") return !hazard.assigned_officer;
    return true;
  });

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
            officer_name: assignOfficerName || officerName,
            officer_id: assignOfficerId,
            assigned_by: officerName // Track who assigned this case
          })
        }
      );
      
      const result = await res.json();
      console.log(result);
      
      // Refresh data
      fetchAllHazards();
      fetchMyCases();
      
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
     UPDATE STATUS
  ================================= */
  const updateStatus = async (newStatus) => {
    if (!selectedCase) return;

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
      const updateInList = (list) =>
        list.map(h =>
          h.case_id === selectedCase.case_id
            ? { ...h, status: newStatus }
            : h
        );
      
      setHazards(updateInList);
      setMyHazards(updateInList);
      setSelectedCase(prev => ({ ...prev, status: newStatus }));

    } catch (err) {
      console.error("Update failed", err);
    }
  };

  /* ===============================
     GENERATE REPORT & CLOSE CASE
  ================================= */
  const generateReport = async () => {
    if (!selectedCase) return;

    try {
      const res = await fetch(
        `http://localhost:5000/api/hazards/generate-report/${selectedCase.case_id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            resolution_notes: resolutionNotes,
            actions_taken: actionsTaken
          })
        }
      );
      
      const result = await res.json();
      console.log("Report generated:", result);
      
      // Show the generated report
      if (result.report) {
        alert(`📄 Report Generated!\n\nCase: ${result.report.case_id}\nStatus: ${result.report.status}\n\n${result.report.incident_summary}`);
      }
      
      // Refresh data
      fetchAllHazards();
      fetchMyCases();
      
      setShowReportModal(false);
      setResolutionNotes("");
      setActionsTaken("");
      setSelectedCase(null);
      
    } catch (err) {
      console.error("Report generation failed", err);
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
    backgroundColor: "#111",
    padding: "30px",
    borderRadius: "12px",
    width: "500px",
    maxHeight: "80vh",
    overflowY: "auto",
    color: "white",
    boxShadow: "0 0 25px rgba(0,0,0,0.6)"
  };

  const closeButtonStyle = {
    marginTop: "20px",
    padding: "10px 20px",
    backgroundColor: "#333",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer"
  };

  const inputStyle = {
    width: "100%",
    padding: "10px",
    marginBottom: "15px",
    borderRadius: "6px",
    border: "1px solid #444",
    backgroundColor: "#222",
    color: "white",
    fontSize: "14px"
  };

  return (
    <div style={{ marginTop: "20px", padding: "20px", color: "white" }}>

      <h2>📊 Police Dashboard</h2>

      {/* ===============================
           SUMMARY CARDS
      ================================= */}
      <div style={{ display: "flex", gap: "20px", marginBottom: "30px", flexWrap: "wrap" }}>
        
        {/* Total */}
        <div
          onClick={() => setSelectedFilter("ALL")}
          style={{
            flex: 1,
            minWidth: "150px",
            background: selectedFilter === "ALL" ? "#444" : "#222",
            padding: "20px",
            borderRadius: "10px",
            textAlign: "center",
            cursor: "pointer"
          }}
        >
          <h3>Total Cases</h3>
          <h1 style={{ color: "#4da6ff" }}>{total}</h1>
        </div>

        {/* Open */}
        <div
          onClick={() => setSelectedFilter("OPEN")}
          style={{
            flex: 1,
            minWidth: "150px",
            background: selectedFilter === "OPEN" ? "#555" : "#333",
            padding: "20px",
            borderRadius: "10px",
            textAlign: "center",
            cursor: "pointer"
          }}
        >
          <h3>Open Cases</h3>
          <h1 style={{ color: "#ff9933" }}>{open}</h1>
        </div>

        {/* Closed */}
        <div
          onClick={() => setSelectedFilter("CLOSED")}
          style={{
            flex: 1,
            minWidth: "150px",
            background: selectedFilter === "CLOSED" ? "#444" : "#222",
            padding: "20px",
            borderRadius: "10px",
            textAlign: "center",
            cursor: "pointer"
          }}
        >
          <h3>Closed Cases</h3>
          <h1 style={{ color: "#00cc00" }}>{closed}</h1>
        </div>

        {/* My Assigned */}
        {officerName && (
          <div
            onClick={() => setSelectedFilter("MY")}
            style={{
              flex: 1,
              minWidth: "150px",
              background: selectedFilter === "MY" ? "#1565c0" : "#0d47a1",
              padding: "20px",
              borderRadius: "10px",
              textAlign: "center",
              cursor: "pointer"
            }}
          >
            <h3>My Cases</h3>
            <h1 style={{ color: "#4da6ff" }}>{myAssigned}</h1>
            <p style={{ fontSize: "12px" }}>{myOpen} open</p>
          </div>
        )}

        {/* Unassigned */}
        <div
          onClick={() => setSelectedFilter("UNASSIGNED")}
          style={{
            flex: 1,
            minWidth: "150px",
            background: selectedFilter === "UNASSIGNED" ? "#555" : "#333",
            padding: "20px",
            borderRadius: "10px",
            textAlign: "center",
            cursor: "pointer"
          }}
        >
          <h3>Unassigned</h3>
          <h1 style={{ color: "#888" }}>
            {hazards.filter(h => !h.assigned_officer).length}
          </h1>
        </div>
      </div>

      {/* ===============================
           DANGER ZONE HEATMAP
      ================================= */}
      <div style={{ marginBottom: "30px" }}>
        <h2 style={{ marginBottom: "15px" }}>🔥 Danger Zone Heatmap</h2>
        <DangerZoneMap height="400px" showLegend={true} />
      </div>

      {/* ===============================
           CASE LIST
      ================================= */}
      <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        <h3>Cases ({filteredHazards.length})</h3>
        {filteredHazards.map((hazard) => (
          <div
            key={hazard.case_id}
            style={{
              background: "#1a1a1a",
              padding: "15px",
              borderRadius: "8px",
              borderLeft:
                hazard.status === "Closed"
                  ? "5px solid green"
                  : hazard.risk_level === "Critical"
                  ? "5px solid red"
                  : hazard.assigned_officer === officerName
                  ? "5px solid #1565c0"
                  : "5px solid gray"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <strong
                  style={{ cursor: "pointer", color: "#4da6ff" }}
                  onClick={() => setSelectedCase(hazard)}
                >
                  {hazard.case_id}
                </strong>
                <span style={{ marginLeft: "10px", color: "#888" }}>{hazard.type}</span>
              </div>
              <div>
                {hazard.assigned_officer ? (
                  <span style={{ color: "#1565c0", fontSize: "12px" }}>
                    👤 {hazard.assigned_officer}
                  </span>
                ) : (
                  <span style={{ color: "#666", fontSize: "12px" }}>Unassigned</span>
                )}
              </div>
            </div>
            
            <p style={{ margin: "5px 0", fontSize: "14px" }}>
              Status: <span style={{ 
                color: hazard.status === "Open" ? "#ff9933" : "#00cc00",
                fontWeight: "bold"
              }}>{hazard.status}</span>
              {" | "}
              Severity: {hazard.severity}
              {" | "}
              Risk: {hazard.risk_level}
            </p>

            {/* Quick Actions */}
            <div style={{ marginTop: "10px", display: "flex", gap: "10px" }}>
              {hazard.status === "Open" && (
                <>
                  {/* Only show Assign button for Sergeant+ */}
                  {canAssign && (
                    <button
                      onClick={() => {
                        setSelectedCase(hazard);
                        setShowAssignModal(true);
                      }}
                      style={{
                        padding: "6px 12px",
                        backgroundColor: "#1565c0",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "12px"
                      }}
                    >
                      📌 Assign
                    </button>
                  )}
                  
                  {/* Show Close Report only for assigned officer */}
                  {hazard.assigned_officer === officerName && (
                    <button
                      onClick={() => {
                        setSelectedCase(hazard);
                        setShowReportModal(true);
                      }}
                      style={{
                        padding: "6px 12px",
                        backgroundColor: "#2e7d32",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "12px"
                      }}
                    >
                      📄 Close & Generate Report
                    </button>
                  )}
                </>
              )}
              
              {/* Show "Take Case" only if canAssign and not already assigned to self */}
              {hazard.assigned_officer !== officerName && hazard.status === "Open" && canAssign && (
                <button
                  onClick={() => {
                    setSelectedCase(hazard);
                    setAssignOfficerName(officerName);
                    setShowAssignModal(true);
                  }}
                  style={{
                    padding: "6px 12px",
                    backgroundColor: "#1565c0",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "12px"
                  }}
                >
                  🎯 Take Case
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ===============================
           FLOATING CASE DETAILS MODAL
      ================================= */}
      {selectedCase && !showAssignModal && !showReportModal && (
        <div style={overlayStyle} onClick={() => setSelectedCase(null)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <h2>📄 Case Details</h2>

            <p><strong>Case ID:</strong> {selectedCase.case_id}</p>
            <p><strong>Username:</strong> {selectedCase.username}</p>
            <p><strong>Type:</strong> {selectedCase.type}</p>
            <p><strong>Description:</strong> {selectedCase.description}</p>

            {/* STATUS DROPDOWN */}
            <div style={{ marginTop: "10px" }}>
              <strong>Status:</strong>
              <select
                value={selectedCase.status}
                onChange={(e) => updateStatus(e.target.value)}
                style={{
                  marginLeft: "10px",
                  padding: "6px",
                  borderRadius: "5px",
                  background: "#222",
                  color: "white",
                  border: "1px solid #555"
                }}
              >
                <option value="Open">Open</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            <p><strong>Assigned Officer:</strong> {selectedCase.assigned_officer || "Unassigned"}</p>
            <p><strong>Assigned By:</strong> {selectedCase.assigned_by || "System"}</p>
            <p><strong>User Severity:</strong> {selectedCase.severity}</p>
            <p><strong>Auto Severity:</strong> {selectedCase.auto_severity}</p>
            <p><strong>Risk Score:</strong> {selectedCase.risk_score}</p>
            <p><strong>Risk Level:</strong> {selectedCase.risk_level}</p>
            <p><strong>Confidence:</strong> {selectedCase.confidence}%</p>
            <p><strong>Location:</strong> {selectedCase.latitude}, {selectedCase.longitude}</p>
            <p><strong>Created At:</strong> {selectedCase.created_at}</p>

            {/* Resolution Notes if closed */}
            {selectedCase.status === "Closed" && selectedCase.resolution_notes && (
              <div style={{ marginTop: "15px", padding: "10px", backgroundColor: "#222", borderRadius: "6px" }}>
                <strong>Resolution Notes:</strong>
                <p>{selectedCase.resolution_notes}</p>
              </div>
            )}

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
            <h2>📌 Assign Officer</h2>
            <p><strong>Case:</strong> {selectedCase?.case_id}</p>
            <p><strong>Assigned By:</strong> {officerName}</p>
            
            <label style={{ display: "block", marginBottom: "8px" }}>
              Select Officer:
            </label>
            <select
              onChange={handleOfficerSelect}
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: "15px",
                borderRadius: "6px",
                border: "1px solid #444",
                backgroundColor: "#222",
                color: "white",
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
            
            <label style={{ display: "block", marginBottom: "8px" }}>
              Or Enter Officer Name:
            </label>
            <input
              type="text"
              value={assignOfficerName}
              onChange={(e) => setAssignOfficerName(e.target.value)}
              placeholder="Enter officer name manually"
              style={inputStyle}
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
                  backgroundColor: "#333",
                  color: "white",
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
      <div style={{ marginTop: "40px", padding: "20px", backgroundColor: "#1a1a1a", borderRadius: "10px" }}>
        <h2 style={{ marginBottom: "15px" }}>🤖 AI Video Analysis</h2>
        <p style={{ color: "#888", marginBottom: "20px" }}>
          Analyze uploaded evidence videos using AI to extract key information, detect emergency indicators, and identify what help is needed.
        </p>
        
        {evidence.length === 0 ? (
          <div style={{ padding: "20px", textAlign: "center", color: "#666" }}>
            No evidence available for analysis. Evidence will appear here after being uploaded in Survival Mode.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            {evidence.map((ev) => (
              <div
                key={ev.id}
                style={{
                  background: "#222",
                  padding: "15px",
                  borderRadius: "8px",
                  borderLeft: ev.ai_analysis ? "5px solid #4da6ff" : "5px solid #666"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <strong>📹 Evidence #{ev.id}</strong>
                    <span style={{ marginLeft: "10px", color: "#888" }}>
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
                
                <p style={{ margin: "10px 0", fontSize: "13px", color: "#aaa" }}>
                  📍 Location: {ev.latitude}, {ev.longitude}
                </p>
                
                {/* AI Analysis Result */}
                {ev.ai_analysis && (
                  <div style={{ marginTop: "15px", padding: "15px", backgroundColor: "#1a1a1a", borderRadius: "6px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                      <strong style={{ color: "#4da6ff" }}>🤖 AI Analysis Result</strong>
                      <span style={{ color: "#00cc00", fontSize: "12px" }}>
                        Confidence: {ev.ai_analysis.confidence_score}%
                      </span>
                    </div>
                    
                    <p style={{ marginBottom: "10px" }}>{ev.ai_analysis.situation_summary}</p>
                    
                    {ev.ai_analysis.help_needed && ev.ai_analysis.help_needed.length > 0 && (
                      <div style={{ marginTop: "10px" }}>
                        <strong style={{ color: "#ff9933" }}>🚨 Help Needed:</strong>
                        <div style={{ display: "flex", gap: "10px", marginTop: "5px", flexWrap: "wrap" }}>
                          {ev.ai_analysis.help_needed.map((help, idx) => (
                            <span key={idx} style={{ 
                              backgroundColor: "#333", 
                              padding: "4px 10px", 
                              borderRadius: "15px",
                              fontSize: "12px"
                            }}>
                              {help}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {ev.ai_analysis.video_info && (
                      <div style={{ marginTop: "10px", fontSize: "12px", color: "#666" }}>
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

    </div>
  );
};

export default PoliceDashboard;

