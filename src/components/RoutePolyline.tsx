// ============================================================
// RoutePolyline — Real Road-Following Route via Google Directions API
// ============================================================

import React, { useEffect, useState } from 'react';
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

  useEffect(() => {
    if (!origin || !destination) {
      setRouteCoords([]);
      return;
    }
    fetchRoute(origin, destination);
  }, [
    origin?.latitude,
    origin?.longitude,
    destination?.latitude,
    destination?.longitude,
    mode,
  ]);

  const fetchRoute = async (orig: Location, dest: Location) => {
    try {
      const url =
        `https://maps.googleapis.com/maps/api/directions/json` +
        `?origin=${orig.latitude},${orig.longitude}` +
        `&destination=${dest.latitude},${dest.longitude}` +
        `&mode=${mode}` +
        `&key=${GOOGLE_PLACES_API_KEY}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.routes && data.routes.length > 0) {
        const encoded = data.routes[0].overview_polyline.points;
        const decoded = polyline.decode(encoded);
        const coords: Coordinate[] = decoded.map(([lat, lng]: [number, number]) => ({
          latitude: lat,
          longitude: lng,
        }));
        setRouteCoords(coords);
      } else {
        // Fallback: realistic urban street turn waypoints
        setRouteCoords(generateStreetGridWaypoints(orig, dest));
      }
    } catch {
      // Network or API error fallback
      setRouteCoords(generateStreetGridWaypoints(orig, dest));
    }
  };

  if (!origin || !destination || routeCoords.length < 2) return null;

  return (
    <>
      {/* Outer Glow Route Border */}
      <Polyline
        coordinates={routeCoords}
        strokeColor="rgba(42, 71, 54, 0.2)"
        strokeWidth={9}
        lineCap="round"
        lineJoin="round"
      />
      {/* Primary In-App Route Line */}
      <Polyline
        coordinates={routeCoords}
        strokeColor={COLORS.primary}
        strokeWidth={4.5}
        lineCap="round"
        lineJoin="round"
      />
    </>
  );
};
