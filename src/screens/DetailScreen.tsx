// ============================================================
// DetailScreen — Specialty Café Detail View (With Community Tasting & In-App Routing)
// ============================================================

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
  Platform,
  Modal,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Feather } from '@expo/vector-icons';

import { COLORS, SPACING, RADIUS, PRICE_LABELS } from '@constants';
import { getPlaceDetails, formatDistance } from '@services/googlePlaces';
import { useFavorites } from '@hooks/useFavorites';
import { hapticLight, hapticSuccess, hapticSelection } from '@utils/haptics';
import { logBaristaTipEvent, logShareEvent } from '@services/analytics';
import { useStore } from '@store/useStore';
import { RatingStars } from '@components/RatingStars';
import { PhotoMosaic } from '@components/PhotoMosaic';
import { TastingNotesSection } from '@components/TastingNotesSection';
import { InsiderTipsSection } from '@components/InsiderTipsSection';
import { TastingRadarSummary } from '@components/TastingRadarSummary';
import { ReviewsList } from '@components/ReviewsList';
import { ReviewComposerModal } from '@components/ReviewComposerModal';
import { ShopBeansSection } from '@components/ShopBeansSection';
import { CartModal } from '@components/CartModal';
import { ShopEventsSection } from '@components/ShopEventsSection';
import { EventDetailModal } from '@components/EventDetailModal';
import type { CoffeeShop, RootStackParamList, CoffeeEvent } from '@types';

type Route = RouteProp<RootStackParamList, 'ShopDetail'>;
type Nav = StackNavigationProp<RootStackParamList, 'ShopDetail'>;

export const DetailScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const route = useRoute<Route>();
  const initialShop = route.params.shop;

  const [shop, setShop] = useState<CoffeeShop>(initialShop);
  const [hoursExpanded, setHoursExpanded] = useState(false);
  const [menuModalVisible, setMenuModalVisible] = useState(false);
  const [menuActiveCategory, setMenuActiveCategory] = useState<string>('All');
  const [tipModalVisible, setTipModalVisible] = useState(false);
  const [selectedTipAmount, setSelectedTipAmount] = useState<number>(50);

  // Phase 2 State
  const reviews = useStore((s) => s.reviews);
  const shopReviews = reviews.filter((r) => r.shopId === shop.id);
  const cart = useStore((s) => s.cart);
  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const [composerModalVisible, setComposerModalVisible] = useState(false);
  const [cartModalVisible, setCartModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CoffeeEvent | null>(null);
  const [eventModalVisible, setEventModalVisible] = useState(false);

  const { toggleFavorite, isFavorite } = useFavorites();
  const startNavigation = useStore((s) => s.startNavigation);
  const favorited = isFavorite(shop.id);

  const handleSendGcashTip = async () => {
    logBaristaTipEvent(shop.id, shop.name, selectedTipAmount);
    hapticSuccess();
    setTipModalVisible(false);
    const gcashUrl = 'gcash://';
    try {
      const canOpen = await Linking.canOpenURL(gcashUrl);
      if (canOpen) {
        Linking.openURL(gcashUrl);
      } else {
        Alert.alert(
          'Barista Tip Ready',
          `Send ₱${selectedTipAmount} to GCash number: ${shop.merchantGcashNumber ?? '0917-888-CAFE'}\n\nAccount: ${shop.name} Barista Fund`,
        );
      }
    } catch {
      Alert.alert(
        'Barista Tip Ready',
        `Send ₱${selectedTipAmount} to GCash number: ${shop.merchantGcashNumber ?? '0917-888-CAFE'}\n\nAccount: ${shop.name} Barista Fund`,
      );
    }
  };

  // Fetch full details if needed
  useEffect(() => {
    getPlaceDetails(initialShop.id)
      .then((full) => setShop((prev) => ({ ...prev, ...full })))
      .catch(() => {});
  }, [initialShop.id]);

  // Open Native Google/Apple Maps
  const handleDirections = () => {
    const { latitude, longitude } = shop.location;
    const label = encodeURIComponent(shop.name);
    const url =
      Platform.select({
        ios: `maps:0,0?q=${label}@${latitude},${longitude}`,
        android: `geo:${latitude},${longitude}?q=${latitude},${longitude}(${label})`,
      }) ?? `https://maps.google.com?q=${latitude},${longitude}`;
    Linking.openURL(url).catch(() => Alert.alert('Error', 'Could not open Maps app.'));
  };

  // Start In-App Turn-by-Turn Map Routing
  const handleInAppRoute = () => {
    startNavigation(shop);
    nav.goBack(); // returns to Map screen with Polyline & HUD active
  };

  const handleCall = () => {
    if (shop.phoneNumber) {
      Linking.openURL(`tel:${shop.phoneNumber}`);
    }
  };

  const handleWebsite = () => {
    if (shop.website) {
      Linking.openURL(shop.website).catch(() =>
        Alert.alert('Error', 'Could not open website.'),
      );
    }
  };

  const handleOwnerPortal = () => {
    (nav as any).navigate('OwnerPortal');
  };

  const handleFavoritePress = () => {
    toggleFavorite(shop);
    hapticSuccess();
  };

  const handleShareShop = async () => {
    try {
      const minPrice = shop.priceRange?.min ?? 140;
      const maxPrice = shop.priceRange?.max ?? 240;
      const signature = shop.menuHighlights?.[0]?.name
        ? `Signature: ${shop.menuHighlights[0].name}. `
        : '';
      const vibe = shop.vibeTags?.length ? `Vibe: ${shop.vibeTags.join(', ')}. ` : '';
      const message = `Check out this coffee spot on KapeRoute: Coffee Finder PH: ${shop.name} in ${shop.vicinity}! Price: ₱${minPrice}–₱${maxPrice}/cup. ${signature}${vibe}https://kaperoute.ph/shop/${shop.id}`;
      hapticLight();
      logShareEvent(shop.id, shop.name);
      await Share.share({
        title: `KapeRoute: ${shop.name}`,
        message,
      });
    } catch {}
  };

  const distanceText = shop.distance ? ` (${formatDistance(shop.distance)})` : '';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Top Header Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => nav.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Feather name="chevron-left" size={26} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topTitle} numberOfLines={1}>
          {shop.name}
        </Text>
        <View style={styles.topActionsRow}>
          {totalCartCount > 0 && (
            <TouchableOpacity
              style={[styles.headerActionBtn, { position: 'relative' }]}
              onPress={() => setCartModalVisible(true)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather name="shopping-bag" size={19} color={COLORS.primary} />
              <View
                style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  backgroundColor: COLORS.primary,
                  borderRadius: 9,
                  minWidth: 16,
                  height: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 3,
                }}
              >
                <Text style={{ fontSize: 9.5, fontWeight: '900', color: '#FFFFFF' }}>
                  {totalCartCount}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={handleShareShop}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="share-2" size={19} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.favoriteCircleBtn}
            onPress={handleFavoritePress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather
              name="heart"
              size={19}
              color={favorited ? COLORS.danger : COLORS.border}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Floating Detail Card (Matching Mockup Screen 3) */}
        <View style={styles.mainCard}>
          {/* 3-Photo Tiled Mosaic Header */}
          <PhotoMosaic
            photos={shop.photos}
            galleryUrls={shop.galleryUrls}
            height={190}
          />

          {/* Body Info */}
          <View style={styles.cardBody}>
            {/* Title & Verified Checkmark */}
            <View style={styles.titleRow}>
              <Text style={styles.titleText}>{shop.name}</Text>
              {shop.isVerified && (
                <View style={styles.verifiedBadge}>
                  <Feather name="check-circle" size={14} color={COLORS.verified} />
                </View>
              )}
            </View>

            {/* Rating + GCash Pill */}
            <View style={styles.ratingSection}>
              {shop.rating !== undefined && (
                <RatingStars
                  rating={shop.rating}
                  count={shop.userRatingsTotal ?? 1200}
                  size={14}
                  showGcash={shop.acceptsGcash ?? true}
                />
              )}
              {shop.priceLevel !== undefined && (
                <Text style={styles.priceText}>{PRICE_LABELS[shop.priceLevel]}</Text>
              )}
            </View>

            {/* Vibe Tags Grid */}
            <View style={styles.vibeTagsContainer}>
              {(shop.vibeTags ?? ['#UnderratedGem', '#QuietVibe', '#SingleOrigin', '#LaptopFriendly']).map(
                (tag, index) => {
                  const isGreen = index === 0;
                  return (
                    <View
                      key={tag}
                      style={[styles.vibePill, isGreen ? styles.vibePillGreen : styles.vibePillBrown]}
                    >
                      <Text
                        style={[styles.vibeText, isGreen ? styles.vibeTextGreen : styles.vibeTextBrown]}
                      >
                        {tag}
                      </Text>
                    </View>
                  );
                },
              )}
            </View>

            {/* Work-From-Café (WFC) & Outlets Scorecard */}
            <View style={styles.wfcScorecard}>
              <View style={styles.wfcHeaderRow}>
                <Feather name="briefcase" size={13} color={COLORS.primary} />
                <Text style={styles.wfcHeaderTitle}>Work-From-Café (WFC) Index</Text>
              </View>

              <View style={styles.wfcGrid}>
                {/* Outlets Index */}
                <View style={styles.wfcItem}>
                  <Feather
                    name="zap"
                    size={14}
                    color={
                      shop.outletRating === 'plentiful'
                        ? '#1B5E20'
                        : shop.outletRating === 'wall_only'
                        ? '#E65100'
                        : '#C62828'
                    }
                  />
                  <Text style={styles.wfcItemLabel}>Outlets:</Text>
                  <Text
                    style={[
                      styles.wfcItemValue,
                      shop.outletRating === 'plentiful' && styles.wfcValueGreen,
                      shop.outletRating === 'wall_only' && styles.wfcValueOrange,
                      shop.outletRating === 'laptop_ban' && styles.wfcValueRed,
                    ]}
                  >
                    {shop.outletRating === 'plentiful'
                      ? '⚡ Plentiful (Almost all tables)'
                      : shop.outletRating === 'wall_only'
                      ? '⚠️ Wall-Only (1–2 shared sockets)'
                      : shop.outletRating === 'laptop_ban'
                      ? '🚫 Weekend Laptop Ban'
                      : '⚡ Available at tables'}
                  </Text>
                </View>

                {/* Wi-Fi Speed */}
                <View style={styles.wfcItem}>
                  <Feather name="wifi" size={14} color={COLORS.primary} />
                  <Text style={styles.wfcItemLabel}>Wi-Fi:</Text>
                  <Text style={styles.wfcItemValue}>
                    {shop.wifiSpeed ?? '200 Mbps+ Verified'}
                  </Text>
                </View>

                {/* A/C & Comfort */}
                <View style={styles.wfcItem}>
                  <Feather name="sun" size={14} color="#E65100" />
                  <Text style={styles.wfcItemLabel}>A/C Level:</Text>
                  <Text style={styles.wfcItemValue}>
                    {shop.acLevel === 'high_chilly'
                      ? '❄️ High A/C (Bring Jacket)'
                      : shop.acLevel === 'al_fresco_warm'
                      ? '🌿 Al Fresco Breezy'
                      : '❄️ Comfortable Cool'}
                  </Text>
                </View>

                {/* Noise Meter */}
                <View style={styles.wfcItem}>
                  <Feather name="volume-2" size={14} color={COLORS.textSecondary} />
                  <Text style={styles.wfcItemLabel}>Noise:</Text>
                  <Text style={styles.wfcItemValue}>
                    {shop.noiseLevel === 'quiet_zoom'
                      ? '🎧 Zoom-Call Friendly'
                      : shop.noiseLevel === 'social_loud'
                      ? '☕ Social & Lively Music'
                      : '🎧 Moderate Cafe Ambience'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Philippine Single-Origin Heritage Bean Card */}
            {(shop.beanOrigins && shop.beanOrigins.length > 0) || shop.brewRecipe ? (
              <View style={styles.originCard}>
                <View style={styles.originCardHeader}>
                  <Feather name="feather" size={13} color="#512DA8" />
                  <Text style={styles.originCardTitle}>Philippine Single-Origin Heritage</Text>
                </View>
                <Text style={styles.originCardSub}>
                  Direct-trade beans sourced from local highland farmers:
                </Text>
                <View style={styles.originBadgesRow}>
                  {(shop.beanOrigins ?? ['sagada']).map((origin) => (
                    <View key={origin} style={styles.originBadgePill}>
                      <Text style={styles.originBadgeText}>
                        {origin === 'sagada'
                          ? '🌱 Sagada Arabica'
                          : origin === 'apo'
                          ? '🏔️ Mt. Apo Typica'
                          : origin === 'barako'
                          ? '☕ Cavite Barako (Liberica)'
                          : origin === 'benguet'
                          ? '🌿 Benguet Bourbon'
                          : '🌋 Bukidnon / Matutum'}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {/* Price Range & Popular Highlights */}
            {shop.priceRange && (
              <View style={styles.pricingContainer}>
                <View style={styles.pricingTopRow}>
                  <View style={styles.pricingTitleLeft}>
                    <Feather name="tag" size={13} color={COLORS.primary} />
                    <Text style={styles.pricingSectionTitle}>Price Range</Text>
                  </View>
                  <Text style={styles.priceRangeHighlight}>
                    ₱{shop.priceRange.min} – ₱{shop.priceRange.max}
                    <Text style={styles.priceAvgSubtitle}> (avg ₱{shop.priceRange.average})</Text>
                  </Text>
                </View>

                {shop.menuHighlights && shop.menuHighlights.length > 0 && (
                  <View style={styles.menuList}>
                    {shop.menuHighlights.map((m, idx) => (
                      <View key={idx} style={styles.menuItemRow}>
                        <Text style={styles.menuItemName}>{m.name}</Text>
                        <View style={styles.menuItemDots} />
                        <Text style={styles.menuItemPrice}>₱{m.price}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {shop.fullMenu && shop.fullMenu.length > 0 && (
                  <TouchableOpacity
                    style={styles.viewFullMenuBtn}
                    onPress={() => setMenuModalVisible(true)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.viewFullMenuText}>
                      View Full Drink Menu ({shop.fullMenu.length} items)
                    </Text>
                    <Feather name="chevron-right" size={13} color={COLORS.primary} />
                  </TouchableOpacity>
                )}

                {/* Barista Virtual Tip Jar Button */}
                <TouchableOpacity
                  style={styles.tipBaristaBtn}
                  onPress={() => setTipModalVisible(true)}
                  activeOpacity={0.85}
                >
                  <View style={styles.tipBtnLeft}>
                    <View style={styles.gcashDotSmall} />
                    <Text style={styles.tipBtnText}>Tip the Baristas (GCash)</Text>
                  </View>
                  <Feather name="gift" size={14} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
            )}

            {/* Action Row */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.directionsBtn}
                onPress={handleInAppRoute}
                activeOpacity={0.88}
              >
                <Feather name="navigation" size={15} color="#fff" />
                <Text style={styles.directionsBtnText}>
                  Navigate In-App{distanceText}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.externalMapsBtn}
                onPress={handleDirections}
                activeOpacity={0.8}
              >
                <Feather name="map" size={19} color={COLORS.primary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.shareActionBtn}
                onPress={handleShareShop}
                activeOpacity={0.8}
              >
                <Feather name="share-2" size={19} color={COLORS.primary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.heartBtn}
                onPress={handleFavoritePress}
                activeOpacity={0.8}
              >
                <Feather
                  name="heart"
                  size={19}
                  color={favorited ? COLORS.danger : COLORS.border}
                />
              </TouchableOpacity>
            </View>

            {/* Address & Contacts */}
            <View style={styles.contactDetails}>
              <View style={styles.infoRow}>
                <Feather name="map-pin" size={14} color={COLORS.textMuted} />
                <Text style={styles.infoText}>
                  {shop.formattedAddress ?? shop.vicinity}
                </Text>
              </View>

              {shop.phoneNumber && (
                <TouchableOpacity style={styles.infoRow} onPress={handleCall}>
                  <Feather name="phone" size={14} color={COLORS.textMuted} />
                  <Text style={[styles.infoText, styles.linkText]}>
                    {shop.phoneNumber}
                  </Text>
                </TouchableOpacity>
              )}

              {shop.website && (
                <TouchableOpacity style={styles.infoRow} onPress={handleWebsite}>
                  <Feather name="globe" size={14} color={COLORS.textMuted} />
                  <Text style={[styles.infoText, styles.linkText]}>
                    {shop.website}
                  </Text>
                </TouchableOpacity>
              )}

              {shop.openingHours?.weekdayText && (
                <View style={styles.hoursContainer}>
                  <TouchableOpacity
                    style={styles.hoursToggleRow}
                    onPress={() => setHoursExpanded(!hoursExpanded)}
                  >
                    <Feather name="clock" size={14} color={COLORS.textMuted} />
                    <Text style={styles.hoursTitle}>Opening Hours</Text>
                    <Feather
                      name={hoursExpanded ? 'chevron-up' : 'chevron-down'}
                      size={14}
                      color={COLORS.textSecondary}
                    />
                  </TouchableOpacity>
                  {hoursExpanded &&
                    shop.openingHours.weekdayText.map((line, idx) => (
                      <Text key={idx} style={styles.hoursLine}>
                        {line}
                      </Text>
                    ))}
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Phase 2: Fresh Roastery Beans Marketplace & Pre-Orders */}
        <ShopBeansSection
          shopId={shop.id}
          shopName={shop.name}
          onOpenCart={() => setCartModalVisible(true)}
        />

        {/* Phase 2: Barista Cupping Sessions & Pop-Up Events */}
        <ShopEventsSection
          shopId={shop.id}
          shopName={shop.name}
          onSelectEvent={(ev) => {
            setSelectedEvent(ev);
            setEventModalVisible(true);
          }}
        />

        {/* Phase 2: Sensory Profile Summary */}
        <TastingRadarSummary reviews={shopReviews} />

        {/* Phase 2: Live Community Reviews & Cupping Feed */}
        <ReviewsList
          reviews={shopReviews}
          onWriteReviewPress={() => setComposerModalVisible(true)}
        />

        {/* Community Insider Tips Board (Plugs, Parking, Off-Menu) */}
        <InsiderTipsSection shop={shop} />

        {/* Community Tasting Notes & Barista Brew Recipes Section */}
        <TastingNotesSection shop={shop} />

        {/* Owner Portal SaaS Promo Banner */}
        <TouchableOpacity
          style={styles.ownerBanner}
          onPress={handleOwnerPortal}
          activeOpacity={0.88}
        >
          <View style={styles.ownerIconBox}>
            <Feather name="briefcase" size={20} color={COLORS.primary} />
          </View>
          <View style={styles.ownerTextContent}>
            <Text style={styles.ownerTitle}>Shop Owner? Claim Your Listing</Text>
            <Text style={styles.ownerSubtitle}>
              Manage live status, analytics, and loyalty stamps in the Owner Portal.
            </Text>
          </View>
          <Feather name="chevron-right" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>
      </ScrollView>

      {/* Full Digital Drink Menu Modal */}
      <Modal
        visible={menuModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setMenuModalVisible(false)}
      >
        <View style={styles.menuModalOverlay}>
          <View style={styles.menuModalSheet}>
            <View style={styles.menuModalHeader}>
              <View>
                <Text style={styles.menuModalTitle}>{shop.name}</Text>
                <Text style={styles.menuModalSub}>Specialty Beverage & Brew Menu</Text>
              </View>
              <TouchableOpacity
                onPress={() => setMenuModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Feather name="x" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Category Filter Tabs */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.menuCategoryTabs}
              contentContainerStyle={styles.menuCategoryTabsContent}
            >
              {['All', 'Espresso Bar', 'Filter & Pour-Over', 'Milk Coffee', 'Signatures & Cold'].map(
                (cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.menuCategoryPill,
                      menuActiveCategory === cat && styles.menuCategoryPillActive,
                    ]}
                    onPress={() => setMenuActiveCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.menuCategoryPillText,
                        menuActiveCategory === cat && styles.menuCategoryPillTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ),
              )}
            </ScrollView>

            {/* Drink List */}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.menuItemsList}>
              {(shop.fullMenu ?? [])
                .filter((item) => menuActiveCategory === 'All' || item.category === menuActiveCategory)
                .map((item, idx) => (
                  <View key={idx} style={styles.fullMenuItemCard}>
                    <View style={styles.fullMenuItemTop}>
                      <Text style={styles.fullMenuItemName}>{item.name}</Text>
                      <Text style={styles.fullMenuItemPrice}>₱{item.price}</Text>
                    </View>
                    {item.description && (
                      <Text style={styles.fullMenuItemDesc}>{item.description}</Text>
                    )}
                    <View style={styles.itemCategoryBadge}>
                      <Text style={styles.itemCategoryBadgeText}>{item.category}</Text>
                    </View>
                  </View>
                ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Barista Virtual Tip Jar Modal */}
      <Modal
        visible={tipModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setTipModalVisible(false)}
      >
        <View style={styles.menuModalOverlay}>
          <View style={styles.tipModalCard}>
            <View style={styles.tipModalHeader}>
              <View style={styles.tipHeaderTitleCol}>
                <Text style={styles.tipModalTitle}>Barista Tip Jar</Text>
                <Text style={styles.tipModalSub}>
                  Support the specialty craft baristas at {shop.name}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setTipModalVisible(false)}>
                <Feather name="x" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.tipAmountPrompt}>Choose tip amount:</Text>
            <View style={styles.tipAmountsRow}>
              {[20, 50, 100, 200].map((amt) => (
                <TouchableOpacity
                  key={amt}
                  style={[
                    styles.tipAmountChip,
                    selectedTipAmount === amt && styles.tipAmountChipActive,
                  ]}
                  onPress={() => {
                    hapticSelection();
                    setSelectedTipAmount(amt);
                  }}
                >
                  <Text
                    style={[
                      styles.tipAmountText,
                      selectedTipAmount === amt && styles.tipAmountTextActive,
                    ]}
                  >
                    ₱{amt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.merchantGcashBox}>
              <View style={styles.gcashHeaderRow}>
                <View style={styles.gcashDotLarge} />
                <Text style={styles.merchantGcashTitle}>GCash Direct / QR</Text>
              </View>
              <Text style={styles.merchantGcashNumber}>
                {shop.merchantGcashNumber ?? '0917-888-2233'}
              </Text>
              <Text style={styles.merchantGcashName}>
                Verified Account: {shop.name} Barista Fund
              </Text>
            </View>

            <TouchableOpacity
              style={styles.sendTipSubmitBtn}
              onPress={handleSendGcashTip}
              activeOpacity={0.88}
            >
              <Feather name="send" size={16} color="#FFFFFF" />
              <Text style={styles.sendTipSubmitText}>
                Send ₱{selectedTipAmount} Tip via GCash
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Phase 2: Review Composer Modal */}
      <ReviewComposerModal
        visible={composerModalVisible}
        shopId={shop.id}
        shopName={shop.name}
        onClose={() => setComposerModalVisible(false)}
      />

      {/* Phase 2: Roastery Beans Cart Modal */}
      <CartModal
        visible={cartModalVisible}
        onClose={() => setCartModalVisible(false)}
      />

      {/* Phase 2: Event Details & RSVP Modal */}
      <EventDetailModal
        event={selectedEvent}
        visible={eventModalVisible}
        onClose={() => {
          setEventModalVisible(false);
          setSelectedEvent(null);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.sm,
  },
  backBtn: {
    paddingRight: SPACING.xs,
  },
  backIcon: {
    fontSize: 28,
    color: COLORS.primary,
    fontWeight: '300',
  },
  topTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  topActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  favoriteCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  favoriteIcon: {
    fontSize: 16,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 40,
    gap: SPACING.md,
  },
  mainCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
  },
  cardBody: {
    padding: SPACING.md,
    gap: SPACING.sm + 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  titleText: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  verifiedBadge: {
    backgroundColor: '#27AE60',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedCheck: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  ratingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  vibeTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginVertical: 2,
  },
  vibePill: {
    borderRadius: RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  vibePillGreen: {
    backgroundColor: COLORS.primary,
  },
  vibePillBrown: {
    backgroundColor: COLORS.tagBrown,
  },
  vibeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  vibeTextGreen: {
    color: '#FFFFFF',
  },
  vibeTextBrown: {
    color: '#FFFFFF',
  },
  wfcScorecard: {
    backgroundColor: '#EAF4EE',
    borderRadius: RADIUS.md,
    padding: SPACING.md - 2,
    gap: 8,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#D0E7D8',
  },
  wfcHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(42, 71, 54, 0.12)',
    paddingBottom: 4,
  },
  wfcHeaderTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  wfcGrid: {
    gap: 6,
  },
  wfcItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  wfcItemLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  wfcItemValue: {
    fontSize: 12,
    color: COLORS.textSecondary,
    flex: 1,
  },
  wfcValueGreen: {
    color: '#1B5E20',
    fontWeight: '700',
  },
  wfcValueOrange: {
    color: '#E65100',
    fontWeight: '700',
  },
  wfcValueRed: {
    color: '#C62828',
    fontWeight: '700',
  },
  originCard: {
    backgroundColor: '#F3E5F5',
    borderRadius: RADIUS.md,
    padding: SPACING.md - 2,
    gap: 6,
    marginTop: 2,
    borderWidth: 1,
    borderColor: '#E1BEE7',
  },
  originCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  originCardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#512DA8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  originCardSub: {
    fontSize: 11,
    color: '#5E35B1',
  },
  originBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 2,
  },
  originBadgePill: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#D1C4E9',
  },
  originBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4A148C',
  },
  pricingContainer: {
    backgroundColor: COLORS.surfaceSage,
    borderRadius: RADIUS.md,
    padding: SPACING.md - 2,
    gap: 8,
    marginTop: 4,
  },
  pricingTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pricingTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  pricingSectionTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.primary,
  },
  priceRangeHighlight: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
  },
  priceAvgSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  menuList: {
    gap: 5,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(42, 71, 54, 0.12)',
  },
  menuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuItemName: {
    fontSize: 12,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  menuItemDots: {
    flex: 1,
    height: 1,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(42, 71, 54, 0.15)',
    borderStyle: 'dashed',
    marginHorizontal: 8,
  },
  menuItemPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  amenityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    fontSize: 10,
    marginRight: 6,
  },
  amenityIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  amenityLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  amenityValue: {
    fontSize: 12.5,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  directionsBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  directionsBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  externalMapsBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
  shareActionBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
  externalMapsIcon: {
    fontSize: 18,
  },
  heartBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
  heartBtnIcon: {
    fontSize: 18,
  },
  contactDetails: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    gap: SPACING.xs + 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoIcon: {
    fontSize: 14,
    width: 20,
    textAlign: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  linkText: {
    color: COLORS.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  hoursContainer: {
    marginTop: SPACING.xs,
  },
  hoursToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  hoursTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flex: 1,
  },
  hoursArrow: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  hoursLine: {
    fontSize: 12,
    color: COLORS.textSecondary,
    paddingLeft: 24,
    lineHeight: 18,
  },
  ownerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF5ED',
    borderRadius: RADIUS.md,
    padding: SPACING.md - 2,
    borderWidth: 1.2,
    borderColor: '#EBDDC9',
    gap: SPACING.sm,
  },
  ownerIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3E5D3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownerIcon: {
    fontSize: 16,
  },
  ownerTextContent: {
    flex: 1,
  },
  ownerTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#422B18',
  },
  ownerSubtitle: {
    fontSize: 11.5,
    color: '#6E5540',
    marginTop: 1,
    lineHeight: 16,
  },
  ownerArrow: {
    fontSize: 20,
    color: '#A88B70',
    fontWeight: '300',
  },
  viewFullMenuBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: RADIUS.sm,
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(42, 71, 54, 0.15)',
  },
  viewFullMenuText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  menuModalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  menuModalSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    padding: SPACING.lg,
    maxHeight: '85%',
    gap: SPACING.sm,
  },
  menuModalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: 4,
  },
  menuModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  menuModalSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  menuCategoryTabs: {
    marginVertical: 4,
  },
  menuCategoryTabsContent: {
    gap: 6,
    paddingRight: SPACING.md,
  },
  menuCategoryPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  menuCategoryPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  menuCategoryPillText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  menuCategoryPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  menuItemsList: {
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
    paddingBottom: 30,
  },
  fullMenuItemCard: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm + 4,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: 4,
  },
  fullMenuItemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fullMenuItemName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  fullMenuItemPrice: {
    fontSize: 13.5,
    fontWeight: '800',
    color: COLORS.primary,
  },
  fullMenuItemDesc: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  itemCategoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.surfaceSage,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  itemCategoryBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: COLORS.primary,
  },
  tipBaristaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F3F8F5',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: '#CDE5D7',
    marginTop: 4,
  },
  tipBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  gcashDotSmall: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.gcash,
  },
  tipBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  tipModalCard: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  tipModalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  tipHeaderTitleCol: {
    flex: 1,
  },
  tipModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  tipModalSub: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  tipAmountPrompt: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  tipAmountsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tipAmountChip: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingVertical: 12,
    borderRadius: RADIUS.sm,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipAmountChipActive: {
    backgroundColor: COLORS.surfaceSage,
    borderColor: COLORS.primary,
  },
  tipAmountText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  tipAmountTextActive: {
    color: COLORS.primary,
    fontWeight: '900',
  },
  merchantGcashBox: {
    backgroundColor: '#F0F7FF',
    borderRadius: RADIUS.sm,
    padding: 12,
    borderWidth: 1,
    borderColor: '#C7E1FC',
    gap: 3,
  },
  gcashHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  gcashDotLarge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.gcash,
  },
  merchantGcashTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#005BBB',
  },
  merchantGcashNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  merchantGcashName: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  sendTipSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gcash,
    paddingVertical: 14,
    borderRadius: RADIUS.full,
    gap: 8,
    marginTop: 4,
  },
  sendTipSubmitText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
