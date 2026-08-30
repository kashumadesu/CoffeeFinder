// ============================================================
// FilterBar Component — Specialty Filter Chips (Matching Mockup)
// ============================================================

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, SPACING, RADIUS, SPECIALTY_CATEGORIES } from '@constants';
import { useStore } from '@store/useStore';
import type { CategoryFilter } from '@types';

export const FilterBar: React.FC = () => {
  const activeCategory = useStore((s) => s.filters.activeCategory);
  const setCategory = useStore((s) => s.setCategory);

  const handlePress = (id: string) => {
    if (activeCategory === id) {
      setCategory('all');
    } else {
      setCategory(id as CategoryFilter);
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
          const isActive = activeCategory === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[styles.chip, isActive && styles.chipActive]}
              onPress={() => handlePress(cat.id)}
              activeOpacity={0.8}
            >
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
    height: 48,
    marginVertical: 4,
  },
  scroll: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.xs + 2,
    alignItems: 'center',
  },
  chip: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.full,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1.2,
    borderColor: COLORS.border,
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
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  chipTextActive: {
    color: COLORS.surface,
    fontWeight: '700',
  },
});
