const db = require("../config/db");

exports.createEmergency = (req, res) => {
  const { latitude, longitude } = req.body;

  if (!latitude || !longitude) {
    return res.status(400).json({ error: "Location required" });
  }

  const sql = `
    INSERT INTO emergencies (latitude, longitude, status)
    VALUES (?, ?, ?)
  `;

  db.query(sql, [latitude, longitude, "Active"], (err, result) => {
    if (err) {
      console.error("DB ERROR:", err);
      return res.status(500).json({ error: "Database error" });
    }

    res.json({ message: "Emergency stored successfully" });
  });
};