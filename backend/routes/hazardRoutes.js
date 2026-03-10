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
  const { case_id, username, type, severity, description, location } = req.body;

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

    // Use provided case_id or generate new one (for unified tracking)
    const finalCaseId = case_id || generateCaseId();

    const hazardData = {
      case_id: finalCaseId,
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
   🔹 Assign Officer to Case
================================= */
router.put("/assign-officer/:caseId", async (req, res) => {
  const { officer_name, officer_id, assigned_by } = req.body;
  const { caseId } = req.params;

  if (!officer_name) {
    return res.status(400).json({ error: "Officer name is required" });
  }

  try {
    const sql = `
      UPDATE hazards 
      SET assigned_officer = ?, officer_id = ?, assigned_by = ?, updated_at = NOW()
      WHERE case_id = ?
    `;

    await db.promise().query(sql, [officer_name, officer_id || null, assigned_by || null, caseId]);

    const [updated] = await db.promise().query(
      "SELECT * FROM hazards WHERE case_id = ?",
      [caseId]
    );

    res.json({
      message: "Officer assigned successfully",
      assigned_by: assigned_by || "Self-assigned",
      data: updated[0]
    });

  } catch (err) {
    console.error("Assign Error:", err);
    res.status(500).json({ error: "Failed to assign officer" });
  }
});

/* ===============================
   🔹 Generate Report & Close Case
================================= */
router.put("/generate-report/:caseId", async (req, res) => {
  const { caseId } = req.params;
  const { resolution_notes, actions_taken } = req.body;

  try {
    // Get the case details first
    const [caseData] = await db.promise().query(
      "SELECT * FROM hazards WHERE case_id = ?",
      [caseId]
    );

    if (caseData.length === 0) {
      return res.status(404).json({ error: "Case not found" });
    }

    const hazard = caseData[0];

    // Generate report content
    const report = {
      case_id: hazard.case_id,
      generated_at: new Date().toISOString(),
      case_details: {
        type: hazard.type,
        severity: hazard.severity,
        auto_severity: hazard.auto_severity,
        risk_score: hazard.risk_score,
        risk_level: hazard.risk_level,
        location: {
          latitude: hazard.latitude,
          longitude: hazard.longitude
        },
        description: hazard.description,
        reported_by: hazard.username,
        created_at: hazard.created_at
      },
      assigned_officer: hazard.assigned_officer,
      status: "Closed",
      resolution: {
        resolution_notes: resolution_notes || "Case resolved",
        actions_taken: actions_taken || "Standard investigation completed",
        closed_at: new Date().toISOString()
      },
      incident_summary: `${hazard.type} incident at location (${hazard.latitude}, ${hazard.longitude}). Risk level: ${hazard.risk_level}. Case was assigned to ${hazard.assigned_officer || 'unassigned'}.`
    };

    // Update the case with report and close it
    const sql = `
      UPDATE hazards 
      SET status = 'Closed', 
          report = ?, 
          resolution_notes = ?,
          updated_at = NOW()
      WHERE case_id = ?
    `;

    await db.promise().query(sql, [
      JSON.stringify(report),
      resolution_notes || "Case resolved",
      caseId
    ]);

    const [updated] = await db.promise().query(
      "SELECT * FROM hazards WHERE case_id = ?",
      [caseId]
    );

    res.json({
      message: "Report generated and case closed successfully",
      report: report,
      data: updated[0]
    });

  } catch (err) {
    console.error("Generate Report Error:", err);
    res.status(500).json({ error: "Failed to generate report" });
  }
});

/* ===============================
   🔹 Get Police Cases (for specific officer)
================================= */
router.get("/police-cases", (req, res) => {
  const { officer_id, officer_name } = req.query;
  
  let sql = "SELECT * FROM hazards WHERE 1=1";
  const params = [];

  if (officer_name) {
    sql += " AND assigned_officer = ?";
    params.push(officer_name);
  }

  if (officer_id) {
    sql += " AND officer_id = ?";
    params.push(officer_id);
  }

  sql += " ORDER BY created_at DESC";

  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

/* ===============================
   🔹 Get My Assigned Cases
================================= */
router.get("/my-cases", (req, res) => {
  const { officer_name } = req.query;
  
  if (!officer_name) {
    return res.status(400).json({ error: "Officer name required" });
  }

  const sql = `
    SELECT * FROM hazards 
    WHERE assigned_officer = ?
    ORDER BY 
      CASE status 
        WHEN 'Open' THEN 1 
        WHEN 'Closed' THEN 2 
      END,
      created_at DESC
  `;

  db.query(sql, [officer_name], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
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
