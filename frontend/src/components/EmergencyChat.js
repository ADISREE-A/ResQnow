import React, { useEffect, useState, useRef } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:5000");

const EmergencyChat = ({ userRole = "user", userName = "Guest" }) => {
  const [username, setUsername] = useState(userName);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [location, setLocation] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notification, setNotification] = useState(null);
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastPriority, setBroadcastPriority] = useState("normal");
  const messagesEndRef = useRef(null);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (err) => console.error("Location error:", err),
        { enableHighAccuracy: true }
      );
    }
  }, []);

  // Connect to socket and join rooms
  useEffect(() => {
    setIsConnected(true);
    
    // Join emergency room
    socket.emit("joinEmergency", username);
    
    // Also join role-specific rooms for broadcasting
    if (userRole === "admin") {
      socket.emit("joinRole", "admin");
    } else if (userRole === "police") {
      socket.emit("joinRole", "police");
    } else {
      socket.emit("joinRole", "user");
    }

    // Listen for connection status
    socket.on("connect", () => {
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    // Request connected users
    socket.emit("getConnectedUsers");

    return () => {
      socket.off("connect");
      socket.off("disconnect");
    };
  }, [username, userRole]);

  // Listen for all types of messages
  useEffect(() => {
    // Normal messages
    socket.on("receiveMessage", (data) => {
      handleNewMessage(data);
    });

    // Admin broadcasts
    socket.on("adminBroadcast", (data) => {
      handleNewMessage({ ...data, type: "admin" });
    });

    // Police alerts
    socket.on("policeAlert", (data) => {
      handleNewMessage({ ...data, type: "police" });
    });

    // System notifications
    socket.on("systemNotification", (data) => {
      handleNewMessage({ ...data, type: "system" });
    });

    // Role messages
    socket.on("roleMessage", (data) => {
      handleNewMessage({ ...data, type: "role_message" });
    });

    // Connected users update
    socket.on("connectedUsers", (users) => {
      setConnectedUsers(users);
    });

    return () => {
      socket.off("receiveMessage");
      socket.off("adminBroadcast");
      socket.off("policeAlert");
      socket.off("systemNotification");
      socket.off("roleMessage");
      socket.off("connectedUsers");
    };
  }, []);

  // Handle incoming messages
  const handleNewMessage = (data) => {
    setMessages((prev) => [...prev, data]);
    
    // Show notification for urgent messages
    if (data.type === "alert" || data.type === "police" || data.type === "admin" || data.priority === "critical") {
      setNotification(`${data.username}: ${data.message.substring(0, 50)}...`);
      setTimeout(() => setNotification(null), 5000);
      
      // Play notification sound for urgent messages
      if (data.type === "alert" || data.priority === "critical") {
        playNotificationSound();
      }
    }
  };

  // Play notification sound
  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.value = 800;
      oscillator.type = "sine";
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
      console.log("Audio not supported");
    }
  };

  // Send message
  const sendMessage = (e) => {
    e?.preventDefault();
    if (!message.trim()) return;
    socket.emit("sendMessage", { username, message, location, priority: "normal" });
    setMessage("");
  };

  // Send admin broadcast
  const sendBroadcast = () => {
    if (!broadcastMessage.trim()) return;
    socket.emit("adminBroadcast", { username, message: broadcastMessage, priority: broadcastPriority });
    setBroadcastMessage("");
    setShowBroadcastModal(false);
  };

  // Send police alert
  const sendPoliceAlert = () => {
    if (!message.trim()) return;
    socket.emit("sendPoliceAlert", { username, message, location, priority: "high" });
    setMessage("");
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Get message style based on type
  const getMessageStyle = (msg) => {
    const baseStyle = { maxWidth: "75%", padding: "12px 16px", borderRadius: "12px", marginBottom: "10px", wordBreak: "break-word" };
    switch (msg.type) {
      case "alert": return { ...baseStyle, backgroundColor: "#ff3333", color: "white", border: "2px solid #ff0000" };
      case "police": return { ...baseStyle, backgroundColor: "#1565c0", color: "white", border: "2px solid #0d47a1" };
      case "admin": return { ...baseStyle, backgroundColor: "#6a1b9a", color: "white", border: "2px solid #4a148c" };
      case "system": return { ...baseStyle, backgroundColor: "#333", color: "#aaa", fontStyle: "italic", fontSize: "12px" };
      case "role_message": return { ...baseStyle, backgroundColor: "#1b5e20", color: "white" };
      default: return msg.username === username || msg.username === userName ? { ...baseStyle, backgroundColor: "#4da6ff", color: "white", marginLeft: "auto" } : { ...baseStyle, backgroundColor: "#333", color: "white", marginRight: "auto" };
    }
  };

  // Get message icon
  const getMessageIcon = (msg) => {
    switch (msg.type) {
      case "alert": return "🚨";
      case "police": return "🚔";
      case "admin": return "📢";
      case "system": return "🔔";
      case "role_message": return "💬";
      default: return "💬";
    }
  };

  // Format timestamp
  const formatTime = (timestamp) => new Date(timestamp || timestamp?.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <h3 style={styles.title}>🚨 Emergency Chat</h3>
          <span style={styles.connectionStatus}>{isConnected ? "🟢 Connected" : "🔴 Disconnected"}</span>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.userRole}>{userRole === "admin" ? "👑 Admin" : userRole === "police" ? "👮 Police" : "👤 User"}</span>
          <span style={styles.userCount}>👥 {connectedUsers.length} online</span>
        </div>
      </div>

      {(userRole === "admin" || userRole === "police") && (
        <div style={styles.controls}>
          {userRole === "admin" && <button onClick={() => setShowBroadcastModal(true)} style={styles.broadcastBtn}>📢 Broadcast</button>}
          {(userRole === "admin" || userRole === "police") && <button onClick={sendPoliceAlert} disabled={!message.trim()} style={styles.alertBtn}>🚔 Alert</button>}
        </div>
      )}

      {(userRole === "admin" || userRole === "police") && connectedUsers.length > 0 && (
        <div style={styles.usersPanel}>
          <h4 style={styles.usersTitle}>Online Users:</h4>
          <div style={styles.usersList}>
            {connectedUsers.map((user, index) => (<span key={index} style={styles.userBadge}>{user.role === "admin" ? "👑" : user.role === "police" ? "👮" : "👤"} {user.username}</span>))}
          </div>
        </div>
      )}

      <div style={styles.messagesArea}>
        {messages.map((msg, index) => (
          <div key={index} style={{ ...getMessageStyle(msg), display: "flex", flexDirection: "column", alignItems: msg.username === username || msg.username === userName ? "flex-end" : "flex-start" }}>
            <div style={styles.messageHeader}>
              <span style={styles.messageIcon}>{getMessageIcon(msg)}</span>
              <span style={styles.messageUsername}>{msg.username}</span>
              <span style={styles.messageTime}>{formatTime(msg.timestamp || msg.created_at)}</span>
            </div>
            <div style={styles.messageContent}>{msg.message}</div>
            {msg.location && <div style={styles.messageLocation}>📍 {msg.location.lat?.toFixed(4)}, {msg.location.lng?.toFixed(4)}</div>}
            {(msg.priority === "critical" || msg.priority === "high") && <div style={styles.priorityBadge}>{msg.priority === "critical" ? "🔴 CRITICAL" : "🟠 HIGH"}</div>}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {notification && <div style={styles.notification}>{notification}</div>}

      <form onSubmit={sendMessage} style={styles.inputArea}>
        <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type your message..." style={styles.input} />
        <button type="submit" style={styles.sendBtn}>➤</button>
      </form>

      {showBroadcastModal && (
        <div style={styles.modalOverlay} onClick={() => setShowBroadcastModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>📢 Broadcast Message</h3>
            <textarea value={broadcastMessage} onChange={(e) => setBroadcastMessage(e.target.value)} placeholder="Enter message..." style={styles.textarea} rows={4} />
            <div style={styles.prioritySelect}>
              <label>Priority: </label>
              <select value={broadcastPriority} onChange={(e) => setBroadcastPriority(e.target.value)} style={styles.select}>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div style={styles.modalButtons}>
              <button onClick={sendBroadcast} style={styles.modalSendBtn}>📢 Broadcast</button>
              <button onClick={() => setShowBroadcastModal(false)} style={styles.modalCancelBtn}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { display: "flex", flexDirection: "column", height: "500px", backgroundColor: "#1a1a1a", borderRadius: "12px", overflow: "hidden", fontFamily: "Arial, sans-serif" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px 20px", backgroundColor: "#2d2d2d", borderBottom: "1px solid #444" },
  headerLeft: { display: "flex", alignItems: "center", gap: "15px" },
  title: { margin: 0, color: "#fff", fontSize: "18px" },
  connectionStatus: { fontSize: "12px", color: "#888" },
  headerRight: { display: "flex", alignItems: "center", gap: "15px" },
  userRole: { padding: "5px 10px", backgroundColor: "#333", borderRadius: "15px", fontSize: "12px", color: "#4da6ff" },
  userCount: { fontSize: "12px", color: "#888" },
  controls: { display: "flex", gap: "10px", padding: "10px 20px", backgroundColor: "#222", borderBottom: "1px solid #444" },
  broadcastBtn: { padding: "8px 16px", backgroundColor: "#6a1b9a", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "13px" },
  alertBtn: { padding: "8px 16px", backgroundColor: "#1565c0", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "13px" },
  usersPanel: { padding: "10px 20px", backgroundColor: "#222", borderBottom: "1px solid #444" },
  usersTitle: { margin: "0 0 8px 0", fontSize: "12px", color: "#888" },
  usersList: { display: "flex", flexWrap: "wrap", gap: "8px" },
  userBadge: { padding: "4px 8px", backgroundColor: "#333", borderRadius: "12px", fontSize: "11px", color: "#ccc" },
  messagesArea: { flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column" },
  messageHeader: { display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" },
  messageIcon: { fontSize: "14px" },
  messageUsername: { fontSize: "12px", fontWeight: "bold", color: "rgba(255,255,255,0.8)" },
  messageTime: { fontSize: "10px", color: "rgba(255,255,255,0.5)" },
  messageContent: { fontSize: "14px", lineHeight: "1.4" },
  messageLocation: { fontSize: "10px", color: "rgba(255,255,255,0.6)", marginTop: "4px" },
  priorityBadge: { fontSize: "10px", fontWeight: "bold", marginTop: "4px", padding: "2px 6px", borderRadius: "4px", backgroundColor: "rgba(0,0,0,0.3)" },
  notification: { position: "absolute", top: "70px", left: "50%", transform: "translateX(-50%)", backgroundColor: "#ff3333", color: "white", padding: "10px 20px", borderRadius: "8px", fontSize: "13px", zIndex: 100, boxShadow: "0 4px 12px rgba(0,0,0,0.3)" },
  inputArea: { display: "flex", gap: "10px", padding: "15px 20px", backgroundColor: "#2d2d2d", borderTop: "1px solid #444" },
  input: { flex: 1, padding: "12px 16px", borderRadius: "8px", border: "1px solid #444", backgroundColor: "#333", color: "white", fontSize: "14px", outline: "none" },
  sendBtn: { padding: "12px 20px", backgroundColor: "#4da6ff", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "16px" },
  modalOverlay: { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.7)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 },
  modal: { backgroundColor: "#222", padding: "25px", borderRadius: "12px", width: "400px", maxWidth: "90%" },
  modalTitle: { margin: "0 0 15px 0", color: "white" },
  textarea: { width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #444", backgroundColor: "#333", color: "white", fontSize: "14px", resize: "none", outline: "none" },
  prioritySelect: { marginTop: "15px", color: "white" },
  select: { padding: "6px 12px", borderRadius: "6px", backgroundColor: "#333", color: "white", border: "1px solid #444" },
  modalButtons: { display: "flex", gap: "10px", marginTop: "20px" },
  modalSendBtn: { flex: 1, padding: "10px", backgroundColor: "#6a1b9a", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" },
  modalCancelBtn: { flex: 1, padding: "10px", backgroundColor: "#444", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }
};

export default EmergencyChat;
