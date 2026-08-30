// ============================================================
// RoutePolyline — Real Road-Following Route (Cached & Throttled)
// ============================================================

import React, { useEffect, useRef, useState } from 'react';
import { Polyline } from 'react-native-maps';
import polyline from '@mapbox/polyline';
import { COLORS, GOOGLE_PLACES_API_KEY } from '@constants';
import type { Location } from '@types';

interface Props {
  origin: Location | null | undefined;
  destination: Location | null | undefined;
  mode?: 'walking' | 'driving';
}

interface Coordinate {
  latitude: number;
  longitude: number;
}

// Generates street grid turns if Directions API is unavailable or offline
const generateStreetGridWaypoints = (orig: Location, dest: Location): Coordinate[] => {
  const dLat = dest.latitude - orig.latitude;
  const dLng = dest.longitude - orig.longitude;

  return [
    orig,
    { latitude: orig.latitude + dLat * 0.32, longitude: orig.longitude },
    { latitude: orig.latitude + dLat * 0.32, longitude: orig.longitude + dLng * 0.55 },
    { latitude: orig.latitude + dLat * 0.78, longitude: orig.longitude + dLng * 0.55 },
    { latitude: orig.latitude + dLat * 0.78, longitude: dest.longitude },
    dest,
  ];
};

export const RoutePolyline: React.FC<Props> = ({
  origin,
  destination,
  mode = 'walking',
}) => {
  const [routeCoords, setRouteCoords] = useState<Coordinate[]>([]);
  const lastOriginRef = useRef<Location | null>(null);
  const lastDestRef = useRef<Location | null>(null);
  const lastModeRef = useRef<string>(mode);
  const routeCacheRef = useRef<Map<string, Coordinate[]>>(new Map());

  useEffect(() => {
    if (!origin || !destination) {
      setRouteCoords([]);
      lastOriginRef.current = null;
      lastDestRef.current = null;
      return;
    }

    // Check if we already calculated this route or moved minimally (< ~60 meters)
    if (
      lastOriginRef.current &&
      lastDestRef.current &&
      lastModeRef.current === mode &&
      lastDestRef.current.latitude === destination.latitude &&
      lastDestRef.current.longitude === destination.longitude
    ) {
      const dLat = Math.abs(lastOriginRef.current.latitude - origin.latitude);
      const dLng = Math.abs(lastOriginRef.current.longitude - origin.longitude);
      if (dLat < 0.0006 && dLng < 0.0006) {
        return; // Skip recalculation, user has not moved significantly
      }
    }

    const cacheKey = `${origin.latitude.toFixed(3)},${origin.longitude.toFixed(3)}->${destination.latitude.toFixed(3)},${destination.longitude.toFixed(3)}_${mode}`;
    const cached = routeCacheRef.current.get(cacheKey);
    if (cached && cached.length > 0) {
      setRouteCoords(cached);
      lastOriginRef.current = origin;
      lastDestRef.current = destination;
      lastModeRef.current = mode;
      return;
    }

    let isCancelled = false;

    const fetchRoute = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 second max timeout

        const url =
          `https://maps.googleapis.com/maps/api/directions/json` +
          `?origin=${origin.latitude},${origin.longitude}` +
          `&destination=${destination.latitude},${destination.longitude}` +
          `&mode=${mode}` +
          `&key=${GOOGLE_PLACES_API_KEY}`;

        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        const data = await response.json();

        if (isCancelled) return;

        if (data.status === 'OK' && data.routes && data.routes.length > 0) {
          const encoded = data.routes[0].overview_polyline.points;
          const decoded = polyline.decode(encoded);
          const coords: Coordinate[] = decoded.map(([lat, lng]: [number, number]) => ({
            latitude: lat,
            longitude: lng,
          }));
          routeCacheRef.current.set(cacheKey, coords);
          setRouteCoords(coords);
        } else {
          const fallback = generateStreetGridWaypoints(origin, destination);
          routeCacheRef.current.set(cacheKey, fallback);
          setRouteCoords(fallback);
        }
      } catch {
        if (!isCancelled) {
          const fallback = generateStreetGridWaypoints(origin, destination);
          setRouteCoords(fallback);
        }
      }

      lastOriginRef.current = origin;
      lastDestRef.current = destination;
      lastModeRef.current = mode;
    };

    fetchRoute();

    return () => {
      isCancelled = true;
    };
  }, [
    origin?.latitude,
    origin?.longitude,
    destination?.latitude,
    destination?.longitude,
    mode,
  ]);

  if (!origin || !destination || routeCoords.length < 2) return null;

  return (
    <>
      {/* Outer Glow Route Border */}
      <Polyline
        coordinates={routeCoords}
        strokeColor="rgba(42, 71, 54, 0.22)"
        strokeWidth={9}
        lineCap="round"
        lineJoin="round"
      />
      {/* Primary In-App Route Line */}
      <Polyline
        coordinates={routeCoords}
        strokeColor={mode === 'walking' ? COLORS.primary : '#2E6BE6'}
        strokeWidth={4.5}
        lineCap="round"
        lineJoin="round"
      />
    </>
  );
};
