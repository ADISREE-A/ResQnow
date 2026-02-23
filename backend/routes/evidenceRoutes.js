const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const db = require("../config/db");

// Storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Upload Evidence
router.post("/upload", upload.single("file"), (req, res) => {

  const { latitude, longitude, emergency_id } = req.body;

  const sql = `
    INSERT INTO evidence 
    (emergency_id, file_path, latitude, longitude)
    VALUES (?, ?, ?, ?)
  `;

  db.query(
    sql,
    [emergency_id || null, req.file.path, latitude, longitude],
    (err) => {
      if (err) return res.status(500).json(err);

      res.json({ message: "Evidence uploaded successfully ✅" });
    }
  );
});

module.exports = router;