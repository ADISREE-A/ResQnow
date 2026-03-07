import React, { useEffect, useState } from "react";
import DangerZoneMap from "../components/DangerZoneMap";

const AnalyticsDashboard = ({ darkMode = true }) => {
  const [summary, setSummary] = useState(null);
  const [byType, setByType] = useState([]);
  const [byRisk, setByRisk] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [dangerZones, setDangerZones] = useState([]);
  const [timeFilter, setTimeFilter] = useState("month");
  const [loading, setLoading] = useState(true);

  // Dynamic theme colors
  const theme = {
    bg: darkMode ? "#0d0d0d" : "#f5f5f5",
    cardBg: darkMode ? "#1a1a1a" : "#ffffff",
    text: darkMode ? "#ffffff" : "#333333",
    textSecondary: darkMode ? "#888" : "#666666",
    border: darkMode ? "#333" : "#dddddd",
    accent: "#4da6ff"
  };

  /* Fetch all analytics data */
  useEffect(() => {
    fetchAnalytics();
  }, [timeFilter]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [summaryRes, byTypeRes, byRiskRes, timelineRes, dangerZonesRes] = await Promise.all([
        fetch("http://localhost:5000/api/hazards/analytics/summary"),
        fetch("http://localhost:5000/api/hazards/analytics/by-type"),
        fetch("http://localhost:5000/api/hazards/analytics/by-risk"),
        fetch(`http://localhost:5000/api/hazards/analytics/timeline?period=${timeFilter}`),
        fetch("http://localhost:5000/api/hazards/analytics/danger-zones?limit=10")
      ]);

      const summaryData = await summaryRes.json();
      const byTypeData = await byTypeRes.json();
      const byRiskData = await byRiskRes.json();
      const timelineData = await timelineRes.json();
      const dangerZonesData = await dangerZonesRes.json();

      setSummary(summaryData);
      setByType(byTypeData);
      setByRisk(byRiskData);
      setTimeline(timelineData);
      setDangerZones(dangerZonesData);
    } catch (err) {
      console.error("Error fetching analytics:", err);
    }
    setLoading(false);
  };

  /* Get color for risk level */
  const getRiskColor = (level) => {
    switch (level) {
      case "Critical": return "#ff0000";
      case "High": return "#ff6600";
      case "Medium": return "#ffcc00";
      case "Low": return "#00cc00";
      default: return "#888888";
    }
  };

  /* Get max count for bar chart scaling */
  const getMaxCount = (arr) => {
    if (!arr || arr.length === 0) return 1;
    return Math.max(...arr.map(item => item.count));
  };

  const styles = {
    container: {
      backgroundColor: theme.bg,
      color: theme.text,
      minHeight: "100vh",
      padding: "20px",
      fontFamily: "Arial, sans-serif",
      transition: "all 0.3s ease"
    },
    loading: {
      textAlign: "center",
      padding: "50px",
      fontSize: "18px",
      color: theme.textSecondary
    },
    header: {
      marginBottom: "30px"
    },
    filterContainer: {
      display: "flex",
      alignItems: "center",
      gap: "15px",
      marginTop: "15px"
    },
    filterLabel: {
      fontSize: "14px",
      color: theme.textSecondary
    },
    filterSelect: {
      padding: "8px 15px",
      backgroundColor: darkMode ? "#222" : "#fff",
      color: theme.text,
      border: `1px solid ${theme.border}`,
      borderRadius: "5px",
      fontSize: "14px"
    },
    refreshBtn: {
      padding: "8px 20px",
      backgroundColor: darkMode ? "#333" : "#ddd",
      color: theme.text,
      border: `1px solid ${theme.border}`,
      borderRadius: "5px",
      cursor: "pointer",
      fontSize: "14px"
    },
    summaryGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: "20px",
      marginBottom: "30px"
    },
    summaryCard: {
      backgroundColor: theme.cardBg,
      padding: "20px",
      borderRadius: "10px",
      borderLeft: "4px solid #4da6ff",
      border: `1px solid ${theme.border}`,
      transition: "all 0.3s ease"
    },
    summaryLabel: {
      fontSize: "14px",
      color: theme.textSecondary,
      marginBottom: "10px"
    },
    summaryValue: {
      fontSize: "32px",
      fontWeight: "bold",
      color: theme.text
    },
    section: {
      backgroundColor: theme.cardBg,
      padding: "25px",
      borderRadius: "12px",
      marginBottom: "20px",
      border: `1px solid ${theme.border}`,
      transition: "all 0.3s ease"
    },
    sectionTitle: {
      marginBottom: "20px",
      borderBottom: `2px solid ${theme.border}`,
      paddingBottom: "10px",
      color: theme.text
    },
    riskGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      gap: "15px"
    },
    riskCard: {
      backgroundColor: darkMode ? "#222" : "#f5f5f5",
      padding: "15px",
      borderRadius: "8px",
      overflow: "hidden",
      border: `1px solid ${theme.border}`
    },
    riskBar: {
      height: "8px",
      borderRadius: "4px",
      marginBottom: "10px"
    },
    riskInfo: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    },
    riskLabel: {
      fontSize: "14px",
      fontWeight: "bold",
      color: theme.text
    },
    riskCount: {
      fontSize: "18px",
      fontWeight: "bold",
      color: "#4da6ff"
    },
    typeGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
      gap: "15px"
    },
    typeCard: {
      backgroundColor: darkMode ? "#222" : "#f5f5f5",
      padding: "15px",
      borderRadius: "8px",
      border: `1px solid ${theme.border}`
    },
    typeName: {
      fontSize: "16px",
      fontWeight: "bold",
      marginBottom: "8px",
      color: theme.text
    },
    typeBarContainer: {
      height: "8px",
      backgroundColor: darkMode ? "#333" : "#ddd",
      borderRadius: "4px",
      marginBottom: "8px",
      overflow: "hidden"
    },
    typeBar: {
      height: "100%",
      backgroundColor: "#4da6ff",
      borderRadius: "4px"
    },
    typeStats: {
      display: "flex",
      justifyContent: "space-between",
      fontSize: "12px",
      color: theme.textSecondary
    },
    timelineContainer: {
      maxHeight: "400px",
      overflowY: "auto"
    },
    timelineItem: {
      display: "grid",
      gridTemplateColumns: "80px 1fr 60px 150px",
      gap: "15px",
      alignItems: "center",
      padding: "12px",
      borderBottom: `1px solid ${theme.border}`
    },
    timelineLabel: {
      fontSize: "14px",
      fontWeight: "bold",
      color: theme.text
    },
    timelineBarContainer: {
      height: "20px",
      backgroundColor: darkMode ? "#333" : "#ddd",
      borderRadius: "4px",
      overflow: "hidden"
    },
    timelineBar: {
      height: "100%",
      backgroundColor: "#4da6ff",
      borderRadius: "4px"
    },
    timelineCount: {
      fontSize: "18px",
      fontWeight: "bold",
      textAlign: "right",
      color: theme.text
    },
    timelineBreakdown: {
      fontSize: "12px",
      display: "flex",
      gap: "8px"
    },
    dangerZonesList: {
      display: "flex",
      flexDirection: "column",
      gap: "10px"
    },
    dangerZoneItem: {
      display: "flex",
      alignItems: "center",
      gap: "20px",
      padding: "15px",
      backgroundColor: darkMode ? "#222" : "#f5f5f5",
      borderRadius: "8px",
      borderLeft: "4px solid #ff0000",
      border: `1px solid ${theme.border}`
    },
    dangerZoneRank: {
      fontSize: "24px",
      fontWeight: "bold",
      color: "#ff0000",
      width: "40px"
    },
    dangerZoneInfo: {
      flex: 1
    },
    dangerZoneLocation: {
      fontSize: "14px",
      fontWeight: "bold",
      color: theme.text
    },
    dangerZoneTypes: {
      fontSize: "12px",
      color: theme.textSecondary,
      marginTop: "4px"
    },
    dangerZoneStats: {
      textAlign: "right",
      fontSize: "12px",
      color: theme.textSecondary
    },
    noData: {
      textAlign: "center",
      padding: "30px",
      color: theme.textSecondary
    },
    exportSection: {
      textAlign: "center",
      marginTop: "30px"
    },
    exportBtn: {
      padding: "15px 30px",
      backgroundColor: "#4da6ff",
      color: "white",
      border: "none",
      borderRadius: "8px",
      fontSize: "16px",
      cursor: "pointer",
      fontWeight: "bold"
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading analytics...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1>📊 Analytics Dashboard</h1>
        <p style={{ color: theme.textSecondary }}>Comprehensive hazard analysis and risk insights</p>
        
        {/* Time Filter */}
        <div style={styles.filterContainer}>
          <span style={styles.filterLabel}>Time Period:</span>
          <select 
            value={timeFilter} 
            onChange={(e) => setTimeFilter(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="day">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
          
          <button onClick={fetchAnalytics} style={styles.refreshBtn}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={styles.summaryGrid}>
        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>Total Cases</div>
          <div style={styles.summaryValue}>{summary?.total || 0}</div>
        </div>
        <div style={{...styles.summaryCard, borderLeft: "4px solid #ff9933"}}>
          <div style={styles.summaryLabel}>Open Cases</div>
          <div style={styles.summaryValue}>{summary?.open_cases || 0}</div>
        </div>
        <div style={{...styles.summaryCard, borderLeft: "4px solid #00cc00"}}>
          <div style={styles.summaryLabel}>Closed Cases</div>
          <div style={styles.summaryValue}>{summary?.closed_cases || 0}</div>
        </div>
        <div style={{...styles.summaryCard, borderLeft: "4px solid #ff0000"}}>
          <div style={styles.summaryLabel}>Avg Risk Score</div>
          <div style={styles.summaryValue}>{Number(summary?.avg_risk_score || 0).toFixed(1)}</div>
        </div>
      </div>

      {/* Risk Level Distribution */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>⚠️ Risk Level Distribution</h2>
        <div style={styles.riskGrid}>
          {byRisk.map((item, index) => (
            <div key={index} style={styles.riskCard}>
              <div style={{
                ...styles.riskBar,
                width: `${(item.count / (summary?.total || 1)) * 100}%`,
                backgroundColor: getRiskColor(item.risk_level)
              }}></div>
              <div style={styles.riskInfo}>
                <span style={styles.riskLabel}>{item.risk_level || "Unknown"}</span>
                <span style={styles.riskCount}>{item.count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hazards by Type */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>📋 Hazards by Type</h2>
        <div style={styles.typeGrid}>
          {byType.map((item, index) => (
            <div key={index} style={styles.typeCard}>
              <div style={styles.typeName}>{item.type}</div>
              <div style={styles.typeBarContainer}>
                <div style={{
                  ...styles.typeBar,
                  width: `${(item.count / getMaxCount(byType)) * 100}%`
                }}></div>
              </div>
              <div style={styles.typeStats}>
                <span>{item.count} cases</span>
                <span>{item.open_count} open</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline Chart */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>📈 Incident Timeline</h2>
        <div style={styles.timelineContainer}>
          {timeline.length === 0 ? (
            <div style={styles.noData}>No data available for this period</div>
          ) : (
            timeline.map((item, index) => (
              <div key={index} style={styles.timelineItem}>
                <div style={styles.timelineLabel}>{item.period}</div>
                <div style={styles.timelineBarContainer}>
                  <div style={{
                    ...styles.timelineBar,
                    width: `${(item.count / getMaxCount(timeline)) * 100}%`
                  }}></div>
                </div>
                <div style={styles.timelineCount}>{item.count}</div>
                <div style={styles.timelineBreakdown}>
                  <span style={{color: "#ff0000"}}>{item.critical || 0} C</span>
                  <span style={{color: "#ff6600"}}>{item.high || 0} H</span>
                  <span style={{color: "#ffcc00"}}>{item.medium || 0} M</span>
                  <span style={{color: "#00cc00"}}>{item.low || 0} L</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Top Danger Zones */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>🔴 Top Danger Zones</h2>
        <div style={styles.dangerZonesList}>
          {dangerZones.length === 0 ? (
            <div style={styles.noData}>No danger zones identified</div>
          ) : (
            dangerZones.map((zone, index) => (
              <div key={index} style={styles.dangerZoneItem}>
                <div style={styles.dangerZoneRank}>#{index + 1}</div>
                <div style={styles.dangerZoneInfo}>
                  <div style={styles.dangerZoneLocation}>
                    📍 {zone.lat}, {zone.lng}
                  </div>
                  <div style={styles.dangerZoneTypes}>
                    {zone.types?.split(",").slice(0, 3).join(", ")}
                  </div>
                </div>
                <div style={styles.dangerZoneStats}>
                  <div style={{color: getRiskColor(zone.max_risk_level)}}>
                    {zone.max_risk_level}
                  </div>
                  <div>{zone.incident_count} incidents</div>
                  <div>Avg: {Number(zone.avg_risk_score || 0).toFixed(1)}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Danger Zone Map */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>🗺 Danger Zone Map</h2>
        <DangerZoneMap height="500px" showLegend={true} darkMode={darkMode} />
      </div>

      {/* Export Button */}
      <div style={styles.exportSection}>
        <button 
          onClick={() => {
            const data = {
              summary,
              byType,
              byRisk,
              timeline,
              dangerZones,
              generatedAt: new Date().toISOString()
            };
            const blob = new Blob([JSON.stringify(data, null, 2)], {type: "application/json"});
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "analytics-report.json";
            a.click();
          }}
          style={styles.exportBtn}
        >
          📥 Export Report
        </button>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;

