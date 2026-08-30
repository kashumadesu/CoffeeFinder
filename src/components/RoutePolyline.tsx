// ============================================================
// RoutePolyline — High-Visibility Multi-Layer Road Polyline
// Crystal-clear contrast on Satellite, Terrain, and Standard maps
// ============================================================

import React, { memo } from 'react';
import { Polyline } from 'react-native-maps';
import type { Location, NavigationMode, MapTypeOption } from '@types';

interface Props {
  coordinates: Location[];
  mode?: NavigationMode;
  mapType?: MapTypeOption;
}

const RoutePolylineComponent: React.FC<Props> = ({
  coordinates,
  mode = 'walking',
  mapType = 'standard',
}) => {
  if (!coordinates || coordinates.length < 2) return null;

  const isSatelliteOrTerrain = mapType === 'satellite' || mapType === 'terrain';

  // High-visibility core colors tuned for maximum contrast
  const getPrimaryColor = () => {
    if (isSatelliteOrTerrain) {
      // High-Voltage Neon Palette on dark satellite imagery
      if (mode === 'motorcycle') return '#FF9100'; // Neon Amber/Orange
      if (mode === 'transit') return '#E040FB';    // Neon Magenta/Purple Rail
      if (mode === 'driving') return '#00E5FF';    // Electric Neon Cyan
      return '#00E676';                            // Neon Spring Lime (Walk)
    }
    // Standard Road Map Palette
    if (mode === 'motorcycle') return '#FF6D00';   // Vivid Deep Orange
    if (mode === 'transit') return '#7B1FA2';      // Purple Transit
    if (mode === 'driving') return '#1A73E8';      // Google Royal Blue
    return '#1B5E20';                              // Deep Forest Green (Walk)
  };

  const primaryColor = getPrimaryColor();
  const casingColor = isSatelliteOrTerrain ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)';
  const casingWidth = isSatelliteOrTerrain ? 10 : 8.5;
  const coreWidth = isSatelliteOrTerrain ? 5.5 : 4.5;

  return (
    <>
      {/* Outer High-Contrast Casing Line */}
      <Polyline
        coordinates={coordinates}
        strokeColor={casingColor}
        strokeWidth={casingWidth}
        lineCap="round"
        lineJoin="round"
      />
      {/* Primary Vivid Road Line */}
      <Polyline
        coordinates={coordinates}
        strokeColor={primaryColor}
        strokeWidth={coreWidth}
        lineCap="round"
        lineJoin="round"
      />
    </>
  );
};

export const RoutePolyline = memo(RoutePolylineComponent);
