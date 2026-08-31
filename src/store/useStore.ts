// ============================================================
// Zustand Global Store — Specialty Coffee Edition (With Claims & Price Tiers)
// ============================================================

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  CoffeeShop,
  Filters,
  Location,
  LiveSeatingStatus,
  TastingNote,
  RegionHub,
  MapTypeOption,
  OwnerClaimRequest,
  PriceTierFilter,
  HeartbeatEvent,
  NavigationMode,
  CommunityReview,
  CoffeeBean,
  CartItem,
  CoffeeEvent,
  EventRSVP,
  GrindType,
} from '@types';
import { DEFAULT_FILTERS } from '@types';
import { searchNearbyCoffee } from '@services/googlePlaces';
import { REGION_HUBS } from '@constants';
import {
  submitClaimToFirestore,
  approveClaimInFirestore,
  rejectClaimInFirestore,
  subscribeToFirestoreClaims,
} from '@services/firebase';
import {
  logSearchEvent,
  logFilterEvent,
  logNavigationEvent,
  logFavoriteEvent,
  logTrekPackDownloaded,
} from '@services/analytics';
import type { User } from 'firebase/auth';

const FAVORITES_KEY = '@coffee_finder:favorites_v2';
const TASTING_NOTES_KEY = '@coffee_finder:tasting_notes_v2';
const CACHED_SHOPS_KEY = '@coffee_finder:cached_shops_v2';
const MAP_TYPE_KEY = '@coffee_finder:map_type_v1';
const CLAIMS_KEY = '@coffee_finder:claims_v1';
const TREK_PACKS_KEY = '@coffee_finder:trek_packs_v1';
const REVIEWS_KEY = '@coffee_finder:reviews_v2';
const CART_KEY = '@coffee_finder:cart_v2';
const RSVPS_KEY = '@coffee_finder:rsvps_v2';

interface AppState {
  // ---- location & regional hubs ----
  userLocation: Location;
  userHeading: number;
  currentRegion: RegionHub;
  mapType: MapTypeOption;
  setUserLocation: (loc: Location) => void;
  setUserHeading: (heading: number) => void;
  setRegion: (region: RegionHub) => void;
  setMapType: (type: MapTypeOption) => void;

  // ---- in-app map navigation mode ----
  activeNavigationShop: CoffeeShop | null;
  navigationMode: NavigationMode;
  setNavigationMode: (mode: NavigationMode) => void;
  startNavigation: (shop: CoffeeShop, mode?: NavigationMode) => void;
  stopNavigation: () => void;

  // ---- shops ----
  shops: CoffeeShop[];
  isLoading: boolean;
  isOffline: boolean;
  error: string | null;
  fetchNearbyShops: (location?: Location) => Promise<void>;

  // ---- selected shop ----
  selectedShop: CoffeeShop | null;
  setSelectedShop: (shop: CoffeeShop | null) => void;

  // ---- filters ----
  filters: Filters;
  setFilters: (filters: Partial<Filters>) => void;
  setCategory: (category: Filters['activeCategory']) => void;
  setPriceTier: (tier: PriceTierFilter) => void;
  setSearchQuery: (query: string) => void;
  toggleGcashOnly: () => void;
  applyFilters: () => void;

  // ---- community tasting notes ----
  customTastingNotes: Record<string, TastingNote[]>;
  loadTastingNotes: () => Promise<void>;
  addTastingNote: (note: Omit<TastingNote, 'id' | 'createdAt'>) => Promise<void>;
  getShopTastingNotes: (shopId: string) => TastingNote[];

  // ---- user & auth ----
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;

  // ---- owner claims & admin verification ----
  claimRequests: OwnerClaimRequest[];
  verifiedOwnerShopIds: string[];
  loadClaims: () => Promise<void>;
  submitClaim: (request: Omit<OwnerClaimRequest, 'id' | 'submittedAt' | 'status'>) => void;
  approveClaim: (claimId: string) => void;
  rejectClaim: (claimId: string, reason: string) => void;
  deleteClaim: (claimId: string) => void;
  revokeClaim: (claimId: string) => void;
  isShopClaimed: (shopId: string) => boolean;

  // ---- owner portal (SaaS live updates) ----
  updateShopLiveStatus: (
    shopId: string,
    seatingStatus: LiveSeatingStatus,
    wifiSpeed?: string,
  ) => void;

  // ---- admin moderation & shop management ----
  adminUpdateShop: (shopId: string, updates: Partial<CoffeeShop>) => void;
  adminDeleteShop: (shopId: string) => void;
  adminToggleShopVerified: (shopId: string) => void;
  adminCreateShop: (newShop: CoffeeShop) => void;

  // ---- favorites ----
  favorites: CoffeeShop[];
  loadFavorites: () => Promise<void>;
  toggleFavorite: (shop: CoffeeShop) => Promise<void>;
  isFavorite: (id: string) => boolean;

  // ---- offline mountain trek packs ----
  downloadedTrekPacks: string[];
  loadTrekPacks: () => Promise<void>;
  downloadTrekPack: (region: RegionHub) => Promise<void>;
  removeTrekPack: (regionId: string) => Promise<void>;
  isTrekPackDownloaded: (regionId: string) => boolean;

  // ---- live owner heartbeat notifications ----
  liveHeartbeatEvents: HeartbeatEvent[];
  addHeartbeatEvent: (event: Omit<HeartbeatEvent, 'id' | 'timestamp' | 'timeAgo'>) => void;

  // ---- Phase 2: Community Reviews & Tasting Feed ----
  reviews: CommunityReview[];
  loadReviews: () => Promise<void>;
  submitReview: (review: Omit<CommunityReview, 'id' | 'createdAt' | 'helpfulCount'>) => Promise<void>;
  voteReviewHelpful: (reviewId: string) => void;

  // ---- Phase 2: Coffee Bean Marketplace & Roastery Pre-Orders ----
  beans: CoffeeBean[];
  cart: CartItem[];
  loadCart: () => Promise<void>;
  addToCart: (bean: CoffeeBean, grind: GrindType, quantity?: number) => void;
  removeFromCart: (cartItemId: string) => void;
  updateCartQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  checkoutOrder: (deliveryAddress: string, paymentMethod: string) => Promise<boolean>;

  // ---- Phase 2: Barista Cupping, Workshops & Pop-up Events ----
  events: CoffeeEvent[];
  myRsvps: EventRSVP[];
  loadEvents: () => Promise<void>;
  rsvpEvent: (eventId: string) => void;
  cancelRSVP: (eventId: string) => void;
}

export const useStore = create<AppState>((set, get) => ({
  // Default to Metro Manila (Tomas Morato)
  currentRegion: REGION_HUBS[0],
  userLocation: {
    latitude: REGION_HUBS[0].latitude,
    longitude: REGION_HUBS[0].longitude,
  },
  userHeading: 0,
  mapType: 'standard',

  setUserLocation: (loc) => {
    set({ userLocation: loc });
  },
  setUserHeading: (heading) => {
    set({ userHeading: heading });
  },
  setRegion: (region) => {
    const loc = { latitude: region.latitude, longitude: region.longitude };
    set({ currentRegion: region, userLocation: loc });
    get().fetchNearbyShops(loc);
  },
  setMapType: (mapType) => {
    set({ mapType });
    try {
      AsyncStorage.setItem(MAP_TYPE_KEY, mapType);
    } catch {}
  },

  // ---- In-App Map Navigation Mode ----
  activeNavigationShop: null,
  navigationMode: 'walking',
  setNavigationMode: (mode) => set({ navigationMode: mode }),
  startNavigation: (shop, mode) => {
    set({
      activeNavigationShop: shop,
      selectedShop: shop,
      ...(mode ? { navigationMode: mode } : {}),
    });
    logNavigationEvent(shop.id, shop.name, mode || get().navigationMode, shop.distance ?? 650);
    get().addHeartbeatEvent({
      shopId: shop.id,
      shopName: shop.name,
      type: 'navigation',
      message: `A coffee lover is navigating to ${shop.name} (${mode || get().navigationMode} mode)!`,
    });
  },
  stopNavigation: () => set({ activeNavigationShop: null }),

  // ---- shops & offline cache ----
  shops: [],
  isLoading: false,
  isOffline: false,
  error: null,

  fetchNearbyShops: async (location?: Location) => {
    const loc = location ?? get().userLocation;
    set({ isLoading: true, error: null });
    try {
      const shops = await searchNearbyCoffee(loc, get().filters);
      set({ shops, isLoading: false, isOffline: false });
      if (get().filters.searchQuery.trim()) {
        logSearchEvent(get().filters.searchQuery.trim(), get().currentRegion.id, shops.length);
      }
      try {
        await AsyncStorage.setItem(CACHED_SHOPS_KEY, JSON.stringify(shops));
      } catch {}
    } catch {
      try {
        const cached = await AsyncStorage.getItem(CACHED_SHOPS_KEY);
        if (cached) {
          set({ shops: JSON.parse(cached), isLoading: false, isOffline: true });
          return;
        }
      } catch {}
      set({ isLoading: false, isOffline: true });
    }
  },

  // ---- selected shop ----
  selectedShop: null,
  setSelectedShop: (shop) => set({ selectedShop: shop }),

  // ---- filters ----
  filters: DEFAULT_FILTERS,

  setFilters: (newFilters) => {
    const filters = { ...get().filters, ...newFilters };
    set({ filters });
    logFilterEvent('batch_filters', newFilters);
    get().fetchNearbyShops();
  },

  setCategory: (activeCategory) => {
    const filters = { ...get().filters, activeCategory };
    set({ filters });
    logFilterEvent('category', activeCategory);
    get().fetchNearbyShops();
  },

  setPriceTier: (priceTier) => {
    const filters = { ...get().filters, priceTier };
    set({ filters });
    logFilterEvent('price_tier', priceTier);
    get().fetchNearbyShops();
  },

  setSearchQuery: (searchQuery) => {
    const filters = { ...get().filters, searchQuery };
    set({ filters });
    get().fetchNearbyShops();
  },

  toggleGcashOnly: () => {
    const filters = { ...get().filters, gcashOnly: !get().filters.gcashOnly };
    set({ filters });
    logFilterEvent('gcash_only', filters.gcashOnly);
    get().fetchNearbyShops();
  },

  applyFilters: () => {
    const loc = get().userLocation;
    get().fetchNearbyShops(loc);
  },

  // ---- community tasting notes ----
  customTastingNotes: {},

  loadTastingNotes: async () => {
    try {
      const raw = await AsyncStorage.getItem(TASTING_NOTES_KEY);
      if (raw) set({ customTastingNotes: JSON.parse(raw) });

      const savedMapType = await AsyncStorage.getItem(MAP_TYPE_KEY);
      if (savedMapType) set({ mapType: savedMapType as MapTypeOption });

      get().loadClaims();
    } catch {}
  },

  addTastingNote: async (noteData) => {
    const newNote: TastingNote = {
      ...noteData,
      id: `tn-user-${Date.now()}`,
      createdAt: 'Just now',
    };

    const currentNotes = get().customTastingNotes[noteData.shopId] ?? [];
    const updated = {
      ...get().customTastingNotes,
      [noteData.shopId]: [newNote, ...currentNotes],
    };

    set({ customTastingNotes: updated });
    try {
      await AsyncStorage.setItem(TASTING_NOTES_KEY, JSON.stringify(updated));
    } catch {}
  },

  getShopTastingNotes: (shopId: string) => {
    const shop = get().shops.find((s) => s.id === shopId);
    const builtIn = shop?.tastingNotes ?? [];
    const userAdded = get().customTastingNotes[shopId] ?? [];
    return [...userAdded, ...builtIn];
  },

  // ---- user & auth ----
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),

  // ---- owner claims & admin verification ----
  claimRequests: [
    {
      id: 'claim-init-1',
      shopId: 'ph-yardstick-coffee',
      shopName: 'Yardstick Coffee',
      ownerFullName: 'Andre Chanco',
      businessEmail: 'andre@yardstickcoffee.com',
      phoneNumber: '+63 917 888 1234',
      dtiOrSecNumber: 'DTI-NCR-2023-991204',
      permitType: 'DTI Registration',
      submittedAt: 'Yesterday, 3:15 PM',
      status: 'pending',
    },
  ],
  verifiedOwnerShopIds: ['ph-chapter-coffee'],

  loadClaims: async () => {
    try {
      const raw = await AsyncStorage.getItem(CLAIMS_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        set({ claimRequests: saved });
      }

      // Listen for real-time Cloud Firestore updates (Free Spark plan)
      subscribeToFirestoreClaims((cloudClaims) => {
        if (cloudClaims && cloudClaims.length > 0) {
          set({ claimRequests: cloudClaims });
        }
      });
    } catch {}
  },

  submitClaim: (reqData) => {
    const newClaim: OwnerClaimRequest = {
      ...reqData,
      id: `claim-${Date.now()}`,
      submittedAt: 'Just now',
      status: 'pending',
    };
    const updated = [newClaim, ...get().claimRequests];
    set({ claimRequests: updated });
    try {
      AsyncStorage.setItem(CLAIMS_KEY, JSON.stringify(updated));
      // Cloud Firestore sync (runs safely in background)
      submitClaimToFirestore(newClaim).catch(() => {});
    } catch {}
  },

  approveClaim: (claimId) => {
    const updated = get().claimRequests.map((c) =>
      c.id === claimId
        ? {
            ...c,
            status: 'verified' as const,
            reviewedAt: 'Just now',
          }
        : c,
    );
    const approved = get().claimRequests.find((c) => c.id === claimId);
    const verifiedShopIds = approved
      ? [...new Set([...get().verifiedOwnerShopIds, approved.shopId])]
      : get().verifiedOwnerShopIds;

    set({ claimRequests: updated, verifiedOwnerShopIds: verifiedShopIds });
    try {
      AsyncStorage.setItem(CLAIMS_KEY, JSON.stringify(updated));
      // Cloud Firestore sync
      approveClaimInFirestore(claimId).catch(() => {});
    } catch {}
  },

  rejectClaim: (claimId, reason) => {
    const updated = get().claimRequests.map((c) =>
      c.id === claimId
        ? {
            ...c,
            status: 'rejected' as const,
            rejectionReason: reason,
            reviewedAt: 'Just now',
          }
        : c,
    );
    set({ claimRequests: updated });
    try {
      AsyncStorage.setItem(CLAIMS_KEY, JSON.stringify(updated));
      // Cloud Firestore sync
      rejectClaimInFirestore(claimId, reason).catch(() => {});
    } catch {}
  },

  deleteClaim: (claimId) => {
    const claim = get().claimRequests.find((c) => c.id === claimId);
    const updated = get().claimRequests.filter((c) => c.id !== claimId);
    const updatedVerified = claim
      ? get().verifiedOwnerShopIds.filter((id) => id !== claim.shopId)
      : get().verifiedOwnerShopIds;

    set({ claimRequests: updated, verifiedOwnerShopIds: updatedVerified });
    try {
      AsyncStorage.setItem(CLAIMS_KEY, JSON.stringify(updated));
    } catch {}
  },

  revokeClaim: (claimId) => {
    const claim = get().claimRequests.find((c) => c.id === claimId);
    const updated = get().claimRequests.map((c) =>
      c.id === claimId
        ? {
            ...c,
            status: 'rejected' as const,
            rejectionReason: 'Verification revoked by administrator upon fraud / document audit.',
            reviewedAt: 'Just now',
          }
        : c,
    );
    const updatedVerified = claim
      ? get().verifiedOwnerShopIds.filter((id) => id !== claim.shopId)
      : get().verifiedOwnerShopIds;

    set({ claimRequests: updated, verifiedOwnerShopIds: updatedVerified });
    try {
      AsyncStorage.setItem(CLAIMS_KEY, JSON.stringify(updated));
    } catch {}
  },

  isShopClaimed: (shopId: string) => {
    return (
      get().verifiedOwnerShopIds.includes(shopId) ||
      get().claimRequests.some((c) => c.shopId === shopId && c.status === 'pending')
    );
  },

  // ---- owner portal SaaS update ----
  updateShopLiveStatus: (shopId, seatingStatus, wifiSpeed) => {
    set((state) => ({
      shops: state.shops.map((s) =>
        s.id === shopId
          ? {
              ...s,
              seatingStatus,
              wifiSpeed: wifiSpeed ?? s.wifiSpeed,
            }
          : s,
      ),
      selectedShop:
        state.selectedShop?.id === shopId
          ? {
              ...state.selectedShop,
              seatingStatus,
              wifiSpeed: wifiSpeed ?? state.selectedShop.wifiSpeed,
            }
          : state.selectedShop,
    }));
  },

  // ---- admin moderation & shop management ----
  adminUpdateShop: (shopId, updates) => {
    set((state) => ({
      shops: state.shops.map((s) => (s.id === shopId ? { ...s, ...updates } : s)),
      selectedShop:
        state.selectedShop?.id === shopId ? { ...state.selectedShop, ...updates } : state.selectedShop,
    }));
  },

  adminDeleteShop: (shopId) => {
    set((state) => ({
      shops: state.shops.filter((s) => s.id !== shopId),
      selectedShop: state.selectedShop?.id === shopId ? null : state.selectedShop,
      favorites: state.favorites.filter((s) => s.id !== shopId),
      verifiedOwnerShopIds: state.verifiedOwnerShopIds.filter((id) => id !== shopId),
    }));
  },

  adminToggleShopVerified: (shopId) => {
    set((state) => {
      const isCurrentlyVerified = state.verifiedOwnerShopIds.includes(shopId);
      const newVerified = isCurrentlyVerified
        ? state.verifiedOwnerShopIds.filter((id) => id !== shopId)
        : [...state.verifiedOwnerShopIds, shopId];

      return {
        verifiedOwnerShopIds: newVerified,
        shops: state.shops.map((s) =>
          s.id === shopId ? { ...s, isVerified: !isCurrentlyVerified } : s,
        ),
      };
    });
  },

  adminCreateShop: (newShop) => {
    set((state) => ({
      shops: [newShop, ...state.shops],
    }));
  },

  // ---- favorites ----
  favorites: [],

  loadFavorites: async () => {
    try {
      const raw = await AsyncStorage.getItem(FAVORITES_KEY);
      if (raw) set({ favorites: JSON.parse(raw) });
    } catch {}
  },

  toggleFavorite: async (shop: CoffeeShop) => {
    const { favorites } = get();
    const exists = favorites.some((f) => f.id === shop.id);
    const updated = exists ? favorites.filter((f) => f.id !== shop.id) : [...favorites, shop];
    set({ favorites: updated });
    logFavoriteEvent(shop.id, shop.name, !exists);
    if (!exists) {
      get().addHeartbeatEvent({
        shopId: shop.id,
        shopName: shop.name,
        type: 'favorite',
        message: `A coffee lover added ${shop.name} to their saved spots!`,
      });
    }
    try {
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
    } catch {}
  },

  isFavorite: (id: string) => get().favorites.some((f) => f.id === id),

  // ---- offline mountain trek packs ----
  downloadedTrekPacks: [],
  loadTrekPacks: async () => {
    try {
      const raw = await AsyncStorage.getItem(TREK_PACKS_KEY);
      if (raw) set({ downloadedTrekPacks: JSON.parse(raw) });
    } catch {}
  },
  downloadTrekPack: async (region) => {
    try {
      const current = get().downloadedTrekPacks;
      if (!current.includes(region.id)) {
        const updated = [...current, region.id];
        set({ downloadedTrekPacks: updated });
        await AsyncStorage.setItem(TREK_PACKS_KEY, JSON.stringify(updated));
        logTrekPackDownloaded(region.id, region.name);
      }
    } catch {}
  },
  removeTrekPack: async (regionId) => {
    try {
      const updated = get().downloadedTrekPacks.filter((id) => id !== regionId);
      set({ downloadedTrekPacks: updated });
      await AsyncStorage.setItem(TREK_PACKS_KEY, JSON.stringify(updated));
    } catch {}
  },
  isTrekPackDownloaded: (regionId) => {
    return get().downloadedTrekPacks.includes(regionId);
  },

  // ---- live owner heartbeat notifications ----
  liveHeartbeatEvents: [
    {
      id: 'hb-1',
      shopId: 'ph-chapter-coffee',
      shopName: 'Chapter Coffee Roasters',
      type: 'navigation',
      message: 'A coffee lover started navigating to Chapter Coffee (Walk mode)',
      timeAgo: 'Just now',
      timestamp: Date.now() - 60000,
    },
    {
      id: 'hb-2',
      shopId: 'ph-yardstick',
      shopName: 'Yardstick Coffee',
      type: 'favorite',
      message: 'A user saved your Golden Ticket espresso to their Coffee Passport',
      timeAgo: '12m ago',
      timestamp: Date.now() - 720000,
    },
  ],
  addHeartbeatEvent: (ev) => {
    const newEvent: HeartbeatEvent = {
      id: `hb-${Date.now()}`,
      timestamp: Date.now(),
      timeAgo: 'Just now',
      ...ev,
    };
    set((s) => ({
      liveHeartbeatEvents: [newEvent, ...s.liveHeartbeatEvents].slice(0, 10),
    }));
  },

  // ============================================================
  // PHASE 2 IMPLEMENTATIONS: Reviews, Beans Marketplace & Events
  // ============================================================

  reviews: [
    {
      id: 'rev-1',
      shopId: 'ph-chapter-coffee',
      userId: 'user-101',
      userName: 'Kaye B.',
      rating: 5,
      brewMethod: 'V60 Pour Over',
      beanOriginTag: 'apo',
      flavorTags: ['Wild Berry', 'Brown Sugar', 'Dark Chocolate'],
      acidity: 4,
      sweetness: 5,
      body: 4,
      comment: 'The Mt. Apo Anaerobic pour-over here is world class. Super vibrant strawberry notes with a silky cacao finish. Ample power sockets too!',
      helpfulCount: 14,
      createdAt: '2 days ago',
    },
    {
      id: 'rev-2',
      shopId: 'ph-yardstick',
      userId: 'user-102',
      userName: 'Carlos D.',
      rating: 5,
      brewMethod: 'Espresso',
      beanOriginTag: 'benguet',
      flavorTags: ['Citrus & Bergamot', 'Caramel'],
      acidity: 4,
      sweetness: 4,
      body: 5,
      comment: 'Flawless Golden Ticket flat white. Great barista conversation and clean industrial aesthetic.',
      helpfulCount: 9,
      createdAt: '5 days ago',
    },
    {
      id: 'rev-3',
      shopId: 'ph-sagada-brew',
      userId: 'user-103',
      userName: 'Bea M.',
      rating: 5,
      brewMethod: 'French Press',
      beanOriginTag: 'sagada',
      flavorTags: ['Floral', 'Brown Sugar'],
      acidity: 3,
      sweetness: 5,
      body: 4,
      comment: 'Drinking Sagada Typica while overlooking the Mountain Province pine trees. Pure tranquility.',
      helpfulCount: 22,
      createdAt: '1 week ago',
    },
    {
      id: 'rev-4',
      shopId: 'ph-el-union',
      userId: 'user-104',
      userName: 'Migs R.',
      rating: 5,
      brewMethod: 'Cold Brew',
      flavorTags: ['Caramel', 'Tropical Fruit'],
      acidity: 3,
      sweetness: 4,
      body: 5,
      comment: 'Best Dirty Horchata and cold brew on the coast. Sunset view makes the coffee taste even better.',
      helpfulCount: 18,
      createdAt: '3 days ago',
    },
  ],

  loadReviews: async () => {
    try {
      const stored = await AsyncStorage.getItem(REVIEWS_KEY);
      if (stored) {
        set({ reviews: JSON.parse(stored) });
      }
    } catch {}
  },

  submitReview: async (reviewData) => {
    const newRev: CommunityReview = {
      id: `rev-${Date.now()}`,
      createdAt: 'Just now',
      helpfulCount: 0,
      ...reviewData,
    };
    const updated = [newRev, ...get().reviews];

    // Dynamically recalculate shop rating & rating count
    const shopReviews = updated.filter((r) => r.shopId === reviewData.shopId);
    const avgScore = shopReviews.reduce((sum, r) => sum + r.rating, 0) / shopReviews.length;
    const roundedRating = Math.round(avgScore * 10) / 10;

    const updatedShops = get().shops.map((s) =>
      s.id === reviewData.shopId
        ? {
            ...s,
            rating: roundedRating,
            userRatingsTotal: (s.userRatingsTotal ?? 12) + 1,
          }
        : s,
    );

    const currentSelected = get().selectedShop;
    const updatedSelected =
      currentSelected?.id === reviewData.shopId
        ? {
            ...currentSelected,
            rating: roundedRating,
            userRatingsTotal: (currentSelected.userRatingsTotal ?? 12) + 1,
          }
        : currentSelected;

    set({ reviews: updated, shops: updatedShops, selectedShop: updatedSelected });
    try {
      await AsyncStorage.setItem(REVIEWS_KEY, JSON.stringify(updated));
      await AsyncStorage.setItem(CACHED_SHOPS_KEY, JSON.stringify(updatedShops));
    } catch {}
  },

  voteReviewHelpful: (reviewId) => {
    const updated = get().reviews.map((r) =>
      r.id === reviewId
        ? {
            ...r,
            helpfulCount: r.isHelpfulByMe ? r.helpfulCount - 1 : r.helpfulCount + 1,
            isHelpfulByMe: !r.isHelpfulByMe,
          }
        : r,
    );
    set({ reviews: updated });
    try {
      AsyncStorage.setItem(REVIEWS_KEY, JSON.stringify(updated));
    } catch {}
  },

  // ---- Beans Marketplace ----
  beans: [
    {
      id: 'bean-1',
      roasterShopId: 'ph-sagada-brew',
      roasterName: 'Sagada Brew Heritage House',
      name: 'Sagada Typica Reserve',
      origin: 'Sagada, Mountain Province',
      region: 'Cordillera Highlands',
      altitudeMasl: 1550,
      varietal: 'Typica & Bourbon',
      process: 'Washed',
      roastLevel: 'Light',
      tastingNotes: ['Floral', 'Bergamot', 'Sweet Black Tea', 'Honey'],
      pricePhp: 580,
      bagWeightGrams: 250,
      roastDate: 'Roasted 3 days ago',
      inStock: true,
      imageUrl: 'https://images.unsplash.com/photo-1559525839-b184a4d698c7?w=600&q=80',
    },
    {
      id: 'bean-2',
      roasterShopId: 'ph-chapter-coffee',
      roasterName: 'Chapter Coffee Roasters',
      name: 'Mt. Apo Anaerobic Micro-Lot',
      origin: 'Bansalan, Davao del Sur',
      region: 'Mindanao Highlands',
      altitudeMasl: 1450,
      varietal: 'Catimor / Yellow Bourbon',
      process: 'Anaerobic Slow Dry',
      roastLevel: 'Medium-Light',
      tastingNotes: ['Wild Strawberry', 'Dark Chocolate', 'Ripe Mango', 'Cacao Nibs'],
      pricePhp: 620,
      bagWeightGrams: 250,
      roastDate: 'Roasted 2 days ago',
      inStock: true,
      imageUrl: 'https://images.unsplash.com/photo-1587734195503-904fca47e0e9?w=600&q=80',
    },
    {
      id: 'bean-3',
      roasterShopId: 'ph-yardstick',
      roasterName: 'Yardstick Coffee',
      name: 'Benguet Atok Single Origin',
      origin: 'Atok, Benguet',
      region: 'Northern Luzon',
      altitudeMasl: 1600,
      varietal: 'Typica',
      process: 'Washed',
      roastLevel: 'Medium-Light',
      tastingNotes: ['Brown Sugar', 'Orange Blossom', 'Candied Pecan'],
      pricePhp: 590,
      bagWeightGrams: 250,
      roastDate: 'Roasted yesterday',
      inStock: true,
      imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&q=80',
    },
    {
      id: 'bean-4',
      roasterShopId: 'ph-commune-pob',
      roasterName: 'Commune Poblacion',
      name: 'Batangas Liberica Barako Supremo',
      origin: 'Lipa, Batangas',
      region: 'CALABARZON',
      altitudeMasl: 450,
      varietal: 'Liberica Barako',
      process: 'Natural',
      roastLevel: 'Medium',
      tastingNotes: ['Jackfruit', 'Dark Cacao', 'Smoky Anise', 'Molasses'],
      pricePhp: 450,
      bagWeightGrams: 250,
      roastDate: 'Roasted 4 days ago',
      inStock: true,
      imageUrl: 'https://images.unsplash.com/photo-1611854779393-1b2da9d400fe?w=600&q=80',
    },
    {
      id: 'bean-5',
      roasterShopId: 'ph-el-union',
      roasterName: 'El Union Coffee',
      name: 'San Juan Surf Cold Brew Blend',
      origin: 'La Union & Benguet Blend',
      region: 'Ilocos Region',
      altitudeMasl: 1200,
      varietal: 'Bourbon & Robusta Fine',
      process: 'Honey',
      roastLevel: 'Medium',
      tastingNotes: ['Toffee', 'Dried Fig', 'Creamy Fudge'],
      pricePhp: 520,
      bagWeightGrams: 250,
      roastDate: 'Roasted 3 days ago',
      inStock: true,
      imageUrl: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=600&q=80',
    },
  ],

  cart: [],

  loadCart: async () => {
    try {
      const stored = await AsyncStorage.getItem(CART_KEY);
      if (stored) {
        set({ cart: JSON.parse(stored) });
      }
    } catch {}
  },

  addToCart: (bean, grind, quantity = 1) => {
    const existingIndex = get().cart.findIndex(
      (item) => item.bean.id === bean.id && item.grind === grind,
    );
    let updated: CartItem[];
    if (existingIndex >= 0) {
      updated = [...get().cart];
      updated[existingIndex].quantity += quantity;
    } else {
      const newItem: CartItem = {
        id: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        bean,
        grind,
        quantity,
      };
      updated = [newItem, ...get().cart];
    }
    set({ cart: updated });
    try {
      AsyncStorage.setItem(CART_KEY, JSON.stringify(updated));
    } catch {}
  },

  removeFromCart: (cartItemId) => {
    const updated = get().cart.filter((item) => item.id !== cartItemId);
    set({ cart: updated });
    try {
      AsyncStorage.setItem(CART_KEY, JSON.stringify(updated));
    } catch {}
  },

  updateCartQuantity: (cartItemId, quantity) => {
    if (quantity <= 0) {
      get().removeFromCart(cartItemId);
      return;
    }
    const updated = get().cart.map((item) =>
      item.id === cartItemId ? { ...item, quantity } : item,
    );
    set({ cart: updated });
    try {
      AsyncStorage.setItem(CART_KEY, JSON.stringify(updated));
    } catch {}
  },

  clearCart: () => {
    set({ cart: [] });
    try {
      AsyncStorage.removeItem(CART_KEY);
    } catch {}
  },

  checkoutOrder: async (_deliveryAddress, _paymentMethod) => {
    get().clearCart();
    return true;
  },

  // ---- Events & Cupping Calendar ----
  events: [
    {
      id: 'event-1',
      shopId: 'ph-chapter-coffee',
      shopName: 'Chapter Coffee Roasters',
      title: 'Highlands Cupping Tour: Cordillera vs Mindanao',
      category: 'Cupping & Tasting',
      description: 'Blind sensory cupping comparing 6 high-altitude micro-lots from Sagada, Benguet, Mt. Apo, and Bukidnon. Guided by Q-Graders.',
      eventDate: 'Saturday, Sep 5, 2026',
      eventTime: '2:00 PM – 4:30 PM',
      venueAddress: 'Maginhawa St, Diliman, Quezon City',
      pricePhp: 0,
      maxSlots: 20,
      bookedSlots: 14,
      hostName: 'Marco Santos (Head Roaster)',
      imageUrl: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=700&q=80',
    },
    {
      id: 'event-2',
      shopId: 'ph-yardstick',
      shopName: 'Yardstick Coffee',
      title: 'Home Barista V60 Dial-in Masterclass',
      category: 'Barista Workshop',
      description: 'Master water temperature, grind distribution, and extraction ratio for pour-over brewing at home.',
      eventDate: 'Sunday, Sep 6, 2026',
      eventTime: '10:00 AM – 1:00 PM',
      venueAddress: 'Legazpi Village, Makati City',
      pricePhp: 1200,
      maxSlots: 12,
      bookedSlots: 8,
      hostName: 'Andre Chanco',
      imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=700&q=80',
    },
    {
      id: 'event-3',
      shopId: 'ph-commune-pob',
      shopName: 'Commune Poblacion',
      title: 'Barako Throwdown & Sunset Social',
      category: 'Latte Art Throwdown',
      description: 'Head-to-head latte art battle using 100% Batangas Liberica Barako milk blends. Free entrance with craft coffee cocktails.',
      eventDate: 'Friday, Sep 11, 2026',
      eventTime: '6:00 PM – 10:00 PM',
      venueAddress: 'Poblacion, Makati City',
      pricePhp: 0,
      maxSlots: 50,
      bookedSlots: 32,
      hostName: 'Ros Juan',
      imageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=700&q=80',
    },
  ],

  myRsvps: [],

  loadEvents: async () => {
    try {
      const stored = await AsyncStorage.getItem(RSVPS_KEY);
      if (stored) {
        set({ myRsvps: JSON.parse(stored) });
      }
    } catch {}
  },

  rsvpEvent: (eventId) => {
    const event = get().events.find((e) => e.id === eventId);
    if (!event) return;

    const newRsvp: EventRSVP = {
      eventId,
      eventTitle: event.title,
      shopName: event.shopName,
      eventDate: event.eventDate,
      ticketCode: `KAPE-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      rsvpedAt: 'Just now',
    };

    const updatedRsvps = [newRsvp, ...get().myRsvps];
    const updatedEvents = get().events.map((e) =>
      e.id === eventId
        ? {
            ...e,
            bookedSlots: e.bookedSlots + 1,
            isRSVPed: true,
          }
        : e,
    );

    set({ myRsvps: updatedRsvps, events: updatedEvents });
    try {
      AsyncStorage.setItem(RSVPS_KEY, JSON.stringify(updatedRsvps));
    } catch {}
  },

  cancelRSVP: (eventId) => {
    const updatedRsvps = get().myRsvps.filter((r) => r.eventId !== eventId);
    const updatedEvents = get().events.map((e) =>
      e.id === eventId
        ? {
            ...e,
            bookedSlots: Math.max(0, e.bookedSlots - 1),
            isRSVPed: false,
          }
        : e,
    );

    set({ myRsvps: updatedRsvps, events: updatedEvents });
    try {
      AsyncStorage.setItem(RSVPS_KEY, JSON.stringify(updatedRsvps));
    } catch {}
  },
}));

