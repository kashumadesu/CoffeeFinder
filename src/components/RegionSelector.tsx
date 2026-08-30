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
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, REGION_HUBS } from '@constants';
import { useStore } from '@store/useStore';
import { hapticSuccess, hapticSelection } from '@utils/haptics';
import type { RegionHub } from '@types';

export const RegionSelector: React.FC = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const currentRegion = useStore((s) => s.currentRegion);
  const setRegion = useStore((s) => s.setRegion);
  const downloadTrekPack = useStore((s) => s.downloadTrekPack);
  const isTrekPackDownloaded = useStore((s) => s.isTrekPackDownloaded);

  const handleSelect = (hub: RegionHub) => {
    hapticSelection();
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
              const isDownloaded = isTrekPackDownloaded(hub.id);

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

                  <View style={styles.hubRightCol}>
                    {isDownloaded ? (
                      <View style={styles.downloadedBadge}>
                        <Feather name="check" size={11} color={COLORS.verified} />
                        <Text style={styles.downloadedBadgeText}>Offline Ready</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.downloadActionBtn}
                        onPress={(e) => {
                          e.stopPropagation();
                          downloadTrekPack(hub);
                          hapticSuccess();
                          Alert.alert(
                            'Trek Pack Downloaded',
                            `Downloaded 100% offline map, café menus, and road navigation for ${hub.name}.`,
                          );
                        }}
                        activeOpacity={0.7}
                      >
                        <Feather name="download-cloud" size={11} color={COLORS.primary} />
                        <Text style={styles.downloadActionText}>Save Pack</Text>
                      </TouchableOpacity>
                    )}

                    {isSelected && <Feather name="check-circle" size={16} color={COLORS.primary} />}
                  </View>
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
  hubRightCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  downloadedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF4EE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    gap: 3,
    borderWidth: 1,
    borderColor: '#C6E4D0',
  },
  downloadedBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: COLORS.verified,
  },
  downloadActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSage,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    gap: 3,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
  },
  downloadActionText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: COLORS.primary,
  },
});
