import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

const EmergencyChat = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    socket.on("receiveMessage", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => socket.off("receiveMessage");
  }, []);

  const sendMessage = () => {
    if (message.trim() === "") return;

    socket.emit("sendMessage", message);
    setMessage("");
  };

  return (
    <div style={{ marginTop: "20px" }}>
      <h2>💬 Emergency Chat</h2>

      <div style={{
        background: "#222",
        height: "150px",
        overflowY: "auto",
        padding: "10px",
        marginBottom: "10px"
      }}>
        {messages.map((msg, index) => (
          <div key={index}>{msg}</div>
        ))}
      </div>

      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type emergency message..."
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
};

export default EmergencyChat;