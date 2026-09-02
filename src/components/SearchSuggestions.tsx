// ============================================================
// SearchSuggestions — Rich Autocomplete, History & Recommendations
// Offline-first instant 0ms local matching + Google Places API fallback
// ============================================================

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, GOOGLE_PLACES_API_KEY, getPhotoUrl } from '@constants';
import { useStore } from '@store/useStore';
import { formatDistance } from '@services/googlePlaces';
import { RatingStars } from '@components/RatingStars';
import { hapticLight, hapticSelection } from '@utils/haptics';
import type { CoffeeShop } from '@types';

export interface Suggestion {
  placeId: string;
  mainText: string;
  secondaryText: string;
}

interface Props {
  query: string;
  userLocation?: { latitude: number; longitude: number } | null;
  onSelect: (text: string) => void;
  onSelectShop?: (shop: CoffeeShop) => void;
  visible: boolean;
}

const SEARCH_HISTORY_KEY = '@coffee_finder:search_history_v1';
const DEBOUNCE_MS = 200;
const queryCache = new Map<string, Suggestion[]>();

const TRENDING_HOTSPOTS = [
  { label: '⚡ Plentiful Plugs', query: 'outlets', icon: 'zap' },
  { label: '🌱 Sagada Arabica', query: 'Sagada', icon: 'coffee' },
  { label: '🏔️ Mt. Apo Anaerobic', query: 'Mt. Apo', icon: 'award' },
  { label: '☕ Batangas Barako', query: 'Barako', icon: 'coffee' },
  { label: '🚐 Kape sa Garahe', query: 'garahe', icon: 'truck' },
  { label: '📍 Maginhawa Strip', query: 'Maginhawa', icon: 'map-pin' },
  { label: '📍 Tomas Morato', query: 'Tomas Morato', icon: 'map-pin' },
  { label: '📍 Poblacion Makati', query: 'Poblacion', icon: 'map-pin' },
  { label: '🌙 Open Late Night', query: 'late night', icon: 'moon' },
];

export const SearchSuggestions: React.FC<Props> = ({
  query,
  userLocation,
  onSelect,
  onSelectShop,
  visible,
}) => {
  const allShops = useStore((s) => s.shops);
  const currentRegion = useStore((s) => s.currentRegion);

  const [googleSuggestions, setGoogleSuggestions] = useState<Suggestion[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Load search history from local storage on mount / visibility
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const stored = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
        if (stored) {
          setHistory(JSON.parse(stored).slice(0, 6));
        }
      } catch {}
    };
    if (visible) {
      loadHistory();
    }
  }, [visible]);

  const cleanQuery = query.trim().toLowerCase();

  // Instant Local Matches (0ms latency, always works offline)
  const matchingLocalShops = useMemo(() => {
    if (!cleanQuery || cleanQuery.length < 1) return [];

    return allShops.filter((s) => {
      const nameMatch = s.name.toLowerCase().includes(cleanQuery);
      const vicinityMatch = s.vicinity?.toLowerCase().includes(cleanQuery);
      const cityMatch = s.city?.toLowerCase().includes(cleanQuery);
      const originsMatch = s.beanOrigins?.some((o) => o.toLowerCase().includes(cleanQuery));
      const tagsMatch = s.vibeTags?.some((t) => t.toLowerCase().includes(cleanQuery));
      const outletMatch = cleanQuery.includes('outlet') || cleanQuery.includes('plug')
        ? s.outletRating === 'plentiful'
        : false;
      const garaheMatch = cleanQuery.includes('garahe') || cleanQuery.includes('garage')
        ? s.cafeFormat === 'garage_popup'
        : false;

      return (
        nameMatch ||
        vicinityMatch ||
        cityMatch ||
        originsMatch ||
        tagsMatch ||
        outletMatch ||
        garaheMatch
      );
    }).slice(0, 5);
  }, [allShops, cleanQuery]);

  // Recommended similar specialty places when browsing or looking at empty/short query
  const recommendedShops = useMemo(() => {
    // Show top-rated specialty places in current region or popular spots
    return allShops
      .filter((s) => (s.rating ?? 0) >= 4.7)
      .slice(0, 4);
  }, [allShops]);

  const handleSelectQuery = async (selectedText: string) => {
    hapticSelection();
    try {
      const updated = [
        selectedText,
        ...history.filter((h) => h.toLowerCase() !== selectedText.toLowerCase()),
      ].slice(0, 8);
      setHistory(updated);
      await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
    } catch {}
    onSelect(selectedText);
  };

  const handleSelectShopItem = async (shop: CoffeeShop) => {
    hapticSelection();
    try {
      const updated = [
        shop.name,
        ...history.filter((h) => h.toLowerCase() !== shop.name.toLowerCase()),
      ].slice(0, 8);
      setHistory(updated);
      await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
    } catch {}
    if (onSelectShop) {
      onSelectShop(shop);
    } else {
      onSelect(shop.name);
    }
  };

  const handleClearHistory = async () => {
    hapticLight();
    setHistory([]);
    try {
      await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
    } catch {}
  };

  const handleRemoveHistoryItem = async (item: string) => {
    hapticLight();
    const updated = history.filter((h) => h !== item);
    setHistory(updated);
    try {
      await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
    } catch {}
  };

  // Google Places Autocomplete fetch effect (for external landmarks)
  useEffect(() => {
    if (!visible || cleanQuery.length < 3) {
      setGoogleSuggestions([]);
      setLoading(false);
      return;
    }

    const cacheKey = cleanQuery;
    if (queryCache.has(cacheKey)) {
      setGoogleSuggestions(queryCache.get(cacheKey)!);
      setLoading(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      setLoading(true);

      try {
        const locationBias = userLocation
          ? `&location=${userLocation.latitude},${userLocation.longitude}&radius=25000`
          : '';
        const url =
          `https://maps.googleapis.com/maps/api/place/autocomplete/json` +
          `?input=${encodeURIComponent(cleanQuery)}` +
          `&types=establishment` +
          `&components=country:ph` +
          `&keyword=cafe|coffee` +
          locationBias +
          `&key=${GOOGLE_PLACES_API_KEY}`;

        const res = await fetch(url, { signal: abortRef.current.signal });
        const data = await res.json();

        if (data.status === 'OK' && data.predictions) {
          const mapped: Suggestion[] = data.predictions.slice(0, 4).map((p: any) => ({
            placeId: p.place_id,
            mainText: p.structured_formatting?.main_text ?? p.description,
            secondaryText: p.structured_formatting?.secondary_text ?? '',
          }));
          queryCache.set(cacheKey, mapped);
          setGoogleSuggestions(mapped);
        } else {
          setGoogleSuggestions([]);
        }
      } catch {
        setGoogleSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [cleanQuery, visible, userLocation?.latitude, userLocation?.longitude]);

  if (!visible) return null;

  const showIdleState = cleanQuery.length === 0;

  return (
    <View style={styles.container}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ==================================================== */}
        {/* STATE A: IDLE / EMPTY QUERY (History, Trending, Recos) */}
        {/* ==================================================== */}
        {showIdleState && (
          <View style={styles.idleContainer}>
            {/* 1. Recent Search History */}
            {history.length > 0 && (
              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeaderRow}>
                  <View style={styles.sectionTitleWithIcon}>
                    <Feather name="clock" size={13} color={COLORS.textSecondary} />
                    <Text style={styles.sectionTitle}>Recent Searches</Text>
                  </View>
                  <TouchableOpacity
                    onPress={handleClearHistory}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.clearAllText}>Clear All</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.historyList}>
                  {history.map((item) => (
                    <View key={item} style={styles.historyItemRow}>
                      <TouchableOpacity
                        style={styles.historyItemLeft}
                        onPress={() => handleSelectQuery(item)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.historyIconCircle}>
                          <Feather name="search" size={12} color={COLORS.textMuted} />
                        </View>
                        <Text style={styles.historyItemText} numberOfLines={1}>
                          {item}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleRemoveHistoryItem(item)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        style={styles.historyRemoveBtn}
                      >
                        <Feather name="x" size={14} color={COLORS.textMuted} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* 2. Trending & Curated Coffee Filters */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionTitleWithIcon}>
                <Feather name="compass" size={13} color={COLORS.primary} />
                <Text style={styles.sectionTitle}>Trending Specialty Filters</Text>
              </View>
              <View style={styles.trendingGrid}>
                {TRENDING_HOTSPOTS.map((hotspot) => (
                  <TouchableOpacity
                    key={hotspot.query}
                    style={styles.trendingChip}
                    onPress={() => handleSelectQuery(hotspot.query)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.trendingChipText}>{hotspot.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 3. Recommended Top-Rated Spots in Current Region */}
            {recommendedShops.length > 0 && (
              <View style={styles.sectionBlock}>
                <View style={styles.sectionTitleWithIcon}>
                  <Feather name="star" size={13} color="#D97706" />
                  <Text style={styles.sectionTitle}>
                    Top Specialty Spots in {currentRegion.name}
                  </Text>
                </View>

                {recommendedShops.map((shop) => {
                  const thumb =
                    shop.galleryUrls?.[0] ??
                    (shop.photos?.[0] ? getPhotoUrl(shop.photos[0].photoReference, 150) : null);

                  return (
                    <TouchableOpacity
                      key={shop.id}
                      style={styles.shopResultCard}
                      onPress={() => handleSelectShopItem(shop)}
                      activeOpacity={0.78}
                    >
                      {thumb ? (
                        <Image source={{ uri: thumb }} style={styles.shopThumb} />
                      ) : (
                        <View style={styles.shopThumbPlaceholder}>
                          <Feather name="coffee" size={18} color={COLORS.primary} />
                        </View>
                      )}

                      <View style={styles.shopResultInfo}>
                        <View style={styles.shopResultNameRow}>
                          <Text style={styles.shopResultName} numberOfLines={1}>
                            {shop.name}
                          </Text>
                          {shop.isVerified && (
                            <Feather name="check-circle" size={12} color={COLORS.verified} />
                          )}
                        </View>

                        <Text style={styles.shopResultVicinity} numberOfLines={1}>
                          {shop.vicinity}
                        </Text>

                        <View style={styles.shopResultMetaRow}>
                          {shop.rating && (
                            <RatingStars rating={shop.rating} count={shop.userRatingsTotal} size={10.5} />
                          )}
                          {shop.distance !== undefined && (
                            <Text style={styles.shopResultDistance}>
                              • {formatDistance(shop.distance)}
                            </Text>
                          )}
                          {shop.outletRating === 'plentiful' && (
                            <View style={styles.wfcMicroPill}>
                              <Text style={styles.wfcMicroText}>⚡ Plugs</Text>
                            </View>
                          )}
                        </View>
                      </View>

                      <Feather name="chevron-right" size={16} color={COLORS.textMuted} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* ==================================================== */}
        {/* STATE B: ACTIVE QUERY (Live Matches + Predictions) */}
        {/* ==================================================== */}
        {!showIdleState && (
          <View style={styles.queryContainer}>
            {/* 1. Direct Local Specialty Coffee Shop Matches */}
            {matchingLocalShops.length > 0 && (
              <View style={styles.sectionBlock}>
                <View style={styles.sectionTitleWithIcon}>
                  <Feather name="coffee" size={13} color={COLORS.primary} />
                  <Text style={styles.sectionTitle}>
                    Specialty Cafés Matching "{query}"
                  </Text>
                </View>

                {matchingLocalShops.map((shop) => {
                  const thumb =
                    shop.galleryUrls?.[0] ??
                    (shop.photos?.[0] ? getPhotoUrl(shop.photos[0].photoReference, 150) : null);

                  return (
                    <TouchableOpacity
                      key={shop.id}
                      style={styles.shopResultCard}
                      onPress={() => handleSelectShopItem(shop)}
                      activeOpacity={0.78}
                    >
                      {thumb ? (
                        <Image source={{ uri: thumb }} style={styles.shopThumb} />
                      ) : (
                        <View style={styles.shopThumbPlaceholder}>
                          <Feather name="coffee" size={18} color={COLORS.primary} />
                        </View>
                      )}

                      <View style={styles.shopResultInfo}>
                        <View style={styles.shopResultNameRow}>
                          <Text style={styles.shopResultName} numberOfLines={1}>
                            {shop.name}
                          </Text>
                          {shop.isVerified && (
                            <Feather name="check-circle" size={12} color={COLORS.verified} />
                          )}
                        </View>

                        <Text style={styles.shopResultVicinity} numberOfLines={1}>
                          {shop.vicinity}
                        </Text>

                        <View style={styles.shopResultMetaRow}>
                          {shop.rating && (
                            <RatingStars rating={shop.rating} count={shop.userRatingsTotal} size={10.5} />
                          )}
                          {shop.distance !== undefined && (
                            <Text style={styles.shopResultDistance}>
                              • {formatDistance(shop.distance)}
                            </Text>
                          )}
                          {shop.acceptsGcash && (
                            <View style={styles.gcashMicroPill}>
                              <Text style={styles.gcashMicroText}>GCash</Text>
                            </View>
                          )}
                        </View>
                      </View>

                      <Feather name="arrow-up-left" size={16} color={COLORS.primary} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Loading Indicator for Places API */}
            {loading && (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.loadingText}>Searching Philippine coffee spots…</Text>
              </View>
            )}

            {/* 2. Google Places Landmark Suggestions */}
            {googleSuggestions.length > 0 && (
              <View style={styles.sectionBlock}>
                <View style={styles.sectionTitleWithIcon}>
                  <Feather name="map-pin" size={13} color={COLORS.textSecondary} />
                  <Text style={styles.sectionTitle}>Landmarks & Areas</Text>
                </View>

                {googleSuggestions.map((item) => (
                  <TouchableOpacity
                    key={item.placeId}
                    style={styles.placesResultRow}
                    onPress={() => handleSelectQuery(item.mainText)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.placesIconWrap}>
                      <Feather name="map-pin" size={13} color={COLORS.primary} />
                    </View>
                    <View style={styles.placesTextWrap}>
                      <Text style={styles.placesMainText} numberOfLines={1}>
                        {item.mainText}
                      </Text>
                      {!!item.secondaryText && (
                        <Text style={styles.placesSecondaryText} numberOfLines={1}>
                          {item.secondaryText}
                        </Text>
                      )}
                    </View>
                    <Feather name="arrow-up-left" size={14} color={COLORS.textMuted} />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* 3. Empty State if no local or API matches */}
            {!loading && matchingLocalShops.length === 0 && googleSuggestions.length === 0 && (
              <View style={styles.noMatchCard}>
                <Feather name="search" size={28} color={COLORS.textMuted} />
                <Text style={styles.noMatchTitle}>No direct matches found</Text>
                <Text style={styles.noMatchSub}>
                  Press enter to search the map for "{query}", or explore trending filters above.
                </Text>
                <TouchableOpacity
                  style={styles.searchExactBtn}
                  onPress={() => handleSelectQuery(query)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.searchExactBtnText}>Search "{query}" on Map</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 58,
    left: SPACING.md,
    right: SPACING.md,
    maxHeight: 460,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    overflow: 'hidden',
    zIndex: 9999,
  },
  scrollContent: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
  },
  idleContainer: {
    gap: SPACING.sm,
  },
  queryContainer: {
    gap: SPACING.sm,
  },
  sectionBlock: {
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    paddingBottom: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  sectionTitleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  clearAllText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  historyList: {
    gap: 2,
  },
  historyItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  historyItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  historyIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceWarm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyItemText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '500',
    flex: 1,
  },
  historyRemoveBtn: {
    padding: 4,
  },
  trendingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 2,
    marginTop: 2,
  },
  trendingChip: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.full,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  trendingChipText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  shopResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 7,
    paddingHorizontal: 6,
    borderRadius: RADIUS.sm,
  },
  shopThumb: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceWarm,
  },
  shopThumbPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.sm,
    backgroundColor: '#EFF5F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopResultInfo: {
    flex: 1,
    gap: 2,
  },
  shopResultNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  shopResultName: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
    flex: 1,
  },
  shopResultVicinity: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  shopResultMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  shopResultDistance: {
    fontSize: 10.5,
    color: COLORS.textMuted,
  },
  wfcMicroPill: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: RADIUS.xs,
  },
  wfcMicroText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#1B5E20',
  },
  gcashMicroPill: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: RADIUS.xs,
  },
  gcashMicroText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#0D47A1',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.sm,
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 12.5,
    color: COLORS.textMuted,
  },
  placesResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    gap: 8,
  },
  placesIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#EFF5F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placesTextWrap: {
    flex: 1,
  },
  placesMainText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  placesSecondaryText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  noMatchCard: {
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
    gap: 6,
  },
  noMatchTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  noMatchSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  searchExactBtn: {
    marginTop: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
  },
  searchExactBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
