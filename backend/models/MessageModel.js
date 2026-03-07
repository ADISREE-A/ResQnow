const db = require("../config/db");

// Save message
exports.saveMessage = (data, callback) => {
  const query = `
    INSERT INTO messages 
    (username, message, latitude, longitude, type, priority, target_role) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    query,
    [
      data.username,
      data.message,
      data.location?.lat || null,
      data.location?.lng || null,
      data.type || "normal",
      data.priority || "normal",
      data.targetRole || null
    ],
    callback
  );
};

// Get all messages
exports.getMessages = (callback) => {
  db.query("SELECT * FROM messages ORDER BY created_at ASC", callback);
};

// Get messages by type
exports.getMessagesByType = (type, callback) => {
  db.query(
    "SELECT * FROM messages WHERE type = ? ORDER BY created_at ASC",
    [type],
    callback
  );
};

// Get messages by role
exports.getMessagesByRole = (role, callback) => {
  db.query(
    "SELECT * FROM messages WHERE target_role = ? OR target_role IS NULL ORDER BY created_at ASC",
    [role],
    callback
  );
};

