import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '@constants';
import { useStore } from '@store/useStore';
import {
  loginWithEmail,
  registerWithEmail,
  logoutUser,
  subscribeToAuthChanges,
} from '@services/firebase';
import { promptGoogleSignIn } from '@services/googleAuth';
import { promptFacebookSignIn } from '@services/facebookAuth';
import { hapticSuccess, hapticMedium, hapticWarning, hapticLight } from '@utils/haptics';
import { PhotoPassportModal } from '@components/PhotoPassportModal';

const ADMIN_EMAILS = [
  'michaelapril81416@gmail.com',
  'admin@coffeefinder.ph',
  'kashumadesu@gmail.com',
];
const ADMIN_MASTER_PIN = '102403';

interface PassportStamp {
  id: string;
  region: string;
  island: string;
  unlocked: boolean;
  cafesCount: number;
}

export const ProfileScreen: React.FC = () => {
  const favorites = useStore((s) => s.favorites);
  const currentUser = useStore((s) => s.currentUser);
  const setCurrentUser = useStore((s) => s.setCurrentUser);

  // Claims & Verification Global Store Hooks
  const claimRequests = useStore((s) => s.claimRequests);
  const approveClaim = useStore((s) => s.approveClaim);
  const rejectClaim = useStore((s) => s.rejectClaim);
  const deleteClaim = useStore((s) => s.deleteClaim);
  const revokeClaim = useStore((s) => s.revokeClaim);
  const verifiedOwnerShopIds = useStore((s) => s.verifiedOwnerShopIds);
  const reviews = useStore((s) => s.reviews);
  const passportCheckIns = useStore((s) => s.passportCheckIns);
  const visitedShops = useStore((s) => s.visitedShops);
  const getRegionalRanks = useStore((s) => s.getRegionalRanks);
  const getNationalRank = useStore((s) => s.getNationalRank);
  const [photoPassportVisible, setPhotoPassportVisible] = useState(false);

  const nationalRank = getNationalRank();
  const regionalRanks = getRegionalRanks();

  // Administrator & Moderation Console State
  const isWhitelisted = !!(
    currentUser?.email && ADMIN_EMAILS.includes(currentUser.email.toLowerCase())
  );
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [adminPinModalVisible, setAdminPinModalVisible] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const hasAdminAccess = isWhitelisted || isAdminUnlocked;

  // Permit Claims Filter & Search
  const [claimSearchQuery, setClaimSearchQuery] = useState('');
  const [claimFilterStatus, setClaimFilterStatus] = useState<
    'all' | 'pending' | 'verified' | 'rejected'
  >('all');

  // Document Inspection Modal State
  const [previewDocUri, setPreviewDocUri] = useState<string | null>(null);

  // Authentication State (Firebase Spark Auth)
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [userName, setUserName] = useState('Specialty Coffee Lover');

  // Legal & Privacy Reader State
  const [legalModalVisible, setLegalModalVisible] = useState(false);
  const [legalModalType, setLegalModalType] = useState<'privacy' | 'terms'>('privacy');

  const handleOpenLegal = (type: 'privacy' | 'terms') => {
    setLegalModalType(type);
    setLegalModalVisible(true);
  };

  useEffect(() => {
    const unsub = subscribeToAuthChanges((u) => {
      setCurrentUser(u);
      if (u) {
        setIsLoggedIn(true);
        setUserName(u.displayName ?? u.email?.split('@')[0] ?? 'Coffee Explorer');
      } else {
        setIsLoggedIn(false);
      }
    });
    return () => unsub();
  }, [setCurrentUser]);

  // 8 Official Philippine Coffee Passport Regional Stamps
  const STAMP_REGIONS = [
    { id: 'manila', region: 'Metro Manila', island: 'Luzon', keywords: ['manila', 'quezon', 'makati', 'bgc', 'taguig', 'pasig', 'ortigas', 'san juan'] },
    { id: 'benguet', region: 'Baguio & Benguet', island: 'Luzon', keywords: ['baguio', 'benguet', 'la trinidad', 'atok'] },
    { id: 'sagada', region: 'Sagada & Mt. Province', island: 'Highlands', keywords: ['sagada', 'mountain province', 'bontoc'] },
    { id: 'la-union', region: 'La Union Surf Coast', island: 'Luzon', keywords: ['la union', 'san juan', 'elyu'] },
    { id: 'antipolo', region: 'Antipolo & Rizal Ridge', island: 'Luzon', keywords: ['antipolo', 'rizal', 'tanay', 'angono'] },
    { id: 'cebu', region: 'Cebu City & Visayas', island: 'Visayas', keywords: ['cebu', 'mandaue', 'it park'] },
    { id: 'iloilo', region: 'Iloilo City Heritage', island: 'Visayas', keywords: ['iloilo', 'jaro', 'mandurriao'] },
    { id: 'davao', region: 'Davao & Mt. Apo', island: 'Mindanao', keywords: ['davao', 'apo', 'matina', 'lanang'] },
  ];

  const stamps: PassportStamp[] = STAMP_REGIONS.map((r) => {
    const matchingFavorites = favorites.filter((f) => {
      const haystack = `${f.name} ${f.vicinity ?? ''} ${f.city ?? ''}`.toLowerCase();
      return r.keywords.some((kw) => haystack.includes(kw));
    });

    const matchingVisited = visitedShops.filter((v) => {
      const haystack = `${v.shopName} ${v.city ?? ''} ${v.regionId ?? ''}`.toLowerCase();
      return r.keywords.some((kw) => haystack.includes(kw)) || v.regionId === r.id;
    });

    const matchingCheckIns = passportCheckIns.filter((c) => {
      const haystack = `${c.shopName} ${c.region}`.toLowerCase();
      return r.keywords.some((kw) => haystack.includes(kw));
    });

    const totalLogged = Math.max(matchingVisited.length, matchingCheckIns.length, matchingFavorites.length);

    return {
      id: r.id,
      region: r.region,
      island: r.island,
      unlocked: totalLogged > 0,
      cafesCount: totalLogged,
    };
  });

  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      const { profile, error } = await promptGoogleSignIn();
      if (profile) {
        const name = profile.name || profile.email.split('@')[0];
        setUserName(name);
        setIsLoggedIn(true);
        setAuthModalVisible(false);
        hapticSuccess();
        Alert.alert(
          'Google Connected',
          `Welcome, ${name}! Signed in with Google (${profile.email}). Your passport stamps and saved cafés are synced.`,
        );
      } else if (error && error !== 'Cancelled by user') {
        Alert.alert('Google Sign-In', error);
      }
    } catch (err: any) {
      Alert.alert('Google Sign-In Error', err.message || 'Could not complete Google Sign-In.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const [isFacebookLoading, setIsFacebookLoading] = useState(false);

  const handleFacebookLogin = async () => {
    setIsFacebookLoading(true);
    try {
      const { profile, error } = await promptFacebookSignIn();
      if (profile) {
        const name = profile.name || 'Facebook User';
        setUserName(name);
        setIsLoggedIn(true);
        setAuthModalVisible(false);
        hapticSuccess();
        Alert.alert(
          'Facebook Connected',
          `Welcome, ${name}! Signed in with Facebook. Your passport stamps and saved cafés are synced.`,
        );
      } else if (error && error !== 'Cancelled by user') {
        Alert.alert('Facebook Login', error);
      }
    } catch (err: any) {
      Alert.alert('Facebook Login Error', err.message || 'Could not complete Facebook Login.');
    } finally {
      setIsFacebookLoading(false);
    }
  };

  const handleSocialLogin = (provider: 'Apple') => {
    Alert.alert(
      `${provider} Sign-In`,
      `${provider} Sign-In will activate automatically upon App Store submission with your Apple Developer Account.`,
    );
  };

  const handleEmailAuth = async () => {
    if (!authEmail.trim() || !authPassword.trim()) {
      Alert.alert('Input Error', 'Please enter your email and password.');
      return;
    }
    
    // Attempt Firebase sign in
    const res = await loginWithEmail(authEmail, authPassword);
    if (res.user) {
      setUserName(res.user.email?.split('@')[0] ?? 'Coffee Explorer');
      setIsLoggedIn(true);
      setAuthModalVisible(false);
      Alert.alert('Account Active', `Logged in via Firebase Auth as ${authEmail}.`);
      return;
    }

    // If account doesn't exist, register
    const signupRes = await registerWithEmail(authEmail, authPassword);
    if (signupRes.user) {
      setUserName(signupRes.user.email?.split('@')[0] ?? 'Coffee Explorer');
      setIsLoggedIn(true);
      setAuthModalVisible(false);
      Alert.alert('Account Created', `Free account registered for ${authEmail}!`);
      return;
    }

    // Fallback if offline/demo key
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
        onPress: async () => {
          await logoutUser();
          setIsLoggedIn(false);
          setUserName('Specialty Coffee Lover');
        },
      },
    ]);
  };

  const handleVerifyAdminPin = () => {
    if (enteredPin.trim() === ADMIN_MASTER_PIN) {
      hapticSuccess();
      setIsAdminUnlocked(true);
      setAdminPinModalVisible(false);
      setEnteredPin('');
      Alert.alert('Admin Access Granted', 'Moderation & Verification Console is now unlocked.');
    } else {
      hapticWarning();
      Alert.alert('Access Denied', 'The security PIN you entered is incorrect.');
    }
  };

  const handleLockAdmin = () => {
    hapticMedium();
    setIsAdminUnlocked(false);
    Alert.alert('Admin Locked', 'Permit Verification Console has been securely locked.');
  };

  const handleApproveClaim = (claimId: string, shopName: string) => {
    approveClaim(claimId);
    hapticSuccess();
    Alert.alert(
      'Permit Verified',
      `Ownership credentials for "${shopName}" have been validated. Verified green checkmark badge granted.`,
    );
  };

  const handleRejectClaim = (claimId: string, shopName: string) => {
    rejectClaim(claimId, 'Permit documentation did not match local city or DTI registry records.');
    hapticWarning();
    Alert.alert('Claim Rejected', `Rejected application for "${shopName}". Owner notified.`);
  };

  const handleRevokeClaim = (claimId: string, shopName: string) => {
    Alert.alert(
      'Revoke Verification?',
      `Are you sure you want to revoke the verified badge for "${shopName}"? The owner portal will return to unverified status.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke Badge',
          style: 'destructive',
          onPress: () => {
            revokeClaim(claimId);
            hapticWarning();
            Alert.alert('Verification Revoked', `"${shopName}" is now marked as Unverified.`);
          },
        },
      ],
    );
  };

  const handleDeleteClaim = (claimId: string, shopName: string) => {
    Alert.alert(
      'Delete Claim Application?',
      `Are you sure you want to permanently delete the permit claim for "${shopName}"? This is recommended to purge spam or fraudulent submissions.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Submission',
          style: 'destructive',
          onPress: () => {
            deleteClaim(claimId);
            hapticWarning();
            Alert.alert('Deleted', `Permit submission for "${shopName}" has been permanently purged.`);
          },
        },
      ],
    );
  };

  const filteredClaims = claimRequests.filter((claim) => {
    const q = claimSearchQuery.toLowerCase();
    const matchesSearch =
      claim.shopName.toLowerCase().includes(q) ||
      claim.ownerFullName.toLowerCase().includes(q) ||
      claim.businessEmail.toLowerCase().includes(q) ||
      claim.dtiOrSecNumber.toLowerCase().includes(q);
    if (!matchesSearch) return false;
    if (claimFilterStatus !== 'all' && claim.status !== claimFilterStatus) return false;
    return true;
  });

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
            <Text style={styles.statNumber}>{favorites.length}</Text>
            <Text style={styles.statLabel}>Saved Cafés</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{visitedShops.length}</Text>
            <Text style={styles.statLabel}>Visited Spots</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{reviews.length}</Text>
            <Text style={styles.statLabel}>Cuppings & Notes</Text>
          </View>
        </View>

        {/* National Coffee Explorer Level Banner */}
        <View
          style={{
            backgroundColor: COLORS.surface,
            borderRadius: RADIUS.lg,
            padding: SPACING.md,
            borderWidth: 1.5,
            borderColor: COLORS.surfaceSage,
            gap: 10,
            shadowColor: '#000',
            shadowOpacity: 0.06,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 3 },
            elevation: 2,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  backgroundColor: '#FFF8E1',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: '#FFE082',
                }}
              >
                <Feather name="award" size={20} color="#B78103" />
              </View>
              <View>
                <Text style={{ fontSize: 15, fontWeight: '900', color: COLORS.textPrimary }}>
                  Level {nationalRank.level} • {nationalRank.rankTitle}
                </Text>
                <Text style={{ fontSize: 11, color: COLORS.textSecondary, marginTop: 1 }}>
                  {nationalRank.badgeName}
                </Text>
              </View>
            </View>

            <View
              style={{
                backgroundColor: '#EFF5F1',
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: COLORS.primary,
              }}
            >
              <Text style={{ fontSize: 10.5, fontWeight: '800', color: COLORS.primary }}>
                {nationalRank.totalVisited} / {nationalRank.nextLevelTotal} Spots
              </Text>
            </View>
          </View>

          {/* XP Progress Bar */}
          <View style={{ gap: 4 }}>
            <View
              style={{
                height: 7,
                backgroundColor: COLORS.borderLight,
                borderRadius: 3.5,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  width: `${Math.round(nationalRank.progress * 100)}%`,
                  height: '100%',
                  backgroundColor: COLORS.primary,
                  borderRadius: 3.5,
                }}
              />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 10, color: COLORS.textSecondary }}>
                Rank Progress ({Math.round(nationalRank.progress * 100)}%)
              </Text>
              <Text style={{ fontSize: 10, fontWeight: '700', color: COLORS.primary }}>
                {nationalRank.level >= 4
                  ? 'Max Rank Achieved 👑'
                  : `${nationalRank.nextLevelTotal - nationalRank.totalVisited} more spots to Level ${nationalRank.level + 1}`}
              </Text>
            </View>
          </View>
        </View>

        {/* Regional & City Ranks Progression Grid */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderLeft}>
              <Feather name="map-pin" size={16} color={COLORS.primary} />
              <Text style={styles.cardTitle}>Regional & City Explorer Ranks</Text>
            </View>
            <Text style={styles.cardSubCount}>
              {regionalRanks.filter((r) => r.level > 0).length} / {regionalRanks.length} Active
            </Text>
          </View>
          <Text style={styles.passportDesc}>
            Log visits in each Philippine coffee hub to level up your regional badges:
          </Text>

          <View style={{ gap: 8, marginTop: 4 }}>
            {regionalRanks.map((r) => {
              const hasRank = r.level > 0;
              return (
                <View
                  key={r.regionId}
                  style={{
                    backgroundColor: hasRank ? '#F9FAF9' : COLORS.background,
                    borderRadius: RADIUS.md,
                    padding: 10,
                    borderWidth: 1,
                    borderColor: hasRank ? '#C8E6C9' : COLORS.borderLight,
                    gap: 6,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                      <View
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 13,
                          backgroundColor: hasRank ? '#E8F5E9' : '#ECEFF1',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Feather
                          name={hasRank ? (r.badgeIcon as any) : 'lock'}
                          size={13}
                          color={hasRank ? '#1B5E20' : COLORS.textMuted}
                        />
                      </View>
                      <View>
                        <Text style={{ fontSize: 13, fontWeight: '800', color: COLORS.textPrimary }}>
                          {r.regionName}
                        </Text>
                        <Text style={{ fontSize: 10.5, color: COLORS.textSecondary }}>
                          {r.island} • {r.rankTitle}
                        </Text>
                      </View>
                    </View>

                    <View
                      style={{
                        backgroundColor: hasRank ? '#E8F5E9' : '#ECEFF1',
                        paddingHorizontal: 7,
                        paddingVertical: 3,
                        borderRadius: 8,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 10.5,
                          fontWeight: '800',
                          color: hasRank ? '#1B5E20' : COLORS.textMuted,
                        }}
                      >
                        {r.visitedCount} {r.visitedCount === 1 ? 'spot' : 'spots'} visited
                      </Text>
                    </View>
                  </View>

                  {/* Mini Progress Bar */}
                  <View
                    style={{
                      height: 4,
                      backgroundColor: COLORS.borderLight,
                      borderRadius: 2,
                      overflow: 'hidden',
                    }}
                  >
                    <View
                      style={{
                        width: `${Math.round(r.progress * 100)}%`,
                        height: '100%',
                        backgroundColor: hasRank ? '#2E7D32' : COLORS.textMuted,
                        borderRadius: 2,
                      }}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Coffee Passport Regional Stamps */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderLeft}>
              <Feather name="award" size={16} color={COLORS.primary} />
              <Text style={styles.cardTitle}>Philippine Coffee Passport</Text>
            </View>
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                backgroundColor: '#E8F5E9',
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: '#C8E6C9',
              }}
              onPress={() => {
                hapticLight();
                setPhotoPassportVisible(true);
              }}
              activeOpacity={0.8}
            >
              <Feather name="camera" size={13} color="#1B5E20" />
              <Text style={{ fontSize: 11.5, fontWeight: '800', color: '#1B5E20' }}>
                📸 Log Cup Photo
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.passportDesc}>
            Earn digital stamps and unlock regional badges by taking a photo of your cup when visiting specialty cafés:
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

          {/* Recent Counter Check-ins */}
          {passportCheckIns.length > 0 && (
            <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: COLORS.borderLight, paddingTop: 10, gap: 6 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase' }}>
                Recent Counter Check-in Passes
              </Text>
              {passportCheckIns.slice(0, 3).map((ci) => (
                <View
                  key={ci.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: COLORS.background,
                    paddingHorizontal: 10,
                    paddingVertical: 7,
                    borderRadius: RADIUS.sm,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                    <Feather name="check-circle" size={13} color="#1B5E20" />
                    <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.textPrimary }} numberOfLines={1}>
                      {ci.shopName}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 10.5, color: COLORS.textSecondary }}>{ci.dateFormatted}</Text>
                </View>
              ))}
            </View>
          )}
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

        {/* ============================================================
            ADMINISTRATOR & MODERATION CONSOLE (ROLE-BASED & PIN-LOCKED)
           ============================================================ */}
        <View style={[styles.card, hasAdminAccess && styles.adminCardActive]}>
          <View style={styles.adminSectionHeader}>
            <View style={styles.adminHeaderLeft}>
              <View style={[styles.adminShieldCircle, hasAdminAccess && styles.adminShieldCircleActive]}>
                <Feather name="shield" size={18} color={hasAdminAccess ? '#1B5E20' : COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.adminTitleRow}>
                  <Text style={styles.cardTitle}>Permit Verification Console</Text>
                  {hasAdminAccess && (
                    <View style={styles.adminBadgeActive}>
                      <Text style={styles.adminBadgeActiveText}>
                        ADMIN ACTIVE • {verifiedOwnerShopIds.length} VERIFIED
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.adminSubtitle}>
                  {hasAdminAccess
                    ? 'Audit DTI/Mayor permits, fact-check submissions & revoke fraud'
                    : 'Inspect permit applications, approve badges & delete spam claims'}
                </Text>
              </View>
            </View>

            {hasAdminAccess ? (
              <TouchableOpacity
                style={styles.adminLockPillBtn}
                onPress={handleLockAdmin}
                activeOpacity={0.8}
              >
                <Feather name="lock" size={12} color="#C0392B" />
                <Text style={styles.adminLockPillText}>Lock</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.adminUnlockBtn}
                onPress={() => setAdminPinModalVisible(true)}
                activeOpacity={0.85}
              >
                <Feather name="key" size={12} color="#FFFFFF" />
                <Text style={styles.adminUnlockBtnText}>Unlock</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* LOCKED STATE BANNER */}
          {!hasAdminAccess && (
            <View style={styles.adminLockedNotice}>
              <Feather name="lock" size={13} color={COLORS.textMuted} />
              <Text style={styles.adminLockedNoticeText}>
                Restricted to authorized system administrators. Tap Unlock to enter Master Passcode.
              </Text>
            </View>
          )}

          {/* UNLOCKED PERMIT CLAIMS AUDIT DASHBOARD */}
          {hasAdminAccess && (
            <View style={styles.adminConsoleBody}>
              {/* Claims Search Bar */}
              <View style={styles.adminSearchBarWrap}>
                <Feather name="search" size={14} color={COLORS.textMuted} />
                <TextInput
                  style={styles.adminSearchInput}
                  placeholder="Search claims by shop, applicant, or permit #..."
                  placeholderTextColor={COLORS.textMuted}
                  value={claimSearchQuery}
                  onChangeText={setClaimSearchQuery}
                />
                {claimSearchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setClaimSearchQuery('')}>
                    <Feather name="x" size={14} color={COLORS.textMuted} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Status Filter Pills */}
              <View style={styles.adminFilterRow}>
                {(
                  [
                    { id: 'all', label: `All (${claimRequests.length})` },
                    {
                      id: 'pending',
                      label: `Pending (⚡ ${
                        claimRequests.filter((c) => c.status === 'pending').length
                      })`,
                    },
                    {
                      id: 'verified',
                      label: `Verified (✓ ${
                        claimRequests.filter((c) => c.status === 'verified').length
                      })`,
                    },
                    {
                      id: 'rejected',
                      label: `Rejected (${
                        claimRequests.filter((c) => c.status === 'rejected').length
                      })`,
                    },
                  ] as const
                ).map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.adminFilterPill,
                      claimFilterStatus === cat.id && styles.adminFilterPillActive,
                    ]}
                    onPress={() => setClaimFilterStatus(cat.id as any)}
                  >
                    <Text
                      style={[
                        styles.adminFilterPillText,
                        claimFilterStatus === cat.id && styles.adminFilterPillTextActive,
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Applications List */}
              <View style={styles.adminTabContent}>
                {filteredClaims.length === 0 ? (
                  <View style={styles.emptyAdminTab}>
                    <Feather name="inbox" size={24} color={COLORS.textMuted} />
                    <Text style={styles.emptyAdminTabText}>
                      No claim applications match your filter.
                    </Text>
                  </View>
                ) : (
                  filteredClaims.map((claim) => {
                    const isPending = claim.status === 'pending';
                    const isVerified = claim.status === 'verified';
                    const isRejected = claim.status === 'rejected';

                    return (
                      <View key={claim.id} style={styles.adminClaimItem}>
                        <View style={styles.claimItemHeader}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.claimShopName}>{claim.shopName}</Text>
                            <Text style={styles.claimApplicantSub}>
                              Applicant: {claim.ownerFullName} • {claim.submittedAt}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.claimStatusBadge,
                              isVerified
                                ? styles.claimStatusVerified
                                : isPending
                                ? styles.claimStatusPending
                                : styles.claimStatusRejected,
                            ]}
                          >
                            <Text
                              style={[
                                styles.claimStatusBadgeText,
                                isVerified
                                  ? styles.claimTextVerified
                                  : isPending
                                  ? styles.claimTextPending
                                  : styles.claimTextRejected,
                              ]}
                            >
                              {claim.status.toUpperCase()}
                            </Text>
                          </View>
                        </View>

                        {/* Fact-Checking & Credential Audit Card */}
                        <View style={styles.claimCredsGrid}>
                          <View style={styles.credRow}>
                            <Text style={styles.credLabel}>Business Email:</Text>
                            <Text style={styles.credValue}>{claim.businessEmail}</Text>
                          </View>
                          <View style={styles.credRow}>
                            <Text style={styles.credLabel}>Contact Phone:</Text>
                            <Text style={styles.credValue}>{claim.phoneNumber}</Text>
                          </View>
                          <View style={styles.credRow}>
                            <Text style={styles.credLabel}>{claim.permitType}:</Text>
                            <Text style={[styles.credValue, { fontWeight: '700', color: COLORS.primary }]}>
                              {claim.dtiOrSecNumber}
                            </Text>
                          </View>
                          {claim.rejectionReason && (
                            <View style={[styles.credRow, { marginTop: 2 }]}>
                              <Text style={[styles.credLabel, { color: COLORS.danger }]}>Rejection Note:</Text>
                              <Text style={[styles.credValue, { color: COLORS.danger, flex: 1, textAlign: 'right' }]} numberOfLines={2}>
                                {claim.rejectionReason}
                              </Text>
                            </View>
                          )}
                        </View>

                        {/* Attached Permit Document Photo Preview */}
                        {claim.permitPhotoUri && (
                          <TouchableOpacity
                            style={styles.inspectPermitBtn}
                            onPress={() => setPreviewDocUri(claim.permitPhotoUri!)}
                            activeOpacity={0.8}
                          >
                            <Image source={{ uri: claim.permitPhotoUri }} style={styles.inspectThumbnail} />
                            <View style={styles.inspectTextCol}>
                              <Text style={styles.inspectTitle}>Inspect Uploaded Document</Text>
                              <Text style={styles.inspectSub}>Tap to view full resolution ›</Text>
                            </View>
                            <Feather name="maximize-2" size={14} color={COLORS.primary} />
                          </TouchableOpacity>
                        )}

                        {/* Claim Moderation Actions */}
                        <View style={styles.claimActionsRow}>
                          {isPending && (
                            <>
                              <TouchableOpacity
                                style={styles.claimRejectBtn}
                                onPress={() => handleRejectClaim(claim.id, claim.shopName)}
                                activeOpacity={0.8}
                              >
                                <Feather name="x" size={13} color={COLORS.danger} />
                                <Text style={styles.claimRejectText}>Reject</Text>
                              </TouchableOpacity>

                              <TouchableOpacity
                                style={styles.claimApproveBtn}
                                onPress={() => handleApproveClaim(claim.id, claim.shopName)}
                                activeOpacity={0.8}
                              >
                                <Feather name="check" size={13} color="#FFFFFF" />
                                <Text style={styles.claimApproveText}>Approve & Verify</Text>
                              </TouchableOpacity>
                            </>
                          )}

                          {isVerified && (
                            <TouchableOpacity
                              style={styles.claimRevokeBtn}
                              onPress={() => handleRevokeClaim(claim.id, claim.shopName)}
                              activeOpacity={0.8}
                            >
                              <Feather name="slash" size={13} color="#D35400" />
                              <Text style={styles.claimRevokeText}>Revoke Verification</Text>
                            </TouchableOpacity>
                          )}

                          {isRejected && (
                            <TouchableOpacity
                              style={styles.claimApproveBtn}
                              onPress={() => handleApproveClaim(claim.id, claim.shopName)}
                              activeOpacity={0.8}
                            >
                              <Feather name="check" size={13} color="#FFFFFF" />
                              <Text style={styles.claimApproveText}>Re-Approve Claim</Text>
                            </TouchableOpacity>
                          )}

                          {/* Delete Application (Purge fraudulent or spam claims) */}
                          <TouchableOpacity
                            style={styles.claimDeleteBtn}
                            onPress={() => handleDeleteClaim(claim.id, claim.shopName)}
                            activeOpacity={0.8}
                          >
                            <Feather name="trash-2" size={13} color={COLORS.danger} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            </View>
          )}
        </View>

        {/* Legal & Privacy Section (App Store & DPA Compliance) */}
        <View style={styles.card}>
          <View style={styles.cardHeaderLeft}>
            <Feather name="file-text" size={16} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Legal & Privacy</Text>
          </View>

          <TouchableOpacity
            style={styles.legalRow}
            onPress={() => handleOpenLegal('privacy')}
            activeOpacity={0.7}
          >
            <View style={styles.legalLeft}>
              <Feather name="shield" size={14} color={COLORS.primary} />
              <Text style={styles.legalText}>Privacy Policy</Text>
            </View>
            <Feather name="chevron-right" size={14} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.legalRow}
            onPress={() => handleOpenLegal('terms')}
            activeOpacity={0.7}
          >
            <View style={styles.legalLeft}>
              <Feather name="book-open" size={14} color={COLORS.primary} />
              <Text style={styles.legalText}>Terms of Service</Text>
            </View>
            <Feather name="chevron-right" size={14} color={COLORS.textMuted} />
          </TouchableOpacity>

          <View style={styles.versionRow}>
            <Text style={styles.versionLabel}>App Version</Text>
            <Text style={styles.versionValue}>v2.0.0 (Build 54 - PH Specialty)</Text>
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
              <Text style={styles.authModalTitle}>Sign In to KapeRoute</Text>
              <TouchableOpacity onPress={() => setAuthModalVisible(false)}>
                <Feather name="x" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.authModalSubtitle}>
              Sync your saved spots, coffee passport stamps, and reviews across your devices.
            </Text>

            {/* Social Login Options */}
            <View style={styles.socialBtnGroup}>
              {/* Google Sign In — Active & Configured */}
              <TouchableOpacity
                style={styles.googleBtn}
                onPress={handleGoogleLogin}
                activeOpacity={0.85}
                disabled={isGoogleLoading}
              >
                {isGoogleLoading ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                  <>
                    <Feather name="globe" size={16} color="#DB4437" />
                    <Text style={styles.googleBtnText}>Continue with Google</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Apple Sign In */}
              <TouchableOpacity
                style={styles.appleBtn}
                onPress={() => handleSocialLogin('Apple')}
                activeOpacity={0.85}
              >
                <Feather name="command" size={16} color="#FFFFFF" />
                <Text style={styles.appleBtnText}>Continue with Apple ID</Text>
              </TouchableOpacity>

              {/* Facebook Login — Active & Configured */}
              <TouchableOpacity
                style={styles.facebookBtn}
                onPress={handleFacebookLogin}
                activeOpacity={0.85}
                disabled={isFacebookLoading}
              >
                {isFacebookLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Feather name="facebook" size={16} color="#FFFFFF" />
                    <Text style={styles.facebookBtnText}>Continue with Facebook</Text>
                  </>
                )}
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

            {/* Legal Agreement Disclaimer */}
            <View style={styles.legalDisclaimerRow}>
              <Text style={styles.legalDisclaimerText}>
                By continuing, you agree to KapeRoute's{' '}
                <Text
                  style={styles.legalLink}
                  onPress={() => {
                    setAuthModalVisible(false);
                    handleOpenLegal('terms');
                  }}
                >
                  Terms of Service
                </Text>{' '}
                and{' '}
                <Text
                  style={styles.legalLink}
                  onPress={() => {
                    setAuthModalVisible(false);
                    handleOpenLegal('privacy');
                  }}
                >
                  Privacy Policy
                </Text>.
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Legal & Privacy Reader Modal */}
      <Modal
        visible={legalModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setLegalModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.legalModalCard}>
            <View style={styles.legalModalHeader}>
              <View style={styles.legalHeaderTitleCol}>
                <Text style={styles.legalModalTitle}>
                  {legalModalType === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
                </Text>
                <Text style={styles.legalModalSub}>
                  Philippine Data Privacy Act (RA 10173) & Store Compliance
                </Text>
              </View>
              <TouchableOpacity onPress={() => setLegalModalVisible(false)}>
                <Feather name="x" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.legalScroll}>
              {legalModalType === 'privacy' ? (
                <View style={styles.legalContentBox}>
                  <Text style={styles.legalHeading}>1. Information We Collect</Text>
                  <Text style={styles.legalParagraph}>
                    • Location Data: Accessed with your explicit permission solely to locate nearby specialty cafés, calculate distance, and render road navigation. We do not track your location in the background when the app is closed.
                  </Text>
                  <Text style={styles.legalParagraph}>
                    • Account Information: Managed via Firebase Authentication (Email/Password, Apple ID, Google) to sync your coffee passport stamps and saved favorites.
                  </Text>
                  <Text style={styles.legalParagraph}>
                    • Business Permits: DTI registration certificates and Mayor's permits submitted by café owners are processed exclusively to verify ownership and prevent fraudulent claims. Document photos are stored securely and never published to the general public.
                  </Text>

                  <Text style={styles.legalHeading}>2. Philippine Data Privacy Act Compliance</Text>
                  <Text style={styles.legalParagraph}>
                    Under Republic Act No. 10173, you have the right to request access, correction, or complete deletion of your profile data at any time by contacting privacy@coffeefinder.ph.
                  </Text>

                  <Text style={styles.legalHeading}>3. Payment Processing</Text>
                  <Text style={styles.legalParagraph}>
                    SaaS subscriptions are processed through PayMongo (regulated by the Bangko Sentral ng Pilipinas). KapeRoute does not store credit card credentials or GCash MPINs.
                  </Text>
                </View>
              ) : (
                <View style={styles.legalContentBox}>
                  <Text style={styles.legalHeading}>1. Acceptance of Terms</Text>
                  <Text style={styles.legalParagraph}>
                    By using KapeRoute: Coffee Finder PH, you agree to comply with these terms. If you do not agree, please discontinue using the service.
                  </Text>

                  <Text style={styles.legalHeading}>2. Café Owner Verification</Text>
                  <Text style={styles.legalParagraph}>
                    Only authorized owners or managers may claim listings. Submitting forged or unauthorized DTI / Mayor's permits will result in immediate termination of the account.
                  </Text>

                  <Text style={styles.legalHeading}>3. Community Guidelines</Text>
                  <Text style={styles.legalParagraph}>
                    Tasting notes, barista recipes, and ratings must be authentic reflections of your coffee experience. Defamatory content or spam is strictly prohibited.
                  </Text>

                  <Text style={styles.legalHeading}>4. SaaS Subscriptions</Text>
                  <Text style={styles.legalParagraph}>
                    Starter and Pro owner plans renew monthly. You may cancel at any time prior to the billing cycle renewal via PayMongo or your account settings.
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ============================================================
          ADMIN MODALS (PIN AUTH, SHOP EDIT, DOCUMENT PREVIEW)
         ============================================================ */}

      {/* 1. Admin Master Passcode Auth Modal */}
      <Modal
        visible={adminPinModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAdminPinModalVisible(false)}
      >
        <View style={styles.adminPinModalOverlay}>
          <View style={styles.adminPinModalCard}>
            <View style={styles.adminPinHeader}>
              <View style={styles.adminPinIconWrap}>
                <Feather name="shield" size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.adminPinTitle}>Administrator Console</Text>
              <Text style={styles.adminPinSub}>
                Enter the master administrator passcode to unlock the full moderation dashboard.
              </Text>
            </View>

            <TextInput
              style={styles.adminPinInput}
              placeholder="••••••"
              placeholderTextColor={COLORS.textMuted}
              value={enteredPin}
              onChangeText={setEnteredPin}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={8}
              autoFocus
            />

            <View style={styles.adminPinActionsRow}>
              <TouchableOpacity
                style={styles.adminPinCancelBtn}
                onPress={() => {
                  setAdminPinModalVisible(false);
                  setEnteredPin('');
                }}
              >
                <Text style={styles.adminPinCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.adminPinSubmitBtn}
                onPress={handleVerifyAdminPin}
                activeOpacity={0.85}
              >
                <Feather name="unlock" size={14} color="#FFFFFF" />
                <Text style={styles.adminPinSubmitText}>Unlock Console</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.adminPinHelper}>
              Confidential • System Administrator Credentials Only
            </Text>
          </View>
        </View>
      </Modal>

      {/* 2. Document / Permit High-Res Inspection Modal */}
      <Modal
        visible={!!previewDocUri}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewDocUri(null)}
      >
        <View style={styles.imageViewerOverlay}>
          <TouchableOpacity
            style={styles.imageViewerCloseBtn}
            onPress={() => setPreviewDocUri(null)}
          >
            <Feather name="x" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          {previewDocUri && (
            <Image
              source={{ uri: previewDocUri }}
              style={styles.fullInspectionImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>

      {/* Photo-Proof Coffee Passport Camera Modal */}
      <PhotoPassportModal
        visible={photoPassportVisible}
        onClose={() => setPhotoPassportVisible(false)}
      />
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
  legalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  legalLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legalText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  versionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  versionLabel: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
  },
  versionValue: {
    fontSize: 11.5,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  legalDisclaimerRow: {
    marginTop: 8,
    paddingHorizontal: 4,
  },
  legalDisclaimerText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  legalLink: {
    color: COLORS.primary,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  legalModalCard: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    padding: SPACING.lg,
    maxHeight: '85%',
    gap: SPACING.sm,
  },
  legalModalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  legalHeaderTitleCol: {
    flex: 1,
  },
  legalModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  legalModalSub: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  legalScroll: {
    marginTop: 6,
    paddingBottom: 20,
  },
  legalContentBox: {
    gap: 8,
    paddingBottom: 30,
  },
  legalHeading: {
    fontSize: 13.5,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: 8,
  },
  legalParagraph: {
    fontSize: 12,
    color: COLORS.textPrimary,
    lineHeight: 18,
  },
  comingSoonNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F5F0EA',
    borderRadius: 10,
    padding: 12,
  },
  comingSoonText: {
    flex: 1,
    fontSize: 12.5,
    color: COLORS.textSecondary,
    lineHeight: 17,
  },
  // ==========================================
  // Administrator & Moderation Console Styles
  // ==========================================
  adminCardActive: {
    borderColor: '#A5D6A7',
    backgroundColor: '#FBFCFB',
  },
  adminSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  adminHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  adminShieldCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.surfaceWarm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  adminShieldCircleActive: {
    backgroundColor: '#E8F5E9',
    borderColor: '#C8E6C9',
  },
  adminTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  adminBadgeActive: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#A5D6A7',
  },
  adminBadgeActiveText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#2E7D32',
    letterSpacing: 0.5,
  },
  adminSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  adminUnlockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
  },
  adminUnlockBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  adminLockPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FDEEE9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#F9CCC2',
  },
  adminLockPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#C0392B',
  },
  adminLockedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: COLORS.surfaceWarm,
    borderRadius: RADIUS.sm,
  },
  adminLockedNoticeText: {
    flex: 1,
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 15,
  },
  adminConsoleBody: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    gap: 10,
  },
  adminTabsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  adminTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceWarm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  adminTabBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  adminTabBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  adminTabBtnTextActive: {
    color: '#FFFFFF',
  },
  adminTabContent: {
    gap: 10,
  },
  emptyAdminTab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  emptyAdminTabText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  // Claims Items
  adminClaimItem: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: 8,
  },
  claimItemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  claimShopName: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  claimApplicantSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  claimStatusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  claimStatusVerified: {
    backgroundColor: '#E8F5E9',
  },
  claimStatusPending: {
    backgroundColor: '#FFF8E1',
  },
  claimStatusRejected: {
    backgroundColor: '#FFEBEE',
  },
  claimStatusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  claimTextVerified: {
    color: '#2E7D32',
  },
  claimTextPending: {
    color: '#F57F17',
  },
  claimTextRejected: {
    color: '#C62828',
  },
  claimCredsGrid: {
    backgroundColor: COLORS.surfaceWarm,
    borderRadius: RADIUS.sm,
    padding: 8,
    gap: 4,
  },
  credRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  credLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  credValue: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  inspectPermitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF5EE',
    padding: 8,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: '#E8DCB8',
    gap: 8,
  },
  inspectThumbnail: {
    width: 36,
    height: 36,
    borderRadius: 4,
    backgroundColor: '#DDD',
  },
  inspectTextCol: {
    flex: 1,
  },
  inspectTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.primary,
  },
  inspectSub: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  claimActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  claimRejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
    backgroundColor: '#FDEEE9',
    borderWidth: 1,
    borderColor: '#F9CCC2',
  },
  claimRejectText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.danger,
  },
  claimApproveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primary,
  },
  claimApproveText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Cafes Management
  adminSearchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceWarm,
    borderRadius: RADIUS.md,
    paddingHorizontal: 10,
    height: 36,
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  adminSearchInput: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textPrimary,
    padding: 0,
  },
  adminFilterRow: {
    flexDirection: 'row',
    gap: 6,
  },
  adminFilterPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceWarm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  adminFilterPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  adminFilterPillText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  adminFilterPillTextActive: {
    color: '#FFFFFF',
  },
  adminShopCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: 6,
  },
  adminShopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  adminShopTitleCol: {
    flex: 1,
  },
  adminShopNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  adminShopName: {
    fontSize: 13.5,
    fontWeight: '800',
    color: COLORS.textPrimary,
    flexShrink: 1,
  },
  adminShopCity: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  factBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  factBadge: {
    backgroundColor: COLORS.surfaceWarm,
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 4,
  },
  factBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  claimRevokeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
    backgroundColor: '#FFF3E0',
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  claimRevokeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#D35400',
  },
  claimDeleteBtn: {
    width: 36,
    height: 34,
    borderRadius: RADIUS.sm,
    backgroundColor: '#FDEEE9',
    borderWidth: 1,
    borderColor: '#F9CCC2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Admin PIN Auth Modal Styles
  adminPinModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  adminPinModalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    gap: SPACING.sm + 2,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  adminPinHeader: {
    alignItems: 'center',
    gap: 4,
  },
  adminPinIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.surfaceSage,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  adminPinTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  adminPinSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  adminPinInput: {
    width: '100%',
    height: 48,
    backgroundColor: COLORS.surfaceWarm,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 8,
    color: COLORS.textPrimary,
  },
  adminPinActionsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: SPACING.sm,
    marginTop: 4,
  },
  adminPinCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceWarm,
  },
  adminPinCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  adminPinSubmitBtn: {
    flex: 1.5,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  adminPinSubmitText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  adminPinHelper: {
    fontSize: 10.5,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },
  // Full Document Image Modal Styles
  imageViewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  imageViewerCloseBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullInspectionImage: {
    width: '100%',
    height: '80%',
  },
});
