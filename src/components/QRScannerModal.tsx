// ============================================================
// QRScannerModal — Countertop Barista QR Passport Check-in
// ============================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from '@constants';
import { useStore } from '@store/useStore';
import { hapticSuccess, hapticSelection } from '@utils/haptics';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export const QRScannerModal: React.FC<Props> = ({ visible, onClose }) => {
  const shops = useStore((s) => s.shops);
  const addPassportCheckIn = useStore((s) => s.addPassportCheckIn);
  const [selectedDemoShop, setSelectedDemoShop] = useState(shops[0] || null);

  const handleSimulatedScan = (targetShop = selectedDemoShop) => {
    if (!targetShop) return;

    hapticSuccess();
    const isNew = addPassportCheckIn(
      targetShop.id,
      targetShop.name,
      targetShop.vicinity ?? 'Specialty Spot',
      'Luzon',
    );

    Alert.alert(
      isNew ? 'Stamp Unlocked! 🏆' : 'Check-in Recorded! ☕',
      `You've checked in at "${targetShop.name}". Your Philippine Coffee Passport has been stamped!`,
      [{ text: 'View Passport', onPress: onClose }],
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <View style={styles.headerTitleRow}>
                <Feather name="maximize" size={18} color={COLORS.primary} />
                <Text style={styles.title}>Scan Countertop QR</Text>
              </View>
              <Text style={styles.subtitle}>Scan the barista's counter QR to log your passport stamp</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Scanner Viewfinder Box */}
          <View style={styles.viewfinderContainer}>
            <View style={styles.viewfinderBox}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />

              <View style={styles.scannerCenter}>
                <Feather name="camera" size={32} color="rgba(255,255,255,0.7)" />
                <Text style={styles.scannerPrompt}>Align counter QR inside frame</Text>
              </View>

              {/* Animated Laser Line */}
              <View style={styles.laserLine} />
            </View>
          </View>

          {/* Demo / Rapid Check-in Selector */}
          <Text style={styles.sectionLabel}>Or Tap Counter Check-in (Nearby Cafés)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.shopsScroll}>
            {shops.slice(0, 4).map((shop) => (
              <TouchableOpacity
                key={shop.id}
                style={[
                  styles.shopPill,
                  selectedDemoShop?.id === shop.id && styles.shopPillActive,
                ]}
                onPress={() => {
                  hapticSelection();
                  setSelectedDemoShop(shop);
                  handleSimulatedScan(shop);
                }}
              >
                <Feather
                  name="check-circle"
                  size={12}
                  color={selectedDemoShop?.id === shop.id ? '#FFFFFF' : COLORS.primary}
                />
                <Text
                  style={[
                    styles.shopPillText,
                    selectedDemoShop?.id === shop.id && styles.shopPillTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {shop.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Scan Action Button */}
          <TouchableOpacity
            style={styles.scanActionBtn}
            onPress={() => handleSimulatedScan()}
            activeOpacity={0.85}
          >
            <Feather name="zap" size={16} color="#FFFFFF" />
            <Text style={styles.scanActionText}>
              Log Stamp at {selectedDemoShop?.name ?? 'Selected Café'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    padding: SPACING.md,
    maxHeight: '88%',
    gap: SPACING.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  viewfinderContainer: {
    height: 220,
    backgroundColor: '#1E1E1E',
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    marginVertical: 4,
  },
  viewfinderBox: {
    width: 170,
    height: 170,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  corner: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderColor: '#4CAF50',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  scannerCenter: {
    alignItems: 'center',
    gap: 8,
  },
  scannerPrompt: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },
  laserLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#00E676',
    top: '50%',
    shadowColor: '#00E676',
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  shopsScroll: {
    flexDirection: 'row',
  },
  shopPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceWarm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginRight: 6,
  },
  shopPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  shopPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    maxWidth: 130,
  },
  shopPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  scanActionBtn: {
    marginVertical: 12,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  scanActionText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
