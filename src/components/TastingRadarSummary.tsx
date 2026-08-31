// ============================================================
// TastingRadarSummary — Visual Coffee Balance Summary
// ============================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from '@constants';
import type { CommunityReview } from '@types';

interface Props {
  reviews: CommunityReview[];
}

export const TastingRadarSummary: React.FC<Props> = ({ reviews }) => {
  if (reviews.length === 0) return null;

  const avgAcidity =
    reviews.reduce((sum, r) => sum + r.acidity, 0) / reviews.length;
  const avgSweetness =
    reviews.reduce((sum, r) => sum + r.sweetness, 0) / reviews.length;
  const avgBody =
    reviews.reduce((sum, r) => sum + r.body, 0) / reviews.length;

  const allTags = reviews.flatMap((r) => r.flavorTags);
  const tagCounts: { [tag: string]: number } = {};
  allTags.forEach((t) => {
    tagCounts[t] = (tagCounts[t] || 0) + 1;
  });

  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([tag]) => tag);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Feather name="activity" size={14} color={COLORS.primary} />
        <Text style={styles.title}>Community Sensory Profile</Text>
        <Text style={styles.reviewCount}>({reviews.length} cuppings)</Text>
      </View>

      {/* Sensory Bars */}
      <View style={styles.barsGrid}>
        <View style={styles.barRow}>
          <Text style={styles.barLabel}>Sweetness</Text>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${(avgSweetness / 5) * 100}%` }]} />
          </View>
          <Text style={styles.scoreText}>{avgSweetness.toFixed(1)}</Text>
        </View>

        <View style={styles.barRow}>
          <Text style={styles.barLabel}>Acidity</Text>
          <View style={styles.track}>
            <View
              style={[
                styles.fill,
                { width: `${(avgAcidity / 5) * 100}%`, backgroundColor: '#F59E0B' },
              ]}
            />
          </View>
          <Text style={styles.scoreText}>{avgAcidity.toFixed(1)}</Text>
        </View>

        <View style={styles.barRow}>
          <Text style={styles.barLabel}>Body</Text>
          <View style={styles.track}>
            <View
              style={[
                styles.fill,
                { width: `${(avgBody / 5) * 100}%`, backgroundColor: '#8D6E63' },
              ]}
            />
          </View>
          <Text style={styles.scoreText}>{avgBody.toFixed(1)}</Text>
        </View>
      </View>

      {/* Top Flavor Tags */}
      {topTags.length > 0 && (
        <View style={styles.topTagsRow}>
          <Text style={styles.topTagsLabel}>Dominant Notes:</Text>
          <View style={styles.tagsWrap}>
            {topTags.map((tag) => (
              <View key={tag} style={styles.tagBadge}>
                <Text style={styles.tagBadgeText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surfaceWarm,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: SPACING.sm,
    marginVertical: SPACING.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  reviewCount: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  barsGrid: {
    gap: 8,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  barLabel: {
    width: 75,
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  track: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.borderLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  scoreText: {
    width: 26,
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'right',
  },
  topTagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    flexWrap: 'wrap',
  },
  topTagsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  tagBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  tagBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#1B5E20',
  },
});
