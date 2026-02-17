const db = require("../config/db");

exports.saveLocation = (req, res) => {
  const { latitude, longitude } = req.body;

  const sql = `
    INSERT INTO live_locations (latitude, longitude)
    VALUES (?, ?)
  `;

  db.query(sql, [latitude, longitude], (err) => {
    if (err) return res.status(500).json({ error: "DB error" });
    res.json({ message: "Location updated" });
  });
};
