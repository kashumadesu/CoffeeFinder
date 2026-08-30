// ============================================================
// ShopCard — Specialty Café Preview Card (Icons, no emojis)
// ============================================================

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, getPhotoUrl, PRICE_LABELS } from '@constants';
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
            <Feather name="coffee" size={28} color={COLORS.textMuted} />
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
          {shop.priceLevel !== undefined && (
            <Text style={styles.price}>{PRICE_LABELS[shop.priceLevel]}</Text>
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
              size={12}
              showGcash={shop.acceptsGcash}
            />
          )}
          {shop.distance !== undefined && (
            <View style={styles.distanceRow}>
              <Feather name="navigation" size={11} color={COLORS.textMuted} />
              <Text style={styles.distance}>{formatDistance(shop.distance)}</Text>
            </View>
          )}
        </View>

        {/* Vibe Tags */}
        {shop.vibeTags && shop.vibeTags.length > 0 && (
          <View style={styles.tagsRow}>
            {shop.vibeTags.slice(0, 2).map((tag, idx) => (
              <View
                key={tag}
                style={[styles.tagPill, idx === 0 ? styles.tagGreen : styles.tagBrown]}
              >
                <Text
                  style={[
                    styles.tagText,
                    idx === 0 ? styles.tagGreenText : styles.tagBrownText,
                  ]}
                >
                  {tag}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Favorite button */}
      {onFavoritePress && (
        <TouchableOpacity
          style={styles.favoriteBtn}
          onPress={() => onFavoritePress(shop)}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Feather
            name={isFavorite ? 'heart' : 'heart'}
            size={20}
            color={isFavorite ? COLORS.danger : COLORS.border}
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
    marginVertical: 5,
    padding: 8,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  cardCompact: {
    marginHorizontal: SPACING.sm,
  },
  imageContainer: {
    width: 92,
    height: 92,
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
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: 5,
    left: 5,
    borderRadius: RADIUS.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeOpen: { backgroundColor: COLORS.success },
  badgeClosed: { backgroundColor: COLORS.danger },
  badgeText: { color: '#fff', fontSize: 9.5, fontWeight: '700' },
  info: {
    flex: 1,
    paddingLeft: SPACING.sm + 2,
    justifyContent: 'center',
    gap: 4,
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
    backgroundColor: '#E8F6ED',
    borderRadius: 8,
    padding: 2,
  },
  price: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginLeft: 2,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  address: {
    fontSize: 12,
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
    gap: 3,
  },
  distance: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 2,
  },
  tagPill: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tagGreen: { backgroundColor: COLORS.tagGreenBg },
  tagBrown: { backgroundColor: COLORS.tagBrownBg },
  tagText: { fontSize: 10, fontWeight: '600' },
  tagGreenText: { color: COLORS.tagGreen },
  tagBrownText: { color: COLORS.tagBrown },
  favoriteBtn: {
    justifyContent: 'center',
    paddingRight: 6,
  },
});
