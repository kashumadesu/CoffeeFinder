// ============================================================
// DetailScreen — full shop detail with photos, hours, directions
// ============================================================

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Linking,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import { COLORS, SPACING, RADIUS, getPhotoUrl, PRICE_LABELS } from '@constants';
import { getPlaceDetails, formatDistance } from '@services/googlePlaces';
import { useFavorites } from '@hooks/useFavorites';
import { RatingStars } from '@components/RatingStars';
import type { CoffeeShop, RootStackParamList } from '@types';

type Route = RouteProp<RootStackParamList, 'ShopDetail'>;
type Nav = StackNavigationProp<RootStackParamList, 'ShopDetail'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PHOTO_HEIGHT = 240;

export const DetailScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const route = useRoute<Route>();
  const initialShop = route.params.shop;

  const [shop, setShop] = useState<CoffeeShop>(initialShop);
  const [isFetchingDetails, setIsFetchingDetails] = useState(true);
  const [hoursExpanded, setHoursExpanded] = useState(false);

  const { toggleFavorite, isFavorite } = useFavorites();
  const favorited = isFavorite(shop.id);

  // Fetch full details
  useEffect(() => {
    getPlaceDetails(initialShop.id)
      .then((full) => setShop(full))
      .catch(() => { /* keep initial data on error */ })
      .finally(() => setIsFetchingDetails(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialShop.id]);

  // ---- Actions ----
  const handleDirections = () => {
    const { latitude, longitude } = shop.location;
    const label = encodeURIComponent(shop.name);
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${latitude},${longitude}`,
      android: `geo:${latitude},${longitude}?q=${latitude},${longitude}(${label})`,
    }) ?? `https://maps.google.com?q=${latitude},${longitude}`;
    Linking.openURL(url).catch(() => Alert.alert('Error', 'Could not open Maps app.'));
  };

  const handleCall = () => {
    if (shop.phoneNumber) {
      Linking.openURL(`tel:${shop.phoneNumber}`);
    }
  };

  const handleWebsite = () => {
    if (shop.website) {
      Linking.openURL(shop.website).catch(() =>
        Alert.alert('Error', 'Could not open website.'),
      );
    }
  };

  const photos = shop.photos ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* Back + Favorite header */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => nav.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle} numberOfLines={1}>{shop.name}</Text>
        <TouchableOpacity style={styles.favoriteBtn} onPress={() => toggleFavorite(shop)}>
          <Text style={styles.favoriteIcon}>{favorited ? '❤️' : '🤍'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Photo carousel */}
        {photos.length > 0 ? (
          <FlatList
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            data={photos}
            keyExtractor={(p) => p.photoReference}
            renderItem={({ item }) => (
              <Image
                source={{ uri: getPhotoUrl(item.photoReference, 800) }}
                style={styles.photo}
              />
            )}
            style={styles.photoList}
          />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Text style={styles.photoPlaceholderIcon}>☕</Text>
          </View>
        )}

        {/* ---- Info section ---- */}
        <View style={styles.infoSection}>
          {/* Name + badges */}
          <View style={styles.nameRow}>
            <Text style={styles.name}>{shop.name}</Text>
            {shop.openNow !== undefined && (
              <View style={[styles.badge, shop.openNow ? styles.badgeOpen : styles.badgeClosed]}>
                <Text style={styles.badgeText}>{shop.openNow ? 'Open Now' : 'Closed'}</Text>
              </View>
            )}
          </View>

          {/* Rating + price */}
          <View style={styles.ratingRow}>
            {shop.rating !== undefined && (
              <RatingStars rating={shop.rating} count={shop.userRatingsTotal} size={15} />
            )}
            {shop.priceLevel !== undefined && (
              <Text style={styles.price}>{PRICE_LABELS[shop.priceLevel]}</Text>
            )}
          </View>

          {/* Distance */}
          {shop.distance !== undefined && (
            <Text style={styles.distance}>📍 {formatDistance(shop.distance)} away</Text>
          )}

          <View style={styles.divider} />

          {/* Address */}
          <InfoRow icon="🏠" label={shop.formattedAddress ?? shop.vicinity} />

          {/* Phone */}
          {shop.phoneNumber && (
            <TouchableOpacity onPress={handleCall}>
              <InfoRow icon="📞" label={shop.phoneNumber} linkColor />
            </TouchableOpacity>
          )}

          {/* Website */}
          {shop.website && (
            <TouchableOpacity onPress={handleWebsite}>
              <InfoRow icon="🌐" label={shop.website} linkColor />
            </TouchableOpacity>
          )}

          {/* Hours */}
          {isFetchingDetails ? (
            <View style={styles.hoursLoading}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.hoursLoadingText}>Loading hours…</Text>
            </View>
          ) : shop.openingHours?.weekdayText ? (
            <View style={styles.hoursSection}>
              <TouchableOpacity
                style={styles.hoursHeader}
                onPress={() => setHoursExpanded((v) => !v)}
              >
                <Text style={styles.hoursLabel}>🕐 Opening Hours</Text>
                <Text style={styles.hoursToggle}>{hoursExpanded ? '▲' : '▼'}</Text>
              </TouchableOpacity>
              {hoursExpanded &&
                shop.openingHours.weekdayText.map((line, i) => (
                  <Text key={i} style={styles.hoursLine}>{line}</Text>
                ))}
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* ---- Directions CTA ---- */}
      <View style={styles.ctaBar}>
        <TouchableOpacity style={styles.directionsBtn} onPress={handleDirections}>
          <Text style={styles.directionsBtnText}>🗺  Get Directions</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// ---- Sub-component ----
const InfoRow: React.FC<{ icon: string; label: string; linkColor?: boolean }> = ({
  icon, label, linkColor = false,
}) => (
  <View style={infoStyles.row}>
    <Text style={infoStyles.icon}>{icon}</Text>
    <Text style={[infoStyles.text, linkColor && infoStyles.link]} numberOfLines={2}>
      {label}
    </Text>
  </View>
);

const infoStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, marginBottom: SPACING.sm },
  icon: { fontSize: 16, width: 24, textAlign: 'center' },
  text: { flex: 1, fontSize: 14, color: COLORS.textPrimary, lineHeight: 20 },
  link: { color: COLORS.primaryLight, textDecorationLine: 'underline' },
});

// ---- Styles ----

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
    gap: SPACING.sm,
  },
  backBtn: { padding: 4 },
  backIcon: { fontSize: 28, color: COLORS.primary, fontWeight: '300' },
  topTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
  favoriteBtn: { padding: 4 },
  favoriteIcon: { fontSize: 24 },

  photoList: { width: SCREEN_WIDTH, height: PHOTO_HEIGHT },
  photo: { width: SCREEN_WIDTH, height: PHOTO_HEIGHT, resizeMode: 'cover' },
  photoPlaceholder: {
    width: SCREEN_WIDTH,
    height: PHOTO_HEIGHT,
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholderIcon: { fontSize: 64 },

  infoSection: {
    padding: SPACING.md,
    paddingBottom: 16,
  },

  nameRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flexWrap: 'wrap' },
  name: { flex: 1, fontSize: 22, fontWeight: '800', color: COLORS.primary, lineHeight: 28 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full },
  badgeOpen: { backgroundColor: COLORS.success },
  badgeClosed: { backgroundColor: COLORS.danger },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginTop: SPACING.xs },
  price: { fontSize: 15, color: COLORS.primaryLight, fontWeight: '700' },

  distance: { fontSize: 13, color: COLORS.accent, fontWeight: '600', marginTop: 4 },

  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.md },

  hoursLoading: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.sm },
  hoursLoadingText: { fontSize: 13, color: COLORS.textSecondary },

  hoursSection: { marginTop: SPACING.sm },
  hoursHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
  },
  hoursLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  hoursToggle: { fontSize: 12, color: COLORS.textSecondary },
  hoursLine: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 22, paddingLeft: 28 },

  ctaBar: {
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  directionsBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  directionsBtnText: { color: COLORS.surface, fontSize: 16, fontWeight: '700' },
});
