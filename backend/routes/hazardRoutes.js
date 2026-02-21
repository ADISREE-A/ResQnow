const express = require("express");
const router = express.Router();
const { saveHazard } = require("../models/HazardModel");

router.post("/report", (req, res) => {
  const { type, description, location } = req.body;

  if (!type || !location) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const hazardData = {
    type,
    description,
    latitude: location.lat,
    longitude: location.lng
  };

  saveHazard(hazardData, (err) => {
    if (err) {
      console.log("DB Error:", err);
      return res.status(500).json({ message: "Database error" });
    }

    res.status(200).json({ message: "Hazard reported successfully" });
  });
});

module.exports = router;