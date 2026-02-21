import React from "react";
import LocationTracker from "../components/LocationTracker";
import LiveMap from "../components/LiveMap";
import VoiceGuide from "../components/VoiceGuide";
import EmergencyChat from "../components/EmergencyChat";
import HazardReport from "../components/HazardReport";
import { speak } from "../utils/voice";

const SurvivalMode = () => {

  const handlePanic = () => {
    speak("Emergency alert sent. Stay calm. Sharing your live location now.");
    console.log("Panic button clicked");
  };

  return (
    <div style={styles.container}>

      {/* 🔥 HEADER */}
      <div style={styles.header}>
        <h1>🚨 Survival Mode Activated</h1>
        <p>Stay Calm. Help is being notified.</p>

        <button onClick={handlePanic} style={styles.panicBtn}>
          🚨 PANIC
        </button>
      </div>

      {/* 🔥 MAIN CONTENT */}
      <div style={styles.mainContent}>

        {/* LEFT SIDE */}
        <div style={styles.leftPanel}>
          <LiveMap />
        </div>

        {/* RIGHT SIDE */}
        <div style={styles.rightPanel}>
          <EmergencyChat />
          
          <HazardReport />
        </div>

      </div>

      <LocationTracker />

      <VoiceGuide message="Stay calm. Help is on the way. Move to a safe and open area." />
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