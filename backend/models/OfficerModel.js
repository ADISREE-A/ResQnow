const db = require("../config/db");

// 🔹 Get All Active Officers
const getAllOfficers = (callback) => {
  const sql = "SELECT id, badge_number, officer_name, `rank`, station, email, is_active, created_at FROM officers WHERE is_active = TRUE ORDER BY officer_name ASC";
  db.query(sql, callback);
};

// 🔹 Get Officer by Badge Number
const getOfficerByBadge = (badgeNumber, callback) => {
  const sql = "SELECT * FROM officers WHERE badge_number = ? AND is_active = TRUE";
  db.query(sql, [badgeNumber], callback);
};

// 🔹 Get Officer by ID
const getOfficerById = (id, callback) => {
  const sql = "SELECT id, badge_number, officer_name, `rank`, station, email, is_active, created_at FROM officers WHERE id = ? AND is_active = TRUE";
  db.query(sql, [id], callback);
};

// 🔹 Create New Officer
const createOfficer = (officer, callback) => {
  const sql = `
    INSERT INTO officers 
    (badge_number, officer_name, \`rank\`, station, email, password_hash, is_active) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  
  db.query(
    sql,
    [
      officer.badge_number,
      officer.officer_name,
      officer.rank || null,
      officer.station || null,
      officer.email || null,
      officer.password_hash,
      true
    ],
    callback
  );
};

// 🔹 Verify Officer Credentials
const verifyOfficer = (badgeNumber, password, callback) => {
  const sql = "SELECT * FROM officers WHERE badge_number = ? AND password_hash = ? AND is_active = TRUE";
  db.query(sql, [badgeNumber, password], callback);
};

// 🔹 Update Officer
const updateOfficer = (id, officer, callback) => {
  const sql = `
    UPDATE officers 
    SET officer_name = ?, \`rank\` = ?, station = ?, email = ?
    WHERE id = ?
  `;
  
  db.query(
    sql,
    [officer.officer_name, officer.rank, officer.station, officer.email, id],
    callback
  );
};

// 🔹 Deactivate Officer (Soft Delete)
const deactivateOfficer = (id, callback) => {
  const sql = "UPDATE officers SET is_active = FALSE WHERE id = ?";
  db.query(sql, [id], callback);
};

module.exports = {
  getAllOfficers,
  getOfficerByBadge,
  getOfficerById,
  createOfficer,
  verifyOfficer,
  updateOfficer,
  deactivateOfficer
};

