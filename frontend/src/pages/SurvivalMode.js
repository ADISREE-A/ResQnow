import React, { useEffect, useState } from "react";
import LocationTracker from "../components/LocationTracker";
import LiveMap from "../components/LiveMap";
import VoiceGuide from "../components/VoiceGuide";
import EmergencyChat from "../components/EmergencyChat";
import { speak } from "../utils/voice";
import io from "socket.io-client";

const socket = io("http://localhost:5000");

const SurvivalMode = () => {

  const [username] = useState("Adi"); // You can later make dynamic
  const [location, setLocation] = useState(null);

  // ✅ Join emergency when page loads
  useEffect(() => {
    socket.emit("joinEmergency", username);

    // Get current location
    navigator.geolocation.getCurrentPosition((position) => {
      const currentLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      setLocation(currentLocation);
    });
  }, [username]);

  // ✅ Panic Handler
  const handlePanic = () => {

    speak("Emergency alert sent. Stay calm. Sharing your live location now.");

    socket.emit("panicActivated", {
      username: username,
      location: location
    });

    console.log("🚨 Panic activated");
  };

  return (
    <div style={{
      backgroundColor: "#000",
      color: "white",
      minHeight: "100vh",
      textAlign: "center",
      paddingTop: "80px"
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
      <EmergencyChat />

    </div>
  );
};

export default SurvivalMode;