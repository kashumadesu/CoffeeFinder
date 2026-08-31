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
  TableAlert,
  PassportCheckIn,
  VisitedShop,
  RegionRankInfo,
  NationalRankInfo,
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
const TABLE_ALERTS_KEY = '@coffee_finder:table_alerts_v1';
const PASSPORT_CHECKINS_KEY = '@coffee_finder:passport_checkins_v1';
const VISITED_SHOPS_KEY = '@coffee_finder:visited_shops_v1';

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

  // ---- Phase 3: Table Alerts & Passport Counter QR Check-ins ----
  tableAlerts: TableAlert[];
  loadTableAlerts: () => Promise<void>;
  toggleTableAlert: (shopId: string, shopName: string) => boolean;
  isTableAlertActive: (shopId: string) => boolean;

  passportCheckIns: PassportCheckIn[];
  loadPassportCheckIns: () => Promise<void>;
  addPassportCheckIn: (
    shopId: string,
    shopName: string,
    region: string,
    island: 'Luzon' | 'Visayas' | 'Mindanao',
  ) => boolean;

  // ---- Regional & City Coffee Explorer Rank Progression ----
  visitedShops: VisitedShop[];
  loadVisitedShops: () => Promise<void>;
  toggleShopVisited: (
    shopId: string,
    shopName: string,
    regionId?: string,
    city?: string,
  ) => boolean;
  isShopVisited: (shopId: string) => boolean;
  getRegionalRanks: () => RegionRankInfo[];
  getNationalRank: () => NationalRankInfo;
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

  // ---- Phase 3: Table Alerts & Passport Check-ins ----
  tableAlerts: [],

  loadTableAlerts: async () => {
    try {
      const stored = await AsyncStorage.getItem(TABLE_ALERTS_KEY);
      if (stored) {
        set({ tableAlerts: JSON.parse(stored) });
      }
    } catch {}
  },

  toggleTableAlert: (shopId, shopName) => {
    const isExisting = get().tableAlerts.some((a) => a.shopId === shopId);
    let updated: TableAlert[];
    let isNowActive = false;

    if (isExisting) {
      updated = get().tableAlerts.filter((a) => a.shopId !== shopId);
      isNowActive = false;
    } else {
      updated = [{ shopId, shopName, requestedAt: Date.now() }, ...get().tableAlerts];
      isNowActive = true;
    }

    set({ tableAlerts: updated });
    try {
      AsyncStorage.setItem(TABLE_ALERTS_KEY, JSON.stringify(updated));
    } catch {}
    return isNowActive;
  },

  isTableAlertActive: (shopId) => {
    return get().tableAlerts.some((a) => a.shopId === shopId);
  },

  passportCheckIns: [
    {
      id: 'checkin-1',
      shopId: 'ph-chapter-coffee',
      shopName: 'Chapter Coffee Roasters',
      region: 'Metro Manila',
      island: 'Luzon',
      timestamp: Date.now() - 86400000 * 2,
      dateFormatted: '2 days ago',
    },
    {
      id: 'checkin-2',
      shopId: 'ph-sagada-brew',
      shopName: 'Sagada Brew Heritage House',
      region: 'Sagada & Benguet',
      island: 'Luzon',
      timestamp: Date.now() - 86400000 * 6,
      dateFormatted: '6 days ago',
    },
  ],

  loadPassportCheckIns: async () => {
    try {
      const stored = await AsyncStorage.getItem(PASSPORT_CHECKINS_KEY);
      if (stored) {
        set({ passportCheckIns: JSON.parse(stored) });
      }
    } catch {}
  },

  addPassportCheckIn: (shopId, shopName, region, island) => {
    const isAlreadyCheckedIn = get().passportCheckIns.some((c) => c.shopId === shopId);
    const newCheckIn: PassportCheckIn = {
      id: `checkin-${Date.now()}`,
      shopId,
      shopName,
      region,
      island,
      timestamp: Date.now(),
      dateFormatted: 'Just now',
    };

    const updated = [newCheckIn, ...get().passportCheckIns];
    set({ passportCheckIns: updated });
    try {
      AsyncStorage.setItem(PASSPORT_CHECKINS_KEY, JSON.stringify(updated));
    } catch {}
    return !isAlreadyCheckedIn; // returns true if new stamp unlocked
  },

  // ---- Regional & City Coffee Explorer Rank Progression ----
  visitedShops: [
    {
      shopId: 'ph-chapter-coffee',
      shopName: 'Chapter Coffee Roasters',
      regionId: 'manila',
      city: 'Quezon City',
      visitedAt: Date.now() - 86400000 * 2,
    },
    {
      shopId: 'ph-yardstick-coffee',
      shopName: 'Yardstick Coffee',
      regionId: 'manila',
      city: 'Makati',
      visitedAt: Date.now() - 86400000 * 5,
    },
    {
      shopId: 'ph-sagada-brew',
      shopName: 'Sagada Brew Heritage House',
      regionId: 'sagada',
      city: 'Sagada',
      visitedAt: Date.now() - 86400000 * 10,
    },
  ],

  loadVisitedShops: async () => {
    try {
      const stored = await AsyncStorage.getItem(VISITED_SHOPS_KEY);
      if (stored) {
        set({ visitedShops: JSON.parse(stored) });
      }
    } catch {}
  },

  toggleShopVisited: (shopId, shopName, regionId = 'manila', city = 'Metro Manila') => {
    const isAlready = get().visitedShops.some((v) => v.shopId === shopId);
    let updated: VisitedShop[];
    let isNowVisited = false;

    if (isAlready) {
      updated = get().visitedShops.filter((v) => v.shopId !== shopId);
      isNowVisited = false;
    } else {
      updated = [
        {
          shopId,
          shopName,
          regionId,
          city,
          visitedAt: Date.now(),
        },
        ...get().visitedShops,
      ];
      isNowVisited = true;
    }

    set({ visitedShops: updated });
    try {
      AsyncStorage.setItem(VISITED_SHOPS_KEY, JSON.stringify(updated));
    } catch {}
    return isNowVisited;
  },

  isShopVisited: (shopId) => {
    return get().visitedShops.some((v) => v.shopId === shopId);
  },

  getRegionalRanks: () => {
    const visited = get().visitedShops;
    return REGION_HUBS.map((hub) => {
      // Find visited shops matching this hub by regionId or name keywords
      const count = visited.filter(
        (v) =>
          v.regionId === hub.id ||
          v.shopName.toLowerCase().includes(hub.name.toLowerCase().split(' ')[0]) ||
          hub.name.toLowerCase().includes(v.city.toLowerCase()),
      ).length;

      let level = 0;
      let rankTitle = 'Unexplored Territory';
      let badgeIcon = 'compass';
      let nextTierCount = 1;
      let isMaxRank = false;

      if (count >= 10) {
        level = 4;
        rankTitle = 'Roastmaster Legend';
        badgeIcon = 'award';
        nextTierCount = 10;
        isMaxRank = true;
      } else if (count >= 5) {
        level = 3;
        rankTitle = 'City Trailblazer';
        badgeIcon = 'award';
        nextTierCount = 10;
      } else if (count >= 3) {
        level = 2;
        rankTitle = 'Silver Regular';
        badgeIcon = 'shield';
        nextTierCount = 5;
      } else if (count >= 1) {
        level = 1;
        rankTitle = 'Bronze Cupper';
        badgeIcon = 'coffee';
        nextTierCount = 3;
      }

      const progress = isMaxRank ? 1 : Math.min(1, count / nextTierCount);

      return {
        regionId: hub.id,
        regionName: hub.name,
        island: (hub.id === 'cebu' || hub.id === 'iloilo'
          ? 'Visayas'
          : hub.id === 'davao'
          ? 'Mindanao'
          : 'Luzon') as 'Luzon' | 'Visayas' | 'Mindanao',
        level,
        rankTitle,
        badgeIcon,
        visitedCount: count,
        nextTierCount,
        progress,
        isMaxRank,
      };
    });
  },

  getNationalRank: () => {
    const total = get().visitedShops.length;
    if (total >= 20) {
      return {
        level: 4,
        rankTitle: 'Philippine Coffee Legend',
        totalVisited: total,
        nextLevelTotal: 20,
        progress: 1,
        badgeName: '👑 Grand Master Cupper',
      };
    } else if (total >= 10) {
      return {
        level: 3,
        rankTitle: 'Specialty Connoisseur',
        totalVisited: total,
        nextLevelTotal: 20,
        progress: total / 20,
        badgeName: '🥇 Island Hopping Connoisseur',
      };
    } else if (total >= 5) {
      return {
        level: 2,
        rankTitle: 'Caffeine Scout',
        totalVisited: total,
        nextLevelTotal: 10,
        progress: total / 10,
        badgeName: '🥈 Regional Roastery Scout',
      };
    }
    return {
      level: 1,
      rankTitle: 'Coffee Novice',
      totalVisited: total,
      nextLevelTotal: 5,
      progress: Math.min(1, total / 5),
      badgeName: '🥉 First Pour Explorer',
    };
  },
}));



