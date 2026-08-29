// ============================================================
// App Types — shared across the entire application
// ============================================================

export interface Location {
  latitude: number;
  longitude: number;
}

export interface CoffeeShop {
  id: string;              // Google place_id
  name: string;
  vicinity: string;        // Short address
  formattedAddress?: string;
  location: Location;
  rating?: number;
  userRatingsTotal?: number;
  openNow?: boolean;
  openingHours?: OpeningHours;
  photos?: Photo[];
  phoneNumber?: string;
  website?: string;
  priceLevel?: number;     // 0-4
  distance?: number;       // metres from user
  types?: string[];
}

export interface OpeningHours {
  openNow: boolean;
  weekdayText?: string[];  // e.g. ["Monday: 7:00 AM – 6:00 PM", ...]
}

export interface Photo {
  photoReference: string;
  width: number;
  height: number;
}

export type PriceLevel = 0 | 1 | 2 | 3 | 4;

// ---- Filter types ----

export interface Filters {
  openNow: boolean;
  minRating: number | null;   // null = no filter, or 3.5, 4.0, 4.5
  radiusMetres: number;       // 500, 1000, 2000, 5000
}

export const DEFAULT_FILTERS: Filters = {
  openNow: false,
  minRating: null,
  radiusMetres: 1500,
};

// ---- Navigation types ----

export type RootTabParamList = {
  Map: undefined;
  List: undefined;
  Favorites: undefined;
};

export type RootStackParamList = {
  MainTabs: undefined;
  ShopDetail: { shop: CoffeeShop };
};
