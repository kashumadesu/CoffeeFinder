// ============================================================
// RatingStars — renders up to 5 filled/half/empty star icons
// ============================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING } from '@constants';

interface Props {
  rating: number;
  count?: number;
  size?: number;
}

export const RatingStars: React.FC<Props> = ({ rating, count, size = 14 }) => {
  const stars = Array.from({ length: 5 }, (_, i) => {
    const filled = rating >= i + 1;
    const half = !filled && rating >= i + 0.5;
    return { filled, half };
  });

  return (
    <View style={styles.row}>
      {stars.map((s, i) => (
        <Text key={i} style={[styles.star, { fontSize: size }]}>
          {s.filled ? '★' : s.half ? '½' : '☆'}
        </Text>
      ))}
      {count !== undefined && (
        <Text style={[styles.count, { fontSize: size - 2 }]}>({count.toLocaleString()})</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 1 },
  star: { color: COLORS.star },
  count: { color: COLORS.textSecondary, marginLeft: SPACING.xs },
});
