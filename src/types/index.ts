// ============================================================
// App Types — Philippine Specialty Coffee Edition
// ============================================================

export interface Location {
  latitude: number;
  longitude: number;
}

export type LiveSeatingStatus = 'available' | 'moderate' | 'full' | 'unknown';

export interface TastingNote {
  id: string;
  shopId: string;
  author: string;
  rating: number;
  notes: string[];       // e.g. ["🌸 Jasmine", "🍋 Bergamot", "🍯 Wild Honey"]
  brewMethod?: string;   // e.g. "V60 Pour-Over"
  comment: string;
  createdAt: string;
}

export interface BrewRecipe {
  beanOrigin: string;    // e.g. "Benguet Arabica (Typica)"
  roastLevel: string;    // e.g. "Light-Medium"
  ratio: string;         // e.g. "1:15 (15g coffee / 225g water)"
  temperature: string;   // e.g. "92°C"
  grindSize: string;     // e.g. "Medium-Coarse"
  brewTime: string;      // e.g. "2m 45s"
}

export interface RegionHub {
  id: string;
  name: string;
  island: string;        // e.g. "Luzon", "Visayas", "Mindanao"
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface CoffeeShop {
  id: string;              // Google place_id or unique ID
  name: string;
  vicinity: string;        // Short address
  formattedAddress?: string;
  city?: string;           // e.g. "Quezon City", "Sagada", "Cebu", "Siargao"
  regionId?: string;       // e.g. "manila", "sagada", "benguet", "cebu", "siargao"
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

  // Community Tasting & Brew Recipes
  tastingNotes?: TastingNote[];
  brewRecipe?: BrewRecipe;
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
  radiusMetres: 3500,
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
