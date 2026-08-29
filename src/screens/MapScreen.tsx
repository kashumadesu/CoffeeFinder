// ============================================================
// MapScreen — main screen with Google Map + coffee pins
//             + filter bar + draggable bottom sheet list
// ============================================================

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import MapView, { Region } from 'react-native-maps';
import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import { COLORS, SPACING, DEFAULT_REGION, DELTA } from '@constants';
import { useStore } from '@store/useStore';
import { useLocation } from '@hooks/useLocation';
import { useFavorites } from '@hooks/useFavorites';
import { CoffeeMarker } from '@components/CoffeeMarker';
import { FilterBar } from '@components/FilterBar';
import { ShopCard } from '@components/ShopCard';
import type { CoffeeShop, RootStackParamList } from '@types';

type Nav = StackNavigationProp<RootStackParamList, 'MainTabs'>;

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const MapScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const mapRef = useRef<MapView>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);

  // Store
  const shops = useStore((s) => s.shops);
  const isLoading = useStore((s) => s.isLoading);
  const error = useStore((s) => s.error);
  const selectedShop = useStore((s) => s.selectedShop);
  const setSelectedShop = useStore((s) => s.setSelectedShop);
  const fetchNearbyShops = useStore((s) => s.fetchNearbyShops);
  const userLocation = useStore((s) => s.userLocation);

  // Hooks
  const { errorMsg: locationError } = useLocation();
  const { toggleFavorite, isFavorite } = useFavorites();

  // Bottom sheet snap points
  const snapPoints = ['18%', '50%', '88%'];

  // Animate map to user location once available
  useEffect(() => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          ...userLocation,
          latitudeDelta: DELTA.medium,
          longitudeDelta: DELTA.medium,
        },
        600,
      );
    }
  }, [userLocation]);

  // Animate map to selected shop
  useEffect(() => {
    if (selectedShop && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          ...selectedShop.location,
          latitudeDelta: DELTA.small,
          longitudeDelta: DELTA.small,
        },
        500,
      );
      bottomSheetRef.current?.snapToIndex(1);
    }
  }, [selectedShop]);

  useEffect(() => {
    if (locationError) {
      Alert.alert('Location Error', locationError);
    }
  }, [locationError]);

  const handleMarkerPress = useCallback(
    (shop: CoffeeShop) => {
      setSelectedShop(shop);
    },
    [setSelectedShop],
  );

  const handleShopPress = useCallback(
    (shop: CoffeeShop) => {
      nav.navigate('ShopDetail', { shop });
    },
    [nav],
  );

  const handleMapPress = useCallback(() => {
    setSelectedShop(null);
    bottomSheetRef.current?.snapToIndex(0);
  }, [setSelectedShop]);

  const handleRegionChangeComplete = useCallback(
    (region: Region) => {
      // Re-fetch when user pans significantly
      if (userLocation) {
        const center = { latitude: region.latitude, longitude: region.longitude };
        fetchNearbyShops(center);
      }
    },
    [userLocation, fetchNearbyShops],
  );

  const handleMyLocation = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion(
        { ...userLocation, latitudeDelta: DELTA.medium, longitudeDelta: DELTA.medium },
        500,
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* ---- Map ---- */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider="google"
        initialRegion={DEFAULT_REGION}
        showsUserLocation
        showsMyLocationButton={false}
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

      {/* ---- Filter bar (floating above map) ---- */}
      <View style={styles.filterOverlay}>
        <FilterBar />
      </View>

      {/* ---- My Location button ---- */}
      <TouchableOpacity style={styles.myLocationBtn} onPress={handleMyLocation}>
        <Text style={styles.myLocationIcon}>◎</Text>
      </TouchableOpacity>

      {/* ---- Loading spinner ---- */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.loadingText}>Finding coffee shops…</Text>
        </View>
      )}

      {/* ---- Error banner ---- */}
      {error && !isLoading && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      )}

      {/* ---- Bottom Sheet ---- */}
      <BottomSheet
        ref={bottomSheetRef}
        snapPoints={snapPoints}
        index={0}
        handleIndicatorStyle={styles.sheetHandle}
        backgroundStyle={styles.sheetBg}
      >
        {/* Header */}
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>
            {shops.length > 0 ? `${shops.length} coffee shops nearby` : 'No results'}
          </Text>
        </View>

        {/* Shop list */}
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
                {isLoading ? 'Searching…' : 'No coffee shops found nearby. Try a wider radius.'}
              </Text>
            </View>
          }
        />
      </BottomSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  map: { flex: 1 },

  filterOverlay: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 12,
    left: 0,
    right: 0,
    zIndex: 10,
  },

  myLocationBtn: {
    position: 'absolute',
    bottom: SCREEN_HEIGHT * 0.22,
    right: SPACING.md,
    backgroundColor: COLORS.surface,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    zIndex: 10,
  },
  myLocationIcon: { fontSize: 20, color: COLORS.primary },

  loadingOverlay: {
    position: 'absolute',
    top: 110,
    alignSelf: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    zIndex: 20,
  },
  loadingText: { fontSize: 13, color: COLORS.textSecondary },

  errorBanner: {
    position: 'absolute',
    top: 110,
    left: SPACING.md,
    right: SPACING.md,
    backgroundColor: '#FFF3CD',
    borderRadius: 10,
    padding: SPACING.sm,
    zIndex: 20,
  },
  errorText: { fontSize: 13, color: '#856404' },

  // Bottom sheet
  sheetHandle: { backgroundColor: COLORS.border, width: 40 },
  sheetBg: { backgroundColor: COLORS.background, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  sheetHeader: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sheetTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  listContent: { paddingBottom: 40, paddingTop: SPACING.xs },

  emptyState: { alignItems: 'center', paddingTop: 40, gap: SPACING.sm },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 15, color: COLORS.textSecondary, textAlign: 'center', paddingHorizontal: SPACING.xl },
});
