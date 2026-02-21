const db = require("../config/db");

// Save message
exports.saveMessage = (data, callback) => {
  const query = `
    INSERT INTO messages 
    (username, message, latitude, longitude, type) 
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(
    query,
    [
      data.username,
      data.message,
      data.location?.lat || null,
      data.location?.lng || null,
      data.type || "normal"
    ],
    callback
  );
};

// Get all messages
exports.getMessages = (callback) => {
  db.query("SELECT * FROM messages ORDER BY created_at ASC", callback);
};