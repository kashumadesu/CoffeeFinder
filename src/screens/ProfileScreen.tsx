// ============================================================
// ProfileScreen — Coffee Passport, Badges & Authentication
// ============================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, REGION_HUBS } from '@constants';
import { useStore } from '@store/useStore';

interface PassportStamp {
  id: string;
  region: string;
  island: string;
  unlocked: boolean;
  cafesCount: number;
}

export const ProfileScreen: React.FC = () => {
  const favorites = useStore((s) => s.favorites);

  // Authentication State (Simulated Firebase Auth)
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [userName, setUserName] = useState('Specialty Coffee Lover');

  // Coffee Passport Regional Stamps
  const stamps: PassportStamp[] = [
    { id: 'manila', region: 'Metro Manila', island: 'Luzon', unlocked: true, cafesCount: 3 },
    { id: 'sagada', region: 'Sagada Highlands', island: 'Cordillera', unlocked: true, cafesCount: 1 },
    { id: 'benguet', region: 'Baguio & Benguet', island: 'Luzon', unlocked: false, cafesCount: 0 },
    { id: 'cebu', region: 'Cebu City', island: 'Visayas', unlocked: false, cafesCount: 0 },
    { id: 'siargao', region: 'Siargao Island', island: 'Mindanao', unlocked: true, cafesCount: 1 },
  ];

  const handleSocialLogin = (provider: 'Google' | 'Apple' | 'Facebook') => {
    // Simulated Social Login
    setUserName(provider === 'Apple' ? 'Apple ID Coffee Explorer' : `${provider} Coffee Explorer`);
    setIsLoggedIn(true);
    setAuthModalVisible(false);
    Alert.alert('Signed In', `Welcome back! Connected via ${provider}. Your saved cafes and passport stamps are synced.`);
  };

  const handleEmailAuth = () => {
    if (!authEmail.trim()) {
      Alert.alert('Input Error', 'Please enter your email address.');
      return;
    }
    setUserName(authEmail.split('@')[0]);
    setIsLoggedIn(true);
    setAuthModalVisible(false);
    Alert.alert('Account Active', `Logged in as ${authEmail}.`);
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => {
          setIsLoggedIn(false);
          setUserName('Specialty Coffee Lover');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Feather name="user" size={20} color={COLORS.primary} />
          <Text style={styles.headerTitle}>Coffee Passport & Profile</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarLarge}>
            <Feather name="user" size={32} color={COLORS.primary} />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{userName}</Text>
            <View style={styles.locationRow}>
              <Feather name="map-pin" size={12} color={COLORS.textSecondary} />
              <Text style={styles.userCity}>Metro Manila, Philippines</Text>
            </View>
            {isLoggedIn ? (
              <View style={styles.verifiedRow}>
                <Feather name="check-circle" size={12} color={COLORS.verified} />
                <Text style={styles.syncStatus}>Account Synced</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.signInPill}
                onPress={() => setAuthModalVisible(true)}
                activeOpacity={0.8}
              >
                <Feather name="log-in" size={12} color="#FFFFFF" />
                <Text style={styles.signInPillText}>Sign In / Sync</Text>
              </TouchableOpacity>
            )}
          </View>
          {isLoggedIn && (
            <TouchableOpacity onPress={handleSignOut} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Feather name="log-out" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>5</Text>
            <Text style={styles.statLabel}>Spots Visited</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{favorites.length}</Text>
            <Text style={styles.statLabel}>Saved Cafés</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>3</Text>
            <Text style={styles.statLabel}>Stamps Earned</Text>
          </View>
        </View>

        {/* Coffee Passport Regional Stamps */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderLeft}>
              <Feather name="award" size={16} color={COLORS.primary} />
              <Text style={styles.cardTitle}>Philippine Coffee Passport</Text>
            </View>
            <Text style={styles.cardSubCount}>3 / 5 Unlocked</Text>
          </View>
          <Text style={styles.passportDesc}>
            Earn digital stamps by checking in and reviewing specialty cafés across regions:
          </Text>

          <View style={styles.stampsGrid}>
            {stamps.map((stamp) => (
              <View
                key={stamp.id}
                style={[
                  styles.stampItem,
                  stamp.unlocked ? styles.stampUnlocked : styles.stampLocked,
                ]}
              >
                <View
                  style={[
                    styles.stampIconCircle,
                    stamp.unlocked ? styles.stampCircleActive : styles.stampCircleLocked,
                  ]}
                >
                  <Feather
                    name={stamp.unlocked ? 'check' : 'lock'}
                    size={16}
                    color={stamp.unlocked ? '#FFFFFF' : COLORS.textMuted}
                  />
                </View>
                <Text style={styles.stampRegionName} numberOfLines={1}>
                  {stamp.region}
                </Text>
                <Text style={styles.stampIsland}>{stamp.island}</Text>
                <Text style={styles.stampCount}>
                  {stamp.unlocked ? `${stamp.cafesCount} cafés logged` : 'Locked'}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Explorer Badges */}
        <View style={styles.card}>
          <View style={styles.cardHeaderLeft}>
            <Feather name="shield" size={16} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Curator Badges</Text>
          </View>

          <View style={styles.badgesRow}>
            <View style={styles.badgeItem}>
              <View style={styles.badgeIconCircle}>
                <Feather name="coffee" size={18} color={COLORS.primary} />
              </View>
              <Text style={styles.badgeName}>Pour Over Pilgrim</Text>
              <Text style={styles.badgeSub}>3 Single Origins</Text>
            </View>

            <View style={styles.badgeItem}>
              <View style={styles.badgeIconCircle}>
                <Feather name="compass" size={18} color={COLORS.primary} />
              </View>
              <Text style={styles.badgeName}>Highland Scout</Text>
              <Text style={styles.badgeSub}>Visited Sagada</Text>
            </View>

            <View style={styles.badgeItem}>
              <View style={styles.badgeIconCircle}>
                <Feather name="zap" size={18} color={COLORS.primary} />
              </View>
              <Text style={styles.badgeName}>WFC Pro</Text>
              <Text style={styles.badgeSub}>5 Outlets Verified</Text>
            </View>
          </View>
        </View>

        {/* Preferred Brew Methods */}
        <View style={styles.card}>
          <View style={styles.cardHeaderLeft}>
            <Feather name="sliders" size={16} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Preferred Brew Methods</Text>
          </View>
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

        {/* WFC Work Preferences */}
        <View style={styles.card}>
          <View style={styles.cardHeaderLeft}>
            <Feather name="wifi" size={16} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Work-From-Café Preferences</Text>
          </View>
          <View style={styles.perkRow}>
            <Feather name="zap" size={15} color={COLORS.primary} />
            <Text style={styles.perkText}>Prefers Power Outlets Near Tables</Text>
          </View>
          <View style={styles.perkRow}>
            <Feather name="wifi" size={15} color={COLORS.primary} />
            <Text style={styles.perkText}>High Speed Verified Wi-Fi (100 Mbps+)</Text>
          </View>
          <View style={styles.perkRow}>
            <View style={styles.gcashDot} />
            <Text style={styles.perkText}>GCash / QRPh Cashless Payments</Text>
          </View>
        </View>
      </ScrollView>

      {/* Social Login / Firebase Auth Modal */}
      <Modal
        visible={authModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAuthModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.authModalCard}>
            <View style={styles.authModalHeader}>
              <Text style={styles.authModalTitle}>Sign In to Coffee Finder</Text>
              <TouchableOpacity onPress={() => setAuthModalVisible(false)}>
                <Feather name="x" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.authModalSubtitle}>
              Sync your saved spots, coffee passport stamps, and reviews across your devices.
            </Text>

            {/* Social Buttons */}
            <View style={styles.socialBtnGroup}>
              {/* Apple Sign In */}
              <TouchableOpacity
                style={styles.appleBtn}
                onPress={() => handleSocialLogin('Apple')}
                activeOpacity={0.85}
              >
                <Feather name="command" size={16} color="#FFFFFF" />
                <Text style={styles.appleBtnText}>Continue with Apple ID</Text>
              </TouchableOpacity>

              {/* Google Sign In */}
              <TouchableOpacity
                style={styles.googleBtn}
                onPress={() => handleSocialLogin('Google')}
                activeOpacity={0.85}
              >
                <Feather name="mail" size={16} color="#333333" />
                <Text style={styles.googleBtnText}>Continue with Google</Text>
              </TouchableOpacity>

              {/* Facebook Login */}
              <TouchableOpacity
                style={styles.facebookBtn}
                onPress={() => handleSocialLogin('Facebook')}
                activeOpacity={0.85}
              >
                <Feather name="facebook" size={16} color="#FFFFFF" />
                <Text style={styles.facebookBtnText}>Continue with Facebook</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or email</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Email/Password Input */}
            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor={COLORS.textMuted}
              value={authEmail}
              onChangeText={setAuthEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={COLORS.textMuted}
              value={authPassword}
              onChangeText={setAuthPassword}
              secureTextEntry
            />

            <TouchableOpacity
              style={styles.emailSubmitBtn}
              onPress={handleEmailAuth}
              activeOpacity={0.85}
            >
              <Text style={styles.emailSubmitText}>Sign In / Register</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
  },
  scrollContent: {
    padding: SPACING.md,
    gap: SPACING.md,
    paddingBottom: 90,
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
    backgroundColor: COLORS.surfaceSage,
    borderWidth: 2,
    borderColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
    gap: 3,
  },
  userName: {
    fontSize: 16.5,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  userCity: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  syncStatus: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.verified,
  },
  signInPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  signInPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
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
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  cardSubCount: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  passportDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 17,
  },
  stampsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs + 2,
    marginTop: 4,
  },
  stampItem: {
    width: '48%',
    padding: 10,
    borderRadius: RADIUS.sm,
    borderWidth: 1.2,
    alignItems: 'center',
    gap: 3,
  },
  stampUnlocked: {
    backgroundColor: '#FAF5ED',
    borderColor: '#E8DBC8',
  },
  stampLocked: {
    backgroundColor: COLORS.background,
    borderColor: COLORS.border,
    opacity: 0.7,
  },
  stampIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  stampCircleActive: {
    backgroundColor: COLORS.primary,
  },
  stampCircleLocked: {
    backgroundColor: COLORS.border,
  },
  stampRegionName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  stampIsland: {
    fontSize: 10.5,
    color: COLORS.textSecondary,
  },
  stampCount: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: 2,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: 2,
  },
  badgeItem: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.sm,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 2,
  },
  badgeIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceSage,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  badgeName: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  badgeSub: {
    fontSize: 9.5,
    color: COLORS.textSecondary,
    textAlign: 'center',
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
  perkText: {
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  gcashDot: {
    width: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: COLORS.gcash,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    padding: SPACING.md,
  },
  authModalCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  authModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  authModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  authModalSubtitle: {
    fontSize: 12.5,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: SPACING.xs,
  },
  socialBtnGroup: {
    gap: SPACING.xs + 4,
  },
  appleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    gap: 8,
  },
  appleBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    borderWidth: 1.2,
    borderColor: COLORS.border,
    gap: 8,
  },
  googleBtnText: {
    color: '#333333',
    fontSize: 13.5,
    fontWeight: '700',
  },
  facebookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1877F2',
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    gap: 8,
  },
  facebookBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.borderLight,
  },
  dividerText: {
    fontSize: 11,
    color: COLORS.textMuted,
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
  },
  emailSubmitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  emailSubmitText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
