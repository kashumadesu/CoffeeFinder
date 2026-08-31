// ============================================================
// MapScreen — Discover Specialty Spots (Interactive Pins & In-App Routing)
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
  Image,
  Keyboard,
} from 'react-native';
import MapView, { Region } from 'react-native-maps';
import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Feather } from '@expo/vector-icons';
import { hapticLight, hapticSelection } from '@utils/haptics';

import { COLORS, SPACING, RADIUS, DEFAULT_REGION, DELTA, getPhotoUrl } from '@constants';
import { useStore } from '@store/useStore';
import { useLocation } from '@hooks/useLocation';
import { useFavorites } from '@hooks/useFavorites';
import { CoffeeMarker } from '@components/CoffeeMarker';
import { SearchBar } from '@components/SearchBar';
import { FilterBar } from '@components/FilterBar';
import { RegionSelector } from '@components/RegionSelector';
import { RoutePolyline } from '@components/RoutePolyline';
import { NavigationAssistant } from '@components/NavigationAssistant';
import { ShopCard } from '@components/ShopCard';
import { RatingStars } from '@components/RatingStars';
import { formatDistance } from '@services/googlePlaces';
import { fetchDirectionsRoute, generateFallbackRoute } from '@services/directions';
import type { CoffeeShop, RootStackParamList, MapTypeOption, NavigationRoute, NavigationMode } from '@types';

type Nav = StackNavigationProp<RootStackParamList, 'MainTabs'>;

export const MapScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const mapRef = useRef<MapView>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const lastFetchRef = useRef<{ latitude: number; longitude: number } | null>(null);

  const [layersModalVisible, setLayersModalVisible] = useState(false);
  // Real Directions API route + turn-by-turn steps
  const [navigationRoute, setNavigationRoute] = useState<NavigationRoute | null>(null);

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
  const navigationMode = useStore((s) => s.navigationMode);
  const setNavigationMode = useStore((s) => s.setNavigationMode);
  const startNavigation = useStore((s) => s.startNavigation);
  const stopNavigation = useStore((s) => s.stopNavigation);
  const loadTastingNotes = useStore((s) => s.loadTastingNotes);
  const searchQuery = useStore((s) => s.filters.searchQuery);

  // Hooks
  useLocation();
  const { toggleFavorite, isFavorite } = useFavorites();

  const snapPoints = useMemo(() => ['15%', '42%', '85%'], []);

  useEffect(() => {
    fetchNearbyShops();
    loadTastingNotes();
  }, [fetchNearbyShops, loadTastingNotes]);

  // Animate map when user location changes (only if NOT currently navigating)
  useEffect(() => {
    if (userLocation && mapRef.current && !activeNavigationShop && !selectedShop) {
      mapRef.current.animateToRegion(
        {
          ...userLocation,
          latitudeDelta: DELTA.medium,
          longitudeDelta: DELTA.medium,
        },
        500,
      );
    }
  }, [userLocation, activeNavigationShop, selectedShop]);

  // Instant route calculation & turn-by-turn generation on navigation start
  useEffect(() => {
    if (!activeNavigationShop) {
      setNavigationRoute(null);
      return;
    }

    const origin = userLocation || DEFAULT_REGION;
    
    // Set immediate initial route so polyline renders on Frame 0 instantly
    const initialRoute = generateFallbackRoute(origin, activeNavigationShop.location, navigationMode);
    setNavigationRoute(initialRoute);

    // Frame camera immediately to fit route
    if (mapRef.current) {
      mapRef.current.fitToCoordinates([origin, activeNavigationShop.location], {
        edgePadding: {
          top: Platform.OS === 'ios' ? 180 : 140,
          right: 60,
          bottom: 160,
          left: 60,
        },
        animated: true,
      });
    }

    let isMounted = true;

    // Fetch full precision road coordinates and turn-by-turn steps from Google Directions
    fetchDirectionsRoute(origin, activeNavigationShop.location, navigationMode).then((liveRoute) => {
      if (isMounted && liveRoute) {
        setNavigationRoute(liveRoute);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [activeNavigationShop?.id, navigationMode]);

  // When search query produces results, snap bottom sheet up and smoothly center on top match
  useEffect(() => {
    if (searchQuery.trim().length > 0 && shops.length > 0 && mapRef.current && !activeNavigationShop) {
      bottomSheetRef.current?.snapToIndex(1);
      const topShop = shops[0];
      if (topShop) {
        mapRef.current.animateToRegion(
          {
            latitude: topShop.location.latitude - 0.003,
            longitude: topShop.location.longitude,
            latitudeDelta: DELTA.small * 1.5,
            longitudeDelta: DELTA.small * 1.5,
          },
          450,
        );
      }
    }
  }, [searchQuery, shops.length, activeNavigationShop]);

  const handleMarkerPress = useCallback(
    (shop: CoffeeShop) => {
      Keyboard.dismiss();
      setSelectedShop(shop);
      // Snap bottom sheet to middle so the café card is visible — R3 fix
      bottomSheetRef.current?.snapToIndex(1);
    },
    [setSelectedShop],
  );

  const handleShopPress = useCallback(
    (shop: CoffeeShop) => {
      Keyboard.dismiss();
      setSelectedShop(shop);
      nav.navigate('ShopDetail', { shop });
    },
    [nav, setSelectedShop],
  );

  const handleMapPress = useCallback(() => {
    Keyboard.dismiss();
    if (!activeNavigationShop) {
      setSelectedShop(null);
    }
  }, [setSelectedShop, activeNavigationShop]);

  // Throttled region change handler (disabled while actively navigating to keep 60fps)
  const handleRegionChangeComplete = useCallback(
    (region: Region) => {
      if (activeNavigationShop) return;

      const center = { latitude: region.latitude, longitude: region.longitude };
      if (lastFetchRef.current) {
        const dLat = Math.abs(lastFetchRef.current.latitude - center.latitude);
        const dLng = Math.abs(lastFetchRef.current.longitude - center.longitude);
        if (dLat < 0.01 && dLng < 0.01) {
          return;
        }
      }
      lastFetchRef.current = center;
      fetchNearbyShops(center);
    },
    [fetchNearbyShops, activeNavigationShop],
  );

  const handleRecenterRoute = () => {
    hapticLight();
    if (activeNavigationShop && userLocation && mapRef.current) {
      mapRef.current.fitToCoordinates([userLocation, activeNavigationShop.location], {
        edgePadding: {
          top: Platform.OS === 'ios' ? 190 : 150,
          right: 50,
          bottom: 180,
          left: 50,
        },
        animated: true,
      });
    }
  };

  const handleMyLocation = () => {
    hapticLight();
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion(
        { ...userLocation, latitudeDelta: DELTA.medium, longitudeDelta: DELTA.medium },
        400,
      );
    }
  };

  // Memoized markers list to avoid re-rendering pins on pan/zoom
  const renderedMarkers = useMemo(() => {
    return shops.map((shop) => (
      <CoffeeMarker
        key={shop.id}
        shop={shop}
        isSelected={
          activeNavigationShop?.id === shop.id || selectedShop?.id === shop.id
        }
        onPress={handleMarkerPress}
      />
    ));
  }, [shops, activeNavigationShop?.id, selectedShop?.id, handleMarkerPress]);

  // Quick preview photo
  const previewPhotoUrl = selectedShop
    ? selectedShop.galleryUrls?.[0] ??
      (selectedShop.photos?.[0] ? getPhotoUrl(selectedShop.photos[0].photoReference, 300) : null)
    : null;

  return (
    <View style={styles.container}>
      {/* Interactive Map with Hardware-Accelerated Native GPS Location */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={DEFAULT_REGION}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={true}
        minZoomLevel={6}
        mapType={mapType}
        moveOnMarkerPress={false}
        onPress={handleMapPress}
        onRegionChangeComplete={handleRegionChangeComplete}
      >

        {/* Render Road-Following Route Polyline during navigation */}
        {activeNavigationShop && (
          <RoutePolyline
            coordinates={navigationRoute?.coordinates || []}
            mode={navigationMode}
            mapType={mapType}
          />
        )}

        {renderedMarkers}
      </MapView>

      {/* Floating Minimalist Header (Search + Hub Switcher + Filters) — Hidden during active navigation */}
      {!activeNavigationShop && (
        <View style={styles.headerOverlay}>
          <View style={styles.topRow}>
            <View style={styles.searchWrapper}>
              <SearchBar onAvatarPress={() => (nav as any).navigate('Profile')} />
            </View>
          </View>

          <View style={styles.subFilterRow}>
            <RegionSelector />
            <View style={styles.filterScrollWrapper}>
              <FilterBar />
            </View>
          </View>
        </View>
      )}

      {/* Google Maps-Style Turn-by-Turn Navigation Assistant */}
      {activeNavigationShop && (
        <NavigationAssistant
          shop={activeNavigationShop}
          route={navigationRoute}
          navigationMode={navigationMode}
          onModeChange={(mode) => setNavigationMode(mode)}
          onEndNavigation={() => {
            stopNavigation();
            setNavigationRoute(null);
          }}
          onRecenter={handleRecenterRoute}
          onViewShopDetail={() => nav.navigate('ShopDetail', { shop: activeNavigationShop })}
        />
      )}

      {/* Offline Mode Indicator Pill */}
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Feather name="wifi-off" size={12} color="#6E4822" />
          <Text style={styles.offlineText}>Offline Mode (Cached Hub)</Text>
        </View>
      )}

      {/* Floating Controls (Map Layer + GPS on Bottom Right) */}
      <View
        style={[
          styles.floatingControlsRight,
          selectedShop && !activeNavigationShop && { bottom: 220 },
        ]}
      >
        <TouchableOpacity
          style={styles.controlCircleBtn}
          onPress={() => setLayersModalVisible(true)}
          activeOpacity={0.85}
        >
          <Feather name="layers" size={18} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlCircleBtn}
          onPress={handleMyLocation}
          activeOpacity={0.85}
        >
          <Feather name="crosshair" size={18} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Floating Quick Preview Card (Pop-up when clicking a pin) */}
      {selectedShop && !activeNavigationShop && (
        <View style={styles.quickPreviewCard}>
          <TouchableOpacity
            style={styles.previewCloseBtn}
            onPress={() => setSelectedShop(null)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="x" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.previewContentRow}
            onPress={() => handleShopPress(selectedShop)}
            activeOpacity={0.9}
          >
            {/* Thumbnail */}
            <View style={styles.previewThumbContainer}>
              {previewPhotoUrl ? (
                <Image source={{ uri: previewPhotoUrl }} style={styles.previewThumb} />
              ) : (
                <View style={styles.previewPlaceholder}>
                  <Feather name="coffee" size={24} color={COLORS.textMuted} />
                </View>
              )}
            </View>

            {/* Info */}
            <View style={styles.previewInfo}>
              <View style={styles.previewTitleRow}>
                <Text style={styles.previewName} numberOfLines={1}>
                  {selectedShop.name}
                </Text>
                {selectedShop.isVerified && (
                  <Feather name="check-circle" size={13} color={COLORS.verified} />
                )}
              </View>

              {/* Rating + Distance */}
              <View style={styles.previewMetaRow}>
                {selectedShop.rating !== undefined && (
                  <RatingStars rating={selectedShop.rating} size={11} />
                )}
                {selectedShop.distance !== undefined && (
                  <Text style={styles.previewDistance}>
                    • {formatDistance(selectedShop.distance)}
                  </Text>
                )}
              </View>

              {/* Price Range */}
              <View style={styles.previewPriceRow}>
                <Feather name="tag" size={11} color={COLORS.primary} />
                <Text style={styles.previewPriceText}>
                  {selectedShop.priceRange
                    ? `₱${selectedShop.priceRange.min} – ₱${selectedShop.priceRange.max} / cup`
                    : 'Specialty Coffee'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Direct Action Buttons */}
          <View style={styles.previewActionRow}>
            <TouchableOpacity
              style={styles.previewRouteBtn}
              onPress={() => startNavigation(selectedShop)}
              activeOpacity={0.85}
            >
              <Feather name="navigation" size={13} color="#FFFFFF" />
              <Text style={styles.previewRouteText}>Navigate Route</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.previewDetailBtn}
              onPress={() => handleShopPress(selectedShop)}
              activeOpacity={0.85}
            >
              <Text style={styles.previewDetailText}>View Details</Text>
              <Feather name="chevron-right" size={14} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>
      )}

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
            <Text style={styles.layersTitle}>Select Map Layer</Text>
            {[
              { type: 'standard' as MapTypeOption, label: 'Standard Road', sub: 'Clean road map' },
              { type: 'satellite' as MapTypeOption, label: 'Satellite Hybrid', sub: 'High-res aerial photography' },
              { type: 'terrain' as MapTypeOption, label: 'Highland Terrain', sub: 'Topography & mountain contours' },
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
                {mapType === layer.type && <Feather name="check" size={16} color={COLORS.primary} />}
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

      {/* Bottom Sheet Drawer (Only shown when not previewing a single pin or navigating) */}
      {!activeNavigationShop && !selectedShop && (
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
                <Feather name="coffee" size={36} color={COLORS.textMuted} />
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
    gap: 6,
    width: '100%',
  },
  filterScrollWrapper: {
    flex: 1,
  },
  navHudCard: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 120 : 85,
    left: SPACING.md,
    right: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.sm + 4,
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
  },
  navIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navHudTextCol: {
    flex: 1,
    gap: 1,
  },
  navHudTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  navHudEtaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  navHudEta: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  navHudRightCol: {
    alignItems: 'flex-end',
    gap: 6,
  },
  modeToggleGroup: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceWarm,
    borderRadius: RADIUS.full,
    padding: 2,
    gap: 2,
  },
  modePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  modePillActive: {
    backgroundColor: COLORS.primary,
  },
  modePillText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  modePillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  navHudActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  navRecenterBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceSage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navDetailBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceSage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navEndBtn: {
    backgroundColor: '#FDEDEC',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: '#FADBD8',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  offlineText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#6E4822',
  },
  floatingControlsRight: {
    position: 'absolute',
    bottom: 120,
    right: SPACING.md,
    gap: SPACING.sm,
    zIndex: 9,
  },
  controlCircleBtn: {
    backgroundColor: COLORS.surface,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.2,
    borderColor: COLORS.border,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  quickPreviewCard: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 80,
    left: SPACING.md,
    right: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md - 2,
    borderWidth: 1.2,
    borderColor: COLORS.border,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    zIndex: 30,
    gap: SPACING.sm,
  },
  previewCloseBtn: {
    position: 'absolute',
    top: 10,
    right: 12,
    zIndex: 2,
    padding: 4,
  },
  previewContentRow: {
    flexDirection: 'row',
    gap: SPACING.sm + 2,
  },
  previewThumbContainer: {
    width: 68,
    height: 68,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
  },
  previewThumb: {
    width: '100%',
    height: '100%',
  },
  previewPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.surfaceWarm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewInfo: {
    flex: 1,
    justifyContent: 'center',
    gap: 3,
    paddingRight: 20,
  },
  previewTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  previewName: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
    flexShrink: 1,
  },
  previewMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  previewDistance: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  previewPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  previewPriceText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.primary,
  },
  previewActionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  previewRouteBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  previewRouteText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  previewDetailBtn: {
    flex: 1,
    backgroundColor: COLORS.surfaceSage,
    borderRadius: RADIUS.full,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
  },
  previewDetailText: {
    color: COLORS.primary,
    fontSize: 12.5,
    fontWeight: '700',
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
  emptyText: {
    fontSize: 13.5,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
  },
});
