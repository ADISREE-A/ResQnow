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

const SurvivalMode = () => {
  const [panicActivated, setPanicActivated] = useState(false);
  const [currentHazard, setCurrentHazard] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [nearbyDanger, setNearbyDanger] = useState(null);
  const [hazards, setHazards] = useState([]);

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
    <div style={styles.container}>
      {/* HEADER */}
      <div style={styles.header}>
        <h1>🚨 Survival Mode</h1>
        <p>{panicActivated ? "Emergency Active" : "Press Panic if in danger"}</p>

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
        </div>

        {/* RIGHT SIDE */}
        <div style={styles.rightPanel}>
          <EmergencyChat />

{/* Proper Hazard Selection */}
          <HazardReport onHazardSelect={(hazard) => setCurrentHazard(hazard)} />

          {/* Emergency Contacts */}
          <EmergencyContacts />

          <button
            onClick={() => setShowHistory(true)}
            style={styles.historyBtn}
          >
            📜 View Hazard History
          </button>
        </div>
      </div>

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

      {/* HISTORY MODAL */}
      {showHistory && (
        <HazardHistory onClose={() => setShowHistory(false)} />
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
  }
};

export default SurvivalMode;