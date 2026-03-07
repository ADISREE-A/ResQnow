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
    // Pass type to risk engine for better classification
    const riskResult = await generateRiskAnalysis(
      description,
      location.lat,
      location.lng,
      type
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

      // Return comprehensive risk analysis with instructions
      res.status(201).json({
        message: "Hazard reported successfully",
        case_id: hazardData.case_id,
        prediction: {
          hazard_type: riskResult.hazard_type,
          auto_severity: riskResult.auto_severity,
          severity_category: riskResult.severity_category,
          risk_score: riskResult.risk_score,
          risk_level: riskResult.risk_level,
          confidence: riskResult.confidence,
          risk_factors: riskResult.risk_factors,
          time_factor: riskResult.time_factor,
          nearby_incidents: riskResult.nearby_incidents,
          spatial_density: riskResult.spatial_density,
          instructions: riskResult.instructions
        }
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

/* ===============================
   🔹 Analytics Endpoints
================================= */

/* Get analytics summary */
router.get("/analytics/summary", (req, res) => {
  const sql = `
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'Open' THEN 1 ELSE 0 END) as open_cases,
      SUM(CASE WHEN status = 'Closed' THEN 1 ELSE 0 END) as closed_cases,
      SUM(CASE WHEN risk_level = 'Critical' THEN 1 ELSE 0 END) as critical,
      SUM(CASE WHEN risk_level = 'High' THEN 1 ELSE 0 END) as high,
      SUM(CASE WHEN risk_level = 'Medium' THEN 1 ELSE 0 END) as medium,
      SUM(CASE WHEN risk_level = 'Low' THEN 1 ELSE 0 END) as low,
      AVG(risk_score) as avg_risk_score
    FROM hazards
  `;
  
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results[0]);
  });
});

/* Get hazards by type */
router.get("/analytics/by-type", (req, res) => {
  const sql = `
    SELECT 
      type,
      COUNT(*) as count,
      SUM(CASE WHEN status = 'Open' THEN 1 ELSE 0 END) as open_count,
      AVG(risk_score) as avg_risk_score
    FROM hazards
    GROUP BY type
    ORDER BY count DESC
  `;
  
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

/* Get hazards by risk level */
router.get("/analytics/by-risk", (req, res) => {
  const sql = `
    SELECT 
      risk_level,
      COUNT(*) as count,
      AVG(risk_score) as avg_risk_score
    FROM hazards
    GROUP BY risk_level
    ORDER BY 
      CASE risk_level
        WHEN 'Critical' THEN 1
        WHEN 'High' THEN 2
        WHEN 'Medium' THEN 3
        WHEN 'Low' THEN 4
        ELSE 5
      END
  `;
  
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

/* Get timeline data */
router.get("/analytics/timeline", (req, res) => {
  const { period = 'month' } = req.query;
  let dateField;
  
  switch(period) {
    case 'day':
      dateField = 'DATE(created_at)';
      break;
    case 'week':
      dateField = 'YEARWEEK(created_at)';
      break;
    case 'month':
    default:
      dateField = 'DATE_FORMAT(created_at, "%Y-%m")';
      break;
  }

  const sql = `
    SELECT 
      ${dateField} as period,
      COUNT(*) as count,
      SUM(CASE WHEN risk_level = 'Critical' THEN 1 ELSE 0 END) as critical,
      SUM(CASE WHEN risk_level = 'High' THEN 1 ELSE 0 END) as high,
      SUM(CASE WHEN risk_level = 'Medium' THEN 1 ELSE 0 END) as medium,
      SUM(CASE WHEN risk_level = 'Low' THEN 1 ELSE 0 END) as low
    FROM hazards
    WHERE created_at > DATE_SUB(NOW(), INTERVAL 1 YEAR)
    GROUP BY ${dateField}
    ORDER BY period ASC
  `;
  
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

/* Get top danger zones */
router.get("/analytics/danger-zones", (req, res) => {
  const { limit = 10 } = req.query;
  
  const sql = `
    SELECT 
      ROUND(latitude, 4) as lat,
      ROUND(longitude, 4) as lng,
      COUNT(*) as incident_count,
      AVG(risk_score) as avg_risk_score,
      MAX(risk_level) as max_risk_level,
      GROUP_CONCAT(type) as types
    FROM hazards
    WHERE created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
    GROUP BY ROUND(latitude, 4), ROUND(longitude, 4)
    ORDER BY incident_count DESC, avg_risk_score DESC
    LIMIT ?
  `;
  
  db.query(sql, [parseInt(limit)], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

/* Get analytics with time filter */
router.get("/analytics/filtered", (req, res) => {
  const { timeFilter = 'all' } = req.query;
  
  let dateCondition = '';
  switch(timeFilter) {
    case 'today':
      dateCondition = 'AND DATE(created_at) = CURDATE()';
      break;
    case 'week':
      dateCondition = 'AND created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)';
      break;
    case 'month':
      dateCondition = 'AND created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)';
      break;
    case 'year':
      dateCondition = 'AND created_at > DATE_SUB(NOW(), INTERVAL 1 YEAR)';
      break;
    default:
      dateCondition = '';
  }

  const sql = `
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'Open' THEN 1 ELSE 0 END) as open_cases,
      SUM(CASE WHEN risk_level = 'Critical' THEN 1 ELSE 0 END) as critical,
      SUM(CASE WHEN risk_level = 'High' THEN 1 ELSE 0 END) as high,
      type,
      COUNT(*) as count
    FROM hazards
    WHERE 1=1 ${dateCondition}
    GROUP BY type
    ORDER BY count DESC
  `;
  
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

module.exports = router;
