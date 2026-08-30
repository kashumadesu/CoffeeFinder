// ============================================================
// ShopCard — Specialty Café Preview Card (Minimalist & Detailed)
// ============================================================

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, getPhotoUrl } from '@constants';
import { formatDistance } from '@services/googlePlaces';
import { RatingStars } from './RatingStars';
import type { CoffeeShop } from '@types';

interface Props {
  shop: CoffeeShop;
  onPress: (shop: CoffeeShop) => void;
  onFavoritePress?: (shop: CoffeeShop) => void;
  isFavorite?: boolean;
  compact?: boolean;
}

export const ShopCard: React.FC<Props> = ({
  shop,
  onPress,
  onFavoritePress,
  isFavorite = false,
  compact = false,
}) => {
  const photoUrl =
    shop.galleryUrls?.[0] ??
    (shop.photos?.[0] ? getPhotoUrl(shop.photos[0].photoReference, 400) : null);

  return (
    <TouchableOpacity
      style={[styles.card, compact && styles.cardCompact]}
      onPress={() => onPress(shop)}
      activeOpacity={0.88}
    >
      {/* Thumbnail */}
      <View style={styles.imageContainer}>
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Feather name="coffee" size={26} color={COLORS.textMuted} />
          </View>
        )}
        {shop.openNow !== undefined && (
          <View style={[styles.badge, shop.openNow ? styles.badgeOpen : styles.badgeClosed]}>
            <Text style={styles.badgeText}>{shop.openNow ? 'Open' : 'Closed'}</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        {/* Title + Verified */}
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {shop.name}
          </Text>
          {shop.isVerified && (
            <View style={styles.verifiedBadge}>
              <Feather name="check-circle" size={12} color={COLORS.verified} />
            </View>
          )}
        </View>

        {/* Address */}
        <View style={styles.addressRow}>
          <Feather name="map-pin" size={11} color={COLORS.textMuted} />
          <Text style={styles.address} numberOfLines={1}>
            {shop.vicinity}
          </Text>
        </View>

        {/* Rating + Distance */}
        <View style={styles.metaRow}>
          {shop.rating !== undefined && (
            <RatingStars
              rating={shop.rating}
              count={shop.userRatingsTotal}
              size={11.5}
              showGcash={shop.acceptsGcash}
            />
          )}
          {shop.distance !== undefined && (
            <View style={styles.distanceRow}>
              <Feather name="navigation" size={10.5} color={COLORS.textMuted} />
              <Text style={styles.distance}>{formatDistance(shop.distance)}</Text>
            </View>
          )}
        </View>

        {/* Price Range & Vibe Row */}
        <View style={styles.bottomRow}>
          {shop.priceRange ? (
            <View style={styles.priceRangePill}>
              <Text style={styles.priceRangeText}>
                ₱{shop.priceRange.min} – ₱{shop.priceRange.max}
              </Text>
            </View>
          ) : (
            shop.priceLevel !== undefined && (
              <Text style={styles.priceLevelText}>
                {'₱'.repeat(Math.max(1, shop.priceLevel))}
              </Text>
            )
          )}

          {shop.vibeTags && shop.vibeTags.length > 0 && (
            <View style={styles.vibeTag}>
              <Text style={styles.vibeTagText}>{shop.vibeTags[0]}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Favorite button */}
      {onFavoritePress && (
        <TouchableOpacity
          style={styles.favoriteBtn}
          onPress={() => onFavoritePress(shop)}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Feather
            name="heart"
            size={18}
            color={isFavorite ? COLORS.danger : '#D2C4B5'}
          />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    marginHorizontal: SPACING.md,
    marginVertical: 4,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 1 },
  },
  cardCompact: {
    marginHorizontal: SPACING.sm,
  },
  imageContainer: {
    width: 88,
    height: 88,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.surfaceWarm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: 4,
    left: 4,
    borderRadius: RADIUS.full,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
  },
  badgeOpen: { backgroundColor: COLORS.success },
  badgeClosed: { backgroundColor: COLORS.danger },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  info: {
    flex: 1,
    paddingLeft: SPACING.sm + 2,
    justifyContent: 'center',
    gap: 3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  name: {
    fontSize: 14.5,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flexShrink: 1,
  },
  verifiedBadge: {
    padding: 1,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  address: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
    flexShrink: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 1,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  distance: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  priceRangePill: {
    backgroundColor: COLORS.surfaceSage,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priceRangeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: COLORS.primary,
  },
  priceLevelText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  vibeTag: {
    backgroundColor: COLORS.tagBrownBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  vibeTagText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.tagBrown,
  },
  favoriteBtn: {
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
});
