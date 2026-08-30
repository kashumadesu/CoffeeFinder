// ============================================================
// RoutePolyline — Real Road Route (Cached & Throttled)
// Surfaces real duration + distance from Directions API via onRouteReady
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
  onRouteReady?: (info: { durationSecs: number; distanceMetres: number }) => void;
}

interface Coordinate {
  latitude: number;
  longitude: number;
}

// Realistic L-shaped street grid fallback for offline use
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
  onRouteReady,
}) => {
  const [routeCoords, setRouteCoords] = useState<Coordinate[]>([]);
  const lastOriginRef = useRef<Location | null>(null);
  const lastDestRef = useRef<Location | null>(null);
  const lastModeRef = useRef<string>(mode);
  const routeCacheRef = useRef<Map<string, { coords: Coordinate[]; durationSecs: number; distanceMetres: number }>>(new Map());

  useEffect(() => {
    if (!origin || !destination) {
      setRouteCoords([]);
      lastOriginRef.current = null;
      lastDestRef.current = null;
      return;
    }

    // Skip if user has not moved > ~60 metres and destination/mode unchanged
    if (
      lastOriginRef.current &&
      lastDestRef.current &&
      lastModeRef.current === mode &&
      lastDestRef.current.latitude === destination.latitude &&
      lastDestRef.current.longitude === destination.longitude
    ) {
      const dLat = Math.abs(lastOriginRef.current.latitude - origin.latitude);
      const dLng = Math.abs(lastOriginRef.current.longitude - origin.longitude);
      if (dLat < 0.0006 && dLng < 0.0006) return;
    }

    const cacheKey = `${origin.latitude.toFixed(3)},${origin.longitude.toFixed(3)}->${destination.latitude.toFixed(3)},${destination.longitude.toFixed(3)}_${mode}`;
    const cached = routeCacheRef.current.get(cacheKey);
    if (cached && cached.coords.length > 0) {
      setRouteCoords(cached.coords);
      onRouteReady?.({ durationSecs: cached.durationSecs, distanceMetres: cached.distanceMetres });
      lastOriginRef.current = origin;
      lastDestRef.current = destination;
      lastModeRef.current = mode;
      return;
    }

    let isCancelled = false;

    const fetchRoute = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const url =
          `https://maps.googleapis.com/maps/api/directions/json` +
          `?origin=${origin.latitude},${origin.longitude}` +
          `&destination=${destination.latitude},${destination.longitude}` +
          `&mode=${mode}` +
          `&region=PH` +
          `&key=${GOOGLE_PLACES_API_KEY}`;

        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        const data = await response.json();

        if (isCancelled) return;

        if (data.status === 'OK' && data.routes?.length > 0) {
          const route = data.routes[0];
          const encoded = route.overview_polyline.points;
          const decoded = polyline.decode(encoded);
          const coords: Coordinate[] = decoded.map(([lat, lng]: [number, number]) => ({
            latitude: lat,
            longitude: lng,
          }));

          // Extract real duration and distance from the first leg
          const leg = route.legs?.[0];
          const durationSecs: number = leg?.duration?.value ?? 0;
          const distanceMetres: number = leg?.distance?.value ?? 0;

          routeCacheRef.current.set(cacheKey, { coords, durationSecs, distanceMetres });
          setRouteCoords(coords);
          onRouteReady?.({ durationSecs, distanceMetres });
        } else {
          // Offline fallback: estimate duration from straight-line distance
          const R = 6371000;
          const dLat = ((destination.latitude - origin.latitude) * Math.PI) / 180;
          const dLng = ((destination.longitude - origin.longitude) * Math.PI) / 180;
          const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos((origin.latitude * Math.PI) / 180) *
              Math.cos((destination.latitude * Math.PI) / 180) *
              Math.sin(dLng / 2) ** 2;
          const straightLine = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          // Road factor: real road distance is ~1.4x straight line in PH cities
          const roadFactor = 1.4;
          const distanceMetres = Math.round(straightLine * roadFactor);
          // Walking: 5 km/h (83 m/min), Driving: 25 km/h in city traffic (417 m/min)
          const speedMps = mode === 'walking' ? 1.38 : 6.94;
          const durationSecs = Math.round(distanceMetres / speedMps);

          const fallback = generateStreetGridWaypoints(origin, destination);
          routeCacheRef.current.set(cacheKey, { coords: fallback, durationSecs, distanceMetres });
          setRouteCoords(fallback);
          onRouteReady?.({ durationSecs, distanceMetres });
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
    return () => { isCancelled = true; };
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
      {/* Outer glow */}
      <Polyline
        coordinates={routeCoords}
        strokeColor="rgba(42, 71, 54, 0.18)"
        strokeWidth={10}
        lineCap="round"
        lineJoin="round"
      />
      {/* Primary route */}
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
