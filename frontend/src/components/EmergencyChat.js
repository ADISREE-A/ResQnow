import React, { useEffect, useState, useRef } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:5000");

const EmergencyChat = () => {

  const [username] = useState("Adi"); // Later make dynamic
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [location, setLocation] = useState(null);

  const messagesEndRef = useRef(null);

  // 📍 Get user location
  useEffect(() => {
    navigator.geolocation.getCurrentPosition((position) => {
      setLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      });
    });
  }, []);

  // 🔵 Join emergency room
  useEffect(() => {
    socket.emit("joinEmergency", username);
  }, [username]);

  // 📩 Listen for messages
  useEffect(() => {
    socket.on("receiveMessage", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      socket.off("receiveMessage");
    };
  }, []);

  // 🔽 Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
      backgroundColor: "#0f0f0f",
      padding: "20px",
      marginTop: "30px",
      borderRadius: "12px",
      width: "100%",
      maxWidth: "600px",
      marginInline: "auto",
      boxShadow: "0 0 15px rgba(255,0,0,0.2)"
    }}>

      <h2 style={{ marginBottom: "15px" }}>💬 Emergency Chat</h2>

      {/* Chat Messages */}
      <div style={{
        height: "300px",
        overflowY: "auto",
        marginBottom: "15px",
        textAlign: "left",
        paddingRight: "5px"
      }}>
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              marginBottom: "12px",
              padding: "10px",
              borderRadius: "8px",
              backgroundColor:
                msg.type === "alert" ? "#5c0000" : "#1e1e1e",
              border:
                msg.type === "alert" ? "1px solid red" : "1px solid #333"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <strong style={{ color: "#ff4d4d" }}>{msg.username}</strong>
              <span style={{ fontSize: "12px", color: "#aaa" }}>
                {msg.timestamp}
              </span>
            </div>

            <div style={{ marginTop: "5px" }}>{msg.message}</div>

            {/* 📍 Location Link */}
            {msg.location && (
              <a
                href={`https://www.google.com/maps?q=${msg.location.lat},${msg.location.lng}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  color: "#4da6ff",
                  fontSize: "12px",
                  display: "block",
                  marginTop: "5px"
                }}
              >
                📍 View Location
              </a>
            )}
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{ display: "flex", gap: "10px" }}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type emergency message..."
          style={{
            flex: 1,
            padding: "10px",
            borderRadius: "6px",
            border: "none",
            outline: "none"
          }}
        />

        <button
          onClick={sendMessage}
          style={{
            padding: "10px 20px",
            backgroundColor: "red",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "bold"
          }}
        >
          Send
        </button>
      </div>

    </div>
  );
};

export default EmergencyChat;