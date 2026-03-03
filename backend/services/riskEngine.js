const db = require("../config/db");

/* =====================================
   🔹 Severity Classification
===================================== */
const classifySeverity = (description = "") => {
  const text = description.toLowerCase();

  if (text.includes("fire") || text.includes("explosion"))
    return { level: "Critical", weight: 4 };

  if (
    text.includes("attack") ||
    text.includes("bleeding") ||
    text.includes("injured")
  )
    return { level: "High", weight: 3 };

  if (text.includes("suspicious") || text.includes("threat"))
    return { level: "Medium", weight: 2 };

  return { level: "Low", weight: 1 };
};

/* =====================================
   🔹 Count Nearby Incidents
===================================== */
const countNearbyIncidents = (lat, lng) => {
  return new Promise((resolve, reject) => {
    const radius = 0.01;

    const sql = `
      SELECT COUNT(*) AS count
      FROM hazards
      WHERE latitude BETWEEN ? AND ?
      AND longitude BETWEEN ? AND ?
    `;

    db.query(
      sql,
      [lat - radius, lat + radius, lng - radius, lng + radius],
      (err, results) => {
        if (err) {
          console.error("Nearby Incident Query Error:", err);
          return reject(err);
        }

        const count = results?.[0]?.count || 0;
        console.log("Nearby Incidents Found:", count);
        resolve(count);
      }
    );
  });
};

/* =====================================
   🔹 Risk Calculation
===================================== */
const calculateRisk = (incidentCount, severityWeight) => {
  const hour = new Date().getHours();
  const nightFactor = hour >= 20 || hour <= 5 ? 2 : 0;

  const riskScore = incidentCount * 2 + severityWeight + nightFactor;

  let riskLevel = "Low";
  if (riskScore >= 20) riskLevel = "Critical";
  else if (riskScore >= 11) riskLevel = "High";
  else if (riskScore >= 6) riskLevel = "Medium";

  const confidence = Math.min(95, 60 + riskScore);

  return { riskScore, riskLevel, confidence };
};

/* =====================================
   🔹 Main Risk Engine Function
===================================== */
const generateRiskAnalysis = async (description, lat, lng) => {
  try {
    // 🔥 Convert to numbers (IMPORTANT FIX)
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      throw new Error("Invalid latitude or longitude values");
    }

    const severityData = classifySeverity(description);
    const incidentCount = await countNearbyIncidents(
      latitude,
      longitude
    );
    const riskData = calculateRisk(
      incidentCount,
      severityData.weight
    );

    console.log("Risk Engine Output:", {
      severityData,
      incidentCount,
      riskData
    });

    return {
      auto_severity: severityData.level,
      risk_score: riskData.riskScore,
      risk_level: riskData.riskLevel,
      confidence: riskData.confidence
    };

  } catch (error) {
    console.error("Risk Engine Internal Error:", error);
    throw error;
  }
};

module.exports = { generateRiskAnalysis };