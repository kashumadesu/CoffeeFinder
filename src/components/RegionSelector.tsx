// ============================================================
// RegionSelector Component — Regional Coffee Hubs Switcher
// ============================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, REGION_HUBS } from '@constants';
import { useStore } from '@store/useStore';
import type { RegionHub } from '@types';

export const RegionSelector: React.FC = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const currentRegion = useStore((s) => s.currentRegion);
  const setRegion = useStore((s) => s.setRegion);

  const handleSelect = (hub: RegionHub) => {
    setRegion(hub);
    setModalVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        style={styles.pillBtn}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <Feather name="map-pin" size={12} color={COLORS.primary} />
        <Text style={styles.pillText}>{currentRegion.name}</Text>
        <Feather name="chevron-down" size={13} color={COLORS.textSecondary} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          onPress={() => setModalVisible(false)}
          activeOpacity={1}
        >
          <SafeAreaView style={styles.modalSheet}>
            <View style={styles.dragHandle} />
            <Text style={styles.modalTitle}>Explore Philippine Coffee Hubs</Text>
            <Text style={styles.modalSubtitle}>
              Browse specialty cafés and origin roasteries across the islands (100% Offline Ready):
            </Text>

            {REGION_HUBS.map((hub) => {
              const isSelected = hub.id === currentRegion.id;
              return (
                <TouchableOpacity
                  key={hub.id}
                  style={[styles.hubOption, isSelected && styles.hubOptionSelected]}
                  onPress={() => handleSelect(hub)}
                  activeOpacity={0.8}
                >
                  <View style={styles.hubInfo}>
                    <Text style={[styles.hubName, isSelected && styles.hubNameSelected]}>
                      {hub.name}
                    </Text>
                    <Text style={styles.hubIsland}>{hub.island}</Text>
                  </View>
                  {isSelected && <Feather name="check" size={16} color={COLORS.primary} />}
                </TouchableOpacity>
              );
            })}
          </SafeAreaView>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  pillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    borderWidth: 1.2,
    borderColor: COLORS.border,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    gap: 5,
  },
  pillText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.primary,
  },
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
    gap: SPACING.sm,
  },
  dragHandle: {
    width: 36,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: SPACING.xs,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  modalSubtitle: {
    fontSize: 12.5,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: SPACING.xs,
  },
  hubOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  hubOptionSelected: {
    backgroundColor: COLORS.surfaceSage,
  },
  hubInfo: {
    gap: 2,
  },
  hubName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  hubNameSelected: {
    color: COLORS.primary,
  },
  hubIsland: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
  },
});
