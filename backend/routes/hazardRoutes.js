const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { saveHazard, getAllHazards } = require("../models/HazardModel");

// Generate Case ID
const generateCaseId = () => {
  return "CASE-" + Date.now();
};

// POST hazard
router.post("/report", (req, res) => {
  const { username, type, severity, description, location } = req.body;

  if (!location) {
    return res.status(400).json({ error: "Location missing" });
  }

  const hazardData = {
    case_id: generateCaseId(),
    username,
    type,
    severity,
    description,
    latitude: location.lat,
    longitude: location.lng
  };

  saveHazard(hazardData, (err) => {
    if (err) {
      console.log("DB ERROR:", err);
      return res.status(500).json({ error: "DB error" });
    }

    res.json({
      message: "Hazard reported successfully",
      case_id: hazardData.case_id
    });
  });
});

// GET history
router.get("/all", (req, res) => {
  getAllHazards((err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

// Update status
router.put("/update-status/:caseId", (req, res) => {
  const { status } = req.body;
  const { caseId } = req.params;

  const sql = "UPDATE hazards SET status = ? WHERE case_id = ?";

  db.query(sql, [status, caseId], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Status updated" });
  });
});

module.exports = router;