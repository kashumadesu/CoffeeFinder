// ============================================================
// Zustand Global Store — Specialty Coffee Edition
// ============================================================

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CoffeeShop, Filters, Location, LiveSeatingStatus } from '@types';
import { DEFAULT_FILTERS } from '@types';
import { searchNearbyCoffee } from '@services/googlePlaces';
import { DEFAULT_REGION } from '@constants';

const FAVORITES_KEY = '@coffee_finder:favorites_v2';

interface AppState {
  // ---- location ----
  userLocation: Location;
  setUserLocation: (loc: Location) => void;

  // ---- shops ----
  shops: CoffeeShop[];
  isLoading: boolean;
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
  // Default centered on Quezon City (Tomas Morato area)
  userLocation: {
    latitude: DEFAULT_REGION.latitude,
    longitude: DEFAULT_REGION.longitude,
  },
  setUserLocation: (loc) => {
    set({ userLocation: loc });
    get().fetchNearbyShops(loc);
  },

  // ---- shops ----
  shops: [],
  isLoading: false,
  error: null,

  fetchNearbyShops: async (location?: Location) => {
    const loc = location ?? get().userLocation;
    set({ isLoading: true, error: null });
    try {
      const shops = await searchNearbyCoffee(loc, get().filters);
      set({ shops, isLoading: false });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error finding coffee shops';
      set({ error: msg, isLoading: false });
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
    } catch {
      // silently ignore
    }
  },

  toggleFavorite: async (shop: CoffeeShop) => {
    const { favorites } = get();
    const exists = favorites.some((f) => f.id === shop.id);
    const updated = exists ? favorites.filter((f) => f.id !== shop.id) : [...favorites, shop];
    set({ favorites: updated });
    try {
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
    } catch {
      // silently ignore
    }
  },

  isFavorite: (id: string) => get().favorites.some((f) => f.id === id),
}));
