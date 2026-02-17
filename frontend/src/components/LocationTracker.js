import { useEffect, useState } from "react";
import API from "../services/api";

const LocationTracker = () => {
  const [location, setLocation] = useState(null);

  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        setLocation({ latitude, longitude });

        // 🔥 Send to backend
        API.post("/location/update", {
          latitude,
          longitude
        });
      },
      (error) => {
        console.error(error);
      },
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return (
    <div style={{ marginTop: "20px" }}>
      <h3>📍 Live Location Tracking</h3>
      {location ? (
        <>
          <p>Latitude: {location.latitude}</p>
          <p>Longitude: {location.longitude}</p>
        </>
      ) : (
        <p>Fetching location...</p>
      )}
    </div>
  );
};

export default LocationTracker;
