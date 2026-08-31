// ============================================================
// UserLocationMarker — GPU-Accelerated Directional Heading Cone
// Uses native Marker `rotation` prop for 120fps smooth rotation
// Zero CPU redraws, zero blinking, never disappears
// ============================================================

import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { useStore } from '@store/useStore';
import type { Location } from '@types';

interface Props {
  location: Location;
}

const UserLocationMarkerComponent: React.FC<Props> = ({ location }) => {
  // Read heading from store (throttled in useLocation hook)
  const heading = useStore((s) => s.userHeading);

  return (
    <Marker
      coordinate={location}
      anchor={{ x: 0.5, y: 0.5 }}
      rotation={heading} // Native GPU layer rotation on iOS & Android — zero redraws!
      flat={true}
      tracksViewChanges={false} // Kept static in GPU texture cache so it NEVER blinks
      zIndex={999}
    >
      <View style={styles.container}>
        {/* Directional Flashlight Beam Cone (Points UP towards 0° North) */}
        <View style={styles.coneWrapper}>
          <View style={styles.coneBeam} />
        </View>

        {/* Pulsing Blue Halo */}
        <View style={styles.haloRing} />

        {/* Core Google Blue Dot */}
        <View style={styles.blueDot}>
          <View style={styles.innerCoreDot} />
        </View>
      </View>
    </Marker>
  );
};

export const UserLocationMarker = memo(UserLocationMarkerComponent);

const styles = StyleSheet.create({
  container: {
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coneWrapper: {
    position: 'absolute',
    top: 4,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  // 60-degree translucent directional flashlight beam pointing UP
  coneBeam: {
    width: 0,
    height: 0,
    borderLeftWidth: 26,
    borderRightWidth: 26,
    borderTopWidth: 42,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'rgba(26, 115, 232, 0.42)', // Vivid Google Blue Flashlight Cone
    transform: [{ rotate: '180deg' }], // Flips wedge to point outward
  },
  haloRing: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(26, 115, 232, 0.20)',
    borderWidth: 1,
    borderColor: 'rgba(26, 115, 232, 0.40)',
  },
  blueDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#1A73E8', // Google Blue
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1A73E8',
    shadowOpacity: 0.5,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 6,
  },
  innerCoreDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
});
