// ============================================================
// OwnerPortalScreen — Shop Owner SaaS Portal
// ============================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS } from '@constants';
import { useStore } from '@store/useStore';
import type { LiveSeatingStatus } from '@types';

export const OwnerPortalScreen: React.FC = () => {
  const shops = useStore((s) => s.shops);
  const updateShopLiveStatus = useStore((s) => s.updateShopLiveStatus);

  const [selectedShopId, setSelectedShopId] = useState(
    shops[0]?.id ?? 'ph-chapter-coffee',
  );
  const [seatingStatus, setSeatingStatus] = useState<LiveSeatingStatus>('moderate');
  const [wifiSpeed, setWifiSpeed] = useState('Fast (250 Mbps+ verified)');
  const [loyaltyStamps, setLoyaltyStamps] = useState('Buy 9 coffees, get 1 free!');

  const activeShop = shops.find((s) => s.id === selectedShopId) ?? shops[0];

  const handleSave = () => {
    if (activeShop) {
      updateShopLiveStatus(activeShop.id, seatingStatus, wifiSpeed);
      Alert.alert(
        'Status Broadcasted! 🚀',
        `Live seating (${seatingStatus}) and Wi-Fi metrics for "${activeShop.name}" are now visible to all coffee seekers in real time.`,
      );
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🏪 Owner Portal (SaaS)</Text>
        <Text style={styles.headerSubtitle}>
          Live status manager & digital loyalty stamps
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Managed Shop Selector */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Select Your Café</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.shopSelector}>
            {shops.slice(0, 5).map((shop) => {
              const isSelected = shop.id === selectedShopId;
              return (
                <TouchableOpacity
                  key={shop.id}
                  style={[styles.shopChip, isSelected && styles.shopChipActive]}
                  onPress={() => setSelectedShopId(shop.id)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.shopChipText, isSelected && styles.shopChipTextActive]}>
                    {shop.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Live Seating Status Broadcast */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>🟢 Broadcast Live Seating</Text>
          <Text style={styles.helperText}>
            Help remote workers and coffee lovers see current table availability:
          </Text>

          <View style={styles.statusButtonsRow}>
            <TouchableOpacity
              style={[
                styles.statusBtn,
                seatingStatus === 'available' && styles.statusBtnAvailable,
              ]}
              onPress={() => setSeatingStatus('available')}
            >
              <Text style={styles.statusEmoji}>🟢</Text>
              <Text style={styles.statusBtnTitle}>Plenty</Text>
              <Text style={styles.statusBtnSub}>Seats Open</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.statusBtn,
                seatingStatus === 'moderate' && styles.statusBtnModerate,
              ]}
              onPress={() => setSeatingStatus('moderate')}
            >
              <Text style={styles.statusEmoji}>🟡</Text>
              <Text style={styles.statusBtnTitle}>Moderate</Text>
              <Text style={styles.statusBtnSub}>50% Full</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.statusBtn,
                seatingStatus === 'full' && styles.statusBtnFull,
              ]}
              onPress={() => setSeatingStatus('full')}
            >
              <Text style={styles.statusEmoji}>🔴</Text>
              <Text style={styles.statusBtnTitle}>Busy</Text>
              <Text style={styles.statusBtnSub}>Few Left</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Wi-Fi Speed Metric */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>📶 Verified Wi-Fi Speed</Text>
          <TextInput
            style={styles.input}
            value={wifiSpeed}
            onChangeText={setWifiSpeed}
            placeholder="e.g. Fast (200 Mbps+ verified)"
          />
        </View>

        {/* Loyalty Stamp Promo */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>🎫 Digital Loyalty Stamp Card</Text>
          <TextInput
            style={styles.input}
            value={loyaltyStamps}
            onChangeText={setLoyaltyStamps}
            placeholder="e.g. Buy 9 cups, get 1 free pour-over"
          />
        </View>

        {/* Save & Broadcast CTA */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.88}>
          <Text style={styles.saveBtnText}>Broadcast Live Updates</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
  },
  headerSubtitle: {
    fontSize: 12.5,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  scrollContent: {
    padding: SPACING.md,
    gap: SPACING.md,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.xs + 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  helperText: {
    fontSize: 12.5,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  shopSelector: {
    marginTop: SPACING.xs,
  },
  shopChip: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    marginRight: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  shopChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  shopChipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  shopChipTextActive: {
    color: '#FFFFFF',
  },
  statusButtonsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  statusBtn: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.sm,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  statusBtnAvailable: {
    backgroundColor: '#E8F6ED',
    borderColor: '#27AE60',
  },
  statusBtnModerate: {
    backgroundColor: '#FEF8E7',
    borderColor: '#F39C12',
  },
  statusBtnFull: {
    backgroundColor: '#FDEDEC',
    borderColor: '#E74C3C',
  },
  statusEmoji: {
    fontSize: 14,
  },
  statusBtnTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  statusBtnSub: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 10,
    fontSize: 13,
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
