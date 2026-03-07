const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const db = require("../config/db");
const { analyzeVideo } = require("../services/videoAnalyzer");

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

// ================= AI VIDEO ANALYSIS =================
router.post("/analyze/:id", async (req, res) => {
  const { id } = req.params;
  const { case_id } = req.body;

  // Get evidence file path
  const sql = `SELECT * FROM evidence WHERE id = ?`;
  
  db.query(sql, [id], async (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Database query failed" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Evidence not found" });
    }

    const evidence = results[0];
    const videoPath = evidence.file_path;

    try {
      // Run AI analysis
      console.log("Starting AI analysis for:", videoPath);
      const analysisResult = await analyzeVideo(videoPath);
      
      // Update evidence record with AI analysis
      const updateSql = `
        UPDATE evidence 
        SET ai_analysis = ?, case_id = ?, analyzed_at = NOW()
        WHERE id = ?
      `;
      
      const analysisJson = JSON.stringify(analysisResult);
      
      db.query(updateSql, [analysisJson, case_id || null, id], (updateErr, updateResult) => {
        if (updateErr) {
          console.error("Update error:", updateErr);
          return res.status(500).json({ 
            error: "Analysis complete but failed to save",
            analysis: analysisResult 
          });
        }

        res.json({
          message: "✅ Video analysis complete",
          evidence_id: id,
          case_id: case_id,
          analysis: analysisResult
        });
      });

    } catch (error) {
      console.error("Analysis error:", error);
      res.status(500).json({ error: "Video analysis failed: " + error.message });
    }
  });
});

// ================= GET EVIDENCE WITH AI ANALYSIS =================
router.get("/with-analysis", (req, res) => {
  const { case_id } = req.query;

  let sql = `
    SELECT * FROM evidence
    WHERE is_deleted = 0
  `;

  if (case_id) {
    sql += ` AND case_id = ?`;
  }

  sql += ` ORDER BY created_at DESC`;

  const params = case_id ? [case_id] : [];

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("Fetch error:", err);
      return res.status(500).json({ error: "Database fetch failed" });
    }

    // Parse AI analysis JSON for each evidence
    const parsedResults = results.map(evidence => ({
      ...evidence,
      ai_analysis: evidence.ai_analysis ? JSON.parse(evidence.ai_analysis) : null
    }));

    res.json(parsedResults);
  });
});

module.exports = router;
