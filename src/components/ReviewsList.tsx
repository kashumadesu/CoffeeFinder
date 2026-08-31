// ============================================================
// ReviewsList — Community Reviews & Cupping Feedback Feed
// ============================================================

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from '@constants';
import type { CommunityReview } from '@types';
import { useStore } from '@store/useStore';
import { hapticSelection } from '@utils/haptics';

interface Props {
  reviews: CommunityReview[];
  onWriteReviewPress: () => void;
}

export const ReviewsList: React.FC<Props> = ({ reviews, onWriteReviewPress }) => {
  const voteReviewHelpful = useStore((s) => s.voteReviewHelpful);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Community Tasting Feed</Text>
          <Text style={styles.subtitle}>Real reviews from Philippine specialty coffee lovers</Text>
        </View>
        <TouchableOpacity style={styles.writeReviewBtn} onPress={onWriteReviewPress} activeOpacity={0.85}>
          <Feather name="edit-3" size={13} color="#FFFFFF" />
          <Text style={styles.writeReviewText}>Write Review</Text>
        </TouchableOpacity>
      </View>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="coffee" size={28} color={COLORS.textMuted} />
          <Text style={styles.emptyTitle}>Be the first to review this spot!</Text>
          <Text style={styles.emptySub}>Share your tasting notes, extraction ratings, and recommendations.</Text>
          <TouchableOpacity style={styles.emptyActionBtn} onPress={onWriteReviewPress}>
            <Text style={styles.emptyActionText}>Add Cupping Notes</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.list}>
          {reviews.map((rev) => (
            <View key={rev.id} style={styles.reviewCard}>
              {/* Top Row: User & Rating */}
              <View style={styles.cardTop}>
                <View style={styles.userRow}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{rev.userName.charAt(0)}</Text>
                  </View>
                  <View>
                    <Text style={styles.userName}>{rev.userName}</Text>
                    <Text style={styles.dateText}>{rev.createdAt}</Text>
                  </View>
                </View>

                {/* Stars */}
                <View style={styles.starsWrap}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Feather
                      key={s}
                      name="star"
                      size={12}
                      color={s <= rev.rating ? '#F59E0B' : COLORS.borderLight}
                    />
                  ))}
                </View>
              </View>

              {/* Extraction Badges */}
              <View style={styles.badgesRow}>
                <View style={styles.methodBadge}>
                  <Feather name="coffee" size={10} color={COLORS.primary} />
                  <Text style={styles.methodBadgeText}>{rev.brewMethod}</Text>
                </View>

                {rev.beanOriginTag && (
                  <View style={styles.originBadge}>
                    <Text style={styles.originBadgeText}>
                      {rev.beanOriginTag === 'sagada'
                        ? '🌱 Sagada'
                        : rev.beanOriginTag === 'apo'
                        ? '🏔️ Mt. Apo'
                        : rev.beanOriginTag === 'benguet'
                        ? '🌿 Benguet'
                        : '☕ Barako'}
                    </Text>
                  </View>
                )}
              </View>

              {/* Flavor Tags */}
              {rev.flavorTags.length > 0 && (
                <View style={styles.flavorTagsRow}>
                  {rev.flavorTags.map((t) => (
                    <View key={t} style={styles.flavorTagChip}>
                      <Text style={styles.flavorTagText}>{t}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Comment */}
              <Text style={styles.commentText}>{rev.comment}</Text>

              {/* Photo */}
              {rev.photoUri && (
                <Image source={{ uri: rev.photoUri }} style={styles.reviewPhoto} resizeMode="cover" />
              )}

              {/* Bottom Row: Helpful Vote */}
              <View style={styles.cardBottom}>
                <TouchableOpacity
                  style={[styles.helpfulBtn, rev.isHelpfulByMe && styles.helpfulBtnActive]}
                  onPress={() => {
                    hapticSelection();
                    voteReviewHelpful(rev.id);
                  }}
                  activeOpacity={0.8}
                >
                  <Feather
                    name="thumbs-up"
                    size={12}
                    color={rev.isHelpfulByMe ? COLORS.primary : COLORS.textSecondary}
                  />
                  <Text
                    style={[
                      styles.helpfulText,
                      rev.isHelpfulByMe && styles.helpfulTextActive,
                    ]}
                  >
                    Helpful ({rev.helpfulCount})
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  writeReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
  },
  writeReviewText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyState: {
    backgroundColor: COLORS.surfaceWarm,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: 6,
    marginVertical: SPACING.xs,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  emptySub: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
    maxWidth: 260,
  },
  emptyActionBtn: {
    marginTop: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
  },
  emptyActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  list: {
    gap: SPACING.sm,
  },
  reviewCard: {
    backgroundColor: COLORS.surfaceWarm,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: 8,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceSage,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
  },
  userName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  dateText: {
    fontSize: 10.5,
    color: COLORS.textMuted,
  },
  starsWrap: {
    flexDirection: 'row',
    gap: 2,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  methodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  methodBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
  },
  originBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  originBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1B5E20',
  },
  flavorTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  flavorTagChip: {
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  flavorTagText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#B78103',
  },
  commentText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    lineHeight: 18,
  },
  reviewPhoto: {
    width: '100%',
    height: 160,
    borderRadius: RADIUS.sm,
    marginTop: 4,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  helpfulBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surface,
  },
  helpfulBtnActive: {
    backgroundColor: '#E8F5E9',
  },
  helpfulText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  helpfulTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});
