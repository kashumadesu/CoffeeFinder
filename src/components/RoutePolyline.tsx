// ============================================================
// RoutePolyline — High-Performance Road Polyline Renderer
// ============================================================

import React, { memo } from 'react';
import { Polyline } from 'react-native-maps';
import { COLORS } from '@constants';
import type { Location } from '@types';

interface Props {
  coordinates: Location[];
  mode?: 'walking' | 'driving';
}

const RoutePolylineComponent: React.FC<Props> = ({
  coordinates,
  mode = 'walking',
}) => {
  if (!coordinates || coordinates.length < 2) return null;

  return (
    <>
      {/* Outer Glow Route Border */}
      <Polyline
        coordinates={coordinates}
        strokeColor="rgba(27, 56, 40, 0.22)"
        strokeWidth={10}
        lineCap="round"
        lineJoin="round"
      />
      {/* Primary In-App Route Line */}
      <Polyline
        coordinates={coordinates}
        strokeColor={mode === 'walking' ? COLORS.primary : '#2E6BE6'}
        strokeWidth={5}
        lineCap="round"
        lineJoin="round"
      />
    </>
  );
};

export const RoutePolyline = memo(RoutePolylineComponent);
