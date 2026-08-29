// ============================================================
// Zustand Global Store
// Holds: nearby shops, user location, active filters, favorites,
//        selected shop (for bottom sheet), loading/error state.
// ============================================================

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CoffeeShop, Filters, Location } from '@types';
import { DEFAULT_FILTERS } from '@types';
import { searchNearbyCoffee } from '@services/googlePlaces';

const FAVORITES_KEY = '@coffee_finder:favorites';

interface AppState {
  // ---- location ----
  userLocation: Location | null;
  setUserLocation: (loc: Location) => void;

  // ---- shops ----
  shops: CoffeeShop[];
  isLoading: boolean;
  error: string | null;
  fetchNearbyShops: (location: Location) => Promise<void>;

  // ---- selected shop (map pin tap / bottom sheet) ----
  selectedShop: CoffeeShop | null;
  setSelectedShop: (shop: CoffeeShop | null) => void;

  // ---- filters ----
  filters: Filters;
  setFilters: (filters: Partial<Filters>) => void;
  applyFilters: () => void;

  // ---- favorites ----
  favorites: CoffeeShop[];
  loadFavorites: () => Promise<void>;
  toggleFavorite: (shop: CoffeeShop) => Promise<void>;
  isFavorite: (id: string) => boolean;
}

export const useStore = create<AppState>((set, get) => ({
  // ---- location ----
  userLocation: null,
  setUserLocation: (loc) => set({ userLocation: loc }),

  // ---- shops ----
  shops: [],
  isLoading: false,
  error: null,

  fetchNearbyShops: async (location: Location) => {
    set({ isLoading: true, error: null });
    try {
      const shops = await searchNearbyCoffee(location, get().filters);
      set({ shops, isLoading: false });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      set({ error: msg, isLoading: false });
    }
  },

  // ---- selected shop ----
  selectedShop: null,
  setSelectedShop: (shop) => set({ selectedShop: shop }),

  // ---- filters ----
  filters: DEFAULT_FILTERS,
  setFilters: (partial) => set((s) => ({ filters: { ...s.filters, ...partial } })),
  applyFilters: () => {
    const loc = get().userLocation;
    if (loc) get().fetchNearbyShops(loc);
  },

  // ---- favorites ----
  favorites: [],

  loadFavorites: async () => {
    try {
      const raw = await AsyncStorage.getItem(FAVORITES_KEY);
      if (raw) set({ favorites: JSON.parse(raw) });
    } catch {
      // silently ignore storage errors
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
