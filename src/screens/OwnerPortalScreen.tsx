// ============================================================
// OwnerPortalScreen — Owner Verification, Claim & SaaS Dashboard
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '@constants';
import { useStore } from '@store/useStore';
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
  features: string[];
  recommended?: boolean;
}

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free Basic',
    price: '₱0',
    period: 'forever',
    features: [
      'Verified ownership badge on café profile',
      'Edit opening hours, menu & price range',
      'Upload up to 3 gallery photos',
      'Manual seating status toggle',
      'Basic weekly views count',
    ],
  },
  {
    id: 'starter',
    name: 'Starter Café',
    price: '₱299',
    period: 'per month',
    recommended: true,
    features: [
      'All Free features',
      'Up to 10 gallery photos',
      'Verified Wi-Fi speed badge',
      'GCash / QRPh payment badge',
      'Featured map pin highlight',
      'Weekly direction request analytics',
    ],
  },
  {
    id: 'pro',
    name: 'Pro Roastery',
    price: '₱799',
    period: 'per month',
    badge: 'Most Popular',
    features: [
      'All Starter features',
      'Real-time seating % tracker',
      'Hyperlocal push notifications to nearby coffee lovers',
      'Top placement in Discover feed',
      'Digital brew recipe & menu card',
      'Monthly customer growth analytics',
    ],
  },
];

export const OwnerPortalScreen: React.FC = () => {
  const shops = useStore((s) => s.shops);
  const updateShopLiveStatus = useStore((s) => s.updateShopLiveStatus);

  // Verification State (Defaults to 'unregistered' so the portal is protected)
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

  // Verified Owner Dashboard State
  const [currentPlan, setCurrentPlan] = useState<PlanTier>('free');
  const [seatingStatus, setSeatingStatus] = useState<LiveSeatingStatus>('moderate');
  const [wifiSpeed, setWifiSpeed] = useState('Fast (250 Mbps+ verified)');
  const [pushCampaignText, setPushCampaignText] = useState('');

  // PayMongo Checkout Modal
  const [checkoutPlan, setCheckoutPlan] = useState<Plan | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const activeShop = shops.find((s) => s.id === selectedShopId) ?? shops[0];

  // Submit Claim to Admin Review
  const handleSubmitClaim = () => {
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

    setClaimModalVisible(false);
    setVerificationStatus('pending');
    Alert.alert(
      'Verification Submitted',
      'Your claim has been submitted to Admin & Customer Service. We will verify your permit details within 24-48 business hours.',
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

  const handlePayMongoCheckout = (method: 'GCash' | 'Maya' | 'Card') => {
    setIsProcessingPayment(true);
    setTimeout(() => {
      setIsProcessingPayment(false);
      if (checkoutPlan) {
        setCurrentPlan(checkoutPlan.id);
        Alert.alert(
          'Subscription Active',
          `Successfully subscribed to ${checkoutPlan.name} via ${method} (PayMongo). Premium owner tools are active!`,
        );
      }
      setCheckoutPlan(null);
    }, 1200);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Feather name="briefcase" size={20} color={COLORS.primary} />
          <Text style={styles.headerTitle}>Owner Portal</Text>
        </View>

        {/* Status Badge */}
        <View
          style={[
            styles.statusBadge,
            verificationStatus === 'verified'
              ? styles.statusBadgeVerified
              : verificationStatus === 'pending'
              ? styles.statusBadgePending
              : styles.statusBadgeUnregistered,
          ]}
        >
          <Text
            style={[
              styles.statusBadgeText,
              verificationStatus === 'verified'
                ? styles.statusTextVerified
                : verificationStatus === 'pending'
                ? styles.statusTextPending
                : styles.statusTextUnregistered,
            ]}
          >
            {verificationStatus === 'verified'
              ? 'VERIFIED OWNER'
              : verificationStatus === 'pending'
              ? 'UNDER REVIEW'
              : 'VERIFICATION REQUIRED'}
          </Text>
        </View>
      </View>

      {/* Dev Mode State Switcher */}
      <View style={styles.devBar}>
        <Text style={styles.devBarLabel}>Status Test Mode:</Text>
        <TouchableOpacity
          style={[
            styles.devPill,
            verificationStatus === 'unregistered' && styles.devPillActive,
          ]}
          onPress={() => setVerificationStatus('unregistered')}
        >
          <Text style={styles.devPillText}>Locked</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.devPill,
            verificationStatus === 'pending' && styles.devPillActive,
          ]}
          onPress={() => setVerificationStatus('pending')}
        >
          <Text style={styles.devPillText}>Under Review</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.devPill,
            verificationStatus === 'verified' && styles.devPillActive,
          ]}
          onPress={() => setVerificationStatus('verified')}
        >
          <Text style={styles.devPillText}>Verified</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ============================================================
            STATE 1: UNREGISTERED / VERIFICATION REQUIRED
           ============================================================ */}
        {verificationStatus === 'unregistered' && (
          <View style={styles.unverifiedContainer}>
            <View style={styles.lockHeroCard}>
              <View style={styles.lockIconCircle}>
                <Feather name="shield" size={32} color={COLORS.primary} />
              </View>
              <Text style={styles.lockTitle}>Claim & Verify Your Café</Text>
              <Text style={styles.lockSubtitle}>
                To protect café listings, ownership must be validated by admin or customer service before live seating broadcasts and SaaS tools can be unlocked.
              </Text>

              <View style={styles.securityCheckpoints}>
                <View style={styles.checkpointRow}>
                  <Feather name="check" size={14} color={COLORS.primary} />
                  <Text style={styles.checkpointText}>
                    Prevents unauthorized access & false seating reports
                  </Text>
                </View>
                <View style={styles.checkpointRow}>
                  <Feather name="check" size={14} color={COLORS.primary} />
                  <Text style={styles.checkpointText}>
                    Direct DTI / Mayor Permit business validation
                  </Text>
                </View>
                <View style={styles.checkpointRow}>
                  <Feather name="check" size={14} color={COLORS.primary} />
                  <Text style={styles.checkpointText}>
                    Free Verified Owner Badge on your public café profile
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

        {/* ============================================================
            STATE 2: APPLICATION UNDER REVIEW
           ============================================================ */}
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
                Need expedited verification? Contact support@coffeefinder.ph with your application ID.
              </Text>
            </View>
          </View>
        )}

        {/* ============================================================
            STATE 3: VERIFIED OWNER DASHBOARD & SAAS
           ============================================================ */}
        {verificationStatus === 'verified' && (
          <>
            {/* Managed Café Banner */}
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

            {/* Live Seating Broadcast (Core SaaS) */}
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
                    {shops.map((s) => (
                      <TouchableOpacity
                        key={s.id}
                        style={[
                          styles.modalChip,
                          selectedShopId === s.id && styles.modalChipActive,
                        ]}
                        onPress={() => setSelectedShopId(s.id)}
                      >
                        <Text
                          style={[
                            styles.modalChipText,
                            selectedShopId === s.id && styles.modalChipTextActive,
                          ]}
                        >
                          {s.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
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

              {/* Document Upload Button */}
              <TouchableOpacity
                style={styles.docUploadBox}
                onPress={() => Alert.alert('Permit Attached', 'Business permit photo attached.')}
                activeOpacity={0.8}
              >
                <Feather name="file-text" size={20} color={COLORS.primary} />
                <Text style={styles.docUploadText}>Attach DTI or Mayor Permit Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.submitClaimBtn}
                onPress={handleSubmitClaim}
                activeOpacity={0.88}
              >
                <Text style={styles.submitClaimBtnText}>Submit for Admin Verification</Text>
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
  devBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceWarm,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    gap: 6,
  },
  devBarLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  devPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  devPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  devPillText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  scrollContent: {
    padding: SPACING.md,
    gap: SPACING.md,
    paddingBottom: 90,
  },
  unverifiedContainer: {
    paddingTop: SPACING.sm,
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
  modalChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  modalChipTextActive: {
    color: '#FFFFFF',
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
});
