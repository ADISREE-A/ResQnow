import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

/* Auto Recenter to hazards */
function RecenterMap({ hazards }) {
  const map = useMap();

  useEffect(() => {
    if (hazards && hazards.length > 0) {
      const lats = hazards.map(h => h.latitude);
      const lngs = hazards.map(h => h.longitude);
      const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
      const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
      map.setView([centerLat, centerLng], 12);
    }
  }, [hazards, map]);

  return null;
}

/* Get color based on risk level */
const getRiskColor = (riskLevel, severity) => {
  if (riskLevel === "Critical" || severity === "Critical") return "#ff0000";
  if (riskLevel === "High" || severity === "High") return "#ff6600";
  if (riskLevel === "Medium" || severity === "Medium") return "#ffcc00";
  return "#00cc00";
};

/* Get radius based on risk score */
const getRadius = (riskScore) => {
  if (!riskScore) return 200;
  if (riskScore >= 25) return 500;
  if (riskScore >= 15) return 400;
  if (riskScore >= 8) return 300;
  return 200;
};

/* Get opacity based on risk */
const getOpacity = (riskLevel) => {
  if (riskLevel === "Critical") return 0.7;
  if (riskLevel === "High") return 0.5;
  if (riskLevel === "Medium") return 0.4;
  return 0.3;
};

const DangerZoneMap = ({ 
  height = "400px", 
  showLegend = true,
  onZoneClick,
  userLocation = null,
  dangerWarning = null,
  darkMode = true
}) => {
  const [hazards, setHazards] = useState([]);
  const [loading, setLoading] = useState(true);

  // Theme colors
  const theme = {
    bg: darkMode ? "#1a1a1a" : "#f5f5f5",
    text: darkMode ? "#ffffff" : "#333333",
    overlayBg: darkMode ? "rgba(0,0,0,0.8)" : "rgba(255,255,255,0.9)"
  };

  /* Fetch hazards for heatmap */
  useEffect(() => {
    fetch("http://localhost:5000/api/hazards/all")
      .then(res => res.json())
      .then(data => {
        setHazards(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching hazards:", err);
        setLoading(false);
      });
  }, []);

  /* Default center */
  const defaultCenter = userLocation 
    ? [userLocation.lat, userLocation.lng] 
    : [40.7128, -74.0060];

  if (loading) {
    return (
      <div style={{ 
        height, 
        backgroundColor: theme.bg, 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        color: darkMode ? "#888" : "#666",
        borderRadius: "8px"
      }}>
        Loading danger zones...
      </div>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      {/* Danger Warning Banner */}
      {dangerWarning && (
        <div style={{
          backgroundColor: "#ff0000",
          color: "white",
          padding: "10px 15px",
          borderRadius: "8px",
          marginBottom: "10px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          animation: "pulse 1s infinite"
        }}>
          <span style={{ fontSize: "20px" }}>⚠️</span>
          <strong>{dangerWarning}</strong>
        </div>
      )}

      <div style={{ height, borderRadius: "8px", overflow: "hidden" }}>
        <MapContainer
          center={defaultCenter}
          zoom={12}
          style={{ width: "100%", height: "100%" }}
        >
          <RecenterMap hazards={hazards} />

          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url={darkMode 
              ? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
              : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            }
          />

          {/* Danger Zone Circles */}
          {hazards.map((hazard, index) => {
            const color = getRiskColor(hazard.risk_level, hazard.severity);
            const radius = getRadius(hazard.risk_score);
            const opacity = getOpacity(hazard.risk_level);

            return (
              <CircleMarker
                key={index}
                center={[hazard.latitude, hazard.longitude]}
                pathOptions={{
                  color: color,
                  fillColor: color,
                  fillOpacity: opacity,
                  weight: 2
                }}
                radius={radius / 10}
                eventHandlers={{
                  click: () => onZoneClick && onZoneClick(hazard)
                }}
              >
                <Popup>
                  <div style={{ minWidth: "150px", color: "#333" }}>
                    <strong style={{ color: color }}>{hazard.type}</strong>
                    <br />
                    <span>Case: {hazard.case_id}</span>
                    <br />
                    <span>Risk: {hazard.risk_level}</span>
                    <br />
                    <span>Score: {hazard.risk_score}</span>
                    <br />
                    <span>Status: {hazard.status}</span>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

          {/* User Location Marker */}
          {userLocation && (
            <CircleMarker
              center={[userLocation.lat, userLocation.lng]}
              pathOptions={{
                color: "#00ffff",
                fillColor: "#00ffff",
                fillOpacity: 0.5,
                weight: 3
              }}
              radius={15}
            >
              <Popup>You are here</Popup>
            </CircleMarker>
          )}
        </MapContainer>
      </div>

      {/* Legend */}
      {showLegend && (
        <div style={{
          position: "absolute",
          bottom: "20px",
          right: "10px",
          backgroundColor: theme.overlayBg,
          padding: "12px",
          borderRadius: "8px",
          zIndex: 1000,
          color: darkMode ? "white" : "#333",
          fontSize: "12px"
        }}>
          <div style={{ marginBottom: "8px", fontWeight: "bold" }}>Danger Level</div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#ff0000" }}></span>
            Critical
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#ff6600" }}></span>
            High
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#ffcc00" }}></span>
            Medium
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#00cc00" }}></span>
            Low
          </div>
        </div>
      )}

      {/* Stats overlay */}
      <div style={{
        position: "absolute",
        top: "10px",
        left: "10px",
        backgroundColor: theme.overlayBg,
        padding: "10px",
        borderRadius: "8px",
        zIndex: 1000,
        color: darkMode ? "white" : "#333",
        fontSize: "12px"
      }}>
        <div>Total Danger Zones: <strong>{hazards.length}</strong></div>
        <div>Critical: <strong style={{ color: "#ff0000" }}>{hazards.filter(h => h.risk_level === "Critical").length}</strong></div>
        <div>High: <strong style={{ color: "#ff6600" }}>{hazards.filter(h => h.risk_level === "High").length}</strong></div>
      </div>

      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.7; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default DangerZoneMap;

