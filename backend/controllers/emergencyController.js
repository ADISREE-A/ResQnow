const db = require("../config/db");
const { detectFakeEmergency } = require("../services/anomalyDetection");

// Generate unique case ID
const generateCaseId = () => {
  return "CASE-" + Date.now();
};

exports.createEmergency = async (req, res) => {
  const { latitude, longitude, username, type, description, severity, case_id, userId, deviceId } = req.body;

  if (!latitude || !longitude) {
    return res.status(400).json({ error: "Location required" });
  }

  // Use provided case_id or generate new one (for unified tracking)
  const caseId = case_id || generateCaseId();
  const emergencyType = type || "Panic Emergency";
  const emergencySeverity = severity || "Critical";
  const emergencyDescription = description || "Panic button activated - emergency alert";

  // Detect fake emergency
  const fakeDetection = await detectFakeEmergency({
    description: emergencyDescription,
    type: emergencyType,
    latitude,
    longitude,
    userId,
    deviceId
  });

  // Insert into hazards table for Police Dashboard visibility
  const sql = `
    INSERT INTO hazards 
    (case_id, username, type, severity, auto_severity, description, latitude, longitude, risk_score, risk_level, confidence, status, user_id, device_id, is_verified_user, fake_emergency_risk_score, fake_emergency_flags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  // Calculate risk score based on severity
  let riskScore = 25;
  let riskLevel = "High";
  let confidence = 90;

  if (emergencySeverity === "Critical") {
    riskScore = 30;
    riskLevel = "Critical";
    confidence = 95;
  } else if (emergencySeverity === "High") {
    riskScore = 25;
    riskLevel = "High";
    confidence = 85;
  } else {
    riskScore = 20;
    riskLevel = "Medium";
    confidence = 80;
  }

  // Add penalty for fake detection
  if (fakeDetection.isLikelyFake) {
    riskScore = Math.max(10, riskScore - 15);
    riskLevel = "Low";
    confidence = Math.max(30, confidence - 30);
  }

  db.query(
    sql,
    [
      caseId,
      username || "Anonymous",
      emergencyType,
      emergencySeverity,
      emergencySeverity,
      emergencyDescription,
      latitude,
      longitude,
      riskScore,
      riskLevel,
      confidence,
      "Open",
      userId || null,
      deviceId || null,
      userId ? true : false,
      fakeDetection.fakeScore,
      JSON.stringify(fakeDetection.flags)
    ],
    (err, result) => {
      if (err) {
        console.error("DB ERROR:", err);
        return res.status(500).json({ error: "Database error" });
      }

      res.json({ 
        message: "Emergency stored successfully",
        case_id: caseId,
        type: emergencyType,
        severity: emergencySeverity,
        location: { latitude, longitude },
        // Include fake emergency detection results
        fakeDetection: {
          isLikelyFake: fakeDetection.isLikelyFake,
          riskScore: fakeDetection.fakeScore,
          severity: fakeDetection.severity,
          flags: fakeDetection.flags,
          recommendation: fakeDetection.recommendation
        }
      });
    }
  );
};
