// ============================================================
// useLocation — GPS Tracking with Graceful Fallback
// ============================================================

import { useEffect, useState } from 'react';
import * as ExpoLocation from 'expo-location';
import { useStore } from '@store/useStore';
import type { Location } from '@types';
import { DEFAULT_REGION } from '@constants';

interface UseLocationReturn {
  location: Location;
  errorMsg: string | null;
  isLoading: boolean;
}

export function useLocation(): UseLocationReturn {
  const setUserLocation = useStore((s) => s.setUserLocation);
  const [location, setLocation] = useState<Location>({
    latitude: DEFAULT_REGION.latitude,
    longitude: DEFAULT_REGION.longitude,
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let subscription: ExpoLocation.LocationSubscription | null = null;
    let isMounted = true;

    (async () => {
      try {
        setIsLoading(true);
        const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (isMounted) {
            setErrorMsg('Location permission denied. Showing specialty spots in Quezon City & Metro Manila.');
            setIsLoading(false);
          }
          return;
        }

        // Quick position fix with balanced accuracy
        const initial = await ExpoLocation.getCurrentPositionAsync({
          accuracy: ExpoLocation.Accuracy.Balanced,
        });

        if (isMounted && initial?.coords) {
          const loc: Location = {
            latitude: initial.coords.latitude,
            longitude: initial.coords.longitude,
          };
          setLocation(loc);
          setUserLocation(loc);
          setIsLoading(false);
        }

        // Watch for updates as user moves
        subscription = await ExpoLocation.watchPositionAsync(
          { accuracy: ExpoLocation.Accuracy.Balanced, distanceInterval: 100 },
          (pos) => {
            if (isMounted && pos?.coords) {
              const updated: Location = {
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
              };
              setLocation(updated);
              setUserLocation(updated);
            }
          },
        );
      } catch (err: unknown) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : 'GPS service unavailable';
          setErrorMsg(msg);
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
      subscription?.remove();
    };
  }, [setUserLocation]);

  return { location, errorMsg, isLoading };
}
