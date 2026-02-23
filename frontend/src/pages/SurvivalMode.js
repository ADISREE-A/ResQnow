import React, { useState } from "react";
import LocationTracker from "../components/LocationTracker";
import LiveMap from "../components/LiveMap";
import EmergencyChat from "../components/EmergencyChat";
import HazardReport from "../components/HazardReport";
import HazardHistory from "../components/HazardHistory";
import { speak } from "../utils/voice";

const SurvivalMode = () => {

  const [panicActivated, setPanicActivated] = useState(false);
  const [currentHazard, setCurrentHazard] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  // 🚨 PANIC BUTTON FUNCTION
  const handlePanic = () => {

    const panicVoice =
      "Emergency alert activated. Authorities have been informed. Sharing your live location now.";

    speak(panicVoice);

    navigator.geolocation.getCurrentPosition(async (position) => {

      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;

      try {
        await fetch("http://localhost:5000/api/emergency/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            latitude,
            longitude,
            type: currentHazard || "Panic"
          })
        });

        console.log("Emergency stored in database");

        // 🧠 Give hazard-based guidance AFTER storing
        if (currentHazard) {
          speak(getHazardGuidance(currentHazard));
        } else {
          speak("Stay calm. Help is on the way. Move to a safe and open area.");
        }

      } catch (error) {
        console.error("Error storing emergency:", error);
      }
    });

    setPanicActivated(true);
  };

  // 🧠 Hazard-based Guidance Logic
  const getHazardGuidance = (type) => {
    switch (type) {
      case "Fire":
        return "Fire detected. Move away from flames. Avoid smoke. Stay low and exit safely.";
      case "Flood":
        return "Flood detected. Move to higher ground immediately.";
      case "Accident":
        return "Accident reported. Stay still if injured and avoid unnecessary movement.";
      case "Earthquake":
        return "Earthquake detected. Take cover under sturdy furniture and protect your head.";
      case "Gas Leak":
        return "Gas leak reported. Avoid flames. Move to open air immediately.";
      case "Medical Emergency":
        return "Medical emergency reported. Stay calm. Help is being dispatched.";
      case "Trapped":
        return "You are trapped. Conserve energy and make noise periodically for rescuers.";
      case "Kidnapped":
        return "Stay calm. Avoid confrontation and observe surroundings carefully.";
      case "Lost Path":
        return "You are lost. Stay where you are if safe and share your location.";
      default:
        return "Stay calm. Emergency services are responding.";
    }
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

        {/* LEFT PANEL */}
        <div style={styles.leftPanel}>
          <LiveMap />
        </div>

        {/* RIGHT PANEL */}
        <div style={styles.rightPanel}>

          <EmergencyChat />

          <HazardReport onHazardSelect={setCurrentHazard} />

          <button
            onClick={() => setShowHistory(true)}
            style={styles.historyBtn}
          >
            📜 View Hazard History
          </button>

        </div>

      </div>

      <LocationTracker />

      {/* HISTORY MODAL */}
      {showHistory && (
        <HazardHistory onClose={() => setShowHistory(false)} />
      )}

    </div>
  );
};

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