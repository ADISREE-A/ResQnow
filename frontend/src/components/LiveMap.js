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

/* 🛣️ Routing Control Component */
function RoutingMachine({ start, end, onRouteReady, onRouteError }) {
  const map = useMap();
  const routingControlRef = useRef(null);

  useEffect(() => {
    if (!start || !end || !map) return;

    // Remove existing routing control
    if (routingControlRef.current) {
      map.removeControl(routingControlRef.current);
    }

    // Create new routing control
    const routingControl = L.Routing.control({
      waypoints: [
        L.latLng(start[0], start[1]),
        L.latLng(end[0], end[1])
      ],
      routeWhileDragging: false,
      showAlternatives: true,
      altLineOptions: {
        styles: [
          { color: 'black', opacity: 0.15, weight: 9 },
          { color: 'white', opacity: 0.8, weight: 6 },
          { color: 'blue', opacity: 0.5, weight: 2 }
        ]
      },
      lineOptions: {
        styles: [
          { color: 'green', opacity: 0.8, weight: 6 }
        ]
      },
      createMarker: function() { return null; }, // Don't create default markers
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      showInstructions: false
    });

    routingControl.addTo(map);
    routingControlRef.current = routingControl;

    // Listen for route calculation
    routingControl.on('routesfound', function(e) {
      const routes = e.routes;
      if (routes && routes.length > 0) {
        const summary = routes[0].summary;
        const distanceKm = (summary.totalDistance / 1000).toFixed(1);
        const timeMinutes = Math.round(summary.totalTime / 60);
        
        if (onRouteReady) {
          onRouteReady({
            distance: distanceKm,
            time: timeMinutes,
            instructions: routes[0].instructions
          });
        }
      }
    });

    routingControl.on('routingerror', function(e) {
      console.error('Routing error:', e);
      if (onRouteError) {
        onRouteError(e);
      }
    });

    return () => {
      if (routingControlRef.current && map) {
        map.removeControl(routingControlRef.current);
      }
    };
  }, [start, end, map]);

  return null;
}

const LiveMap = () => {
  const [position, setPosition] = useState(null);
  const [places, setPlaces] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [showDirections, setShowDirections] = useState(false);
  const [routingEnabled, setRoutingEnabled] = useState(false);

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
    
    const placeName = place.tags?.name || "this location";
    speak(`Calculating route to ${placeName}`);
  };

  /* 🧹 Clear Route */
  const handleClearRoute = () => {
    setSelectedPlace(null);
    setRoutingEnabled(false);
    setRouteInfo(null);
    setShowDirections(false);
    speak("Route cleared");
  };

  /* 📖 Handle Route Ready */
  const handleRouteReady = (info) => {
    setRouteInfo(info);
    const placeName = selectedPlace?.tags?.name || "destination";
    speak(`Route to ${placeName} found. ${info.distance} kilometers, approximately ${info.time} minutes.`);
  };

  /* 📖 Toggle Directions Panel */
  const toggleDirections = () => {
    setShowDirections(!showDirections);
  };

  if (!position) {
    return <p style={{ textAlign: "center" }}>📍 Getting your location...</p>;
  }

  return (
    <div style={{ width: "100%" }}>
      {/* Route Control Panel */}
      <div style={styles.controlPanel}>
        <h3 style={{ margin: "0 0 10px 0" }}>🛣️ Safe Route Finder</h3>
        
        {places.length > 0 ? (
          <div style={styles.placeList}>
            <p style={{ margin: "0 0 10px 0", fontSize: "14px", color: "#666" }}>
              Select a destination to get directions:
            </p>
            {places.slice(0, 5).map((place, index) => {
              if (!place.tags) return null;
              return (
                <div key={index} style={styles.placeItem}>
                  <span style={{ fontSize: "12px" }}>
                    {place.tags.amenity === "hospital" && "🏥 "}
                    {place.tags.amenity === "pharmacy" && "💊 "}
                    {place.tags.amenity === "police" && "👮 "}
                    {place.tags.name || `Unknown ${place.tags.amenity}`}
                  </span>
                  <button
                    onClick={() => handleGetRoute(place)}
                    style={styles.routeBtn}
                  >
                    🛣️ Route
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <p style={{ fontSize: "14px", color: "#666" }}>
            Searching for nearby safe places...
          </p>
        )}

        {routeInfo && (
          <div style={styles.routeInfo}>
            <strong>📏 Distance:</strong> {routeInfo.distance} km<br />
            <strong>⏱️ Est. Time:</strong> {routeInfo.time} min
          </div>
        )}

        {routeInfo && (
          <button onClick={toggleDirections} style={styles.directionsToggle}>
            {showDirections ? "🔼 Hide Directions" : "🔽 Show Directions"}
          </button>
        )}

        {routingEnabled && (
          <button onClick={handleClearRoute} style={styles.clearBtn}>
            ❌ Clear Route
          </button>
        )}
      </div>

      {/* Directions Panel */}
      {showDirections && routeInfo && routeInfo.instructions && (
        <div style={styles.directionsPanel}>
          <h4 style={{ margin: "0 0 10px 0" }}>📝 Turn-by-Turn Directions</h4>
          <div style={styles.instructionsList}>
            {routeInfo.instructions.map((instruction, index) => {
              if (instruction.type === 'Straight' || instruction.type === 'DestinationReached') {
                return null; // Skip minor instructions
              }
              return (
                <div key={index} style={styles.instruction}>
                  <span style={styles.instructionType}>
                    {instruction.type === 'Turn right' && '➡️'}
                    {instruction.type === 'Turn left' && '⬅️'}
                    {instruction.type === 'Roundabout' && '🔄'}
                    {instruction.type === 'Merge' && '🔗'}
                    {instruction.type === 'Exit' && '🚪'}
                    {!['Turn right', 'Turn left', 'Roundabout', 'Merge', 'Exit'].includes(instruction.type) && '➡️'}
                  </span>
                  <span style={styles.instructionText}>
                    {instruction.text}
                  </span>
                  {instruction.distance && (
                    <span style={styles.instructionDistance}>
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
    backgroundColor: "#f8f9fa",
    padding: "15px",
    borderRadius: "8px",
    marginBottom: "10px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
  },
  placeList: {
    maxHeight: "150px",
    overflowY: "auto"
  },
  placeItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px",
    borderBottom: "1px solid #eee",
    gap: "10px"
  },
  routeBtn: {
    backgroundColor: "#28a745",
    color: "white",
    border: "none",
    padding: "5px 10px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px",
    whiteSpace: "nowrap"
  },
  routeInfo: {
    marginTop: "10px",
    padding: "10px",
    backgroundColor: "#e7f3e7",
    borderRadius: "4px",
    fontSize: "14px"
  },
  directionsToggle: {
    marginTop: "10px",
    padding: "8px 15px",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    width: "100%"
  },
  clearBtn: {
    marginTop: "10px",
    padding: "8px 15px",
    backgroundColor: "#dc3545",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    width: "100%"
  },
  directionsPanel: {
    backgroundColor: "#f8f9fa",
    padding: "15px",
    borderRadius: "8px",
    marginBottom: "10px",
    maxHeight: "200px",
    overflowY: "auto",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
  },
  instructionsList: {
    fontSize: "13px"
  },
  instruction: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "6px 0",
    borderBottom: "1px solid #eee"
  },
  instructionType: {
    fontSize: "16px",
    minWidth: "25px"
  },
  instructionText: {
    flex: 1
  },
  instructionDistance: {
    color: "#666",
    fontSize: "12px"
  }
};

export default LiveMap;

