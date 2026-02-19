import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* 🔥 Resize Fix */
function ResizeMap({ isFullScreen }) {
  const map = useMap();

  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 200);
  }, [isFullScreen, map]);

  return null;
}

const LiveMap = () => {
  const [position, setPosition] = useState([10.2314, 76.4091]);
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) return;

    const watcher = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition([pos.coords.latitude, pos.coords.longitude]);
      },
      (err) => console.error(err),
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watcher);
  }, []);

  const customIcon = new L.Icon({
    iconUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });

  return (
    <div
      style={
        isFullScreen
          ? {
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              zIndex: 9999,
              background: "white",
            }
          : {
              width: "5cm",
              height: "5cm",
              position: "relative",
            }
      }
    >
      {/* 🔥 Maximize / Minimize Arrow */}
      <div
        onClick={() => setIsFullScreen(!isFullScreen)}
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          zIndex: 10000,
          background: "#D32F2F",
          color: "white",
          padding: "6px 10px",
          borderRadius: "5px",
          cursor: "pointer",
          fontSize: "18px",
        }}
      >
        {isFullScreen ? "🗕" : "🗖"}
      </div>

      <MapContainer
        center={position}
        zoom={15}
        style={{ width: "100%", height: "100%" }}
      >
        <ResizeMap isFullScreen={isFullScreen} />

        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker position={position} icon={customIcon}>
          <Popup>You are here</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default LiveMap;