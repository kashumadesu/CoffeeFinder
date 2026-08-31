// ============================================================
// SearchSuggestions — Ultra-Fast Autocomplete, Recent History & Hotspots
// Instant 0ms response on focus with in-memory caching & AsyncStorage history
// ============================================================

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, GOOGLE_PLACES_API_KEY } from '@constants';
import { hapticLight, hapticSelection } from '@utils/haptics';

export interface Suggestion {
  placeId: string;
  mainText: string;
  secondaryText: string;
}

interface Props {
  query: string;
  userLocation?: { latitude: number; longitude: number } | null;
  onSelect: (text: string) => void;
  visible: boolean;
}

const SEARCH_HISTORY_KEY = '@coffee_finder:search_history_v1';
const DEBOUNCE_MS = 180; // Ultra-fast sub-200ms debounce
const queryCache = new Map<string, Suggestion[]>();

const TRENDING_HOTSPOTS = [
  { label: '🔥 Maginhawa', query: 'Maginhawa' },
  { label: '⚡ Plentiful Plugs', query: 'outlets' },
  { label: '🚐 Kape sa Garahe', query: 'garahe' },
  { label: '🌱 Sagada Arabica', query: 'Sagada' },
  { label: '🔥 Poblacion', query: 'Poblacion' },
  { label: '☕ Batangas Barako', query: 'Barako' },
  { label: '🏔️ Mt. Apo', query: 'Mt. Apo' },
  { label: '🔥 Tomas Morato', query: 'Tomas Morato' },
];

export const SearchSuggestions: React.FC<Props> = ({
  query,
  userLocation,
  onSelect,
  visible,
}) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Load search history from local storage on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const stored = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
        if (stored) {
          setHistory(JSON.parse(stored).slice(0, 5));
        }
      } catch {}
    };
    loadHistory();
  }, [visible]);

  const handleSelectQuery = async (selectedText: string) => {
    hapticSelection();
    // Save to history
    try {
      const updated = [selectedText, ...history.filter((h) => h.toLowerCase() !== selectedText.toLowerCase())].slice(0, 8);
      setHistory(updated);
      await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
    } catch {}
    onSelect(selectedText);
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

  const cleanQuery = query.trim();

  // Autocomplete fetch effect
  useEffect(() => {
    if (!visible || cleanQuery.length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    // Check instant in-memory cache first (0ms latency!)
    const cacheKey = cleanQuery.toLowerCase();
    if (queryCache.has(cacheKey)) {
      setSuggestions(queryCache.get(cacheKey)!);
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
          const mapped: Suggestion[] = data.predictions.slice(0, 5).map((p: any) => ({
            placeId: p.place_id,
            mainText: p.structured_formatting?.main_text ?? p.description,
            secondaryText: p.structured_formatting?.secondary_text ?? '',
          }));
          queryCache.set(cacheKey, mapped);
          setSuggestions(mapped);
        } else {
          setSuggestions([]);
        }
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [cleanQuery, visible, userLocation?.latitude, userLocation?.longitude]);

  if (!visible) return null;

  const showHistoryAndHotspots = cleanQuery.length < 2;

  return (
    <View style={styles.container}>
      {/* Empty State / Focus State: Show Recent History & Trending Hotspots */}
      {showHistoryAndHotspots ? (
        <View style={styles.historyContainer}>
          {/* Trending Hotspot Chips */}
          <View style={styles.hotspotsSection}>
            <Text style={styles.sectionHeader}>🔥 Trending Coffee Hubs & Badges</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hotspotsScroll}
            >
              {TRENDING_HOTSPOTS.map((hotspot) => (
                <TouchableOpacity
                  key={hotspot.query}
                  style={styles.hotspotChip}
                  onPress={() => handleSelectQuery(hotspot.query)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.hotspotChipText}>{hotspot.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Recent Searches History */}
          {history.length > 0 && (
            <View style={styles.historySection}>
              <View style={styles.historyHeaderRow}>
                <Text style={styles.sectionHeader}>Recent Searches</Text>
                <TouchableOpacity onPress={handleClearHistory} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={styles.clearHistoryText}>Clear All</Text>
                </TouchableOpacity>
              </View>

              {history.map((item) => (
                <View key={item} style={styles.historyRow}>
                  <TouchableOpacity
                    style={styles.historyClickable}
                    onPress={() => handleSelectQuery(item)}
                    activeOpacity={0.7}
                  >
                    <Feather name="clock" size={13} color={COLORS.textMuted} />
                    <Text style={styles.historyText} numberOfLines={1}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleRemoveHistoryItem(item)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Feather name="x" size={13} color={COLORS.textMuted} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      ) : loading ? (
        /* Loading Autocomplete State */
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.loadingText}>Locating spots…</Text>
        </View>
      ) : suggestions.length > 0 ? (
        /* Live Suggestions List */
        <FlatList
          data={suggestions}
          keyExtractor={(item) => item.placeId}
          scrollEnabled={false}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={[styles.row, index === suggestions.length - 1 && styles.rowLast]}
              onPress={() => handleSelectQuery(item.mainText)}
              activeOpacity={0.7}
            >
              <View style={styles.iconWrap}>
                <Feather name="coffee" size={14} color={COLORS.primary} />
              </View>
              <View style={styles.textWrap}>
                <Text style={styles.mainText} numberOfLines={1}>
                  {item.mainText}
                </Text>
                {!!item.secondaryText && (
                  <Text style={styles.secondaryText} numberOfLines={1}>
                    {item.secondaryText}
                  </Text>
                )}
              </View>
              <Feather name="arrow-up-left" size={14} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 56,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    overflow: 'hidden',
    zIndex: 999,
  },
  historyContainer: {
    paddingVertical: SPACING.sm,
  },
  hotspotsSection: {
    paddingHorizontal: SPACING.sm,
    paddingBottom: SPACING.xs,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  hotspotsScroll: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 2,
  },
  hotspotChip: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.full,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  hotspotChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  historySection: {
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    marginTop: 8,
    paddingTop: 8,
    paddingHorizontal: SPACING.sm,
  },
  historyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  clearHistoryText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  historyClickable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  historyText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '500',
    flex: 1,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  loadingText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    gap: SPACING.sm,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EFF5F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
  },
  mainText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  secondaryText: {
    fontSize: 11.5,
    color: COLORS.textMuted,
    marginTop: 1,
  },
});
