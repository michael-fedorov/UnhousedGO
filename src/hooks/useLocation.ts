import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import type { LocationObject } from 'expo-location';

interface UseLocationResult {
  location: LocationObject | null;
  error: string | null;
  permissionGranted: boolean;
}

export function useLocation(): UseLocationResult {
  const [location, setLocation] = useState<LocationObject | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    async function startWatching() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Location permission was denied. Enable it in Settings to see your position on the map.');
          setPermissionGranted(false);
          return;
        }

        setPermissionGranted(true);
        setError(null);

        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 5000,
            distanceInterval: 10,
          },
          (newLocation) => {
            setLocation(newLocation);
          },
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown location error';
        setError(message);
      }
    }

    startWatching();

    return () => {
      subscription?.remove();
    };
  }, []);

  return { location, error, permissionGranted };
}
