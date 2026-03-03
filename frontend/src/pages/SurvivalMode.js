import React, { useState } from "react";
import LiveMap from "../components/LiveMap";
import EmergencyChat from "../components/EmergencyChat";
import HazardReport from "../components/HazardReport";
import HazardHistory from "../components/HazardHistory";
import EvidenceRecorder from "../components/EvidenceRecorder";
import { speak } from "../utils/voice";

const SurvivalMode = () => {
  const [panicActivated, setPanicActivated] = useState(false);
  const [currentHazard, setCurrentHazard] = useState("");
  const [showHistory, setShowHistory] = useState(false);

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
        </div>

        {/* RIGHT SIDE */}
        <div style={styles.rightPanel}>
          <EmergencyChat />

          {/* Proper Hazard Selection */}
          <HazardReport onHazardSelect={(hazard) => setCurrentHazard(hazard)} />

          <button
            onClick={() => setShowHistory(true)}
            style={styles.historyBtn}
          >
            📜 View Hazard History
          </button>
        </div>
      </div>

      <EvidenceRecorder />

      {/* HISTORY MODAL */}
      {showHistory && (
        <HazardHistory onClose={() => setShowHistory(false)} />
      )}
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