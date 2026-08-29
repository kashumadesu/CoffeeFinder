// ============================================================
// ShopCard — used in List view and bottom sheet
// ============================================================

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
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
  const photoUrl = shop.photos?.[0]
    ? getPhotoUrl(shop.photos[0].photoReference, 400)
    : null;

  return (
    <TouchableOpacity
      style={[styles.card, compact && styles.cardCompact]}
      onPress={() => onPress(shop)}
      activeOpacity={0.85}
    >
      {/* Thumbnail */}
      <View style={styles.imageContainer}>
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderIcon}>☕</Text>
          </View>
        )}
        {/* Open/Closed badge */}
        {shop.openNow !== undefined && (
          <View style={[styles.badge, shop.openNow ? styles.badgeOpen : styles.badgeClosed]}>
            <Text style={styles.badgeText}>{shop.openNow ? 'Open' : 'Closed'}</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>{shop.name}</Text>
          {shop.priceLevel !== undefined && (
            <Text style={styles.price}>{PRICE_LABELS[shop.priceLevel]}</Text>
          )}
        </View>

        <Text style={styles.address} numberOfLines={1}>{shop.vicinity}</Text>

        <View style={styles.metaRow}>
          {shop.rating !== undefined && (
            <RatingStars rating={shop.rating} count={shop.userRatingsTotal} size={12} />
          )}
          {shop.distance !== undefined && (
            <Text style={styles.distance}>{formatDistance(shop.distance)}</Text>
          )}
        </View>
      </View>

      {/* Favorite button */}
      {onFavoritePress && (
        <TouchableOpacity
          style={styles.favoriteBtn}
          onPress={() => onFavoritePress(shop)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[styles.heartIcon, isFavorite && styles.heartIconActive]}>
            {isFavorite ? '❤️' : '🤍'}
          </Text>
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
    marginVertical: SPACING.xs,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  cardCompact: {
    marginHorizontal: SPACING.sm,
  },
  imageContainer: {
    width: 90,
    height: 90,
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
  imagePlaceholderIcon: { fontSize: 32 },
  badge: {
    position: 'absolute',
    top: 6,
    left: 6,
    borderRadius: RADIUS.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeOpen: { backgroundColor: COLORS.success },
  badgeClosed: { backgroundColor: COLORS.danger },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  info: {
    flex: 1,
    padding: SPACING.sm,
    justifyContent: 'center',
    gap: 4,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  name: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  price: {
    fontSize: 13,
    color: COLORS.primaryLight,
    fontWeight: '600',
  },
  address: { fontSize: 12, color: COLORS.textSecondary },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: 2 },
  distance: { fontSize: 12, color: COLORS.accent, fontWeight: '600' },
  favoriteBtn: {
    justifyContent: 'center',
    paddingRight: SPACING.sm,
  },
  heartIcon: { fontSize: 20 },
  heartIconActive: {},
});
