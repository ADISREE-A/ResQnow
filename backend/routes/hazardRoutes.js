const express = require("express");
const router = express.Router();
const { saveHazard, getAllHazards } = require("../models/HazardModel");

// POST hazard
router.post("/report", (req, res) => {
  const { username, type, severity, description, location } = req.body;

  const hazardData = {
    username,
    type,
    severity,
    description,
    latitude: location.lat,
    longitude: location.lng
  };

  saveHazard(hazardData, (err) => {
    if (err) {
      console.log("DB Error:", err);
      return res.status(500).json({ error: "Failed to save hazard" });
    }

    res.json({ message: "Hazard reported successfully" });
  });
});

// GET history
router.get("/all", (req, res) => {
  getAllHazards((err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

module.exports = router;