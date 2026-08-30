// ============================================================
// NavigationAssistant — Google Maps-Style Turn-by-Turn Guidance HUD
// Multi-Modal: Walk (🚶), Motor (🏍️), 4-Wheels (🚗), Rail (🚆)
// ============================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '@constants';
import { hapticLight, hapticSelection } from '@utils/haptics';
import type { CoffeeShop, NavigationRoute, NavigationStep, NavigationMode } from '@types';

interface Props {
  shop: CoffeeShop;
  route: NavigationRoute | null;
  navigationMode: NavigationMode;
  onModeChange: (mode: NavigationMode) => void;
  onEndNavigation: () => void;
  onRecenter: () => void;
  onViewShopDetail: () => void;
}

/** Get clean Feather icon name for a given maneuver */
function getManeuverIcon(maneuver: string, instruction?: string): keyof typeof Feather.glyphMap {
  const m = (maneuver || '').toLowerCase();
  const inst = (instruction || '').toLowerCase();

  if (inst.includes('mrt') || inst.includes('lrt') || inst.includes('train') || inst.includes('rail')) {
    return 'git-commit';
  }
  if (m.includes('right')) return 'corner-up-right';
  if (m.includes('left')) return 'corner-up-left';
  if (m.includes('roundabout') || m.includes('rotary')) return 'rotate-cw';
  if (m.includes('uturn')) return 'rotate-ccw';
  if (m.includes('arrive') || m.includes('destination')) return 'flag';
  return 'arrow-up';
}

const MODES: { id: NavigationMode; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { id: 'walking', label: 'Walk', icon: 'navigation' },
  { id: 'motorcycle', label: 'Motor', icon: 'zap' },
  { id: 'driving', label: 'Car', icon: 'compass' },
  { id: 'transit', label: 'Train', icon: 'layers' },
];

export const NavigationAssistant: React.FC<Props> = ({
  shop,
  route,
  navigationMode,
  onModeChange,
  onEndNavigation,
  onRecenter,
  onViewShopDetail,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepsModalVisible, setStepsModalVisible] = useState(false);

  const steps = route?.steps ?? [];
  const currentStep: NavigationStep | undefined = steps[currentStepIndex] || steps[0];
  const nextStep: NavigationStep | undefined = steps[currentStepIndex + 1];

  const handleNextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      hapticSelection();
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      hapticSelection();
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const iconName = getManeuverIcon(currentStep?.maneuver ?? 'straight', currentStep?.instruction);

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Top Turn-by-Turn Guidance Card (Google Maps Green Header) */}
      <View style={styles.topCard}>
        <View style={styles.turnRow}>
          {/* Big Maneuver Icon Circle */}
          <View style={styles.turnIconCircle}>
            <Feather name={iconName} size={28} color="#FFFFFF" />
          </View>

          {/* Turn Instruction Text */}
          <View style={styles.instructionCol}>
            <Text style={styles.distanceToTurn}>
              {currentStep?.distanceText ? `In ${currentStep.distanceText}` : 'Follow route'}
            </Text>
            <Text style={styles.instructionText} numberOfLines={2}>
              {currentStep?.instruction || `Proceed to ${shop.name}`}
            </Text>
            {nextStep && (
              <Text style={styles.nextStepHint} numberOfLines={1}>
                Then: {nextStep.instruction}
              </Text>
            )}
          </View>

          {/* Step Navigation Arrows */}
          {steps.length > 1 && (
            <View style={styles.stepArrowsCol}>
              <TouchableOpacity
                style={[styles.stepArrowBtn, currentStepIndex === 0 && styles.stepArrowDisabled]}
                onPress={handlePrevStep}
                disabled={currentStepIndex === 0}
              >
                <Feather name="chevron-up" size={16} color={currentStepIndex === 0 ? 'rgba(255,255,255,0.3)' : '#FFFFFF'} />
              </TouchableOpacity>
              <Text style={styles.stepFractionText}>
                {currentStepIndex + 1}/{steps.length}
              </Text>
              <TouchableOpacity
                style={[styles.stepArrowBtn, currentStepIndex === steps.length - 1 && styles.stepArrowDisabled]}
                onPress={handleNextStep}
                disabled={currentStepIndex === steps.length - 1}
              >
                <Feather name="chevron-down" size={16} color={currentStepIndex === steps.length - 1 ? 'rgba(255,255,255,0.3)' : '#FFFFFF'} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Bottom Floating Navigation HUD & Controls */}
      <View style={styles.bottomBar}>
        {/* Top Info Row: ETA, Distance, and Actions */}
        <View style={styles.bottomTopRow}>
          <View style={styles.etaLeftCol}>
            <Text style={styles.etaTime}>
              {route ? route.durationText : 'Calculating…'}
            </Text>
            <Text style={styles.etaSub} numberOfLines={1}>
              {route ? `${route.distanceText} • to ${shop.name}` : shop.name}
            </Text>
          </View>

          {/* Right Action Icons */}
          <View style={styles.actionsRow}>
            {/* View All Steps Button */}
            {steps.length > 0 && (
              <TouchableOpacity
                style={styles.actionCircleBtn}
                onPress={() => {
                  hapticLight();
                  setStepsModalVisible(true);
                }}
              >
                <Feather name="list" size={16} color={COLORS.primary} />
              </TouchableOpacity>
            )}

            {/* Recenter Route Button */}
            <TouchableOpacity style={styles.actionCircleBtn} onPress={onRecenter}>
              <Feather name="crosshair" size={16} color={COLORS.primary} />
            </TouchableOpacity>

            {/* End Navigation Button */}
            <TouchableOpacity style={styles.endBtn} onPress={onEndNavigation}>
              <Feather name="x" size={15} color="#FFFFFF" />
              <Text style={styles.endBtnText}>End</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 4-Way Multi-Modal Transport Switcher (Walk / Motor / Car / Train) */}
        <View style={styles.modeToggleRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.modeScrollContent}
          >
            {MODES.map((m) => {
              const isActive = navigationMode === m.id;
              return (
                <TouchableOpacity
                  key={m.id}
                  style={[styles.modePill, isActive && styles.modePillActive]}
                  onPress={() => {
                    hapticSelection();
                    onModeChange(m.id);
                  }}
                  activeOpacity={0.8}
                >
                  <Feather
                    name={m.icon}
                    size={12}
                    color={isActive ? '#FFFFFF' : COLORS.textSecondary}
                  />
                  <Text style={[styles.modePillText, isActive && styles.modePillTextActive]}>
                    {m.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>

      {/* Full Step-by-Step Maneuver List Modal */}
      <Modal
        visible={stepsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setStepsModalVisible(false)}
      >
        <SafeAreaView style={styles.modalSafe} edges={['top', 'bottom']}>
          <View style={styles.modalSheet}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Turn-by-Turn Directions</Text>
                <Text style={styles.modalSubTitle}>
                  Routing to {shop.name} ({route?.durationText || '8 mins'} • {route?.distanceText || '1.2 km'})
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setStepsModalVisible(false)}
              >
                <Feather name="x" size={20} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Steps List */}
            <FlatList
              data={steps}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.stepsListContent}
              renderItem={({ item, index }) => {
                const isCurrent = index === currentStepIndex;
                const mIcon = getManeuverIcon(item.maneuver, item.instruction);
                return (
                  <TouchableOpacity
                    style={[styles.stepListItem, isCurrent && styles.stepListItemActive]}
                    onPress={() => {
                      setCurrentStepIndex(index);
                      setStepsModalVisible(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.stepListIconCircle, isCurrent && styles.stepListIconCircleActive]}>
                      <Feather
                        name={mIcon}
                        size={18}
                        color={isCurrent ? '#FFFFFF' : COLORS.primary}
                      />
                    </View>
                    <View style={styles.stepListTextCol}>
                      <Text style={[styles.stepListInstruction, isCurrent && styles.stepListInstructionActive]}>
                        {item.instruction}
                      </Text>
                      <Text style={styles.stepListMeta}>
                        {item.distanceText} • {item.durationText}
                      </Text>
                    </View>
                    {isCurrent && (
                      <View style={styles.activeStepBadge}>
                        <Text style={styles.activeStepBadgeText}>Current</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    zIndex: 100,
  },
  // Top Turn-by-Turn Assistant Banner (Google Maps Dark Green)
  topCard: {
    marginTop: Platform.OS === 'ios' ? 52 : 40,
    marginHorizontal: SPACING.md,
    backgroundColor: '#1B3828', // Dark Forest Green
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  turnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  turnIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionCol: {
    flex: 1,
  },
  distanceToTurn: {
    fontSize: 12,
    fontWeight: '800',
    color: '#9FE8B4', // Mint green highlight
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  instructionText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
    lineHeight: 19,
  },
  nextStepHint: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  stepArrowsCol: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: RADIUS.md,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  stepArrowBtn: {
    padding: 2,
  },
  stepArrowDisabled: {
    opacity: 0.4,
  },
  stepFractionText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    marginVertical: 1,
  },
  // Bottom ETA HUD Banner
  bottomBar: {
    marginBottom: Platform.OS === 'ios' ? 24 : 16,
    marginHorizontal: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    gap: 8,
  },
  bottomTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  etaLeftCol: {
    flex: 1,
  },
  etaTime: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
  },
  etaSub: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  modeToggleRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: 8,
  },
  modeScrollContent: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  modePillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  modePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  modePillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF5F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  endBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.danger,
    borderRadius: RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  endBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Modal Styles
  modalSafe: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  modalSubTitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepsListContent: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  stepListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.md,
    gap: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  stepListItemActive: {
    backgroundColor: '#EFF5F1',
    borderBottomColor: 'transparent',
  },
  stepListIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFE7DE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepListIconCircleActive: {
    backgroundColor: COLORS.primary,
  },
  stepListTextCol: {
    flex: 1,
  },
  stepListInstruction: {
    fontSize: 13.5,
    fontWeight: '600',
    color: COLORS.textPrimary,
    lineHeight: 18,
  },
  stepListInstructionActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  stepListMeta: {
    fontSize: 11.5,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  activeStepBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  activeStepBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
