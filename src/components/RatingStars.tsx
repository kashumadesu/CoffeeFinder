// ============================================================
// RatingStars Component — Clean Star Rating
// ============================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
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
      <Text style={[styles.starIcon, { fontSize: size }]}>⭐</Text>
      <Text style={[styles.ratingNumber, { fontSize: size }]}>
        {rating.toFixed(1)}
      </Text>
      {count !== undefined && (
        <Text style={[styles.count, { fontSize: size - 1 }]}>
          ({count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count} reviews)
        </Text>
      )}

      {showGcash && (
        <View style={styles.gcashPill}>
          <Text style={styles.gcashIcon}>🔵</Text>
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
    gap: 4,
  },
  starIcon: {
    color: COLORS.star,
    marginTop: -1,
  },
  ratingNumber: {
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  count: {
    color: COLORS.textSecondary,
    marginLeft: 2,
  },
  gcashPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF4FF',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: SPACING.xs,
    gap: 3,
  },
  gcashIcon: {
    fontSize: 8,
  },
  gcashText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.gcash,
  },
});
