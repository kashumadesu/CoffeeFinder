// ============================================================
// FilterBar — Icon-based Specialty & Price Tier Filter Chips
// ============================================================

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SPECIALTY_CATEGORIES } from '@constants';
import { useStore } from '@store/useStore';
import { hapticSelection } from '@utils/haptics';
import { logFilterEvent } from '@services/analytics';
import type { CategoryFilter, PriceTierFilter } from '@types';

export const FilterBar: React.FC = () => {
  const activeCategory = useStore((s) => s.filters.activeCategory);
  const priceTier = useStore((s) => s.filters.priceTier);
  const setCategory = useStore((s) => s.setCategory);
  const setPriceTier = useStore((s) => s.setPriceTier);

  const handlePress = (cat: (typeof SPECIALTY_CATEGORIES)[0]) => {
    hapticSelection();
    if (cat.isPrice && cat.tier) {
      const nextTier = priceTier === cat.tier ? 'all' : (cat.tier as PriceTierFilter);
      setPriceTier(nextTier);
      logFilterEvent('price_tier', nextTier);
    } else {
      const nextCat = activeCategory === cat.id ? 'all' : (cat.id as CategoryFilter);
      setCategory(nextCat);
      logFilterEvent('category', nextCat);
    }
  };

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {SPECIALTY_CATEGORIES.map((cat) => {
          const isActive = cat.isPrice
            ? priceTier === cat.tier
            : activeCategory === cat.id;

          return (
            <TouchableOpacity
              key={cat.id}
              style={[styles.chip, isActive && styles.chipActive]}
              onPress={() => handlePress(cat)}
              activeOpacity={0.8}
            >
              <Feather
                name={cat.icon as any}
                size={12.5}
                color={isActive ? COLORS.surface : COLORS.textSecondary}
                style={styles.chipIcon}
              />
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    height: 44,
    marginVertical: 2,
  },
  scroll: {
    paddingRight: SPACING.md,
    gap: 6,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.full,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderWidth: 1.2,
    borderColor: COLORS.border,
    gap: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipIcon: {
    marginTop: 0.5,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  chipTextActive: {
    color: COLORS.surface,
    fontWeight: '700',
  },
});
