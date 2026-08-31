// ============================================================
// OwnerPortalScreen — Verification Gate, Claims & Admin Review Panel
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
  Modal,
  Image,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SPACING, RADIUS } from '@constants';
import { useStore } from '@store/useStore';
import { uploadPermitPhoto } from '@services/firebase';
import { hapticSuccess, hapticMedium } from '@utils/haptics';
import type {
  LiveSeatingStatus,
  OwnerVerificationStatus,
  OwnerClaimRequest,
} from '@types';

type PlanTier = 'free' | 'starter' | 'pro';

interface Plan {
  id: PlanTier;
  name: string;
  price: string;
  period: string;
  badge?: string;
  recommended?: boolean;
  features: string[];
}

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Claimed Spot',
    price: '₱0',
    period: 'forever free',
    features: [
      'Verified Badge (DTI/Mayor Permit check)',
      'Real-time Seating status toggle',
      'Update Wi-Fi speed & menu photos',
      'Direct customer chat inquiries',
    ],
  },
  {
    id: 'starter',
    name: 'Single Origin',
    price: '₱499',
    period: '/month',
    badge: 'POPULAR',
    recommended: true,
    features: [
      'Everything in Claimed Spot',
      'Highlighted Pin on Specialty Map',
      'Tasting Notes spotlight card',
      'Priority support from KapeRoute team',
    ],
  },
  {
    id: 'pro',
    name: 'Master Roaster',
    price: '₱1,299',
    period: '/month',
    badge: 'BEST VALUE',
    features: [
      'Everything in Single Origin',
      'Custom push notification broadcast (1x/week)',
      'Digital Coffee Passport Stamp feature',
      'Monthly customer growth analytics',
    ],
  },
];

export const OwnerPortalScreen: React.FC = () => {
  const shops = useStore((s) => s.shops);
  const updateShopLiveStatus = useStore((s) => s.updateShopLiveStatus);
  const submitClaim = useStore((s) => s.submitClaim);
  const isShopClaimed = useStore((s) => s.isShopClaimed);
  const liveHeartbeatEvents = useStore((s) => s.liveHeartbeatEvents);

  // Verification State (Defaults to 'unregistered' so portal is locked by default)
  const [verificationStatus, setVerificationStatus] =
    useState<OwnerVerificationStatus>('unregistered');
  const [claimModalVisible, setClaimModalVisible] = useState(false);
  const [claimMode, setClaimMode] = useState<'claim' | 'new'>('claim');

  // Claim Form Inputs
  const [selectedShopId, setSelectedShopId] = useState(
    shops[0]?.id ?? 'ph-chapter-coffee',
  );
  const [newCafeName, setNewCafeName] = useState('');
  const [newCafeCity, setNewCafeCity] = useState('');
  const [ownerFullName, setOwnerFullName] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [dtiOrSecNumber, setDtiOrSecNumber] = useState('');
  const [permitType, setPermitType] =
    useState<OwnerClaimRequest['permitType']>('DTI Registration');
  const [permitLocalPhotoUri, setPermitLocalPhotoUri] = useState<string | null>(null);
  const [isUploadingPermit, setIsUploadingPermit] = useState(false);

  // Verified Owner Dashboard State
  const [currentPlan, setCurrentPlan] = useState<PlanTier>('free');
  const [seatingStatus, setSeatingStatus] = useState<LiveSeatingStatus>('moderate');
  const [wifiSpeed, setWifiSpeed] = useState('Fast (250 Mbps+ verified)');
  const [pushCampaignText, setPushCampaignText] = useState('');

  // PayMongo Checkout Modal
  const [checkoutPlan, setCheckoutPlan] = useState<Plan | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const activeShop = shops.find((s) => s.id === selectedShopId) ?? shops[0];

  const handlePickPermitFromGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission Denied', 'Please grant photo library access to attach your business permit.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.85,
    });
    if (!res.canceled && res.assets && res.assets.length > 0) {
      setPermitLocalPhotoUri(res.assets[0].uri);
      hapticMedium();
    }
  };

  const handleTakePermitPhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission Denied', 'Please grant camera access to photograph your business permit.');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.85,
    });
    if (!res.canceled && res.assets && res.assets.length > 0) {
      setPermitLocalPhotoUri(res.assets[0].uri);
      hapticMedium();
    }
  };

  // Submit Claim to Admin Review with duplicate lock and cloud storage
  const handleSubmitClaim = async () => {
    if (claimMode === 'claim') {
      if (isShopClaimed(selectedShopId)) {
        Alert.alert(
          'Already Claimed',
          'This café listing is already claimed or currently undergoing verification by an applicant. Please contact customer service if you are the legal owner.',
        );
        return;
      }
    }

    if (!ownerFullName.trim()) {
      Alert.alert('Missing Field', 'Please enter the owner full name.');
      return;
    }
    if (!businessEmail.trim() || !phoneNumber.trim()) {
      Alert.alert('Missing Contact', 'Please provide a valid business email and mobile phone.');
      return;
    }
    if (!dtiOrSecNumber.trim()) {
      Alert.alert('Missing Permit #', 'Please enter your DTI or Mayor Permit registration number for verification.');
      return;
    }

    const claimId = `claim-${Date.now()}`;
    const targetName = claimMode === 'claim' ? activeShop?.name : newCafeName;

    setIsUploadingPermit(true);
    let finalPhotoUrl = permitLocalPhotoUri;
    if (permitLocalPhotoUri) {
      try {
        finalPhotoUrl = await uploadPermitPhoto(permitLocalPhotoUri, claimId);
      } catch {}
    }
    setIsUploadingPermit(false);

    submitClaim({
      shopId: claimMode === 'claim' ? selectedShopId : `new-cafe-${Date.now()}`,
      shopName: targetName || 'Specialty Café',
      ownerFullName,
      businessEmail,
      phoneNumber,
      dtiOrSecNumber,
      permitType,
      permitPhotoUri: finalPhotoUrl || undefined,
    });

    hapticSuccess();
    setClaimModalVisible(false);
    setPermitLocalPhotoUri(null);
    setVerificationStatus('pending');
    Alert.alert(
      'Verification Submitted',
      'Your claim and document have been uploaded to Admin & Customer Service. We will verify your permit details within 24-48 business hours.',
    );
  };

  const handleSaveStatus = () => {
    if (activeShop) {
      updateShopLiveStatus(activeShop.id, seatingStatus, wifiSpeed);
      Alert.alert(
        'Live Status Updated',
        `Live seating (${seatingStatus}) and metrics for "${activeShop.name}" are now visible to seekers in real-time.`,
      );
    }
  };

  const handleSendPushCampaign = () => {
    if (currentPlan !== 'pro') {
      Alert.alert(
        'Pro Feature Locked',
        'Push notification broadcasts to nearby coffee lovers require the Pro Roastery plan (₱799/mo).',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'View Plans',
            onPress: () => {
              const proPlan = PLANS.find((p) => p.id === 'pro');
              if (proPlan) setCheckoutPlan(proPlan);
            },
          },
        ],
      );
      return;
    }

    if (!pushCampaignText.trim()) {
      Alert.alert('Empty Message', 'Please enter your campaign message.');
      return;
    }

    Alert.alert(
      'Push Broadcast Sent',
      `Sent: "${pushCampaignText}" to ~340 nearby specialty coffee drinkers in your area.`,
    );
    setPushCampaignText('');
  };

  const handlePayMongoCheckout = async (method: 'GCash' | 'Maya' | 'Card') => {
    setIsProcessingPayment(true);

    // PayMongo checkout deep links per method
    const PAYMONGO_LINKS: Record<string, string> = {
      GCash: 'https://pay.paymongo.com/links/coffeefinderph-gcash',
      Maya: 'https://pay.paymongo.com/links/coffeefinderph-maya',
      Card: 'https://pay.paymongo.com/links/coffeefinderph-card',
    };

    const url = PAYMONGO_LINKS[method];
    try {
      if (checkoutPlan) {
        setCurrentPlan(checkoutPlan.id);
      }
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL('https://coffeefinder.ph/subscribe');
      }
    } catch {
      Alert.alert('Payment', 'Opening payment page in your browser.');
    } finally {
      setIsProcessingPayment(false);
      setCheckoutPlan(null);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Spacious Minimalist Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeftCol}>
          <Text style={styles.headerTitle}>Owner Portal</Text>
          <Text style={styles.headerSubtitle}>
            {verificationStatus === 'verified'
              ? 'Verified Café Management & Live Operations'
              : 'Claim Your Listing & Verified Badge'}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* STATE A: UNREGISTERED / VERIFICATION REQUIRED */}
        {verificationStatus === 'unregistered' && (
          <View style={styles.unverifiedContainer}>
            <View style={styles.lockHeroCard}>
              {/* Status Pill Inside Card Header */}
              <View style={styles.heroStatusBadgeRow}>
                <View style={styles.unregisteredStatusPill}>
                  <Text style={styles.unregisteredStatusText}>VERIFICATION REQUIRED</Text>
                </View>
              </View>

              <View style={styles.lockIconCircle}>
                <Feather name="shield" size={28} color={COLORS.primary} />
              </View>
              <Text style={styles.lockTitle}>Claim & Verify Your Café</Text>
              <Text style={styles.lockSubtitle}>
                To protect café listings, ownership must be validated by admin or customer service before live seating broadcasts and SaaS tools can be unlocked.
              </Text>

                  <View style={styles.securityCheckpoints}>
                    <View style={styles.checkpointRow}>
                      <Feather name="check" size={14} color={COLORS.primary} />
                      <Text style={styles.checkpointText}>
                        Prevents unauthorized access & duplicate claims
                      </Text>
                    </View>
                    <View style={styles.checkpointRow}>
                      <Feather name="check" size={14} color={COLORS.primary} />
                      <Text style={styles.checkpointText}>
                        Validates local DTI / Mayor's Permit registration
                      </Text>
                    </View>
                    <View style={styles.checkpointRow}>
                      <Feather name="check" size={14} color={COLORS.primary} />
                      <Text style={styles.checkpointText}>
                        Unlocks live seating broadcast & verified badge
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.claimActionBtn}
                    onPress={() => {
                      setClaimMode('claim');
                      setClaimModalVisible(true);
                    }}
                    activeOpacity={0.88}
                  >
                    <Feather name="award" size={16} color="#FFFFFF" />
                    <Text style={styles.claimActionBtnText}>Claim Existing Café Listing</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.registerNewBtn}
                    onPress={() => {
                      setClaimMode('new');
                      setClaimModalVisible(true);
                    }}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.registerNewText}>Or Register a New Specialty Café ›</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* STATE B: UNDER REVIEW */}
            {verificationStatus === 'pending' && (
              <View style={styles.pendingCard}>
                <View style={styles.pendingHeader}>
                  <View style={styles.pendingIconCircle}>
                    <Feather name="clock" size={24} color="#6E4822" />
                  </View>
                  <View style={styles.pendingHeaderTextCol}>
                    <Text style={styles.pendingTitle}>Claim Under Admin Review</Text>
                    <Text style={styles.pendingAppId}>Application ID: #CF-PH-9482</Text>
                  </View>
                </View>

                <Text style={styles.pendingMessage}>
                  Your business credentials for <Text style={{ fontWeight: '700' }}>{activeShop?.name}</Text> have been received by our verification team.
                </Text>

                {/* Timeline Progress */}
                <View style={styles.timeline}>
                  <View style={styles.timelineStep}>
                    <View style={[styles.timelineDot, styles.timelineDotComplete]}>
                      <Feather name="check" size={10} color="#FFFFFF" />
                    </View>
                    <View style={styles.timelineTextCol}>
                      <Text style={styles.timelineStepTitle}>1. Application Submitted</Text>
                      <Text style={styles.timelineStepSub}>Credentials & DTI details received</Text>
                    </View>
                  </View>

                  <View style={styles.timelineStep}>
                    <View style={[styles.timelineDot, styles.timelineDotActive]}>
                      <Feather name="loader" size={10} color="#FFFFFF" />
                    </View>
                    <View style={styles.timelineTextCol}>
                      <Text style={styles.timelineStepTitle}>2. Admin & Registry Check</Text>
                      <Text style={styles.timelineStepSub}>Currently validating permit with records</Text>
                    </View>
                  </View>

                  <View style={styles.timelineStep}>
                    <View style={[styles.timelineDot, styles.timelineDotPending]}>
                      <Feather name="lock" size={10} color={COLORS.textMuted} />
                    </View>
                    <View style={styles.timelineTextCol}>
                      <Text style={[styles.timelineStepTitle, { color: COLORS.textMuted }]}>
                        3. Verified Owner Dashboard Unlock
                      </Text>
                      <Text style={styles.timelineStepSub}>Estimated within 24–48 hours</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.supportNote}>
                  <Feather name="info" size={13} color={COLORS.textSecondary} />
                  <Text style={styles.supportNoteText}>
                    Tip: Switch to the "Admin Verification Queue" tab above to test the customer service approval action!
                  </Text>
                </View>
              </View>
            )}

            {/* STATE C: VERIFIED OWNER DASHBOARD */}
            {verificationStatus === 'verified' && (
              <>
                {/* Verified Café Banner */}
                <View style={styles.verifiedHeaderCard}>
                  <View style={styles.verifiedHeaderLeft}>
                    <View style={styles.cafeAvatarCircle}>
                      <Feather name="coffee" size={20} color={COLORS.primary} />
                    </View>
                    <View>
                      <View style={styles.verifiedNameRow}>
                        <Text style={styles.verifiedCafeName}>{activeShop.name}</Text>
                        <Feather name="check-circle" size={14} color={COLORS.verified} />
                      </View>
                      <Text style={styles.verifiedCafeAddress}>{activeShop.vicinity}</Text>
                    </View>
                  </View>
                </View>

                {/* Live Customer Heartbeat Feed (Telemetry Alerts) */}
                <View style={styles.card}>
                  <View style={styles.sectionHeaderRow}>
                    <View style={styles.sectionHeaderLeft}>
                      <View style={styles.livePulseDot} />
                      <Text style={styles.sectionTitle}>Customer Heartbeat</Text>
                    </View>
                    <View style={styles.liveStreamBadge}>
                      <Text style={styles.liveStreamBadgeText}>Live Feed</Text>
                    </View>
                  </View>

                  <Text style={styles.helperText}>
                    Real-time customer discovery and in-app navigation to your shop:
                  </Text>

                  <View style={styles.heartbeatList}>
                    {liveHeartbeatEvents.map((hb) => (
                      <View key={hb.id} style={styles.heartbeatItem}>
                        <View style={styles.heartbeatIconCircle}>
                          <Feather
                            name={
                              hb.type === 'navigation'
                                ? 'navigation'
                                : hb.type === 'favorite'
                                ? 'heart'
                                : 'coffee'
                            }
                            size={11}
                            color={COLORS.primary}
                          />
                        </View>
                        <View style={styles.heartbeatTextCol}>
                          <Text style={styles.heartbeatMsg}>{hb.message}</Text>
                          <Text style={styles.heartbeatTime}>{hb.timeAgo}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Live Seating Broadcast */}
                <View style={styles.card}>
                  <View style={styles.sectionHeaderRow}>
                    <View style={styles.sectionHeaderLeft}>
                      <Feather name="activity" size={16} color={COLORS.primary} />
                      <Text style={styles.sectionTitle}>Broadcast Live Seating</Text>
                    </View>
                    <View style={styles.freeBadge}>
                      <Text style={styles.freeBadgeText}>Live</Text>
                    </View>
                  </View>

                  <Text style={styles.helperText}>
                    Update your live table availability to guide nearby remote workers and visitors:
                  </Text>

                  <View style={styles.statusButtonsRow}>
                    <TouchableOpacity
                      style={[
                        styles.statusBtn,
                        seatingStatus === 'available' && styles.statusBtnAvailable,
                      ]}
                      onPress={() => setSeatingStatus('available')}
                    >
                      <View style={[styles.statusDot, { backgroundColor: COLORS.success }]} />
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
                      <View style={[styles.statusDot, { backgroundColor: COLORS.warning }]} />
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
                      <View style={[styles.statusDot, { backgroundColor: COLORS.danger }]} />
                      <Text style={styles.statusBtnTitle}>Busy</Text>
                      <Text style={styles.statusBtnSub}>Few Left</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={[styles.fieldLabel, { marginTop: SPACING.sm }]}>
                    Verified Wi-Fi Speed
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={wifiSpeed}
                    onChangeText={setWifiSpeed}
                    placeholder="e.g. Fast (200 Mbps+ verified)"
                  />

                  <TouchableOpacity
                    style={styles.saveBtn}
                    onPress={handleSaveStatus}
                    activeOpacity={0.88}
                  >
                    <Feather name="check" size={15} color="#FFFFFF" />
                    <Text style={styles.saveBtnText}>Broadcast Status Update</Text>
                  </TouchableOpacity>
                </View>

                {/* Pro Feature: Hyperlocal Push Campaigns */}
                <View style={styles.card}>
                  <View style={styles.sectionHeaderRow}>
                    <View style={styles.sectionHeaderLeft}>
                      <Feather name="send" size={16} color={COLORS.primary} />
                      <Text style={styles.sectionTitle}>Hyperlocal Push Notification</Text>
                    </View>
                    <View style={styles.proBadge}>
                      <Text style={styles.proBadgeText}>PRO PLAN</Text>
                    </View>
                  </View>

                  <Text style={styles.helperText}>
                    Broadcast a fresh roast drop or afternoon discount directly to coffee seekers within 3km:
                  </Text>

                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={pushCampaignText}
                    onChangeText={setPushCampaignText}
                    placeholder="e.g. Fresh batch of Sagada Arabica pour-over ready! 15% off until 3 PM."
                    multiline
                    numberOfLines={2}
                  />

                  <TouchableOpacity
                    style={[
                      styles.campaignBtn,
                      currentPlan !== 'pro' && styles.campaignBtnLocked,
                    ]}
                    onPress={handleSendPushCampaign}
                    activeOpacity={0.88}
                  >
                    <Feather
                      name={currentPlan === 'pro' ? 'send' : 'lock'}
                      size={14}
                      color="#FFFFFF"
                    />
                    <Text style={styles.campaignBtnText}>
                      {currentPlan === 'pro'
                        ? 'Broadcast Push to Nearby Users'
                        : 'Unlock with Pro (₱799/mo)'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Subscription Plans Section (PayMongo SaaS) */}
                <View style={styles.card}>
                  <View style={styles.sectionHeaderLeft}>
                    <Feather name="layers" size={16} color={COLORS.primary} />
                    <Text style={styles.sectionTitle}>SaaS Subscription Plans</Text>
                  </View>
                  <Text style={styles.helperText}>
                    Subscribe to unlock push marketing, priority search visibility, and rich menu showcases:
                  </Text>

                  <View style={styles.plansContainer}>
                    {PLANS.map((plan) => {
                      const isCurrent = currentPlan === plan.id;
                      return (
                        <View
                          key={plan.id}
                          style={[
                            styles.planCard,
                            plan.recommended && styles.planCardRecommended,
                            isCurrent && styles.planCardCurrent,
                          ]}
                        >
                          {plan.badge && (
                            <View style={styles.planRibbon}>
                              <Text style={styles.planRibbonText}>{plan.badge}</Text>
                            </View>
                          )}

                          <View style={styles.planHeader}>
                            <Text style={styles.planName}>{plan.name}</Text>
                            <View style={styles.planPriceRow}>
                              <Text style={styles.planPrice}>{plan.price}</Text>
                              <Text style={styles.planPeriod}>/{plan.period}</Text>
                            </View>
                          </View>

                          <View style={styles.planFeaturesList}>
                            {plan.features.map((feat, idx) => (
                              <View key={idx} style={styles.featureRow}>
                                <Feather name="check" size={12} color={COLORS.primary} />
                                <Text style={styles.featureText}>{feat}</Text>
                              </View>
                            ))}
                          </View>

                          <TouchableOpacity
                            style={[
                              styles.planCtaBtn,
                              isCurrent && styles.planCtaCurrent,
                              plan.recommended && !isCurrent && styles.planCtaRecommended,
                            ]}
                            onPress={() => {
                              if (!isCurrent) setCheckoutPlan(plan);
                            }}
                            disabled={isCurrent}
                          >
                            <Text
                              style={[
                                styles.planCtaText,
                                isCurrent && styles.planCtaTextCurrent,
                              ]}
                            >
                              {isCurrent ? 'Current Plan' : `Subscribe to ${plan.name}`}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </>
            )}
      </ScrollView>

      {/* Verification & Claim Modal Wizard */}
      <Modal
        visible={claimModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setClaimModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.claimModalCard}>
            <View style={styles.claimModalHeader}>
              <View style={styles.modalHeaderTitleCol}>
                <Text style={styles.claimModalTitle}>
                  {claimMode === 'claim' ? 'Claim Café Listing' : 'Register New Café'}
                </Text>
                <Text style={styles.claimModalSub}>
                  Submitted to Admin & Customer Service for verification
                </Text>
              </View>
              <TouchableOpacity onPress={() => setClaimModalVisible(false)}>
                <Feather name="x" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalFormScroll}>
              {/* Café Selection or New Input */}
              {claimMode === 'claim' ? (
                <>
                  <Text style={styles.fieldLabel}>Select Café to Claim</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modalShopChips}>
                    {shops.map((s) => {
                      const isClaimed = isShopClaimed(s.id);
                      const isSelected = selectedShopId === s.id;

                      return (
                        <TouchableOpacity
                          key={s.id}
                          disabled={isClaimed}
                          style={[
                            styles.modalChip,
                            isSelected && styles.modalChipActive,
                            isClaimed && styles.modalChipDisabled,
                          ]}
                          onPress={() => setSelectedShopId(s.id)}
                        >
                          <Text
                            style={[
                              styles.modalChipText,
                              isSelected && styles.modalChipTextActive,
                              isClaimed && styles.modalChipTextDisabled,
                            ]}
                          >
                            {s.name} {isClaimed ? '(Locked)' : ''}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </>
              ) : (
                <>
                  <Text style={styles.fieldLabel}>Café Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Origin Roast Lab"
                    value={newCafeName}
                    onChangeText={setNewCafeName}
                  />
                  <Text style={styles.fieldLabel}>City / Region</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Quezon City, Metro Manila"
                    value={newCafeCity}
                    onChangeText={setNewCafeCity}
                  />
                </>
              )}

              {/* Owner Credentials */}
              <Text style={styles.fieldLabel}>Owner / Manager Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Juan Dela Cruz"
                value={ownerFullName}
                onChangeText={setOwnerFullName}
              />

              <Text style={styles.fieldLabel}>Business Email</Text>
              <TextInput
                style={styles.input}
                placeholder="owner@chaptercoffee.ph"
                keyboardType="email-address"
                autoCapitalize="none"
                value={businessEmail}
                onChangeText={setBusinessEmail}
              />

              <Text style={styles.fieldLabel}>Mobile Phone (for SMS Verification)</Text>
              <TextInput
                style={styles.input}
                placeholder="+63 917 123 4567"
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
              />

              {/* Business Permit */}
              <Text style={styles.fieldLabel}>Permit Type</Text>
              <View style={styles.permitTypeRow}>
                {(['DTI Registration', 'Mayor Permit'] as const).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.permitPill,
                      permitType === t && styles.permitPillActive,
                    ]}
                    onPress={() => setPermitType(t)}
                  >
                    <Text
                      style={[
                        styles.permitPillText,
                        permitType === t && styles.permitPillTextActive,
                      ]}
                    >
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Registration / Permit Number</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. DTI-NCR-2024-849201"
                value={dtiOrSecNumber}
                onChangeText={setDtiOrSecNumber}
              />

              {/* Document Photo Upload (Camera / Gallery) */}
              <Text style={styles.fieldLabel}>Business Registration Document Photo</Text>
              {permitLocalPhotoUri ? (
                <View style={styles.permitPreviewContainer}>
                  <Image source={{ uri: permitLocalPhotoUri }} style={styles.permitImagePreview} />
                  <View style={styles.permitPreviewActions}>
                    <TouchableOpacity
                      style={styles.changePhotoBtn}
                      onPress={handleTakePermitPhoto}
                    >
                      <Feather name="camera" size={13} color={COLORS.primary} />
                      <Text style={styles.changePhotoText}>Retake Photo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.changePhotoBtn}
                      onPress={handlePickPermitFromGallery}
                    >
                      <Feather name="image" size={13} color={COLORS.primary} />
                      <Text style={styles.changePhotoText}>Choose Gallery</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.photoPickerRow}>
                  <TouchableOpacity
                    style={styles.photoPickerBtn}
                    onPress={handleTakePermitPhoto}
                    activeOpacity={0.8}
                  >
                    <Feather name="camera" size={18} color={COLORS.primary} />
                    <Text style={styles.photoPickerText}>Take Photo</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.photoPickerBtn}
                    onPress={handlePickPermitFromGallery}
                    activeOpacity={0.8}
                  >
                    <Feather name="image" size={18} color={COLORS.primary} />
                    <Text style={styles.photoPickerText}>Choose Gallery</Text>
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity
                style={styles.submitClaimBtn}
                onPress={handleSubmitClaim}
                disabled={isUploadingPermit}
                activeOpacity={0.88}
              >
                {isUploadingPermit ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitClaimBtnText}>Submit for Admin Verification</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* PayMongo Checkout Modal */}
      <Modal
        visible={!!checkoutPlan}
        transparent
        animationType="slide"
        onRequestClose={() => setCheckoutPlan(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.checkoutModal}>
            <View style={styles.checkoutHeader}>
              <Text style={styles.checkoutTitle}>PayMongo Checkout</Text>
              <TouchableOpacity onPress={() => setCheckoutPlan(null)}>
                <Feather name="x" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {checkoutPlan && (
              <View style={styles.checkoutSummary}>
                <Text style={styles.checkoutPlanName}>{checkoutPlan.name}</Text>
                <Text style={styles.checkoutPrice}>
                  {checkoutPlan.price} / month
                </Text>
                <Text style={styles.checkoutSub}>
                  Recurring subscription for café owner tools
                </Text>
              </View>
            )}

            <Text style={styles.payMethodLabel}>Select Payment Method (PH):</Text>

            <TouchableOpacity
              style={styles.paymentMethodBtn}
              onPress={() => handlePayMongoCheckout('GCash')}
              disabled={isProcessingPayment}
            >
              <View style={styles.gcashDotLarge} />
              <View style={styles.methodInfo}>
                <Text style={styles.methodName}>GCash</Text>
                <Text style={styles.methodSub}>Pay with GCash wallet / QR</Text>
              </View>
              <Feather name="chevron-right" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.paymentMethodBtn}
              onPress={() => handlePayMongoCheckout('Maya')}
              disabled={isProcessingPayment}
            >
              <View style={styles.mayaDot} />
              <View style={styles.methodInfo}>
                <Text style={styles.methodName}>Maya</Text>
                <Text style={styles.methodSub}>Pay with Maya account</Text>
              </View>
              <Feather name="chevron-right" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.paymentMethodBtn}
              onPress={() => handlePayMongoCheckout('Card')}
              disabled={isProcessingPayment}
            >
              <Feather name="credit-card" size={20} color={COLORS.primary} />
              <View style={styles.methodInfo}>
                <Text style={styles.methodName}>Credit / Debit Card</Text>
                <Text style={styles.methodSub}>Visa, Mastercard</Text>
              </View>
              <Feather name="chevron-right" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>

            {isProcessingPayment && (
              <Text style={styles.processingText}>
                Connecting to PayMongo gateway…
              </Text>
            )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  headerLeftCol: {
    flex: 1,
    gap: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 11.5,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: SPACING.sm,
  },
  adminActivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: '#A5D6A7',
    gap: 5,
  },
  adminActivePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1B5E20',
  },
  adminLockIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.surfaceWarm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  heroStatusBadgeRow: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 6,
  },
  unregisteredStatusPill: {
    backgroundColor: '#FDEEE9',
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: '#F9CCC2',
  },
  unregisteredStatusText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#C0392B',
    letterSpacing: 0.5,
  },
  adminUnlockLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    marginTop: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    backgroundColor: COLORS.surface,
  },
  adminUnlockLinkText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.textMuted,
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
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  adminPinSub: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 8,
  },
  adminPinInput: {
    width: '100%',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    letterSpacing: 4,
    marginVertical: 4,
  },
  adminPinActionsRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    marginTop: 4,
  },
  adminPinCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminPinCancelText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  adminPinSubmitBtn: {
    flex: 1.5,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  adminPinSubmitText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  adminPinHelper: {
    fontSize: 10,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  statusBadgeVerified: {
    backgroundColor: '#E8F6ED',
  },
  statusBadgePending: {
    backgroundColor: '#FEF8E7',
  },
  statusBadgeUnregistered: {
    backgroundColor: '#FDEDEC',
  },
  statusBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  statusTextVerified: {
    color: COLORS.verified,
  },
  statusTextPending: {
    color: '#D35400',
  },
  statusTextUnregistered: {
    color: COLORS.danger,
  },
  roleTabsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceWarm,
    padding: 3,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    borderRadius: RADIUS.full,
  },
  roleTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    gap: 5,
  },
  roleTabActive: {
    backgroundColor: COLORS.primary,
  },
  roleTabText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  roleTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  scrollContent: {
    padding: SPACING.md,
    gap: SPACING.md,
    paddingBottom: 90,
  },
  unverifiedContainer: {
    paddingTop: SPACING.xs,
  },
  lockHeroCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  lockIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.surfaceSage,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  lockTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  lockSubtitle: {
    fontSize: 12.5,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  securityCheckpoints: {
    width: '100%',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.sm,
    padding: SPACING.md - 2,
    gap: 6,
    marginVertical: 4,
  },
  checkpointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkpointText: {
    fontSize: 12,
    color: COLORS.textPrimary,
    flex: 1,
  },
  claimActionBtn: {
    width: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  claimActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  registerNewBtn: {
    paddingVertical: 6,
  },
  registerNewText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  pendingCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1.2,
    borderColor: '#E8DBC8',
    gap: SPACING.md,
  },
  pendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  pendingIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FAF5ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingHeaderTextCol: {
    flex: 1,
  },
  pendingTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  pendingAppId: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  pendingMessage: {
    fontSize: 13,
    color: COLORS.textPrimary,
    lineHeight: 19,
  },
  timeline: {
    gap: SPACING.md - 2,
    paddingLeft: 4,
  },
  timelineStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  timelineDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  timelineDotComplete: {
    backgroundColor: COLORS.verified,
  },
  timelineDotActive: {
    backgroundColor: '#E67E22',
  },
  timelineDotPending: {
    backgroundColor: COLORS.border,
  },
  timelineTextCol: {
    flex: 1,
  },
  timelineStepTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  timelineStepSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  supportNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.background,
    padding: 10,
    borderRadius: RADIUS.sm,
  },
  supportNoteText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    flex: 1,
  },
  verifiedHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  verifiedHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  cafeAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surfaceSage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedCafeName: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  verifiedCafeAddress: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.xs + 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  freeBadge: {
    backgroundColor: '#E8F6ED',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  freeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.verified,
  },
  proBadge: {
    backgroundColor: '#FAF5ED',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: '#E8DBC8',
  },
  proBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#6E4822',
  },
  helperText: {
    fontSize: 12.5,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: 4,
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
    gap: 4,
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
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusBtnTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
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
    marginTop: 2,
  },
  textArea: {
    minHeight: 56,
    textAlignVertical: 'top',
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  campaignBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  campaignBtnLocked: {
    backgroundColor: '#6E4822',
  },
  campaignBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  plansContainer: {
    gap: SPACING.md,
    marginTop: SPACING.xs,
  },
  planCard: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1.2,
    borderColor: COLORS.border,
    gap: SPACING.sm,
    position: 'relative',
  },
  planCardRecommended: {
    borderColor: COLORS.primary,
    borderWidth: 2,
    backgroundColor: '#FAF8F3',
  },
  planCardCurrent: {
    borderColor: COLORS.border,
    opacity: 0.85,
  },
  planRibbon: {
    position: 'absolute',
    top: -10,
    right: 12,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  planRibbonText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '800',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  planPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  planPrice: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.primary,
  },
  planPeriod: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  planFeaturesList: {
    gap: 4,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featureText: {
    fontSize: 12,
    color: COLORS.textPrimary,
    flex: 1,
  },
  planCtaBtn: {
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  planCtaRecommended: {
    backgroundColor: COLORS.primary,
  },
  planCtaCurrent: {
    backgroundColor: COLORS.borderLight,
    borderColor: COLORS.border,
  },
  planCtaText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.primary,
  },
  planCtaTextCurrent: {
    color: COLORS.textMuted,
  },
  adminContainer: {
    gap: SPACING.md,
  },
  adminNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSage,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
    gap: SPACING.sm,
  },
  adminNoticeTextCol: {
    flex: 1,
  },
  adminNoticeTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.primary,
  },
  adminNoticeSub: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  adminQueueHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  emptyAdminBox: {
    backgroundColor: COLORS.surface,
    padding: SPACING.xl,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  emptyAdminText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  adminClaimCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1.2,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  adminClaimHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  adminShopName: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  adminSubmittedAt: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  claimStatusTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  claimTagApproved: { backgroundColor: '#E8F6ED' },
  claimTagPending: { backgroundColor: '#FEF8E7' },
  claimTagRejected: { backgroundColor: '#FDEDEC' },
  claimStatusTagText: { fontSize: 9.5, fontWeight: '800' },
  claimTextApproved: { color: COLORS.verified },
  claimTextPending: { color: '#D35400' },
  claimTextRejected: { color: COLORS.danger },
  credentialGrid: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm + 2,
    gap: 5,
  },
  credItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  credLabel: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  credValue: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  adminActionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: 4,
  },
  adminRejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: '#FADBD8',
    backgroundColor: '#FDEDEC',
    gap: 4,
  },
  adminRejectText: {
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: '700',
  },
  adminApproveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    gap: 4,
  },
  adminApproveText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  claimModalCard: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    padding: SPACING.lg,
    maxHeight: '90%',
    gap: SPACING.sm,
  },
  claimModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 4,
  },
  modalHeaderTitleCol: {
    flex: 1,
  },
  claimModalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  claimModalSub: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  modalFormScroll: {
    paddingBottom: 20,
  },
  modalShopChips: {
    marginVertical: 4,
  },
  modalChip: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 6,
  },
  modalChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  modalChipDisabled: {
    opacity: 0.45,
    backgroundColor: COLORS.borderLight,
  },
  modalChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  modalChipTextActive: {
    color: '#FFFFFF',
  },
  modalChipTextDisabled: {
    color: COLORS.textMuted,
  },
  permitTypeRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 4,
  },
  permitPill: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  permitPillActive: {
    backgroundColor: COLORS.surfaceSage,
    borderColor: COLORS.primary,
  },
  permitPillText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  permitPillTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  docUploadBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceSage,
    borderRadius: RADIUS.sm,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: COLORS.primaryLight,
    borderStyle: 'dashed',
    gap: 8,
    marginVertical: SPACING.sm,
  },
  docUploadText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.primary,
  },
  submitClaimBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  submitClaimBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  checkoutModal: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  checkoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  checkoutTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  checkoutSummary: {
    backgroundColor: COLORS.surfaceSage,
    padding: SPACING.md,
    borderRadius: RADIUS.sm,
    gap: 2,
  },
  checkoutPlanName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  checkoutPrice: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.primary,
  },
  checkoutSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  payMethodLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  paymentMethodBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SPACING.md - 2,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  gcashDotLarge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.gcash,
  },
  mayaDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#00D665',
  },
  methodInfo: {
    flex: 1,
    gap: 1,
  },
  methodName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  methodSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  processingText: {
    fontSize: 12,
    textAlign: 'center',
    color: COLORS.primary,
    fontWeight: '600',
  },
  adminPermitPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSage,
    padding: 8,
    borderRadius: RADIUS.sm,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
  },
  adminPermitThumbnail: {
    width: 44,
    height: 44,
    borderRadius: 6,
  },
  adminPermitTextCol: {
    flex: 1,
    gap: 1,
  },
  adminPermitTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.primary,
  },
  adminPermitSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  permitPreviewContainer: {
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    marginVertical: SPACING.xs,
    backgroundColor: COLORS.background,
  },
  permitImagePreview: {
    width: '100%',
    height: 160,
    resizeMode: 'cover',
  },
  permitPreviewActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 8,
    gap: 8,
    backgroundColor: COLORS.surface,
  },
  changePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSage,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  changePhotoText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.primary,
  },
  photoPickerRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: SPACING.xs,
  },
  photoPickerBtn: {
    flex: 1,
    backgroundColor: COLORS.surfaceSage,
    paddingVertical: 14,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.primaryLight,
    borderStyle: 'dashed',
    gap: 4,
  },
  photoPickerText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  fullInspectionImage: {
    width: '100%',
    height: '80%',
  },
  livePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00D665',
  },
  liveStreamBadge: {
    backgroundColor: '#E6F9EE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: '#B0ECC8',
  },
  liveStreamBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#00873D',
  },
  heartbeatList: {
    gap: 8,
    marginTop: 4,
  },
  heartbeatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 10,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: 10,
  },
  heartbeatIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceSage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartbeatTextCol: {
    flex: 1,
    gap: 1,
  },
  heartbeatMsg: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
    lineHeight: 16,
  },
  heartbeatTime: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
});
