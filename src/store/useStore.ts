// ============================================================
// Zustand Global Store — Specialty Coffee Edition (Features 1, 3, 4)
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
} from '@types';
import { DEFAULT_FILTERS } from '@types';
import { searchNearbyCoffee } from '@services/googlePlaces';
import { REGION_HUBS } from '@constants';

const FAVORITES_KEY = '@coffee_finder:favorites_v2';
const TASTING_NOTES_KEY = '@coffee_finder:tasting_notes_v2';
const CACHED_SHOPS_KEY = '@coffee_finder:cached_shops_v2';

interface AppState {
  // ---- location & regional hubs ----
  userLocation: Location;
  currentRegion: RegionHub;
  setUserLocation: (loc: Location) => void;
  setRegion: (region: RegionHub) => void;

  // ---- in-app map navigation mode ----
  activeNavigationShop: CoffeeShop | null;
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
  setSearchQuery: (query: string) => void;
  toggleGcashOnly: () => void;
  applyFilters: () => void;

  // ---- community tasting notes ----
  customTastingNotes: Record<string, TastingNote[]>; // shopId -> notes
  loadTastingNotes: () => Promise<void>;
  addTastingNote: (note: Omit<TastingNote, 'id' | 'createdAt'>) => Promise<void>;
  getShopTastingNotes: (shopId: string) => TastingNote[];

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
}

export const useStore = create<AppState>((set, get) => ({
  // Default to Metro Manila (Tomas Morato)
  currentRegion: REGION_HUBS[0],
  userLocation: {
    latitude: REGION_HUBS[0].latitude,
    longitude: REGION_HUBS[0].longitude,
  },
  setUserLocation: (loc) => {
    set({ userLocation: loc });
    get().fetchNearbyShops(loc);
  },
  setRegion: (region) => {
    const loc = { latitude: region.latitude, longitude: region.longitude };
    set({ currentRegion: region, userLocation: loc });
    get().fetchNearbyShops(loc);
  },

  // ---- In-App Map Navigation Mode ----
  activeNavigationShop: null,
  startNavigation: (shop) => set({ activeNavigationShop: shop, selectedShop: shop }),
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
      // Cache locally for 100% offline browsing
      try {
        await AsyncStorage.setItem(CACHED_SHOPS_KEY, JSON.stringify(shops));
      } catch {}
    } catch {
      // Load offline cache
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
  setFilters: (partial) => {
    set((s) => ({ filters: { ...s.filters, ...partial } }));
    get().applyFilters();
  },
  setCategory: (activeCategory) => {
    set((s) => ({ filters: { ...s.filters, activeCategory } }));
    get().applyFilters();
  },
  setSearchQuery: (searchQuery) => {
    set((s) => ({ filters: { ...s.filters, searchQuery } }));
    get().applyFilters();
  },
  toggleGcashOnly: () => {
    set((s) => ({ filters: { ...s.filters, gcashOnly: !s.filters.gcashOnly } }));
    get().applyFilters();
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
    try {
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
    } catch {}
  },

  isFavorite: (id: string) => get().favorites.some((f) => f.id === id),
}));
