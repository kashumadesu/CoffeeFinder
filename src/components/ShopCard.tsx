// ============================================================
// ShopCard — Specialty Café Preview Card with Outlets & Origin Badges
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

  const primaryOrigin = shop.beanOrigins?.[0];
  const originLabel =
    primaryOrigin === 'sagada'
      ? '🌱 Sagada'
      : primaryOrigin === 'apo'
      ? '🏔️ Mt. Apo'
      : primaryOrigin === 'barako'
      ? '☕ Barako'
      : primaryOrigin === 'benguet'
      ? '🌿 Benguet'
      : null;

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

        {/* Cultural & WFC Utility Badges Row */}
        <View style={styles.wfcBadgeRow}>
          {/* Outlets-per-Table Index */}
          {shop.outletRating === 'plentiful' && (
            <View style={styles.outletPillPlentiful}>
              <Feather name="zap" size={9.5} color="#1B5E20" />
              <Text style={styles.outletTextPlentiful}>Plentiful Plugs</Text>
            </View>
          )}
          {shop.outletRating === 'wall_only' && (
            <View style={styles.outletPillWall}>
              <Text style={styles.outletTextWall}>⚠️ Wall Plugs</Text>
            </View>
          )}
          {shop.outletRating === 'laptop_ban' && (
            <View style={styles.outletPillBan}>
              <Text style={styles.outletTextBan}>🚫 Study Ban</Text>
            </View>
          )}

          {/* Kape sa Garahe Tag */}
          {shop.cafeFormat === 'garage_popup' && (
            <View style={styles.garageTag}>
              <Text style={styles.garageTagText}>🚐 Garahe</Text>
            </View>
          )}

          {/* Heritage Origin Tag */}
          {originLabel && (
            <View style={styles.originTag}>
              <Text style={styles.originTagText}>{originLabel}</Text>
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
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    alignItems: 'center',
  },
  cardCompact: {
    padding: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
    backgroundColor: COLORS.surfaceWarm,
    position: 'relative',
    marginRight: SPACING.sm,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 4,
    left: 4,
    borderRadius: RADIUS.xs,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  badgeOpen: {
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
  },
  badgeClosed: {
    backgroundColor: 'rgba(244, 67, 54, 0.9)',
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  info: {
    flex: 1,
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
    flex: 1,
  },
  verifiedBadge: {
    marginLeft: 2,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  address: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  distance: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  // WFC & Cultural Badges Row
  wfcBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
    marginTop: 2,
  },
  outletPillPlentiful: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#E8F5E9',
    borderRadius: RADIUS.xs,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderWidth: 0.5,
    borderColor: '#C8E6C9',
  },
  outletTextPlentiful: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#1B5E20',
  },
  outletPillWall: {
    backgroundColor: '#FFF8E1',
    borderRadius: RADIUS.xs,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderWidth: 0.5,
    borderColor: '#FFE082',
  },
  outletTextWall: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#E65100',
  },
  outletPillBan: {
    backgroundColor: '#FFEBEE',
    borderRadius: RADIUS.xs,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderWidth: 0.5,
    borderColor: '#FFCDD2',
  },
  outletTextBan: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#C62828',
  },
  garageTag: {
    backgroundColor: '#EFEBE9',
    borderRadius: RADIUS.xs,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderWidth: 0.5,
    borderColor: '#D7CCC8',
  },
  garageTagText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#4E342E',
  },
  originTag: {
    backgroundColor: '#EDE7F6',
    borderRadius: RADIUS.xs,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderWidth: 0.5,
    borderColor: '#D1C4E9',
  },
  originTagText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#512DA8',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  priceRangePill: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.xs,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  priceRangeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
  },
  priceLevelText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '700',
  },
  vibeTag: {
    backgroundColor: COLORS.surfaceWarm,
    borderRadius: RADIUS.xs,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
  },
  vibeTagText: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  favoriteBtn: {
    padding: SPACING.xs,
    marginLeft: 4,
  },
});
