// ============================================================
// useLocation — GPS Tracking with Graceful Fallback
// ============================================================

import { useEffect, useState, useRef } from 'react';
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
  const setUserHeading = useStore((s) => s.setUserHeading);
  const [location, setLocation] = useState<Location>({
    latitude: DEFAULT_REGION.latitude,
    longitude: DEFAULT_REGION.longitude,
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const lastHeadingRef = useRef<number>(0);
  const lastHeadingTimeRef = useRef<number>(0);
  const lastLocRef = useRef<Location | null>(null);

  useEffect(() => {
    let positionSub: ExpoLocation.LocationSubscription | null = null;
    let headingSub: ExpoLocation.LocationSubscription | null = null;
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
          lastLocRef.current = loc;
          setLocation(loc);
          setUserLocation(loc);
          if (initial.coords.heading !== null && initial.coords.heading !== undefined) {
            lastHeadingRef.current = initial.coords.heading;
            setUserHeading(initial.coords.heading);
          }
          setIsLoading(false);
        }

        // Watch for position updates as user moves (throttled to 5 meters)
        positionSub = await ExpoLocation.watchPositionAsync(
          { accuracy: ExpoLocation.Accuracy.Balanced, distanceInterval: 8 },
          (pos) => {
            if (isMounted && pos?.coords) {
              const updated: Location = {
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
              };
              if (
                !lastLocRef.current ||
                Math.abs(lastLocRef.current.latitude - updated.latitude) > 0.00005 ||
                Math.abs(lastLocRef.current.longitude - updated.longitude) > 0.00005
              ) {
                lastLocRef.current = updated;
                setLocation(updated);
                setUserLocation(updated);
              }
            }
          },
        );

        // Watch for device compass / magnetic heading with deadband filtering (prevents gyro jitter)
        try {
          headingSub = await ExpoLocation.watchHeadingAsync((headingData) => {
            if (isMounted && headingData) {
              const deg = headingData.trueHeading >= 0 ? headingData.trueHeading : headingData.magHeading;
              const now = Date.now();
              if (
                deg >= 0 &&
                Math.abs(deg - lastHeadingRef.current) >= 3.5 &&
                now - lastHeadingTimeRef.current >= 150
              ) {
                lastHeadingRef.current = deg;
                lastHeadingTimeRef.current = now;
                setUserHeading(deg);
              }
            }
          });
        } catch {}
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
      positionSub?.remove();
      headingSub?.remove();
    };
  }, [setUserLocation, setUserHeading]);

  return { location, errorMsg, isLoading };
}
