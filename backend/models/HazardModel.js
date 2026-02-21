const db = require("../config/db");

const saveHazard = (hazard, callback) => {
  const sql = `
    INSERT INTO hazards 
    (username, type, severity, description, latitude, longitude, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      hazard.username,
      hazard.type,
      hazard.severity,
      hazard.description,
      hazard.latitude,
      hazard.longitude,
      "Open"
    ],
    callback
  );
};

const getAllHazards = (callback) => {
  db.query("SELECT * FROM hazards ORDER BY created_at DESC", callback);
};

module.exports = { saveHazard, getAllHazards };