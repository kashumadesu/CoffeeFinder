// ============================================================
// SearchBar — Live Autocomplete Search with Instant History & Dismiss
// ============================================================

import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
  BackHandler,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '@constants';
import { useStore } from '@store/useStore';
import { logSearchEvent } from '@services/analytics';
import { SearchSuggestions } from '@components/SearchSuggestions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { hapticLight } from '@utils/haptics';
import type { CoffeeShop } from '@types';

interface Props {
  onAvatarPress?: () => void;
  onSelectShop?: (shop: CoffeeShop) => void;
}

const SEARCH_HISTORY_KEY = '@coffee_finder:search_history_v1';

export const SearchBar: React.FC<Props> = ({ onAvatarPress, onSelectShop }) => {
  const searchQuery = useStore((s) => s.filters.searchQuery);
  const setSearchQuery = useStore((s) => s.setSearchQuery);
  const currentRegion = useStore((s) => s.currentRegion.id);
  const shopsCount = useStore((s) => s.shops.length);
  const userLocation = useStore((s) => s.userLocation);

  const inputRef = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Handle Android Hardware Back Button to dismiss search overlay
  React.useEffect(() => {
    const onBackPress = () => {
      if (isFocused) {
        setIsFocused(false);
        Keyboard.dismiss();
        inputRef.current?.blur();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backHandler.remove();
  }, [isFocused]);

  const handleSubmit = async () => {
    Keyboard.dismiss();
    setIsFocused(false);
    inputRef.current?.blur();
    if (searchQuery.trim()) {
      try {
        const stored = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
        const history: string[] = stored ? JSON.parse(stored) : [];
        const updated = [
          searchQuery.trim(),
          ...history.filter((h) => h.toLowerCase() !== searchQuery.trim().toLowerCase()),
        ].slice(0, 8);
        await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
      } catch {}
      logSearchEvent(searchQuery, currentRegion, shopsCount);
    }
  };

  const handleSuggestionSelect = (text: string) => {
    Keyboard.dismiss();
    setSearchQuery(text);
    setIsFocused(false);
    inputRef.current?.blur();
    logSearchEvent(text, currentRegion, shopsCount);
  };

  const handleShopSelect = (shop: CoffeeShop) => {
    Keyboard.dismiss();
    setSearchQuery(shop.name);
    setIsFocused(false);
    inputRef.current?.blur();
    if (onSelectShop) {
      onSelectShop(shop);
    }
  };

  const handleClear = () => {
    hapticLight();
    setSearchQuery('');
  };

  const handleCancel = () => {
    hapticLight();
    Keyboard.dismiss();
    inputRef.current?.blur();
    setIsFocused(false);
    setSearchQuery('');
  };

  return (
    <View style={styles.container}>
      {/* Search Input Capsule */}
      <View style={[styles.inputWrapper, isFocused && styles.inputWrapperFocused]}>
        <Feather name="search" size={15} color={isFocused ? COLORS.primary : COLORS.textMuted} style={styles.searchIcon} />

        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder="Search cafés, WFC outlets, Sagada, Barako…"
          placeholderTextColor={COLORS.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSubmit}
          onFocus={() => setIsFocused(true)}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />

        {/* Clear text X button inside capsule */}
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={handleClear}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.clearBtn}
          >
            <Feather name="x-circle" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Cancel Button when focused */}
      {isFocused ? (
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={handleCancel}
          activeOpacity={0.75}
        >
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
      ) : (
        /* User Avatar when idle */
        <TouchableOpacity style={styles.avatarBtn} onPress={onAvatarPress} activeOpacity={0.8}>
          <View style={styles.avatarInner}>
            <Feather name="user" size={19} color={COLORS.textSecondary} />
          </View>
        </TouchableOpacity>
      )}

      {/* Live Autocomplete, Search History & Trending Recommendations Dropdown */}
      <SearchSuggestions
        query={searchQuery}
        userLocation={userLocation}
        onSelect={handleSuggestionSelect}
        onSelectShop={handleShopSelect}
        visible={isFocused}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
    width: '100%',
    zIndex: 9999,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    paddingLeft: SPACING.sm,
    paddingRight: SPACING.sm,
    height: 50,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    gap: SPACING.xs ?? 4,
    zIndex: 9999,
  },
  inputWrapperFocused: {
    borderColor: COLORS.primary,
    backgroundColor: '#FFFFFF',
  },
  searchIcon: {
    marginLeft: 2,
  },
  input: {
    flex: 1,
    fontSize: 13.5,
    color: COLORS.textPrimary,
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 2,
  },
  cancelBtn: {
    paddingHorizontal: 8,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  avatarBtn: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  avatarInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceWarm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
