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
           GENERATE REPORT MODAL
      ================================= */}
      {showReportModal && (
        <div style={overlayStyle} onClick={() => setShowReportModal(false)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <h2>📄 Generate Report & Close Case</h2>
            <p><strong>Case:</strong> {selectedCase?.case_id}</p>
            <p><strong>Type:</strong> {selectedCase?.type}</p>
            <p><strong>Risk Level:</strong> {selectedCase?.risk_level}</p>
            
            <label style={{ display: "block", marginBottom: "8px", marginTop: "15px" }}>
              Resolution Notes:
            </label>
            <textarea
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="Describe how the case was resolved..."
              style={{...inputStyle, minHeight: "80px", resize: "vertical"}}
            />
            
            <label style={{ display: "block", marginBottom: "8px" }}>
              Actions Taken:
            </label>
            <textarea
              value={actionsTaken}
              onChange={(e) => setActionsTaken(e.target.value)}
              placeholder="List actions taken to resolve this case..."
              style={{...inputStyle, minHeight: "80px", resize: "vertical"}}
            />
            
            <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
              <button
                onClick={generateReport}
                style={{
                  flex: 1,
                  padding: "12px",
                  backgroundColor: "#2e7d32",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "bold"
                }}
              >
                📄 Generate Report & Close
              </button>
              <button
                onClick={() => setShowReportModal(false)}
                style={{
                  flex: 1,
                  padding: "12px",
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

    </div>
  );
};

export default PoliceDashboard;

