const db = require("../config/db");

// Save Hazard
const saveHazard = (hazard, callback) => {
  const sql = `
    INSERT INTO hazards 
    (case_id, username, type, severity, description, latitude, longitude, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      hazard.case_id,
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

// Get All Hazards
const getAllHazards = (callback) => {
  db.query("SELECT * FROM hazards ORDER BY created_at DESC", callback);
};

module.exports = {
  saveHazard,
  getAllHazards
};