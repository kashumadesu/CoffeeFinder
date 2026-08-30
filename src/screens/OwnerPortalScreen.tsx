// ============================================================
// OwnerPortalScreen — Shop Owner Freemium SaaS Portal & Subscriptions
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
import type { LiveSeatingStatus } from '@types';

type PlanTier = 'free' | 'starter' | 'pro' | 'enterprise';

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
      'Claim & verify café listing',
      'Edit opening hours & address',
      'Upload up to 3 photos',
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
      'Weekly analytics (taps & directions)',
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
      'Broadcast push alerts to nearby coffee seekers',
      'Top placement in Discover feed',
      'Digital brew recipe & menu card',
      'Monthly customer growth analytics',
    ],
  },
];

export const OwnerPortalScreen: React.FC = () => {
  const shops = useStore((s) => s.shops);
  const updateShopLiveStatus = useStore((s) => s.updateShopLiveStatus);

  const [selectedShopId, setSelectedShopId] = useState(
    shops[0]?.id ?? 'ph-chapter-coffee',
  );
  const [currentPlan, setCurrentPlan] = useState<PlanTier>('free');
  const [seatingStatus, setSeatingStatus] = useState<LiveSeatingStatus>('moderate');
  const [wifiSpeed, setWifiSpeed] = useState('Fast (250 Mbps+ verified)');
  const [loyaltyStamps, setLoyaltyStamps] = useState('Buy 9 coffees, get 1 free pour-over');
  const [pushCampaignText, setPushCampaignText] = useState('');

  // PayMongo Checkout Modal
  const [checkoutPlan, setCheckoutPlan] = useState<Plan | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const activeShop = shops.find((s) => s.id === selectedShopId) ?? shops[0];

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
    if (currentPlan === 'free' || currentPlan === 'starter') {
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
      Alert.alert('Empty Campaign', 'Please enter a message to broadcast.');
      return;
    }

    Alert.alert(
      'Push Alert Broadcasted',
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
          `Successfully subscribed to ${checkoutPlan.name} via ${method} (PayMongo). All premium tools are unlocked!`,
        );
      }
      setCheckoutPlan(null);
    }, 1200);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Feather name="briefcase" size={20} color={COLORS.primary} />
          <Text style={styles.headerTitle}>Owner Portal</Text>
        </View>
        <View style={styles.currentTierBadge}>
          <Text style={styles.currentTierText}>
            Plan: {currentPlan.toUpperCase()}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Managed Café Selector */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Select Your Café</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.shopSelector}
          >
            {shops.slice(0, 5).map((shop) => {
              const isSelected = shop.id === selectedShopId;
              return (
                <TouchableOpacity
                  key={shop.id}
                  style={[styles.shopChip, isSelected && styles.shopChipActive]}
                  onPress={() => setSelectedShopId(shop.id)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.shopChipText,
                      isSelected && styles.shopChipTextActive,
                    ]}
                  >
                    {shop.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Live Seating Status Broadcast (Basic Free Feature) */}
        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderLeft}>
              <Feather name="activity" size={16} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Broadcast Live Seating</Text>
            </View>
            <View style={styles.freeBadge}>
              <Text style={styles.freeBadgeText}>Free</Text>
            </View>
          </View>

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

          {/* Wi-Fi Speed Metric */}
          <Text style={[styles.fieldLabel, { marginTop: SPACING.sm }]}>
            Verified Wi-Fi Speed
          </Text>
          <TextInput
            style={styles.input}
            value={wifiSpeed}
            onChangeText={setWifiSpeed}
            placeholder="e.g. Fast (200 Mbps+ verified)"
          />

          {/* Save Status CTA */}
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
            Broadcast a promo or fresh bean drop directly to users within 3km of {activeShop?.name}:
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
                ? 'Send Push to Nearby Drinkers'
                : 'Unlock with Pro (₱799/mo)'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Subscription Plans Section (Freemium SaaS) */}
        <View style={styles.card}>
          <View style={styles.sectionHeaderLeft}>
            <Feather name="layers" size={16} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>SaaS Subscription Plans</Text>
          </View>
          <Text style={styles.helperText}>
            Upgrade your café listing to attract more remote workers, increase visits, and broadcast live seat updates:
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
                      {isCurrent ? 'Current Plan' : `Upgrade to ${plan.name}`}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* PayMongo Checkout Modal (GCash / Maya / Card) */}
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
  currentTierBadge: {
    backgroundColor: COLORS.surfaceSage,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
  },
  currentTierText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: COLORS.primary,
  },
  scrollContent: {
    padding: SPACING.md,
    gap: SPACING.md,
    paddingBottom: 90,
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
