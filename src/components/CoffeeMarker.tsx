// ============================================================
// CoffeeMarker — Custom Taupe & Dark Bubble Map Pin (Feather Icon + Memoized)
// ============================================================

import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { Feather } from '@expo/vector-icons';
import type { CoffeeShop } from '@types';

interface Props {
  shop: CoffeeShop;
  isSelected: boolean;
  onPress: (shop: CoffeeShop) => void;
}

const CoffeeMarkerComponent: React.FC<Props> = ({ shop, isSelected, onPress }) => (
  <Marker
    coordinate={shop.location}
    onPress={() => onPress(shop)}
    tracksViewChanges={false}
    title={shop.name}
    description={shop.vicinity}
  >
    <View style={[styles.pin, isSelected && styles.pinSelected]}>
      <Feather
        name="coffee"
        size={isSelected ? 18 : 16}
        color={isSelected ? '#FFFFFF' : '#4A3423'}
      />
      {isSelected && <View style={styles.tail} />}
    </View>
  </Marker>
);

export const CoffeeMarker = memo(CoffeeMarkerComponent);

const styles = StyleSheet.create({
  pin: {
    backgroundColor: '#D2C4B5',
    borderRadius: 18,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  pinSelected: {
    backgroundColor: '#1C3326',
    width: 42,
    height: 42,
    borderRadius: 21,
    borderColor: '#FFFFFF',
    borderWidth: 2.5,
    transform: [{ scale: 1.15 }],
  },
  tail: {
    position: 'absolute',
    bottom: -6,
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#1C3326',
  },
});
