// ============================================================
// SearchBar — Live Autocomplete Search with Google Suggestions
// ============================================================

import React, { useRef, useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '@constants';
import { useStore } from '@store/useStore';
import { logSearchEvent } from '@services/analytics';
import { SearchSuggestions } from '@components/SearchSuggestions';

interface Props {
  onAvatarPress?: () => void;
}

export const SearchBar: React.FC<Props> = ({ onAvatarPress }) => {
  const searchQuery = useStore((s) => s.filters.searchQuery);
  const setSearchQuery = useStore((s) => s.setSearchQuery);
  const currentRegion = useStore((s) => s.currentRegion.id);
  const shopsCount = useStore((s) => s.shops.length);
  const userLocation = useStore((s) => s.userLocation);

  const inputRef = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = () => {
    setIsFocused(false);
    inputRef.current?.blur();
    if (searchQuery.trim()) {
      logSearchEvent(searchQuery, currentRegion, shopsCount);
    }
  };

  const handleSuggestionSelect = (text: string) => {
    setSearchQuery(text);
    setIsFocused(false);
    inputRef.current?.blur();
    logSearchEvent(text, currentRegion, shopsCount);
  };

  const handleClear = () => {
    setSearchQuery('');
    inputRef.current?.focus();
  };

  const showSuggestions = isFocused && searchQuery.trim().length >= 2;

  return (
    <View style={styles.container}>
      {/* Search Input Capsule */}
      <View style={styles.inputWrapper}>
        <Feather name="search" size={15} color={COLORS.textMuted} style={styles.searchIcon} />

        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder="Find WFC friendly, pour-over, neighborhood spots…"
          placeholderTextColor={COLORS.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSubmit}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            // Small delay so suggestion tap fires before blur hides the list
            setTimeout(() => setIsFocused(false), 150);
          }}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />

        {/* Clear button — only when text present */}
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={handleClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Feather name="x-circle" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Live Autocomplete Suggestions Dropdown */}
      {showSuggestions && (
        <SearchSuggestions
          query={searchQuery}
          userLocation={userLocation}
          onSelect={handleSuggestionSelect}
          visible={showSuggestions}
        />
      )}

      {/* User Avatar */}
      <TouchableOpacity style={styles.avatarBtn} onPress={onAvatarPress} activeOpacity={0.8}>
        <View style={styles.avatarInner}>
          <Feather name="user" size={20} color={COLORS.textSecondary} />
        </View>
      </TouchableOpacity>
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
    // Must be position relative so suggestions can overlay absolutely below
    zIndex: 100,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    paddingLeft: SPACING.sm,
    paddingRight: SPACING.sm,
    height: 52,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    gap: SPACING.xs ?? 4,
    // Overflow visible so dropdown can poke outside
    overflow: 'visible',
    zIndex: 100,
  },
  searchIcon: {
    marginLeft: 4,
  },
  input: {
    flex: 1,
    fontSize: 13.5,
    color: COLORS.textPrimary,
    paddingVertical: 0,
    fontWeight: '400',
  },
  avatarBtn: {
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  avatarInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFE7DE',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
