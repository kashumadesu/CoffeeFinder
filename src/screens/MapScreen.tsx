// ============================================================
// MapScreen — Discover Specialty Spots (With Map Type Switcher & Routing HUD)
// ============================================================

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  Modal,
} from 'react-native';
import MapView, { Region } from 'react-native-maps';
import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

import { COLORS, SPACING, RADIUS, DEFAULT_REGION, DELTA } from '@constants';
import { useStore } from '@store/useStore';
import { useLocation } from '@hooks/useLocation';
import { useFavorites } from '@hooks/useFavorites';
import { CoffeeMarker } from '@components/CoffeeMarker';
import { SearchBar } from '@components/SearchBar';
import { FilterBar } from '@components/FilterBar';
import { RegionSelector } from '@components/RegionSelector';
import { RoutePolyline } from '@components/RoutePolyline';
import { ShopCard } from '@components/ShopCard';
import { formatDistance } from '@services/googlePlaces';
import type { CoffeeShop, RootStackParamList, MapTypeOption } from '@types';

type Nav = StackNavigationProp<RootStackParamList, 'MainTabs'>;

export const MapScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const mapRef = useRef<MapView>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);

  const [layersModalVisible, setLayersModalVisible] = useState(false);

  // Store
  const shops = useStore((s) => s.shops);
  const isLoading = useStore((s) => s.isLoading);
  const isOffline = useStore((s) => s.isOffline);
  const mapType = useStore((s) => s.mapType);
  const setMapType = useStore((s) => s.setMapType);
  const selectedShop = useStore((s) => s.selectedShop);
  const setSelectedShop = useStore((s) => s.setSelectedShop);
  const fetchNearbyShops = useStore((s) => s.fetchNearbyShops);
  const userLocation = useStore((s) => s.userLocation);
  const gcashOnly = useStore((s) => s.filters.gcashOnly);
  const toggleGcashOnly = useStore((s) => s.toggleGcashOnly);
  const activeNavigationShop = useStore((s) => s.activeNavigationShop);
  const stopNavigation = useStore((s) => s.stopNavigation);
  const loadTastingNotes = useStore((s) => s.loadTastingNotes);

  // Hooks
  useLocation();
  const { toggleFavorite, isFavorite } = useFavorites();

  const snapPoints = useMemo(() => ['16%', '45%', '85%'], []);

  useEffect(() => {
    fetchNearbyShops();
    loadTastingNotes();
  }, [fetchNearbyShops, loadTastingNotes]);

  // Animate map when user location or region changes
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

  // Animate map when navigation starts or shop selected
  useEffect(() => {
    const target = activeNavigationShop ?? selectedShop;
    if (target && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          ...target.location,
          latitudeDelta: DELTA.small,
          longitudeDelta: DELTA.small,
        },
        450,
      );
      if (!activeNavigationShop) {
        bottomSheetRef.current?.snapToIndex(1);
      }
    }
  }, [selectedShop, activeNavigationShop]);

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
    if (!activeNavigationShop) {
      setSelectedShop(null);
    }
  }, [setSelectedShop, activeNavigationShop]);

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
      {/* Interactive Map with dynamic mapType */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={DEFAULT_REGION}
        showsUserLocation
        showsMyLocationButton={false}
        minZoomLevel={6}
        mapType={mapType}
        onPress={handleMapPress}
        onRegionChangeComplete={handleRegionChangeComplete}
      >
        {/* Render Route Polyline when In-App Navigation is active */}
        {activeNavigationShop && (
          <RoutePolyline
            origin={userLocation}
            destination={activeNavigationShop.location}
          />
        )}

        {shops.map((shop) => (
          <CoffeeMarker
            key={shop.id}
            shop={shop}
            isSelected={
              activeNavigationShop?.id === shop.id || selectedShop?.id === shop.id
            }
            onPress={handleMarkerPress}
          />
        ))}
      </MapView>

      {/* Floating Header (Search + Regional Hub Switcher + Category Filters) */}
      <View style={styles.headerOverlay}>
        <View style={styles.topRow}>
          <View style={styles.searchWrapper}>
            <SearchBar onAvatarPress={() => (nav as any).navigate('Profile')} />
          </View>
        </View>

        <View style={styles.subFilterRow}>
          <RegionSelector />
          <FilterBar />
        </View>
      </View>

      {/* In-App Navigation Turn-by-Turn HUD Banner */}
      {activeNavigationShop && (
        <View style={styles.navHudCard}>
          <View style={styles.navHudLeft}>
            <Text style={styles.navHudIcon}>🧭</Text>
            <View>
              <Text style={styles.navHudTitle} numberOfLines={1}>
                Routing to {activeNavigationShop.name}
              </Text>
              <Text style={styles.navHudEta}>
                🚶 8 mins ({formatDistance(activeNavigationShop.distance ?? 650)}) • Live Navigation
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.navEndBtn}
            onPress={stopNavigation}
            activeOpacity={0.8}
          >
            <Text style={styles.navEndText}>✕ End</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Offline Mode Indicator Pill */}
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>📱 100% Offline Mode Active (Cached Hub)</Text>
        </View>
      )}

      {/* Floating GCash-accepted Filter Badge (Bottom Left) */}
      {!activeNavigationShop && (
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
      )}

      {/* Floating Controls (Map Layer + GPS Target on Bottom Right) */}
      <View style={styles.floatingControlsRight}>
        <TouchableOpacity
          style={styles.mapLayerBtn}
          onPress={() => setLayersModalVisible(true)}
          activeOpacity={0.85}
        >
          <Text style={styles.mapLayerIcon}>
            {mapType === 'satellite' ? '🛰️' : mapType === 'terrain' ? '⛰️' : '🗺️'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.myLocationBtn} onPress={handleMyLocation} activeOpacity={0.85}>
          <Text style={styles.myLocationIcon}>🧭</Text>
        </TouchableOpacity>
      </View>

      {/* Map Layers Modal */}
      <Modal
        visible={layersModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLayersModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setLayersModalVisible(false)}
          activeOpacity={1}
        >
          <View style={styles.layersSheet}>
            <Text style={styles.layersTitle}>🗺 Select Map Layer</Text>
            {[
              { type: 'standard' as MapTypeOption, label: '🌿 Specialty Standard', sub: 'Clean road map' },
              { type: 'satellite' as MapTypeOption, label: '🛰️ Satellite Hybrid', sub: 'High-res aerial photography' },
              { type: 'terrain' as MapTypeOption, label: '⛰️ Highland Terrain', sub: 'Topography & mountain contours' },
            ].map((layer) => (
              <TouchableOpacity
                key={layer.type}
                style={[
                  styles.layerOption,
                  mapType === layer.type && styles.layerOptionSelected,
                ]}
                onPress={() => {
                  setMapType(layer.type);
                  setLayersModalVisible(false);
                }}
              >
                <View>
                  <Text style={[styles.layerLabel, mapType === layer.type && styles.layerLabelSelected]}>
                    {layer.label}
                  </Text>
                  <Text style={styles.layerSub}>{layer.sub}</Text>
                </View>
                {mapType === layer.type && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Loading Indicator */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.loadingText}>Locating specialty spots…</Text>
        </View>
      )}

      {/* Bottom Sheet Drawer */}
      {!activeNavigationShop && (
        <BottomSheet
          ref={bottomSheetRef}
          snapPoints={snapPoints}
          index={0}
          handleIndicatorStyle={styles.sheetHandle}
          backgroundStyle={styles.sheetBg}
        >
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>
              Nearby Hidden Gems <Text style={styles.sheetCount}>({shops.length} found)</Text>
            </Text>
          </View>

          <BottomSheetFlatList
            data={shops}
            keyExtractor={(item: CoffeeShop) => item.id}
            renderItem={({ item }: { item: CoffeeShop }) => (
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
      )}
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
    gap: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  searchWrapper: {
    flex: 1,
  },
  subFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: SPACING.md,
    gap: 4,
  },
  navHudCard: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 120 : 85,
    left: SPACING.md,
    right: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md - 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    zIndex: 25,
  },
  navHudLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
    paddingRight: SPACING.xs,
  },
  navHudIcon: {
    fontSize: 22,
  },
  navHudTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
  },
  navHudEta: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  navEndBtn: {
    backgroundColor: '#FDEDEC',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: '#FADBD8',
  },
  navEndText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.danger,
  },
  offlineBanner: {
    position: 'absolute',
    top: 140,
    alignSelf: 'center',
    backgroundColor: '#FAF5ED',
    borderWidth: 1,
    borderColor: '#E8DBC8',
    borderRadius: RADIUS.full,
    paddingHorizontal: 14,
    paddingVertical: 5,
    zIndex: 15,
  },
  offlineText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#6E4822',
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
  floatingControlsRight: {
    position: 'absolute',
    bottom: 135,
    right: SPACING.md,
    gap: SPACING.sm,
    zIndex: 9,
  },
  mapLayerBtn: {
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
  },
  mapLayerIcon: {
    fontSize: 18,
  },
  myLocationBtn: {
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
  },
  myLocationIcon: {
    fontSize: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    padding: SPACING.md,
  },
  layersSheet: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  layersTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  layerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  layerOptionSelected: {
    backgroundColor: COLORS.surfaceSage,
  },
  layerLabel: {
    fontSize: 14.5,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  layerLabelSelected: {
    color: COLORS.primary,
  },
  layerSub: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  checkmark: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.primary,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 175,
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
