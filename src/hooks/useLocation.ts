// ============================================================
// useLocation — requests GPS permission and tracks user position
// ============================================================

import { useEffect, useState } from 'react';
import * as ExpoLocation from 'expo-location';
import { useStore } from '@store/useStore';
import type { Location } from '@types';

interface UseLocationReturn {
  location: Location | null;
  errorMsg: string | null;
  isLoading: boolean;
}

export function useLocation(): UseLocationReturn {
  const setUserLocation = useStore((s) => s.setUserLocation);
  const fetchNearbyShops = useStore((s) => s.fetchNearbyShops);
  const [location, setLocation] = useState<Location | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let subscription: ExpoLocation.LocationSubscription | null = null;

    (async () => {
      setIsLoading(true);
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Location permission denied. Please enable it in Settings to find nearby coffee shops.');
        setIsLoading(false);
        return;
      }

      // Get a quick initial fix
      const initial = await ExpoLocation.getCurrentPositionAsync({
        accuracy: ExpoLocation.Accuracy.Balanced,
      });

      const loc: Location = {
        latitude: initial.coords.latitude,
        longitude: initial.coords.longitude,
      };
      setLocation(loc);
      setUserLocation(loc);
      fetchNearbyShops(loc);
      setIsLoading(false);

      // Then watch for changes (e.g., user is walking)
      subscription = await ExpoLocation.watchPositionAsync(
        { accuracy: ExpoLocation.Accuracy.Balanced, distanceInterval: 50 },
        (pos) => {
          const updated: Location = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          };
          setLocation(updated);
          setUserLocation(updated);
        },
      );
    })();

    return () => {
      subscription?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { location, errorMsg, isLoading };
}
