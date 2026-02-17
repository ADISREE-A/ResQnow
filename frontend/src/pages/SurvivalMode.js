import React from "react";
import LocationTracker from "../components/LocationTracker";

const SurvivalMode = () => {
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

      <LocationTracker />
    </div>
  );
};

export default SurvivalMode;
