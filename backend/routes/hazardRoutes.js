const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { saveHazard, getAllHazards } = require("../models/HazardModel");
const { generateRiskAnalysis } = require("../services/riskEngine");

/* ===============================
   🔹 Generate Case ID
================================= */
const generateCaseId = () => {
  return "CASE-" + Date.now();
};

/* ===============================
   🔹 POST Hazard (Integrated with Risk Engine)
================================= */
router.post("/report", async (req, res) => {
  const { username, type, severity, description, location } = req.body;

  if (!location || !location.lat || !location.lng) {
    return res.status(400).json({ error: "Valid location required" });
  }

  try {
    const riskResult = await generateRiskAnalysis(
      description,
      location.lat,
      location.lng
    );

    const hazardData = {
      case_id: generateCaseId(),
      username,
      type,
      severity,
      description,
      latitude: location.lat,
      longitude: location.lng,
      auto_severity: riskResult.auto_severity,
      risk_score: riskResult.risk_score,
      risk_level: riskResult.risk_level,
      confidence: riskResult.confidence,
      status: "Open" // ✅ Default status
    };

    saveHazard(hazardData, (err) => {
      if (err) {
        console.log("DB ERROR:", err);
        return res.status(500).json({ error: "Database error" });
      }

      res.status(201).json({
        message: "Hazard reported successfully",
        case_id: hazardData.case_id,
        prediction: riskResult
      });
    });

  } catch (error) {
    console.error("Risk Engine Error:", error);
    res.status(500).json({ error: "Risk analysis failed" });
  }
});

/* ===============================
   🔹 GET All Hazards
================================= */
router.get("/all", (req, res) => {
  getAllHazards((err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

/* ===============================
   🔹 UPDATE Hazard Status
================================= */
router.put("/update-status/:caseId", async (req, res) => {
  const { status } = req.body;
  const { caseId } = req.params;

  // ✅ Validate status
  if (!status || !["Open", "Closed"].includes(status)) {
    return res.status(400).json({ error: "Invalid status value" });
  }

  try {
    const sql = `
      UPDATE hazards 
      SET status = ?, updated_at = NOW()
      WHERE case_id = ?
    `;

    await db.promise().query(sql, [status, caseId]);

    // ✅ Return updated record
    const [updated] = await db.promise().query(
      "SELECT * FROM hazards WHERE case_id = ?",
      [caseId]
    );

    res.json({
      message: "Status updated successfully",
      data: updated[0]
    });

  } catch (err) {
    console.error("Update Error:", err);
    res.status(500).json({ error: "Database update failed" });
  }
});

module.exports = router;