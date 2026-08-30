// ============================================================
// RoutePolyline — Real Road-Following Route via Google Directions API
// ============================================================

import React, { useEffect, useState } from 'react';
import { Polyline } from 'react-native-maps';
import polyline from '@mapbox/polyline';
import { COLORS, GOOGLE_PLACES_API_KEY } from '@constants';
import type { Location } from '@types';

interface Props {
  origin: Location;
  destination: Location;
  mode?: 'walking' | 'driving';
}

interface Coordinate {
  latitude: number;
  longitude: number;
}

export const RoutePolyline: React.FC<Props> = ({
  origin,
  destination,
  mode = 'walking',
}) => {
  const [routeCoords, setRouteCoords] = useState<Coordinate[]>([]);

  useEffect(() => {
    fetchRoute();
  }, [origin.latitude, origin.longitude, destination.latitude, destination.longitude, mode]);

  const fetchRoute = async () => {
    try {
      const url =
        `https://maps.googleapis.com/maps/api/directions/json` +
        `?origin=${origin.latitude},${origin.longitude}` +
        `&destination=${destination.latitude},${destination.longitude}` +
        `&mode=${mode}` +
        `&key=${GOOGLE_PLACES_API_KEY}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.routes.length > 0) {
        const encoded = data.routes[0].overview_polyline.points;
        const decoded = polyline.decode(encoded);
        const coords: Coordinate[] = decoded.map(([lat, lng]: [number, number]) => ({
          latitude: lat,
          longitude: lng,
        }));
        setRouteCoords(coords);
      } else {
        // Fallback: straight line if API fails / no key
        setRouteCoords([origin, destination]);
      }
    } catch {
      // Network error fallback
      setRouteCoords([origin, destination]);
    }
  };

  if (routeCoords.length < 2) return null;

  return (
    <>
      {/* Glow shadow line */}
      <Polyline
        coordinates={routeCoords}
        strokeColor="rgba(42, 71, 54, 0.2)"
        strokeWidth={9}
        lineCap="round"
        lineJoin="round"
      />
      {/* Primary route line */}
      <Polyline
        coordinates={routeCoords}
        strokeColor={COLORS.primary}
        strokeWidth={4}
        lineCap="round"
        lineJoin="round"
      />
    </>
  );
};
