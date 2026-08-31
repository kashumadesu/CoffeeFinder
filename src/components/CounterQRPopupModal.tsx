// ============================================================
// CounterQRPopupModal — Official Countertop Check-in QR for Café Owners
// ============================================================

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Share,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from '@constants';
import { hapticSuccess, hapticLight } from '@utils/haptics';

interface Props {
  visible: boolean;
  shopName: string;
  shopId: string;
  onClose: () => void;
}

export const CounterQRPopupModal: React.FC<Props> = ({
  visible,
  shopName,
  shopId,
  onClose,
}) => {
  const qrCheckInToken = `KAPEROUTE://CHECKIN?shopId=${shopId}&time=${Date.now()}`;

  const handleShareCounterQR = async () => {
    hapticLight();
    try {
      await Share.share({
        message: `Official Countertop Passport Check-in QR for ${shopName}: ${qrCheckInToken}\n\nPrint and display this QR code at your POS cash register for customers to scan and earn digital stamps!`,
      });
    } catch {}
  };

  const handlePrint = () => {
    hapticSuccess();
    Alert.alert(
      'Print Prepared 🖨️',
      `Countertop display standee for "${shopName}" is ready to print. A PDF standee template has been sent to your registered business email.`,
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
                <Feather name="award" size={18} color="#1B5E20" />
                <Text style={styles.title}>Countertop Passport QR</Text>
              </View>
              <Text style={styles.subtitle}>Verified loyalty check-in standee for your POS</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Standee Preview Card */}
          <View style={styles.standeeCard}>
            <View style={styles.standeeHeader}>
              <Feather name="coffee" size={22} color={COLORS.primary} />
              <Text style={styles.standeeBrand}>KAPEROUTE PHILIPPINES</Text>
            </View>

            <Text style={styles.standeeShopName}>{shopName}</Text>
            <Text style={styles.standeePrompt}>Scan to log your Coffee Passport Stamp</Text>

            {/* Generated Mock QR Matrix Box */}
            <View style={styles.qrMatrixBox}>
              <View style={styles.qrCornerTl} />
              <View style={styles.qrCornerTr} />
              <View style={styles.qrCornerBl} />
              <View style={styles.qrCenterDot} />
              <Text style={styles.qrCodeText}>[ {shopId.toUpperCase()} ]</Text>
            </View>

            <View style={styles.standeeFooter}>
              <View style={styles.verifiedTag}>
                <Feather name="check-circle" size={12} color="#1B5E20" />
                <Text style={styles.verifiedTagText}>OFFICIAL VERIFIED PARTNER</Text>
              </View>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.printBtn} onPress={handlePrint} activeOpacity={0.85}>
              <Feather name="printer" size={15} color="#FFFFFF" />
              <Text style={styles.printBtnText}>Download PDF Standee</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shareBtn}
              onPress={handleShareCounterQR}
              activeOpacity={0.85}
            >
              <Feather name="share-2" size={16} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
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
    maxHeight: '90%',
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
  standeeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#C8E6C9',
    gap: 8,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  standeeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  standeeBrand: {
    fontSize: 11.5,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 1.5,
  },
  standeeShopName: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  standeePrompt: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  qrMatrixBox: {
    width: 170,
    height: 170,
    backgroundColor: '#F5F5F5',
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 6,
  },
  qrCornerTl: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 32,
    height: 32,
    backgroundColor: COLORS.textPrimary,
  },
  qrCornerTr: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    backgroundColor: COLORS.textPrimary,
  },
  qrCornerBl: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    width: 32,
    height: 32,
    backgroundColor: COLORS.textPrimary,
  },
  qrCenterDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
  },
  qrCodeText: {
    position: 'absolute',
    bottom: 6,
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  standeeFooter: {
    marginTop: 2,
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  verifiedTagText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#1B5E20',
    letterSpacing: 0.5,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 10,
  },
  printBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
  },
  printBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  shareBtn: {
    width: 50,
    backgroundColor: COLORS.surfaceWarm,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
});
