import React, { useEffect, useState } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:5000");

const EmergencyChat = () => {

  const [username] = useState("Adi"); // Later make dynamic
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [location, setLocation] = useState(null);

  // 📍 Get user location
  useEffect(() => {
    navigator.geolocation.getCurrentPosition((position) => {
      setLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      });
    });
  }, []);

  // 📩 Listen for incoming messages
  useEffect(() => {
    socket.on("receiveMessage", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => socket.off("receiveMessage");
  }, []);

  // 📨 Send Message
  const sendMessage = () => {
    if (!message.trim()) return;

    socket.emit("sendMessage", {
      username,
      message,
      location
    });

    setMessage("");
  };

  return (
    <div style={{
      backgroundColor: "#111",
      padding: "20px",
      marginTop: "30px",
      borderRadius: "10px"
    }}>

      <h2>💬 Emergency Chat</h2>

      {/* Chat Messages */}
      <div style={{
        maxHeight: "250px",
        overflowY: "auto",
        marginBottom: "15px",
        textAlign: "left"
      }}>
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              marginBottom: "10px",
              padding: "10px",
              borderRadius: "8px",
              backgroundColor:
                msg.type === "alert" ? "#5c0000" : "#222"
            }}
          >
            <strong>{msg.username}</strong>  
            <span style={{ fontSize: "12px", marginLeft: "8px" }}>
              {msg.timestamp}
            </span>

            <div>{msg.message}</div>

            {/* 📍 Show location if available */}
            {msg.location && (
              <a
                href={`https://www.google.com/maps?q=${msg.location.lat},${msg.location.lng}`}
                target="_blank"
                rel="noreferrer"
                style={{ color: "#4da6ff", fontSize: "12px" }}
              >
                📍 View Location
              </a>
            )}
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div style={{ display: "flex", gap: "10px" }}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type emergency message..."
          style={{
            flex: 1,
            padding: "10px",
            borderRadius: "5px",
            border: "none"
          }}
        />

        <button
          onClick={sendMessage}
          style={{
            padding: "10px 20px",
            backgroundColor: "red",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer"
          }}
        >
          Send
        </button>
      </div>

    </div>
  );
};

export default EmergencyChat;