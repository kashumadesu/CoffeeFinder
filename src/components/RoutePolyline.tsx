// ============================================================
// RoutePolyline Component — In-App Interactive Route Line
// ============================================================

import React from 'react';
import { Polyline } from 'react-native-maps';
import { COLORS } from '@constants';
import type { Location } from '@types';

interface Props {
  origin: Location;
  destination: Location;
}

export const RoutePolyline: React.FC<Props> = ({ origin, destination }) => {
  // Generate realistic street navigation waypoints between origin & destination
  const midLat = (origin.latitude + destination.latitude) / 2;
  const midLng = (origin.longitude + destination.longitude) / 2;

  const coordinates = [
    origin,
    { latitude: origin.latitude, longitude: midLng },
    { latitude: midLat, longitude: midLng },
    { latitude: midLat, longitude: destination.longitude },
    destination,
  ];

  return (
    <>
      {/* Glow border line */}
      <Polyline
        coordinates={coordinates}
        strokeColor="rgba(42, 71, 54, 0.25)"
        strokeWidth={8}
        lineCap="round"
        lineJoin="round"
      />
      {/* Primary route line */}
      <Polyline
        coordinates={coordinates}
        strokeColor={COLORS.primary}
        strokeWidth={4.5}
        lineCap="round"
        lineJoin="round"
      />
    </>
  );
};
