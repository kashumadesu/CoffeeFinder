// ============================================================
// UserLocationMarker — Google Maps-Style Directional Heading Cone
// Real-time compass flashlight beam + pulsating blue GPS beacon
// ============================================================

import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import type { Location } from '@types';

interface Props {
  location: Location;
  heading?: number;
}

const UserLocationMarkerComponent: React.FC<Props> = ({ location, heading = 0 }) => {
  return (
    <Marker
      coordinate={location}
      anchor={{ x: 0.5, y: 0.5 }}
      flat={true}
      tracksViewChanges={false}
      zIndex={999}
    >
      <View style={styles.container}>
        {/* Directional Flashlight Beam / Heading Cone (Rotates with Compass) */}
        <View
          style={[
            styles.headingConeWrapper,
            { transform: [{ rotate: `${Math.round(heading)}deg` }] },
          ]}
        >
          <View style={styles.headingConeBeam} />
        </View>

        {/* Pulsing Translucent Halo */}
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
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headingConeWrapper: {
    position: 'absolute',
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  // Flashlight wedge beam pointing upward (0 deg is top)
  headingConeBeam: {
    width: 0,
    height: 0,
    borderLeftWidth: 26,
    borderRightWidth: 26,
    borderTopWidth: 42,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'rgba(66, 133, 244, 0.35)', // Translucent Google Blue Beam
    opacity: 0.85,
  },
  haloRing: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(66, 133, 244, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(66, 133, 244, 0.4)',
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
