// ============================================================
// MapScreen — Discover Specialty Spots (Matching Mockup Screen 2)
// ============================================================

import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from 'react-native';
import MapView, { Region } from 'react-native-maps';
import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import { COLORS, SPACING, DEFAULT_REGION, DELTA, PH_BOUNDARY } from '@constants';
import { useStore } from '@store/useStore';
import { useLocation } from '@hooks/useLocation';
import { useFavorites } from '@hooks/useFavorites';
import { CoffeeMarker } from '@components/CoffeeMarker';
import { SearchBar } from '@components/SearchBar';
import { FilterBar } from '@components/FilterBar';
import { ShopCard } from '@components/ShopCard';
import type { CoffeeShop, RootStackParamList } from '@types';

type Nav = StackNavigationProp<RootStackParamList, 'MainTabs'>;

export const MapScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const mapRef = useRef<MapView>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);

  // Store
  const shops = useStore((s) => s.shops);
  const isLoading = useStore((s) => s.isLoading);
  const selectedShop = useStore((s) => s.selectedShop);
  const setSelectedShop = useStore((s) => s.setSelectedShop);
  const fetchNearbyShops = useStore((s) => s.fetchNearbyShops);
  const userLocation = useStore((s) => s.userLocation);
  const gcashOnly = useStore((s) => s.filters.gcashOnly);
  const toggleGcashOnly = useStore((s) => s.toggleGcashOnly);

  // Hooks
  useLocation();
  const { toggleFavorite, isFavorite } = useFavorites();

  const snapPoints = useMemo(() => ['16%', '45%', '85%'], []);

  // Fetch initial spots on mount
  useEffect(() => {
    fetchNearbyShops();
  }, [fetchNearbyShops]);

  // Animate map when user location changes
  useEffect(() => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          ...userLocation,
          latitudeDelta: DELTA.medium,
          longitudeDelta: DELTA.medium,
        },
        500,
      );
    }
  }, [userLocation]);

  // Animate map when shop is selected
  useEffect(() => {
    if (selectedShop && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          ...selectedShop.location,
          latitudeDelta: DELTA.small,
          longitudeDelta: DELTA.small,
        },
        450,
      );
      bottomSheetRef.current?.snapToIndex(1);
    }
  }, [selectedShop]);

  const handleMarkerPress = useCallback(
    (shop: CoffeeShop) => {
      setSelectedShop(shop);
    },
    [setSelectedShop],
  );

  const handleShopPress = useCallback(
    (shop: CoffeeShop) => {
      setSelectedShop(shop);
      nav.navigate('ShopDetail', { shop });
    },
    [nav, setSelectedShop],
  );

  const handleMapPress = useCallback(() => {
    setSelectedShop(null);
  }, [setSelectedShop]);

  const handleRegionChangeComplete = useCallback(
    (region: Region) => {
      const center = { latitude: region.latitude, longitude: region.longitude };
      fetchNearbyShops(center);
    },
    [fetchNearbyShops],
  );

  const handleMyLocation = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion(
        { ...userLocation, latitudeDelta: DELTA.medium, longitudeDelta: DELTA.medium },
        400,
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* Interactive Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={DEFAULT_REGION}
        showsUserLocation
        showsMyLocationButton={false}
        minZoomLevel={6}
        onPress={handleMapPress}
        onRegionChangeComplete={handleRegionChangeComplete}
      >
        {shops.map((shop) => (
          <CoffeeMarker
            key={shop.id}
            shop={shop}
            isSelected={selectedShop?.id === shop.id}
            onPress={handleMarkerPress}
          />
        ))}
      </MapView>

      {/* Floating Header (Search + Category Filter Chips) */}
      <View style={styles.headerOverlay}>
        <SearchBar onAvatarPress={() => (nav as any).navigate('Profile')} />
        <FilterBar />
      </View>

      {/* Floating GCash-accepted Filter Badge (Bottom Left) */}
      <TouchableOpacity
        style={[styles.gcashFloatingPill, gcashOnly && styles.gcashFloatingPillActive]}
        onPress={toggleGcashOnly}
        activeOpacity={0.85}
      >
        <Text style={styles.gcashPillIcon}>🔵</Text>
        <Text style={[styles.gcashPillText, gcashOnly && styles.gcashPillTextActive]}>
          GCash-accepted
        </Text>
      </TouchableOpacity>

      {/* Floating Location Target Button (Bottom Right) */}
      <TouchableOpacity style={styles.myLocationBtn} onPress={handleMyLocation} activeOpacity={0.85}>
        <Text style={styles.myLocationIcon}>🧭</Text>
      </TouchableOpacity>

      {/* Loading Indicator Pill */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.loadingText}>Locating specialty spots…</Text>
        </View>
      )}

      {/* Bottom Sheet Drawer */}
      <BottomSheet
        ref={bottomSheetRef}
        snapPoints={snapPoints}
        index={0}
        handleIndicatorStyle={styles.sheetHandle}
        backgroundStyle={styles.sheetBg}
      >
        {/* Header matching mockup */}
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>
            Nearby Hidden Gems <Text style={styles.sheetCount}>({shops.length} found)</Text>
          </Text>
        </View>

        {/* Scrollable list of nearby shops */}
        <BottomSheetFlatList
          data={shops}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ShopCard
              shop={item}
              onPress={handleShopPress}
              onFavoritePress={toggleFavorite}
              isFavorite={isFavorite(item.id)}
            />
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>☕</Text>
              <Text style={styles.emptyText}>
                {isLoading
                  ? 'Searching specialty spots…'
                  : 'No spots match your filters. Try selecting "Specialty" or widening your search.'}
              </Text>
            </View>
          }
        />
      </BottomSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  map: {
    flex: 1,
  },
  headerOverlay: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 52 : 20,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  gcashFloatingPill: {
    position: 'absolute',
    bottom: 135,
    left: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1.2,
    borderColor: COLORS.border,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    gap: 4,
    zIndex: 9,
  },
  gcashFloatingPillActive: {
    backgroundColor: '#E6F2FF',
    borderColor: COLORS.gcash,
  },
  gcashPillIcon: {
    fontSize: 10,
  },
  gcashPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#333333',
  },
  gcashPillTextActive: {
    color: COLORS.gcash,
  },
  myLocationBtn: {
    position: 'absolute',
    bottom: 135,
    right: SPACING.md,
    backgroundColor: COLORS.surface,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.2,
    borderColor: COLORS.border,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    zIndex: 9,
  },
  myLocationIcon: {
    fontSize: 20,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 135,
    alignSelf: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    zIndex: 20,
  },
  loadingText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  sheetHandle: {
    backgroundColor: '#D6CEC3',
    width: 40,
  },
  sheetBg: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  sheetHeader: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.xs,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.2,
  },
  sheetCount: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  listContent: {
    paddingBottom: 90,
    paddingTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 30,
    paddingHorizontal: SPACING.xl,
    gap: SPACING.sm,
  },
  emptyIcon: {
    fontSize: 40,
  },
  emptyText: {
    fontSize: 13.5,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
  },
});
