// ============================================================
// FilterBar — horizontal chip row for Open Now, Rating, Radius
// ============================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { COLORS, SPACING, RADIUS, RADIUS_OPTIONS, RATING_OPTIONS } from '@constants';
import { useStore } from '@store/useStore';

export const FilterBar: React.FC = () => {
  const filters = useStore((s) => s.filters);
  const setFilters = useStore((s) => s.setFilters);
  const applyFilters = useStore((s) => s.applyFilters);
  const [showRadius, setShowRadius] = useState(false);
  const [showRating, setShowRating] = useState(false);

  const handleOpenNow = () => {
    setFilters({ openNow: !filters.openNow });
    applyFilters();
  };

  const handleRadius = (value: number) => {
    setFilters({ radiusMetres: value });
    setShowRadius(false);
    applyFilters();
  };

  const handleRating = (value: number | null) => {
    setFilters({ minRating: value });
    setShowRating(false);
    applyFilters();
  };

  const radiusLabel = RADIUS_OPTIONS.find((r) => r.value === filters.radiusMetres)?.label ?? 'Radius';
  const ratingLabel = filters.minRating !== null ? `${filters.minRating}★+` : 'Rating';

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        style={styles.bar}
      >
        {/* Open Now chip */}
        <TouchableOpacity
          style={[styles.chip, filters.openNow && styles.chipActive]}
          onPress={handleOpenNow}
        >
          <Text style={[styles.chipText, filters.openNow && styles.chipTextActive]}>
            🟢 Open Now
          </Text>
        </TouchableOpacity>

        {/* Rating chip */}
        <TouchableOpacity
          style={[styles.chip, filters.minRating !== null && styles.chipActive]}
          onPress={() => setShowRating(true)}
        >
          <Text style={[styles.chipText, filters.minRating !== null && styles.chipTextActive]}>
            ⭐ {ratingLabel}
          </Text>
        </TouchableOpacity>

        {/* Radius chip */}
        <TouchableOpacity
          style={[styles.chip, styles.chipRadius]}
          onPress={() => setShowRadius(true)}
        >
          <Text style={styles.chipText}>📍 {radiusLabel}</Text>
        </TouchableOpacity>

        {/* Clear all */}
        {(filters.openNow || filters.minRating !== null) && (
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={() => { setFilters({ openNow: false, minRating: null }); applyFilters(); }}
          >
            <Text style={styles.clearText}>✕ Clear</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Radius picker modal */}
      <PickerModal
        visible={showRadius}
        title="Search Radius"
        options={RADIUS_OPTIONS.map((r) => ({ label: r.label, value: r.value }))}
        selected={filters.radiusMetres}
        onSelect={handleRadius}
        onClose={() => setShowRadius(false)}
      />

      {/* Rating picker modal */}
      <PickerModal
        visible={showRating}
        title="Minimum Rating"
        options={[
          { label: 'Any rating', value: null as unknown as number },
          ...RATING_OPTIONS,
        ]}
        selected={filters.minRating as number}
        onSelect={handleRating}
        onClose={() => setShowRating(false)}
      />
    </>
  );
};

// ---------- Generic option picker modal ----------

interface PickerOption {
  label: string;
  value: number;
}

interface PickerModalProps {
  visible: boolean;
  title: string;
  options: PickerOption[];
  selected: number | null;
  onSelect: (v: number) => void;
  onClose: () => void;
}

const PickerModal: React.FC<PickerModalProps> = ({
  visible, title, options, selected, onSelect, onClose,
}) => (
  <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
    <TouchableOpacity style={styles.overlay} onPress={onClose} activeOpacity={1}>
      <SafeAreaView style={styles.sheet}>
        <Text style={styles.sheetTitle}>{title}</Text>
        {options.map((opt) => (
          <TouchableOpacity
            key={String(opt.value)}
            style={[styles.option, selected === opt.value && styles.optionSelected]}
            onPress={() => onSelect(opt.value)}
          >
            <Text style={[styles.optionText, selected === opt.value && styles.optionTextSelected]}>
              {opt.label}
            </Text>
            {selected === opt.value && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
        ))}
      </SafeAreaView>
    </TouchableOpacity>
  </Modal>
);

// -------- Styles --------

const styles = StyleSheet.create({
  bar: { maxHeight: 56, backgroundColor: 'transparent' },
  scroll: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, gap: SPACING.sm },
  chip: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.full,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipRadius: {},
  chipText: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  chipTextActive: { color: COLORS.surface },
  clearBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.border,
  },
  clearText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },

  // Modal
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  optionSelected: {},
  optionText: { fontSize: 16, color: COLORS.textPrimary },
  optionTextSelected: { color: COLORS.primary, fontWeight: '700' },
  checkmark: { fontSize: 16, color: COLORS.primary, fontWeight: '700' },
});
