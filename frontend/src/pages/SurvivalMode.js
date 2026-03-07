import React, { useState, useEffect } from "react";
import LiveMap from "../components/LiveMap";
import DangerZoneMap from "../components/DangerZoneMap";
import EmergencyChat from "../components/EmergencyChat";
import EmergencyContacts from "../components/EmergencyContacts";
import HazardReport from "../components/HazardReport";
import HazardHistory from "../components/HazardHistory";
import EvidenceRecorder from "../components/EvidenceRecorder";
import AIChatbot from "../components/AIChatbot";
import { speak } from "../utils/voice";

const SurvivalMode = ({ darkMode = true, toggleTheme }) => {
  const [panicActivated, setPanicActivated] = useState(false);
  const [currentHazard, setCurrentHazard] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [showAllContacts, setShowAllContacts] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [nearbyDanger, setNearbyDanger] = useState(null);
  const [hazards, setHazards] = useState([]);

  // Dynamic styles based on theme
  const theme = {
    bg: darkMode ? "#0d0d0d" : "#f5f5f5",
    text: darkMode ? "#ffffff" : "#333333",
    panelBg: darkMode ? "#111111" : "#ffffff",
    border: darkMode ? "#333333" : "#cccccc",
    accent: darkMode ? "#4ecca3" : "#2196F3"
  };

  /* Get user location and check for nearby dangers */
  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setUserLocation(loc);
        checkNearbyDangers(loc);
      },
      (err) => console.error("Location error:", err),
      { enableHighAccuracy: true }
    );

    // Also fetch hazards
    fetch("http://localhost:5000/api/hazards/all")
      .then(res => res.json())
      .then(data => setHazards(data))
      .catch(err => console.error(err));
  }, []);

  /* Check if user is near any danger zone */
  const checkNearbyDangers = (location) => {
    const dangerThreshold = 0.01; // ~1km

    hazards.forEach(hazard => {
      const latDiff = Math.abs(hazard.latitude - location.lat);
      const lngDiff = Math.abs(hazard.longitude - location.lng);

      if (latDiff < dangerThreshold && lngDiff < dangerThreshold) {
        if (hazard.risk_level === "Critical" || hazard.risk_level === "High") {
          setNearbyDanger(`Warning! ${hazard.risk_level} risk zone nearby: ${hazard.type}`);
          
          // Voice warning
          speak(`Warning. You are approaching a ${hazard.risk_level.toLowerCase()} danger zone. ${hazard.type} reported in this area.`);
        }
      }
    });
  };

  /* Re-check dangers when hazards change */
  useEffect(() => {
    if (userLocation) {
      checkNearbyDangers(userLocation);
    }
  }, [hazards, userLocation]);

  /* 🧠 Hazard-based Guidance */
  const getHazardGuidance = (type) => {
    switch (type) {
      case "Fire":
        return "Fire detected. Stay low to avoid smoke. Move away from flames and exit safely.";
      case "Flood":
        return "Flood detected. Move to higher ground immediately.";
      case "Accident":
        return "Accident reported. Avoid sudden movement if injured.";
      case "Earthquake":
        return "Earthquake detected. Drop, cover and hold on.";
      case "Gas Leak":
        return "Gas leak detected. Avoid flames and move to fresh air.";
      case "Medical Emergency":
        return "Medical emergency reported. Stay calm. Help is coming.";
      case "Trapped":
        return "You are trapped. Conserve energy and signal for help.";
      case "Kidnapped":
        return "Stay calm. Avoid confrontation and observe surroundings.";
      case "Lost Path":
        return "You are lost. Stay where you are if safe and share your location.";
      default:
        return "Stay calm. Emergency services are responding.";
    }
  };

  /* 🎙 Panic Button Logic */
  const handlePanic = () => {
    setPanicActivated(true);

    // Stop previous speech
    window.speechSynthesis.cancel();

    const calmMessage =
      "Take a deep breath. Emergency alert activated. Sharing your live location.";

    speak(calmMessage);

    if (!navigator.geolocation) {
      speak("Location service is not available.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        try {
          await fetch("http://localhost:5000/api/emergency/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              latitude,
              longitude,
              type: currentHazard || "Panic"
            })
          });

          console.log("Emergency stored");

          // Delay hazard instruction slightly
          setTimeout(() => {
            speak(getHazardGuidance(currentHazard));
          }, 3000);

        } catch (error) {
          console.error("Server error:", error);
          speak("Emergency triggered, but there was a server issue.");
        }
      },
      () => speak("Unable to access location. Please enable GPS."),
      { enableHighAccuracy: true }
    );
  };

  return (
    <div style={{...styles.container, backgroundColor: darkMode ? "#0d0d0d" : "#f5f5f5", color: darkMode ? "white" : "#333"}}>
      
      {/* 🎨 Theme Toggle Button */}
      {toggleTheme && (
        <button
          onClick={toggleTheme}
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            width: "50px",
            height: "50px",
            borderRadius: "50%",
            backgroundColor: darkMode ? "#4ecca3" : "#2196F3",
            color: darkMode ? "#000" : "#fff",
            border: "none",
            fontSize: "24px",
            cursor: "pointer",
            boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
            zIndex: 1000
          }}
          title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {darkMode ? "☀️" : "🌙"}
        </button>
      )}

      {/* HEADER */}
      <div style={{...styles.header, color: darkMode ? "white" : "#333"}}>
        <h1 style={{color: darkMode ? "white" : "#333"}}>🚨 Survival Mode</h1>
        <p style={{color: darkMode ? "#ccc" : "#666"}}>{panicActivated ? "Emergency Active" : "Press Panic if in danger"}</p>

        <button onClick={handlePanic} style={styles.panicBtn}>
          🚨 PANIC
        </button>
      </div>

      {/* MAIN SECTION */}
      <div style={styles.mainContent}>
        {/* MAP */}
        <div style={styles.leftPanel}>
          <LiveMap />

          <EvidenceRecorder />
          {/* DANGER ZONE MAP SECTION */}
      <div style={{ marginTop: "20px" }}>
        <h2 style={{ marginBottom: "15px" }}>🔥 Danger Zones Nearby</h2>
        <DangerZoneMap 
          height="400px" 
          showLegend={true} 
          userLocation={userLocation}
          dangerWarning={nearbyDanger}
        />
      </div>
      {/* Floating Emergency Contact Button */}
      <button
        onClick={() => setShowAllContacts(true)}
        style={styles.floatingContactBtn}
        title="View All Emergency Contacts"
      >
        📞 Contacts
      </button>
        </div>

        {/* RIGHT SIDE */}
        <div style={styles.rightPanel}>
          <EmergencyChat />

{/* Proper Hazard Selection */}
          <HazardReport onHazardSelect={(hazard) => setCurrentHazard(hazard)} />

          {/* Emergency Contacts
          <EmergencyContacts /> */}

          <button
            onClick={() => setShowHistory(true)}
            style={styles.historyBtn}
          >
            📜 View Hazard History
          </button>
        </div>
      </div>

      

      {/* HISTORY MODAL */}
      {showHistory && (
        <HazardHistory onClose={() => setShowHistory(false)} />
      )}

      {/* Emergency Contacts Modal - Shows All Contacts */}
      {showAllContacts && (
        <div style={styles.modalOverlay} onClick={() => setShowAllContacts(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2>📞 All Emergency Contacts</h2>
              <button 
                onClick={() => setShowAllContacts(false)}
                style={styles.closeBtn}
              >
                ✕
              </button>
            </div>
            <EmergencyContacts showAll={true} />
          </div>
        </div>
      )}

      {/* AI CHATBOT */}
      <AIChatbot currentHazard={currentHazard} userLocation={userLocation} />

    </div>
  );
};

/* 🎨 Styles */
const styles = {
  container: {
    backgroundColor: "#0d0d0d",
    color: "white",
    minHeight: "100vh",
    padding: "20px",
    fontFamily: "Arial"
  },
  header: {
    textAlign: "center",
    marginBottom: "20px"
  },
  panicBtn: {
    marginTop: "15px",
    padding: "15px 40px",
    fontSize: "18px",
    backgroundColor: "red",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer"
  },
  historyBtn: {
    marginTop: "10px",
    padding: "10px 20px",
    backgroundColor: "#333",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer"
  },
  mainContent: {
    display: "flex",
    gap: "20px"
  },
  leftPanel: {
    flex: 2,
    backgroundColor: "#111",
    padding: "15px",
    borderRadius: "10px"
  },
  rightPanel: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "20px"
  },
  floatingContactBtn: {
    position: "fixed",
    bottom: "30px",
    right: "30px",
    padding: "15px 25px",
    fontSize: "16px",
    backgroundColor: "#4da6ff",
    color: "white",
    border: "none",
    borderRadius: "30px",
    cursor: "pointer",
    fontWeight: "bold",
    boxShadow: "0 4px 15px rgba(77, 166, 255, 0.4)",
    zIndex: 1000
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2000,
    padding: "20px"
  },
  modalContent: {
    backgroundColor: "#1a1a1a",
    borderRadius: "15px",
    padding: "20px",
    maxWidth: "600px",
    width: "100%",
    maxHeight: "90vh",
    overflowY: "auto"
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "15px",
    borderBottom: "1px solid #333",
    paddingBottom: "10px"
  },
  closeBtn: {
    background: "none",
    border: "1px solid #ff6b6b",
    color: "#ff6b6b",
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    cursor: "pointer",
    fontSize: "16px"
  }
};

export default SurvivalMode;