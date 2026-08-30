// ============================================================
// SearchSuggestions — Live Google Places Autocomplete Dropdown
// ============================================================

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, GOOGLE_PLACES_API_KEY } from '@constants';

interface Suggestion {
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

const DEBOUNCE_MS = 350;
const MIN_CHARS = 2;

export const SearchSuggestions: React.FC<Props> = ({
  query,
  userLocation,
  onSelect,
  visible,
}) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!visible || query.trim().length < MIN_CHARS) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    // Debounce API call
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      // Cancel previous request
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      setLoading(true);

      try {
        const locationBias = userLocation
          ? `&location=${userLocation.latitude},${userLocation.longitude}&radius=25000`
          : '';
        const url =
          `https://maps.googleapis.com/maps/api/place/autocomplete/json` +
          `?input=${encodeURIComponent(query)}` +
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
          setSuggestions(mapped);
        } else {
          setSuggestions([]);
        }
      } catch {
        // Aborted or network error — silent fail
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, visible, userLocation?.latitude, userLocation?.longitude]);

  if (!visible || (!loading && suggestions.length === 0)) return null;

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.loadingText}>Searching…</Text>
        </View>
      ) : (
        <FlatList
          data={suggestions}
          keyExtractor={(item) => item.placeId}
          scrollEnabled={false}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={[styles.row, index === suggestions.length - 1 && styles.rowLast]}
              onPress={() => onSelect(item.mainText)}
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
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 56, // sits just below the input field
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    elevation: 12,
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    zIndex: 999,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
  },
  loadingText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
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
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  secondaryText: {
    fontSize: 11.5,
    color: COLORS.textMuted,
    marginTop: 1,
  },
});
