// ============================================================
// UserLocationMarker — Google Maps-Style Directional Heading Cone
// Real-time compass flashlight beam + pulsating blue GPS beacon
// ============================================================

import React, { memo, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Marker } from 'react-native-maps';
import { useStore } from '@store/useStore';
import type { Location } from '@types';

interface Props {
  location: Location;
}

const UserLocationMarkerComponent: React.FC<Props> = ({ location }) => {
  // Subscribe to userHeading inside this marker only — isolates MapScreen from re-renders!
  const heading = useStore((s) => s.userHeading);

  // Dynamic tracksViewChanges prevents iOS Marker disappearing / blinking glitches
  const [tracksViewChanges, setTracksViewChanges] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setTracksViewChanges(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setTracksViewChanges(false);
    }, 250);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [heading, location.latitude, location.longitude]);

  const rotation = Math.round(heading);

  return (
    <Marker
      coordinate={location}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={tracksViewChanges}
      zIndex={999}
      flat={false}
    >
      <View style={styles.container}>
        {/* Directional Flashlight Beam / Heading Cone (Rotates with Compass) */}
        <View
          style={[
            styles.headingConeWrapper,
            { transform: [{ rotate: `${rotation}deg` }] },
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
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headingConeWrapper: {
    position: 'absolute',
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  // Flashlight wedge beam pointing upward
  headingConeBeam: {
    width: 0,
    height: 0,
    borderLeftWidth: 28,
    borderRightWidth: 28,
    borderTopWidth: 46,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'rgba(66, 133, 244, 0.38)', // Translucent Google Blue Beam
  },
  haloRing: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(66, 133, 244, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(66, 133, 244, 0.45)',
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
