import React from "react";
import { speak } from "../utils/voice";

const VoiceGuide = ({ message }) => {

  const handleSpeak = () => {
    speak(message);
  };

  return (
    <div style={{ marginTop: "20px" }}>
      <button 
        onClick={handleSpeak}
        style={{
          padding: "10px 20px",
          backgroundColor: "orange",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer"
        }}
      >
        🔊 Play Voice Guidance
      </button>
    </div>
  );
};

export default VoiceGuide;