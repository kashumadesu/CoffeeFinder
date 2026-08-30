// ============================================================
// CoffeeMarker — Minimal, Clip-Free Custom Map Pin
// ============================================================

import React, { memo, useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { Feather } from '@expo/vector-icons';
import { hapticLight } from '@utils/haptics';
import type { CoffeeShop } from '@types';

interface Props {
  shop: CoffeeShop;
  isSelected: boolean;
  onPress: (shop: CoffeeShop) => void;
}

const CoffeeMarkerComponent: React.FC<Props> = ({ shop, isSelected, onPress }) => {
  // Allow iOS native layout to finish before freezing tracksViewChanges
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  useEffect(() => {
    setTracksViewChanges(true);
    const timer = setTimeout(() => setTracksViewChanges(false), 500);
    return () => clearTimeout(timer);
  }, [isSelected]);

  // First letter initial of café name for selected state
  const initial = shop.name.charAt(0).toUpperCase();

  return (
    <Marker
      coordinate={shop.location}
      onPress={(e) => {
        e.stopPropagation();
        hapticLight();
        onPress(shop);
      }}
      tracksViewChanges={tracksViewChanges}
      identifier={shop.id}
      anchor={{ x: 0.5, y: 1 }}
    >
      {/* Outer wrapper sized generously — avoids any clipping */}
      <View style={styles.wrapper}>
        {isSelected ? (
          <>
            <View style={styles.bubbleSelected}>
              <Text style={styles.initial}>{initial}</Text>
            </View>
            <View style={styles.tail} />
          </>
        ) : (
          <View style={[styles.bubble, shop.isVerified === false && styles.bubbleUnverified]}>
            <Feather name="coffee" size={13} color={shop.isVerified === false ? '#8A7560' : '#4A3423'} />
          </View>
        )}
      </View>
    </Marker>
  );
};

export const CoffeeMarker = memo(CoffeeMarkerComponent);

const styles = StyleSheet.create({
  // Generous container — overflow visible prevents clipping on all devices
  wrapper: {
    alignItems: 'center',
    overflow: 'visible',
    paddingHorizontal: 6,
    paddingTop: 6,
  },
  // Unselected pin — small, clean circle
  bubble: {
    backgroundColor: '#D9CCBE',
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 4,
  },
  // Unverified café — greyed out
  bubbleUnverified: {
    backgroundColor: '#E0D8CF',
    borderColor: '#E8E0D8',
  },
  // Selected pin — larger, brand green, with initial
  bubbleSelected: {
    backgroundColor: '#1C3326',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    shadowColor: '#1C3326',
    shadowOpacity: 0.4,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
  initial: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  // Pointer tail — sits flush below the bubble
  tail: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#1C3326',
    marginTop: 0,
  },
});
