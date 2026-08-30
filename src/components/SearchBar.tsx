// ============================================================
// SearchBar Component — Matching Mockup Header
// ============================================================

import React from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, RADIUS } from '@constants';
import { useStore } from '@store/useStore';

interface Props {
  onAvatarPress?: () => void;
}

export const SearchBar: React.FC<Props> = ({ onAvatarPress }) => {
  const searchQuery = useStore((s) => s.filters.searchQuery);
  const setSearchQuery = useStore((s) => s.setSearchQuery);

  return (
    <View style={styles.container}>
      {/* Search Input Capsule */}
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          placeholder="Find WFC friendly, pour-over, or underrated spots..."
          placeholderTextColor={COLORS.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        <TouchableOpacity style={styles.searchIconBtn} activeOpacity={0.8}>
          <Text style={styles.searchIcon}>🔍</Text>
        </TouchableOpacity>
      </View>

      {/* User Avatar Circle */}
      <TouchableOpacity
        style={styles.avatarBtn}
        onPress={onAvatarPress}
        activeOpacity={0.8}
      >
        <View style={styles.avatarInner}>
          <Text style={styles.avatarEmoji}>👨🏻‍💼</Text>
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
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    paddingLeft: SPACING.md,
    paddingRight: 6,
    height: 52,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  input: {
    flex: 1,
    fontSize: 13.5,
    color: COLORS.textPrimary,
    paddingVertical: 0,
    fontWeight: '400',
  },
  searchIconBtn: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    backgroundColor: '#F1E9DE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchIcon: {
    fontSize: 15,
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
  avatarEmoji: {
    fontSize: 22,
  },
});
