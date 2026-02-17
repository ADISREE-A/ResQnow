const db = require("../config/db");

exports.createEmergency = (req, res) => {
  const { latitude, longitude, type } = req.body;

  const sql = `
    INSERT INTO emergencies (latitude, longitude, type)
    VALUES (?, ?, ?)
  `;

  db.query(sql, [latitude, longitude, type], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database error" });
    }

    res.json({ message: "Emergency logged successfully ✅" });
  });
};
