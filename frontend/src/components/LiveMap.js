import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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

const LiveMap = () => {
  const [position, setPosition] = useState(null);
  const [places, setPlaces] = useState([]);

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
    iconUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
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

  if (!position) {
    return <p style={{ textAlign: "center" }}>📍 Getting your location...</p>;
  }

  return (
    <div style={{ width: "100%", height: "600px" }}>
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
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default LiveMap;