// ============================================================
// CoffeeMarker — custom map pin for each coffee shop
// ============================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { COLORS } from '@constants';
import type { CoffeeShop } from '@types';

interface Props {
  shop: CoffeeShop;
  isSelected: boolean;
  onPress: (shop: CoffeeShop) => void;
}

export const CoffeeMarker: React.FC<Props> = ({ shop, isSelected, onPress }) => (
  <Marker
    coordinate={shop.location}
    onPress={() => onPress(shop)}
    tracksViewChanges={isSelected} // optimization: only re-render when selected
    title={shop.name}
    description={shop.vicinity}
  >
    <View style={[styles.pin, isSelected && styles.pinSelected]}>
      <Text style={styles.icon}>☕</Text>
      {isSelected && (
        <View style={styles.tail} />
      )}
    </View>
  </Marker>
);

const styles = StyleSheet.create({
  pin: {
    backgroundColor: COLORS.mapPin,
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.surface,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  pinSelected: {
    backgroundColor: COLORS.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderColor: COLORS.accent,
    borderWidth: 3,
    transform: [{ scale: 1.1 }],
  },
  icon: { fontSize: 18 },
  tail: {
    position: 'absolute',
    bottom: -8,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: COLORS.primary,
  },
});
