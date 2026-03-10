const db = require("../config/db");

/* ========================================
   🔹 Anomaly Detection for Fake Emergencies
   ======================================== */

// Suspicious keywords that might indicate fake reports
const SUSPICIOUS_KEYWORDS = [
  "fake", "prank", "joke", "hoax", "not real", "testing",
  "false alarm", "mistake", "wrong", "accidental",
  "just checking", "for fun", "bored"
];

// Keywords that indicate legitimate emergencies
const LEGITIMATE_KEYWORDS = [
  "fire", "help", "emergency", "danger", "trapped", "injured",
  "bleeding", "unconscious", "attack", "crash", "collision",
  "explosion", "smoke", "flood", "earthquake", "collapse"
];

/* ========================================
   🔹 Analyze Report Content
   ======================================== */
const analyzeContent = (description, type) => {
  const text = ((description || "") + " " + (type || "")).toLowerCase();
  
  let suspiciousScore = 0;
  let legitimateScore = 0;
  const flags = [];

  // Check for suspicious keywords
  SUSPICIOUS_KEYWORDS.forEach(keyword => {
    if (text.includes(keyword)) {
      suspiciousScore += 2;
      flags.push(`Suspicious keyword: "${keyword}"`);
    }
  });

  // Check for legitimate keywords
  LEGITIMATE_KEYWORDS.forEach(keyword => {
    if (text.includes(keyword)) {
      legitimateScore += 1;
    }
  });

  // Very short descriptions might be suspicious
  if (description && description.length < 10) {
    suspiciousScore += 1;
    flags.push("Very short description");
  }

  // No description at all
  if (!description || description.trim() === "") {
    suspiciousScore += 2;
    flags.push("No description provided");
  }

  return { suspiciousScore, legitimateScore, flags };
};

/* ========================================
   🔹 Check Report Frequency for User/Device
   ======================================== */
const checkReportFrequency = (userId, deviceId, callback) => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  let query = "";
  let params = [];

  if (userId) {
    query = `
      SELECT 
        COUNT(*) as hourly_count,
        (SELECT COUNT(*) FROM hazards WHERE user_id = ? AND created_at > ?) as daily_count
      FROM hazards 
      WHERE user_id = ? AND created_at > ?
    `;
    params = [userId, oneHourAgo, userId, oneHourAgo];
  } else if (deviceId) {
    query = `
      SELECT 
        COUNT(*) as hourly_count,
        (SELECT COUNT(*) FROM hazards WHERE device_id = ? AND created_at > ?) as daily_count
      FROM hazards 
      WHERE device_id = ? AND created_at > ?
    `;
    params = [deviceId, oneHourAgo, deviceId, oneHourAgo];
  } else {
    return callback(null, { hourly_count: 0, daily_count: 0, flags: [] });
  }

  db.query(query, params, (err, results) => {
    if (err) {
      console.error("Frequency check error:", err);
      return callback(null, { hourly_count: 0, daily_count: 0, flags: [] });
    }

    const data = results?.[0] || { hourly_count: 0, daily_count: 0 };
    const hourlyCount = parseInt(data.hourly_count) || 0;
    const dailyCount = parseInt(data.daily_count) || 0;
    const flags = [];

    // Check thresholds
    if (hourlyCount >= 5) {
      flags.push(`High frequency: ${hourlyCount} reports in last hour`);
    }

    if (dailyCount >= 20) {
      flags.push(`Very high frequency: ${dailyCount} reports in last 24 hours`);
    }

    callback(null, { hourly_count: hourlyCount, daily_count: dailyCount, flags });
  });
};

/* ========================================
   🔹 Check Location Anomalies
   ======================================== */
const checkLocationAnomaly = (latitude, longitude, userId, deviceId, callback) => {
  if (!userId && !deviceId) {
    return callback(null, { isAnomaly: false, score: 0, flags: [] });
  }

  const sql = `
    SELECT latitude, longitude, created_at 
    FROM hazards 
    WHERE (? IS NOT NULL AND user_id = ?)
       OR (? IS NOT NULL AND device_id = ?)
    ORDER BY created_at DESC 
    LIMIT 5
  `;

  db.query(sql, [userId, userId, deviceId, deviceId], (err, results) => {
    if (err || !results || results.length === 0) {
      return callback(null, { isAnomaly: false, score: 0, flags: [] });
    }

    const flags = [];
    let anomalyScore = 0;
    let isAnomaly = false;

    // Check the most recent report
    const lastReport = results[0];
    const timeDiff = Date.now() - new Date(lastReport.created_at).getTime();
    const distance = calculateDistance(
      lastReport.latitude, lastReport.longitude,
      latitude, longitude
    );

    // If report is within 1 minute and distance > 1km, it's suspicious
    // (physically impossible to travel that fast)
    if (timeDiff < 60000 && distance > 1) {
      anomalyScore += 10;
      flags.push(`Impossible travel: ${distance.toFixed(1)}km in less than 1 minute`);
      isAnomaly = true;
    }

    // If report is within 5 minutes and distance > 50km
    if (timeDiff < 300000 && distance > 50) {
      anomalyScore += 5;
      flags.push(`Very fast travel: ${distance.toFixed(1)}km in 5 minutes`);
      isAnomaly = true;
    }

    // Multiple reports from same location (possible copycat)
    if (results.length >= 3) {
      const recentFromSameLocation = results.filter(r => {
        const d = calculateDistance(r.latitude, r.longitude, latitude, longitude);
        return d < 0.1; // Within 100m
      });

      if (recentFromSameLocation.length >= 3) {
        anomalyScore += 3;
        flags.push("Multiple reports from same location");
      }
    }

    callback(null, { isAnomaly, score: anomalyScore, flags });
  });
};

/* ========================================
   🔹 Check Historical Pattern
   ======================================== */
const checkHistoricalPattern = (userId, deviceId, callback) => {
  if (!userId && !deviceId) {
    return callback(null, { closedCount: 0, fakeCount: 0, flags: [] });
  }

  const sql = `
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'Closed' THEN 1 ELSE 0 END) as closed_count,
      SUM(CASE WHEN fake_emergency_risk_score > 50 THEN 1 ELSE 0 END) as fake_count
    FROM hazards 
    WHERE (? IS NOT NULL AND user_id = ?)
       OR (? IS NOT NULL AND device_id = ?)
  `;

  db.query(sql, [userId, userId, deviceId, deviceId], (err, results) => {
    if (err) {
      console.error("Historical pattern check error:", err);
      return callback(null, { closedCount: 0, fakeCount: 0, flags: [] });
    }

    const data = results?.[0] || { total: 0, closed_count: 0, fake_count: 0 };
    const total = parseInt(data.total) || 0;
    const closedCount = parseInt(data.closed_count) || 0;
    const fakeCount = parseInt(data.fake_count) || 0;
    const flags = [];

    // High closed rate without action taken is suspicious
    if (total >= 5 && closedCount / total > 0.8) {
      flags.push(`High closure rate: ${closedCount}/${total} reports closed`);
    }

    // Previous fake reports
    if (fakeCount > 0) {
      flags.push(`Previous suspicious reports: ${fakeCount}`);
    }

    callback(null, { closedCount, fakeCount, flags });
  });
};

/* ========================================
   🔹 Calculate Distance (Haversine formula)
   ======================================== */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (deg) => deg * (Math.PI / 180);

/* ========================================
   🔹 Main Detection Function
   ======================================== */
const detectFakeEmergency = async (reportData) => {
  const { description, type, latitude, longitude, userId, deviceId } = reportData;

  // Analyze content
  const contentAnalysis = analyzeContent(description, type);

  // Check frequency (async)
  const frequencyData = await new Promise((resolve) => {
    checkReportFrequency(userId, deviceId, resolve);
  });

  // Check location anomaly (async)
  const locationAnalysis = await new Promise((resolve) => {
    checkLocationAnomaly(latitude, longitude, userId, deviceId, resolve);
  });

  // Check historical pattern (async)
  const historicalAnalysis = await new Promise((resolve) => {
    checkHistoricalPattern(userId, deviceId, resolve);
  });

  // Calculate total anomaly score
  let totalScore = 0;
  const allFlags = [
    ...contentAnalysis.flags,
    ...frequencyData.flags,
    ...locationAnalysis.flags,
    ...historicalAnalysis.flags
  ];

  // Content score (max 10)
  totalScore += Math.min(contentAnalysis.suspiciousScore, 10);

  // Frequency score (max 15)
  if (frequencyData.hourly_count >= 5) totalScore += 10;
  else if (frequencyData.hourly_count >= 3) totalScore += 5;
  
  if (frequencyData.daily_count >= 20) totalScore += 5;
  else if (frequencyData.daily_count >= 10) totalScore += 3;

  // Location anomaly score (max 15)
  totalScore += locationAnalysis.score;

  // Historical pattern score (max 10)
  if (historicalAnalysis.fakeCount > 0) totalScore += 10;
  else if (historicalAnalysis.closedCount >= 5) totalScore += 3;

  // Determine severity
  let severity = "none";
  let isLikelyFake = false;
  let riskLevel = "low";

  if (totalScore >= 25) {
    severity = "critical";
    isLikelyFake = true;
    riskLevel = "critical";
  } else if (totalScore >= 15) {
    severity = "high";
    isLikelyFake = true;
    riskLevel = "high";
  } else if (totalScore >= 8) {
    severity = "medium";
    riskLevel = "medium";
  } else if (totalScore >= 3) {
    severity = "low";
    riskLevel = "low";
  }

  // Prepare result
  const result = {
    isLikelyFake,
    fakeScore: totalScore,
    severity,
    riskLevel,
    flags: allFlags,
    analysis: {
      content: {
        suspiciousScore: contentAnalysis.suspiciousScore,
        legitimateScore: contentAnalysis.legitimateScore,
        hasSuspiciousContent: contentAnalysis.suspiciousScore > 0
      },
      frequency: {
        hourlyCount: frequencyData.hourly_count,
        dailyCount: frequencyData.daily_count,
        isHighFrequency: frequencyData.hourly_count >= 3
      },
      location: {
        isAnomaly: locationAnalysis.isAnomaly,
        distanceFromLastReport: locationAnalysis.score > 0
      },
      historical: {
        totalReports: historicalAnalysis.closedCount + historicalAnalysis.fakeCount,
        previousFakeReports: historicalAnalysis.fakeCount
      }
    },
    recommendation: getRecommendation(severity, allFlags)
  };

  console.log("Fake Emergency Detection Result:", result);
  return result;
};

/* ========================================
   🔹 Get Recommendation Based on Analysis
   ======================================== */
const getRecommendation = (severity, flags) => {
  if (severity === "critical") {
    return "REVIEW_REQUIRED: This report requires immediate review by authorities. High probability of being a fake or prank emergency.";
  }
  if (severity === "high") {
    return "CAUTION: This report shows signs of being potentially fake. Verify before dispatching resources.";
  }
  if (severity === "medium") {
    return "VERIFY: Some suspicious patterns detected. Consider verifying the report before full dispatch.";
  }
  if (severity === "low" && flags.length > 0) {
    return "MONITOR: Report appears legitimate but minor flags detected. Add to monitoring list.";
  }
  return "APPROVE: No significant anomalies detected. Proceed with normal processing.";
};

/* ========================================
   🔹 Flag a Report as Fake (Admin Action)
   ======================================== */
const flagAsFake = (caseId, userId, reason, callback) => {
  const sql = `
    INSERT INTO fake_emergency_flags (case_id, user_id, reason, severity, is_confirmed)
    VALUES (?, ?, ?, 'high', FALSE)
  `;
  db.query(sql, [caseId, userId, reason], (err, result) => {
    if (err) {
      console.error("Flag error:", err);
      return callback(err);
    }

    // Update the hazard with fake emergency score
    const updateSql = `
      UPDATE hazards 
      SET fake_emergency_risk_score = 100 
      WHERE case_id = ?
    `;
    db.query(updateSql, [caseId], (err) => {
      callback(err, result);
    });
  });
};

module.exports = {
  detectFakeEmergency,
  analyzeContent,
  checkReportFrequency,
  checkLocationAnomaly,
  checkHistoricalPattern,
  flagAsFake,
  SUSPICIOUS_KEYWORDS,
  LEGITIMATE_KEYWORDS
};

