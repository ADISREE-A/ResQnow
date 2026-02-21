const db = require("../config/db");

const saveHazard = (hazardData, callback) => {
  const { type, description, latitude, longitude } = hazardData;

  const sql = `
    INSERT INTO hazards (type, description, latitude, longitude)
    VALUES (?, ?, ?, ?)
  `;

  db.query(sql, [type, description, latitude, longitude], callback);
};

module.exports = { saveHazard };