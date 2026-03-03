const db = require("../config/db");

// 🔹 Save Hazard (With Risk Engine Fields)
const saveHazard = (hazard, callback) => {
  const sql = `
    INSERT INTO hazards
    (
      case_id,
      username,
      type,
      severity,
      auto_severity,
      description,
      latitude,
      longitude,
      risk_score,
      risk_level,
      confidence,
      status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      hazard.case_id,
      hazard.username,
      hazard.type,
      hazard.severity,
      hazard.auto_severity,
      hazard.description,
      hazard.latitude,
      hazard.longitude,
      hazard.risk_score,
      hazard.risk_level,
      hazard.confidence,
      "Open"
    ],
    callback
  );
};

// 🔹 Get All Hazards
const getAllHazards = (callback) => {
  db.query(
    "SELECT * FROM hazards ORDER BY risk_score DESC, created_at DESC",
    callback
  );
};

module.exports = {
  saveHazard,
  getAllHazards
};