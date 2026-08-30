// ============================================================
// SearchBar — Clean vector icon search bar
// ============================================================

import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
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
        <Feather name="search" size={15} color={COLORS.textMuted} style={styles.searchPrefixIcon} />
        <TextInput
          style={styles.input}
          placeholder="Find WFC friendly, pour-over, or underrated spots..."
          placeholderTextColor={COLORS.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      {/* User Avatar Circle */}
      <TouchableOpacity
        style={styles.avatarBtn}
        onPress={onAvatarPress}
        activeOpacity={0.8}
      >
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
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    paddingLeft: SPACING.sm,
    paddingRight: 6,
    height: 52,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    gap: SPACING.sm,
  },
  searchPrefixIcon: {
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
