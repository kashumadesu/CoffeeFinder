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
  logOwnerClaimEvent,
} from '@services/analytics';
import type { User } from 'firebase/auth';

const FAVORITES_KEY = '@coffee_finder:favorites_v2';
const TASTING_NOTES_KEY = '@coffee_finder:tasting_notes_v2';
const CACHED_SHOPS_KEY = '@coffee_finder:cached_shops_v2';
const MAP_TYPE_KEY = '@coffee_finder:map_type_v1';
const CLAIMS_KEY = '@coffee_finder:claims_v1';
const TREK_PACKS_KEY = '@coffee_finder:trek_packs_v1';

interface AppState {
  // ---- location & regional hubs ----
  userLocation: Location;
  currentRegion: RegionHub;
  mapType: MapTypeOption;
  setUserLocation: (loc: Location) => void;
  setRegion: (region: RegionHub) => void;
  setMapType: (type: MapTypeOption) => void;

  // ---- in-app map navigation mode ----
  activeNavigationShop: CoffeeShop | null;
  navigationMode: 'walking' | 'driving';
  setNavigationMode: (mode: 'walking' | 'driving') => void;
  startNavigation: (shop: CoffeeShop) => void;
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
  isShopClaimed: (shopId: string) => boolean;

  // ---- owner portal (SaaS live updates) ----
  updateShopLiveStatus: (
    shopId: string,
    seatingStatus: LiveSeatingStatus,
    wifiSpeed?: string,
  ) => void;

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
}

export const useStore = create<AppState>((set, get) => ({
  // Default to Metro Manila (Tomas Morato)
  currentRegion: REGION_HUBS[0],
  userLocation: {
    latitude: REGION_HUBS[0].latitude,
    longitude: REGION_HUBS[0].longitude,
  },
  mapType: 'standard',

  setUserLocation: (loc) => {
    set({ userLocation: loc });
    get().fetchNearbyShops(loc);
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
  startNavigation: (shop) => {
    set({ activeNavigationShop: shop, selectedShop: shop });
    logNavigationEvent(shop.id, shop.name, get().navigationMode, shop.distance ?? 650);
    get().addHeartbeatEvent({
      shopId: shop.id,
      shopName: shop.name,
      type: 'navigation',
      message: `A coffee lover is navigating to ${shop.name} (${get().navigationMode} mode)!`,
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
    get().fetchNearbyShops();
  },

  setCategory: (activeCategory) => {
    const filters = { ...get().filters, activeCategory };
    set({ filters });
    get().fetchNearbyShops();
  },

  setPriceTier: (priceTier) => {
    const filters = { ...get().filters, priceTier };
    set({ filters });
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
}));
