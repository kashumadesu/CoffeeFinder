// ============================================================
// RatingStars — Vector Icon star rating + GCash badge
// ============================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING } from '@constants';

interface Props {
  rating: number;
  count?: number;
  size?: number;
  showGcash?: boolean;
}

export const RatingStars: React.FC<Props> = ({
  rating,
  count,
  size = 13,
  showGcash = false,
}) => {
  return (
    <View style={styles.row}>
      <Feather name="star" size={size} color={COLORS.star} />
      <Text style={[styles.ratingNumber, { fontSize: size }]}>
        {rating.toFixed(1)}
      </Text>
      {count !== undefined && (
        <Text style={[styles.count, { fontSize: size - 1 }]}>
          ({count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count})
        </Text>
      )}
      {showGcash && (
        <View style={styles.gcashPill}>
          <View style={styles.gcashDot} />
          <Text style={styles.gcashText}>GCash</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingNumber: {
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  count: {
    color: COLORS.textSecondary,
    marginLeft: 1,
  },
  gcashPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF4FF',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: SPACING.xs,
    gap: 4,
  },
  gcashDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.gcash,
  },
  gcashText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.gcash,
  },
});
