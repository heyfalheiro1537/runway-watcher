import { useState, useEffect, useCallback } from 'react';

interface GeoPosition {
  lat: number;
  lng: number;
  accuracy: number;
  heading: number | null;
  speed: number | null;
  timestamp: number;
}

export function useGeolocation(enabled = true) {
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !navigator.geolocation) {
      // Fallback mock position (SFO area)
      setPosition({
        lat: 37.6188 + (Math.random() - 0.5) * 0.002,
        lng: -122.375 + (Math.random() - 0.5) * 0.004,
        accuracy: 5,
        heading: 280,
        speed: 1.2,
        timestamp: Date.now(),
      });
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          heading: pos.coords.heading,
          speed: pos.coords.speed,
          timestamp: pos.timestamp,
        });
        setError(null);
      },
      (err) => {
        setError(err.message);
        // Fallback to mock
        setPosition({
          lat: 37.6188 + (Math.random() - 0.5) * 0.002,
          lng: -122.375 + (Math.random() - 0.5) * 0.004,
          accuracy: 5,
          heading: 280,
          speed: 1.2,
          timestamp: Date.now(),
        });
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [enabled]);

  return { position, error };
}
