const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const db = require("../config/db");

// ================= STORAGE CONFIG =================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// ================= UPLOAD EVIDENCE =================
router.post("/upload", upload.single("file"), (req, res) => {

  const { latitude, longitude, emergency_id } = req.body;

  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const sql = `
    INSERT INTO evidence
    (emergency_id, file_path, latitude, longitude, is_deleted)
    VALUES (?, ?, ?, ?, 0)
  `;

  db.query(
    sql,
    [emergency_id || null, req.file.path, latitude, longitude],
    (err, result) => {
      if (err) {
        console.error("Insert error:", err);
        return res.status(500).json({ error: "Database insert failed" });
      }

      res.json({ message: "Evidence uploaded successfully ✅" });
    }
  );
});

// ================= SOFT DELETE =================
router.put("/delete/:id", (req, res) => {

  const { id } = req.params;

  const sql = `
    UPDATE evidence
    SET is_deleted = 1
    WHERE id = ?
  `;

  db.query(sql, [id], (err, result) => {

    if (err) {
      console.error("Update error:", err);
      return res.status(500).json({ error: "Database update failed" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Evidence not found" });
    }

    console.log("Archived ID:", id);

    res.json({ message: "Evidence moved to archive ✅" });
  });
});

// ================= GET ACTIVE EVIDENCE =================
router.get("/all", (req, res) => {

  const sql = `
    SELECT * FROM evidence
    WHERE is_deleted = 0
    ORDER BY created_at DESC
  `;

  db.query(sql, (err, results) => {

    if (err) {
      console.error("Fetch error:", err);
      return res.status(500).json({ error: "Database fetch failed" });
    }

    res.json(results);
  });
});

module.exports = router;