// Improved location service with better accuracy and fallbacks

// Get high-accuracy location with timeout and fallbacks
export const getHighAccuracyLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }

    // Options for high accuracy with timeout
    const options = {
      enableHighAccuracy: true,
      timeout: 15000, // 15 seconds timeout
      maximumAge: 0 // Don't use cached position
    };

    // Try high-accuracy GPS first
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: position.timestamp,
          source: 'gps'
        };
        console.log("GPS Location obtained:", location);
        resolve(location);
      },
      (error) => {
        console.warn("High-accuracy GPS failed:", error.message);
        
        // Fallback 1: Try with lower accuracy requirements
        const fallbackOptions = {
          enableHighAccuracy: false,
          timeout: 20000,
          maximumAge: 300000 // 5 minutes cache
        };

        navigator.geolocation.getCurrentPosition(
          (fallbackPosition) => {
            const location = {
              lat: fallbackPosition.coords.latitude,
              lng: fallbackPosition.coords.longitude,
              accuracy: fallbackPosition.coords.accuracy,
              altitude: fallbackPosition.coords.altitude,
              heading: fallbackPosition.coords.heading,
              speed: fallbackPosition.coords.speed,
              timestamp: fallbackPosition.timestamp,
              source: 'network'
            };
            console.log("Network Location obtained:", location);
            resolve(location);
          },
          (fallbackError) => {
            console.error("All location methods failed:", fallbackError.message);
            reject(new Error(`Unable to get location: ${fallbackError.message}`));
          },
          fallbackOptions
        );
      },
      options
    );
  });
};

// Watch position continuously for real-time updates
export const watchLocation = (onLocationUpdate, onError) => {
  if (!navigator.geolocation) {
    onError(new Error("Geolocation not supported"));
    return null;
  }

  const options = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 5000 // Cache for 5 seconds
  };

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      const location = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude,
        heading: position.coords.heading,
        speed: position.coords.speed,
        timestamp: position.timestamp,
        source: position.coords.accuracy < 20 ? 'gps' : 'network'
      };
      console.log("Watch Location update:", location);
      onLocationUpdate(location);
    },
    (error) => {
      console.error("Watch position error:", error.message);
      onError(error);
    },
    options
  );

  return watchId;
};

// Stop watching location
export const clearWatch = (watchId) => {
  if (watchId !== null && watchId !== undefined) {
    navigator.geolocation.clearWatch(watchId);
  }
};

// Get location with IP fallback (for areas without GPS)
export const getLocationWithIPFallback = async () => {
  try {
    // Try GPS first
    return await getHighAccuracyLocation();
  } catch (gpsError) {
    console.warn("GPS failed, trying IP-based location...");
    
    try {
      // Try IP-based location using ipapi
      const response = await fetch('https://ipapi.co/json/');
      if (response.ok) {
        const ipData = await response.json();
        if (ipData.latitude && ipData.longitude) {
          return {
            lat: ipData.latitude,
            lng: ipData.longitude,
            accuracy: 1000, // IP location is less accurate
            city: ipData.city,
            region: ipData.region,
            country: ipData.country_name,
            source: 'ip'
          };
        }
      }
    } catch (ipError) {
      console.warn("IP location also failed:", ipError);
    }
    
    throw new Error("Unable to determine location. Please enable GPS.");
  }
};

// Calculate distance between two coordinates (in meters)
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

// Check if location is within a radius (in meters)
export const isWithinRadius = (userLat, userLng, targetLat, targetLng, radiusMeters) => {
  const distance = calculateDistance(userLat, userLng, targetLat, targetLng);
  return distance <= radiusMeters;
};

