// ============================================================
// ProfileScreen — User Coffee Passport & Settings
// ============================================================

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS } from '@constants';
import { useStore } from '@store/useStore';

export const ProfileScreen: React.FC = () => {
  const favorites = useStore((s) => s.favorites);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>👤 Coffee Passport</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeEmoji}>👨🏻‍💼</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>Specialty Coffee Lover</Text>
            <Text style={styles.userCity}>📍 Metro Manila, Philippines</Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Spots Visited</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{favorites.length}</Text>
            <Text style={styles.statLabel}>Saved Cafés</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>4</Text>
            <Text style={styles.statLabel}>Loyalty Cards</Text>
          </View>
        </View>

        {/* Preferred Brew Methods */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>☕ Preferred Brew Methods</Text>
          <View style={styles.chipsRow}>
            {['V60 Pour-Over', 'Aeropress', 'Flat White', 'Cold Drip', 'Single Origin'].map(
              (brew) => (
                <View key={brew} style={styles.brewChip}>
                  <Text style={styles.brewChipText}>{brew}</Text>
                </View>
              ),
            )}
          </View>
        </View>

        {/* WFC Remote Work Perks */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>💻 WFC Work Preferences</Text>
          <View style={styles.perkRow}>
            <Text style={styles.perkIcon}>⚡</Text>
            <Text style={styles.perkText}>Prefers Power Outlets Near Tables</Text>
          </View>
          <View style={styles.perkRow}>
            <Text style={styles.perkIcon}>📶</Text>
            <Text style={styles.perkText}>High Speed Verified Wi-Fi (100 Mbps+)</Text>
          </View>
          <View style={styles.perkRow}>
            <Text style={styles.perkIcon}>🔵</Text>
            <Text style={styles.perkText}>GCash / QRPh Cashless Payments</Text>
          </View>
        </View>
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
  scrollContent: {
    padding: SPACING.md,
    gap: SPACING.md,
    paddingBottom: 40,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.md,
  },
  avatarLarge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EFE7DE',
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLargeEmoji: {
    fontSize: 32,
  },
  userInfo: {
    flex: 1,
    gap: 3,
  },
  userName: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  userCity: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md - 2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  brewChip: {
    backgroundColor: '#F3ECE1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  brewChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4A3423',
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: 3,
  },
  perkIcon: {
    fontSize: 15,
    width: 22,
    textAlign: 'center',
  },
  perkText: {
    fontSize: 13,
    color: COLORS.textPrimary,
  },
});
