// ============================================================
// CoffeeMarker — Glitch-Free, Zero-Jump Custom Map Pin
// Fixed frame coordinates prevent iOS top-left jumping and disappearance
// ============================================================

import React, { memo } from 'react';
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
  // First letter initial of café name for selected state
  const initial = shop.name.charAt(0).toUpperCase();

  return (
    <Marker
      key={`${shop.id}-${isSelected ? 'sel' : 'unsel'}`}
      coordinate={shop.location}
      onPress={(e) => {
        e.stopPropagation();
        hapticLight();
        onPress(shop);
      }}
      identifier={shop.id}
      anchor={{ x: 0.5, y: 1 }}
      tracksViewChanges={false}
    >
      {/* Fixed-dimension outer container prevents coordinate re-layout glitches */}
      <View style={styles.fixedContainer}>
        {isSelected ? (
          <View style={styles.selectedWrapper}>
            <View style={styles.bubbleSelected}>
              <Text style={styles.initial}>{initial}</Text>
            </View>
            <View style={styles.tail} />
          </View>
        ) : (
          <View style={styles.unselectedWrapper}>
            <View style={[styles.bubble, shop.isVerified === false && styles.bubbleUnverified]}>
              <Feather
                name="coffee"
                size={13}
                color={shop.isVerified === false ? '#8A7560' : '#4A3423'}
              />
            </View>
          </View>
        )}
      </View>
    </Marker>
  );
};

export const CoffeeMarker = memo(CoffeeMarkerComponent);

const styles = StyleSheet.create({
  // Fixed size container prevents any subview jump to (0,0)
  fixedContainer: {
    width: 44,
    height: 48,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  unselectedWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 4,
  },
  selectedWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
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
    width: 38,
    height: 38,
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
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#1C3326',
    marginTop: -1,
  },
});
