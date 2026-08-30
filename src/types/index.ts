// ============================================================
// App Types — Philippine Specialty Coffee Edition
// ============================================================

export interface Location {
  latitude: number;
  longitude: number;
}

export type LiveSeatingStatus = 'available' | 'moderate' | 'full' | 'unknown';

export interface CoffeeShop {
  id: string;              // Google place_id or unique ID
  name: string;
  vicinity: string;        // Short address
  formattedAddress?: string;
  city?: string;           // e.g. "Quezon City", "Makati", "BGC", "Cebu"
  location: Location;
  rating?: number;
  userRatingsTotal?: number;
  openNow?: boolean;
  openingHours?: OpeningHours;
  photos?: Photo[];
  galleryUrls?: string[];  // Direct image URLs for 3-photo mosaic
  phoneNumber?: string;
  website?: string;
  priceLevel?: number;     // 0-4
  distance?: number;       // metres from user
  types?: string[];
  
  // Philippine Specialty & WFC attributes (Matching mockup)
  isVerified?: boolean;
  acceptsGcash?: boolean;
  vibeTags?: string[];     // e.g. ["#UnderratedGem", "#QuietVibe", "#SingleOrigin", "#LaptopFriendly"]
  seatingStatus?: LiveSeatingStatus; // e.g. "moderate" -> "Seats Available (Moderate)"
  wifiSpeed?: string;      // e.g. "Fast (200 Mbps+ verified)"
  hasOutlets?: boolean;    // e.g. true
  isPetFriendly?: boolean;
  hasAlFresco?: boolean;
  isSpecialty?: boolean;
  isNew?: boolean;
}

export interface OpeningHours {
  openNow: boolean;
  weekdayText?: string[];
}

export interface Photo {
  photoReference: string;
  width: number;
  height: number;
}

export type PriceLevel = 0 | 1 | 2 | 3 | 4;

// ---- Filter types ----

export type CategoryFilter = 
  | 'all'
  | 'outlets'
  | 'specialty'
  | 'alfresco'
  | 'petFriendly'
  | 'new'
  | 'fastWifi'
  | 'gcash';

export interface Filters {
  searchQuery: string;
  activeCategory: CategoryFilter;
  openNow: boolean;
  minRating: number | null;
  radiusMetres: number;
  gcashOnly: boolean;
}

export const DEFAULT_FILTERS: Filters = {
  searchQuery: '',
  activeCategory: 'specialty',
  openNow: false,
  minRating: null,
  radiusMetres: 2500,
  gcashOnly: false,
};

// ---- Navigation types ----

export type RootTabParamList = {
  Discover: undefined;
  Saved: undefined;
  OwnerPortal: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  MainTabs: undefined;
  ShopDetail: { shop: CoffeeShop };
};
