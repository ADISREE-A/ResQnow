import React from "react";
import LocationTracker from "../components/LocationTracker";
import LiveMap from "../components/LiveMap";
import { speak } from "../utils/voice";
import VoiceGuide from "../components/VoiceGuide";

const SurvivalMode = () => {

  // ✅ Panic Handler goes here
  const handlePanic = () => {
    speak("Emergency alert sent. Stay calm. Sharing your live location now.");

    // If you already have backend panic API,
    // call it here using fetch or axios
    console.log("Panic button clicked");
  };

  return (
    <div style={{
      backgroundColor: "#000",
      color: "white",
      height: "100vh",
      textAlign: "center",
      paddingTop: "100px"
    }}>
      
      <h1>🚨 Survival Mode Activated</h1>
      <p>Stay Calm. Help is being notified.</p>

      {/* ✅ Panic Button */}
      <button
        onClick={handlePanic}
        style={{
          padding: "15px 30px",
          fontSize: "18px",
          backgroundColor: "red",
          color: "white",
          border: "none",
          borderRadius: "10px",
          cursor: "pointer",
          marginBottom: "20px"
        }}
      >
        🚨 PANIC
      </button>

      <LocationTracker />
      <VoiceGuide message="Stay calm. Help is on the way. Move to a safe and open area." />
      <LiveMap />

    </div>
  );
};

export default SurvivalMode;