import React, { useEffect, useState, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import { speak } from "../utils/voice";

/* 🔁 Auto Recenter */
function RecenterMap({ position }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.setView(position, 15);
    }
  }, [position, map]);

  return null;
}

/* 🛣️ Routing Control Component - Using OSRM API directly */
function RoutingMachine({ start, end, onRouteReady, onRouteError }) {
  const map = useMap();
  const routeLineRef = useRef(null);

  useEffect(() => {
    if (!start || !end || !map) return;

    const fetchRoute = async () => {
      try {
        // Use OSRM API directly to get route
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`
        );
        
        if (!response.ok) {
          throw new Error("Route not found");
        }
        
        const data = await response.json();
        
        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const distanceKm = (route.distance / 1000).toFixed(1);
          const timeMinutes = Math.round(route.duration / 60);
          
          // Get geometry coordinates
          const coordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
          
          // Draw the route line on the map
          if (routeLineRef.current) {
            map.removeLayer(routeLineRef.current);
          }
          
          routeLineRef.current = L.polyline(coordinates, {
            color: '#4ecca3',
            weight: 6,
            opacity: 0.9
          }).addTo(map);
          
          // Fit map to show the whole route
          map.fitBounds(routeLineRef.current.getBounds(), { padding: [50, 50] });
          
          // Get instructions if available
          const instructions = route.legs[0].steps.map(step => ({
            type: step.maneuver ? step.maneuver.type : 'Straight',
            modifier: step.maneuver ? step.maneuver.modifier : null,
            text: step.name || step.maneuver?.instruction || "Continue",
            distance: step.distance,
            duration: step.duration
          }));
          
          if (onRouteReady) {
            onRouteReady({
              distance: distanceKm,
              time: timeMinutes,
              instructions: instructions,
              geometry: route.geometry
            });
          }
        } else {
          throw new Error("No route found");
        }
      } catch (e) {
        console.error("Route error:", e);
        if (onRouteError) {
          onRouteError(e);
        }
      }
    };

    fetchRoute();

    // Cleanup
    return () => {
      if (routeLineRef.current && map) {
        try {
          map.removeLayer(routeLineRef.current);
        } catch (e) {}
      }
    };
  }, [start, end, map, onRouteReady, onRouteError]);

  return null;
}

const LiveMap = ({ darkMode = true }) => {
  const [position, setPosition] = useState(null);
  const [places, setPlaces] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [showDirections, setShowDirections] = useState(false);
  const [routingEnabled, setRoutingEnabled] = useState(false);
  const [routeError, setRouteError] = useState(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);

  // Theme colors
  const theme = {
    bg: darkMode ? "#1a1a2e" : "#ffffff",
    text: darkMode ? "#eee" : "#333",
    textSecondary: darkMode ? "#aaa" : "#666",
    panelBg: darkMode ? "#16213e" : "#f5f5f5",
    border: darkMode ? "#2a2a4a" : "#ddd",
    accent: "#4ecca3"
  };

  /* 📍 Get Current Location */
  useEffect(() => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        setPosition([lat, lng]);
        fetchNearbyPlaces(lat, lng);
      },
      (err) => {
        console.error(err);
        alert("Please allow location access");
      },
      { enableHighAccuracy: true }
    );
  }, []);

  /* 🔎 Fetch Nearby Safe Places */
  const fetchNearbyPlaces = async (lat, lng) => {
    const radius = 2000; // 2km

    const query = `
      [out:json];
      (
        node["amenity"="hospital"](around:${radius},${lat},${lng});
        node["amenity"="pharmacy"](around:${radius},${lat},${lng});
        node["amenity"="police"](around:${radius},${lat},${lng});
      );
      out;
    `;

    try {
      const response = await fetch(
        "https://overpass-api.de/api/interpreter",
        {
          method: "POST",
          body: query
        }
      );

      const data = await response.json();
      setPlaces(data.elements || []);
    } catch (error) {
      console.error("Overpass API error:", error);
    }
  };

  /* 🎯 Icons */
  const userIcon = new L.Icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41]
  });

  const hospitalIcon = new L.Icon({
    iconUrl: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
    iconSize: [32, 32]
  });

  const pharmacyIcon = new L.Icon({
    iconUrl: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
    iconSize: [32, 32]
  });

  const policeIcon = new L.Icon({
    iconUrl: "https://maps.google.com/mapfiles/ms/icons/yellow-dot.png",
    iconSize: [32, 32]
  });

  /* 🛣️ Handle Route Selection */
  const handleGetRoute = (place) => {
    setSelectedPlace(place);
    setRoutingEnabled(true);
    setRouteInfo(null);
    setRouteError(null);
    setIsLoadingRoute(true);
    
    const placeName = place.tags?.name || "this location";
    speak(`Calculating route to ${placeName}`);
  };

  /* 🧹 Clear Route */
  const handleClearRoute = () => {
    setSelectedPlace(null);
    setRoutingEnabled(false);
    setRouteInfo(null);
    setShowDirections(false);
    setRouteError(null);
    speak("Route cleared");
  };

  /* 📖 Handle Route Ready */
  const handleRouteReady = (info) => {
    setIsLoadingRoute(false);
    setRouteInfo(info);
    setRouteError(null);
    const placeName = selectedPlace?.tags?.name || "destination";
    speak(`Route to ${placeName} found. ${info.distance} kilometers, approximately ${info.time} minutes.`);
  };

  /* 📖 Handle Route Error */
  const handleRouteError = (error) => {
    setIsLoadingRoute(false);
    console.error("Route error:", error);
    // Provide a user-friendly message instead of the technical error
    setRouteError("Unable to find a route. Please check your internet connection and try again.");
    speak("Sorry, I couldn't find a route to this location. Please try another destination.");
  };

  /* 📖 Toggle Directions Panel */
  const toggleDirections = () => {
    if (!routeInfo || !routeInfo.instructions || routeInfo.instructions.length === 0) {
      setRouteError("No directions available. Please select a route first.");
      return;
    }
    setShowDirections(!showDirections);
  };

  if (!position) {
    return (
      <div style={{ 
        textAlign: "center", 
        padding: "20px",
        backgroundColor: theme.panelBg,
        borderRadius: "12px",
        color: theme.text
      }}>
        <p style={{ color: theme.textSecondary }}>📍 Getting your location...</p>
      </div>
    );
  }

  return (
    <div style={{ width: "100%" }}>
      {/* Route Control Panel */}
      <div style={{
        ...styles.controlPanel,
        backgroundColor: theme.panelBg,
        border: `1px solid ${theme.border}`
      }}>
        <h3 style={{ margin: "0 0 10px 0", color: theme.accent, fontSize: "18px", fontWeight: "bold" }}>🛣️ Safe Route Finder</h3>
        
        {places.length > 0 ? (
          <div style={{
            ...styles.placeList,
            backgroundColor: theme.bg,
            border: `1px solid ${theme.border}`
          }}>
            <p style={{ margin: "0 0 10px 0", fontSize: "14px", color: theme.textSecondary }}>
              Select a destination to get directions:
            </p>
            {places.slice(0, 5).map((place, index) => {
              if (!place.tags) return null;
              return (
                <div key={index} style={{
                  ...styles.placeItem,
                  backgroundColor: theme.panelBg,
                  borderBottom: `1px solid ${theme.border}`
                }}>
                  <span style={{ fontSize: "13px", color: theme.text }}>
                    {place.tags.amenity === "hospital" && "🏥 "}
                    {place.tags.amenity === "pharmacy" && "💊 "}
                    {place.tags.amenity === "police" && "👮 "}
                    {place.tags.name || `Unknown ${place.tags.amenity}`}
                  </span>
                  <button
                    onClick={() => handleGetRoute(place)}
                    style={{
                      ...styles.routeBtn,
                      backgroundColor: theme.accent,
                      color: "#1a1a2e"
                    }}
                  >
                    🛣️ Route
                  </button>
                </div>
              );
            })}
          </div>
          ) : (
          <p style={{ fontSize: "14px", color: theme.textSecondary }}>
            Searching for nearby safe places...
          </p>
        )}

        {isLoadingRoute && (
          <div style={{
            marginTop: "12px",
            padding: "14px",
            backgroundColor: theme.bg,
            borderRadius: "8px",
            textAlign: "center",
            color: theme.accent,
            border: `1px solid ${theme.accent}`
          }}>
            ⏳ Calculating route...
          </div>
        )}

        {routeInfo && !isLoadingRoute && (
          <div style={{
            ...styles.routeInfo,
            backgroundColor: theme.bg,
            border: `1px solid ${theme.accent}`,
            color: theme.text
          }}>
            <strong>📏 Distance:</strong> {routeInfo.distance} km<br />
            <strong>⏱️ Est. Time:</strong> {routeInfo.time} min
          </div>
        )}

        {routeInfo && !isLoadingRoute && (
          <button onClick={toggleDirections} style={{
            ...styles.directionsToggle,
            backgroundColor: theme.accent,
            color: "#1a1a2e"
          }}>
            {showDirections ? "🔼 Hide Directions" : "🔽 Show Directions"}
          </button>
        )}

        {/* Error Display - Improved */}
        {routeError && (
          <div style={{
            marginTop: "10px",
            padding: "12px",
            backgroundColor: darkMode ? "#3d1a1a" : "#ffe6e6",
            border: "1px solid #e84545",
            borderRadius: "6px",
            fontSize: "13px",
            color: darkMode ? "#ff6b6b" : "#cc0000",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            <span style={{ fontSize: "18px" }}>⚠️</span>
            <span>{routeError}</span>
          </div>
        )}

        {routingEnabled && (
          <button onClick={handleClearRoute} style={{
            ...styles.clearBtn,
            backgroundColor: "#e84545"
          }}>
            ❌ Clear Route
          </button>
        )}
      </div>

      {/* Directions Panel */}
      {showDirections && routeInfo && routeInfo.instructions && (
        <div style={{
          ...styles.directionsPanel,
          backgroundColor: theme.panelBg,
          border: `1px solid ${theme.border}`
        }}>
          <h4 style={{ margin: "0 0 10px 0", color: theme.accent, fontSize: "16px" }}>📝 Turn-by-Turn Directions</h4>
          <div style={styles.instructionsList}>
            {routeInfo.instructions.map((instruction, index) => {
              if (instruction.type === 'Straight' || instruction.type === 'DestinationReached') {
                return (
                  <div key={index} style={{
                    ...styles.instruction,
                    borderBottom: `1px solid ${theme.border}`
                  }}>
                    <span style={styles.instructionType}>📍</span>
                    <span style={{...styles.instructionText, color: theme.text}}>
                      {instruction.text || "Continue to destination"}
                    </span>
                  </div>
                );
              }
              return (
                <div key={index} style={{
                  ...styles.instruction,
                  borderBottom: `1px solid ${theme.border}`
                }}>
                  <span style={styles.instructionType}>
                    {instruction.type === 'Turn right' && '➡️'}
                    {instruction.type === 'Turn left' && '⬅️'}
                    {instruction.type === 'Roundabout' && '🔄'}
                    {instruction.type === 'Merge' && '🔗'}
                    {instruction.type === 'Exit' && '🚪'}
                    {!['Turn right', 'Turn left', 'Roundabout', 'Merge', 'Exit'].includes(instruction.type) && '➡️'}
                  </span>
                  <span style={{...styles.instructionText, color: theme.text}}>
                    {instruction.text}
                  </span>
                  {instruction.distance && (
                    <span style={{...styles.instructionDistance, color: theme.accent}}>
                      ({Math.round(instruction.distance)}m)
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Map */}
      <div style={{ width: "100%", height: "500px", marginTop: "10px" }}>
        <MapContainer
          center={position}
          zoom={15}
          style={{ width: "100%", height: "100%" }}
        >
          <RecenterMap position={position} />

          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* 📍 User Location */}
          <Marker position={position} icon={userIcon}>
            <Popup>You are here</Popup>
          </Marker>

          {/* 🏥 Safe Places */}
          {places.map((place, index) => {
            if (!place.tags) return null;

            let icon;
            if (place.tags.amenity === "hospital") icon = hospitalIcon;
            else if (place.tags.amenity === "pharmacy") icon = pharmacyIcon;
            else if (place.tags.amenity === "police") icon = policeIcon;

            return (
              <Marker
                key={index}
                position={[place.lat, place.lon]}
                icon={icon}
              >
                <Popup>
                  <strong>{place.tags.name || "Unnamed"}</strong>
                  <br />
                  {place.tags.amenity}
                  <br />
                  <button
                    onClick={() => handleGetRoute(place)}
                    style={{ marginTop: "5px", cursor: "pointer" }}
                  >
                    🛣️ Get Route
                  </button>
                </Popup>
              </Marker>
            );
          })}

          {/* 🛣️ Routing Control */}
          {routingEnabled && selectedPlace && position && (
            <RoutingMachine
              start={position}
              end={[selectedPlace.lat, selectedPlace.lon]}
              onRouteReady={handleRouteReady}
              onRouteError={handleRouteError}
            />
          )}
        </MapContainer>
      </div>
    </div>
  );
};

/* 🎨 Styles */
const styles = {
  controlPanel: {
    backgroundColor: "#1a1a2e",
    padding: "15px",
    borderRadius: "12px",
    marginBottom: "10px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
    border: "1px solid #16213e"
  },
  placeList: {
    maxHeight: "180px",
    overflowY: "auto",
    backgroundColor: "#16213e",
    borderRadius: "8px",
    padding: "10px"
  },
  placeItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px",
    borderRadius: "6px",
    marginBottom: "5px"
  },
  routeBtn: {
    backgroundColor: "#4ecca3",
    color: "#1a1a2e",
    border: "none",
    padding: "6px 12px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
    whiteSpace: "nowrap",
    fontWeight: "bold"
  },
  routeInfo: {
    marginTop: "12px",
    padding: "14px",
    backgroundColor: "#16213e",
    borderRadius: "8px",
    fontSize: "14px"
  },
  directionsToggle: {
    marginTop: "10px",
    padding: "10px 15px",
    backgroundColor: "#4ecca3",
    color: "#1a1a2e",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    width: "100%",
    fontWeight: "bold",
    fontSize: "14px"
  },
  clearBtn: {
    marginTop: "10px",
    padding: "10px 15px",
    backgroundColor: "#e84545",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    width: "100%",
    fontWeight: "bold",
    fontSize: "14px"
  },
  directionsPanel: {
    backgroundColor: "#1a1a2e",
    padding: "15px",
    borderRadius: "12px",
    marginBottom: "10px",
    maxHeight: "250px",
    overflowY: "auto",
    boxShadow: "0 4px 15px rgba(0,0,0,0.3)"
  },
  instructionsList: {
    fontSize: "13px",
    color: "#ccc"
  },
  instruction: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 0"
  },
  instructionType: {
    fontSize: "18px",
    minWidth: "30px"
  },
  instructionText: {
    flex: 1,
    color: "#eee"
  },
  instructionDistance: {
    color: "#4ecca3",
    fontSize: "12px",
    fontWeight: "bold"
  }
};

export default LiveMap;

