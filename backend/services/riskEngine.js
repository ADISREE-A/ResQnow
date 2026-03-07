const db = require("../config/db");

/* ========================================
   🔹 Enhanced Severity Classification
   ======================================== */
const classifySeverity = (description = "", type = "") => {
  const text = (description + " " + type).toLowerCase();

  // Critical hazards (highest weight)
  if (
    text.includes("fire") ||
    text.includes("explosion") ||
    text.includes("explosive") ||
    text.includes("bomb") ||
    text.includes("terrorist") ||
    text.includes("active shooter") ||
    text.includes("chemical") ||
    text.includes("radiation") ||
    text.includes("gas leak") ||
    text.includes("structural collapse") ||
    text.includes("building collapse")
  ) {
    return { level: "Critical", weight: 10, category: "immediate_danger" };
  }

  // High severity hazards
  if (
    text.includes("attack") ||
    text.includes("assault") ||
    text.includes("bleeding") ||
    text.includes("injured") ||
    text.includes("medical emergency") ||
    text.includes("heart attack") ||
    text.includes("drowning") ||
    text.includes("electrocution") ||
    text.includes("hazardous material") ||
    text.includes("landslide") ||
    text.includes("avalanche")
  ) {
    return { level: "High", weight: 7, category: "serious_threat" };
  }

  // Medium severity hazards
  if (
    text.includes("suspicious") ||
    text.includes("threat") ||
    text.includes("suspicious package") ||
    text.includes("stolen") ||
    text.includes("theft") ||
    text.includes("vandalism") ||
    text.includes("unsafe structure") ||
    text.includes("road damage") ||
    text.includes("power outage") ||
    text.includes("gas leak") ||
    text.includes("water main break")
  ) {
    return { level: "Medium", weight: 4, category: "moderate_risk" };
  }

  // Low severity hazards
  if (
    text.includes("minor accident") ||
    text.includes("fender bender") ||
    text.includes("lost pet") ||
    text.includes("noise complaint") ||
    text.includes("parking violation") ||
    text.includes("littering")
  ) {
    return { level: "Low", weight: 2, category: "low_risk" };
  }

  // Default medium for unknown types
  return { level: "Medium", weight: 3, category: "unknown" };
};

/* ========================================
   🔹 Get Hazard Type from Description
   ======================================== */
const getHazardType = (description = "", type = "") => {
  const text = (description + " " + type).toLowerCase();

  if (text.includes("fire") || text.includes("smoke")) return "Fire";
  if (text.includes("flood") || text.includes("water") || text.includes("tsunami")) return "Flood";
  if (text.includes("earthquake") || text.includes("seismic")) return "Earthquake";
  if (text.includes("storm") || text.includes("hurricane") || text.includes("tornado") || text.includes("cyclone")) return "Storm";
  if (text.includes("attack") || text.includes("assault") || text.includes("shooter")) return "Attack";
  if (text.includes("medical") || text.includes("injury") || text.includes("bleed")) return "Medical";
  if (text.includes("chemical") || text.includes("hazmat") || text.includes("toxic")) return "Chemical";
  if (text.includes("explosion") || text.includes("bomb")) return "Explosion";
  if (text.includes("structural") || text.includes("building collapse")) return "Collapse";
  if (text.includes("suspicious") || text.includes("threat")) return "Suspicious";
  if (text.includes("accident") || text.includes("crash") || text.includes("collision")) return "Accident";
  if (text.includes("wildlife") || text.includes("animal") || text.includes("snake")) return "Wildlife";
  if (text.includes("infrastructure") || text.includes("road") || text.includes("bridge")) return "Infrastructure";

  return "General";
};

/* ========================================
   🔹 Calculate Time Risk Factor
   ======================================== */
const getTimeRiskFactor = () => {
  const hour = new Date().getHours();
  const dayOfWeek = new Date().getDay();

  // Night hours (high risk - less visibility, fewer people)
  if (hour >= 20 || hour <= 5) {
    return 2.5;
  }

  // Early morning rush (6-9 AM)
  if (hour >= 6 && hour <= 9) {
    return 1.5;
  }

  // Evening rush (5-8 PM)
  if (hour >= 17 && hour <= 20) {
    return 1.5;
  }

  // Weekend (potentially fewer emergency resources)
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return 1.2;
  }

  return 1.0;
};

/* ========================================
   🔹 Count Nearby Incidents with Recency Weighting
   ======================================== */
const countNearbyIncidents = (lat, lng) => {
  return new Promise((resolve, reject) => {
    // Use multiple radius for better analysis
    const smallRadius = 0.005; // ~500m
    const mediumRadius = 0.01; // ~1km
    const largeRadius = 0.05;  // ~5km

    const sql = `
      SELECT 
        COUNT(*) as total_count,
        SUM(CASE 
          WHEN created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 
          ELSE 0 
        END) as recent_count,
        SUM(CASE 
          WHEN severity IN ('Critical', 'High') OR auto_severity IN ('Critical', 'High') THEN 1 
          ELSE 0 
        END) as severe_count
      FROM hazards
      WHERE latitude BETWEEN ? AND ?
      AND longitude BETWEEN ? AND ?
    `;

    db.query(
      sql,
      [lat - largeRadius, lat + largeRadius, lng - largeRadius, lng + largeRadius],
      (err, results) => {
        if (err) {
          console.error("Nearby Incident Query Error:", err);
          return resolve({ total: 0, recent: 0, severe: 0 });
        }

        const data = results?.[0] || { total_count: 0, recent_count: 0, severe_count: 0 };
        
        const countData = {
          total: parseInt(data.total_count) || 0,
          recent: parseInt(data.recent_count) || 0,
          severe: parseInt(data.severe_count) || 0
        };

        console.log("Nearby Incidents Analysis:", countData);
        resolve(countData);
      }
    );
  });
};

/* ========================================
   🔹 Calculate Spatial Density
   ======================================== */
const calculateSpatialDensity = (lat, lng) => {
  return new Promise((resolve, reject) => {
    const radius = 0.02; // ~2km

    const sql = `
      SELECT COUNT(*) as density
      FROM hazards
      WHERE latitude BETWEEN ? AND ?
      AND longitude BETWEEN ? AND ?
      AND created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
    `;

    db.query(
      sql,
      [lat - radius, lat + radius, lng - radius, lng + radius],
      (err, results) => {
        if (err) {
          console.error("Spatial Density Query Error:", err);
          return resolve(0);
        }

        const density = parseInt(results?.[0]?.density) || 0;
        
        // Convert to density factor (0-3 scale)
        let densityFactor = 0;
        if (density >= 20) densityFactor = 3;
        else if (density >= 10) densityFactor = 2;
        else if (density >= 5) densityFactor = 1;

        resolve(densityFactor);
      }
    );
  });
};

/* ========================================
   🔹 Enhanced Risk Calculation
   ======================================== */
const calculateRisk = (incidentData, severityWeight, hazardType) => {
  const {
    total = 0,
    recent = 0,
    severe = 0
  } = incidentData;

  // Get time-based risk factor
  const timeFactor = getTimeRiskFactor();

  // Calculate weighted incident score
  // Recent incidents (last 24h) weighted more heavily
  const incidentScore = (total * 0.5) + (recent * 2.0) + (severe * 1.5);

  // Base risk from severity
  const severityScore = severityWeight;

  // Combine all factors
  const riskScore = (incidentScore * 1.5) + severityScore + (timeFactor * 2);

  // Determine risk level with refined thresholds
  let riskLevel = "Low";
  if (riskScore >= 25) riskLevel = "Critical";
  else if (riskScore >= 15) riskLevel = "High";
  else if (riskScore >= 8) riskLevel = "Medium";

  // Calculate confidence based on data availability
  let confidence = 50; // Base confidence
  
  // More historical data = higher confidence
  if (total >= 20) confidence += 20;
  else if (total >= 10) confidence += 15;
  else if (total >= 5) confidence += 10;
  else if (total >= 1) confidence += 5;

  // Recent data increases confidence
  if (recent >= 5) confidence += 15;
  else if (recent >= 2) confidence += 10;
  else if (recent >= 1) confidence += 5;

  // Time factor can reduce confidence (nighttime predictions are harder)
  if (timeFactor > 2) confidence -= 5;

  // Cap confidence between 30 and 95
  confidence = Math.max(30, Math.min(95, confidence));

  // Generate risk factors for display
  const riskFactors = [];
  if (timeFactor > 2) riskFactors.push("Nighttime hours");
  if (timeFactor > 1.2 && timeFactor <= 2) riskFactors.push("Rush hour");
  if (recent >= 5) riskFactors.push("High recent activity");
  if (severe >= 3) riskFactors.push("Multiple severe incidents nearby");
  if (total >= 10) riskFactors.push("High historical incident rate");
  if (severityWeight >= 7) riskFactors.push("Critical hazard severity");

  return { 
    riskScore: Math.round(riskScore * 10) / 10, 
    riskLevel, 
    confidence,
    riskFactors,
    timeFactor: Math.round(timeFactor * 10) / 10
  };
};

/* ========================================
   🔹 Get Emergency Instructions by Type
   ======================================== */
const getInstructions = (type) => {
  const instructions = {
    Fire: [
      "Activate the nearest fire alarm.",
      "Call emergency services immediately.",
      "Evacuate using stairs, never elevators.",
      "Stay low to avoid smoke inhalation.",
      "Feel doors before opening - if hot, find another exit.",
      "Cover nose and mouth with wet cloth.",
      "Meet at designated assembly point."
    ],
    Flood: [
      "Move to higher ground immediately.",
      "Do not walk or drive through flood water.",
      "Avoid bridges over fast-moving water.",
      "Turn off electricity at the main breaker.",
      "Move essential items to upper floors.",
      "Do not return until authorities declare it safe."
    ],
    Earthquake: [
      "DROP, COVER, and HOLD ON.",
      "Get under sturdy furniture.",
      "Stay away from windows and heavy objects.",
      "If outdoors, move away from buildings and power lines.",
      "After shaking stops, evacuate carefully.",
      "Be prepared for aftershocks."
    ],
    Storm: [
      "Seek shelter in a sturdy building.",
      "Stay away from windows and doors.",
      "Listen to emergency broadcasts.",
      "Avoid using electrical appliances.",
      "If flooding occurs, move to higher ground.",
      "Stay indoors until storm passes."
    ],
    Attack: [
      "RUN - Escape if there is a clear path.",
      "HIDE - If you can't run, hide and silence your phone.",
      "FIGHT - As a last resort, fight with force.",
      "Call emergency services when safe.",
      "Follow police instructions exactly.",
      "Provide first aid to others if trained and safe."
    ],
    Medical: [
      "Call emergency services immediately.",
      "Do not move the injured person unless in danger.",
      "Apply pressure to bleeding wounds.",
      "If trained, begin CPR if person is unresponsive.",
      "Keep the person calm and comfortable.",
      "Have someone direct emergency responders to location."
    ],
    Chemical: [
      "Move upwind away from the source.",
      "Try to find clean air immediately.",
      "Cover your mouth and nose with cloth.",
      "Remove contaminated clothing.",
      "Seek medical attention immediately.",
      "Alert others to stay away from the area."
    ],
    Explosion: [
      "Get behind cover immediately.",
      "Watch for secondary explosions.",
      "Call emergency services.",
      "Evacuate the area carefully.",
      "Watch for structural damage.",
      "Provide first aid if trained and safe."
    ],
    Collapse: [
      "Evacuate the area immediately.",
      "Do not re-enter the building.",
      "Call emergency services.",
      "Watch for falling debris.",
      "If trapped, make noise to signal rescuers.",
      "Cover your mouth to avoid dust inhalation."
    ],
    Suspicious: [
      "Do not approach the suspicious item/person.",
      "Alert authorities immediately.",
      "Move to a safe distance.",
      "Note description of suspicious items/persons.",
      "Follow security personnel instructions.",
      "Evacuate the area if instructed."
    ],
    Accident: [
      "Ensure your safety first.",
      "Call emergency services if injuries.",
      "Set up warning signals if on road.",
      "Do not move injured persons unless in danger.",
      "Provide first aid if trained.",
      "Document the scene if safe."
    ],
    Wildlife: [
      "Maintain safe distance.",
      "Do not run or make sudden movements.",
      "Back away slowly facing the animal.",
      "Make yourself appear larger.",
      "If attacked, protect your neck and face.",
      "Seek medical attention for bites/stings."
    ],
    Infrastructure: [
      "Avoid the damaged area.",
      "Report to authorities.",
      "If near electrical lines, stay away.",
      "Watch for secondary hazards.",
      "Follow detour instructions.",
      "Seek alternative routes."
    ],
    General: [
      "Stay calm and assess the situation.",
      "Call emergency services if needed.",
      "Move to a safe location if possible.",
      "Follow official instructions.",
      "Stay informed via emergency broadcasts.",
      "Check on others if safe to do so."
    ]
  };

  return instructions[type] || instructions["General"];
};

/* ========================================
   🔹 Main Risk Engine Function
   ======================================== */
const generateRiskAnalysis = async (description, lat, lng, type = "") => {
  try {
    // Convert to numbers
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      throw new Error("Invalid latitude or longitude values");
    }

    // Get hazard type and severity
    const hazardType = getHazardType(description, type);
    const severityData = classifySeverity(description, type);

    // Get incident data
    const incidentData = await countNearbyIncidents(latitude, longitude);
    
    // Get spatial density
    const spatialDensity = await calculateSpatialDensity(latitude, longitude);

    // Calculate risk
    const riskData = calculateRisk(incidentData, severityData.weight, hazardType);

    // Get instructions for this hazard type
    const instructions = getInstructions(hazardType);

    console.log("Risk Engine Output:", {
      hazardType,
      severityData,
      incidentData,
      spatialDensity,
      riskData
    });

    return {
      hazard_type: hazardType,
      auto_severity: severityData.level,
      severity_category: severityData.category,
      risk_score: riskData.riskScore,
      risk_level: riskData.riskLevel,
      confidence: riskData.confidence,
      risk_factors: riskData.riskFactors,
      time_factor: riskData.timeFactor,
      nearby_incidents: {
        total: incidentData.total,
        recent_24h: incidentData.recent,
        severe: incidentData.severe
      },
      spatial_density: spatialDensity,
      instructions: instructions
    };

  } catch (error) {
    console.error("Risk Engine Internal Error:", error);
    throw error;
  }
};

module.exports = { 
  generateRiskAnalysis,
  getInstructions,
  classifySeverity,
  getHazardType,
  calculateRisk
};

