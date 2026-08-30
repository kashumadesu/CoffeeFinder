// ============================================================
// App Types — Philippine Specialty Coffee Edition
// ============================================================

export interface Location {
  latitude: number;
  longitude: number;
}

export type LiveSeatingStatus = 'available' | 'moderate' | 'full' | 'unknown';
export type MapTypeOption = 'standard' | 'satellite' | 'terrain';

export interface TastingNote {
  id: string;
  shopId: string;
  author: string;
  rating: number;
  notes: string[];
  brewMethod?: string;
  comment: string;
  createdAt: string;
  photoUri?: string;
}

export interface BrewRecipe {
  beanOrigin: string;
  roastLevel: string;
  ratio: string;
  temperature: string;
  grindSize: string;
  brewTime: string;
}

export interface RegionHub {
  id: string;
  name: string;
  island: string;
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface PriceRange {
  min: number;
  max: number;
  average: number;
  currency: string;
}

export interface MenuItem {
  name: string;
  price: number;
  description?: string;
  category: 'Espresso Bar' | 'Filter & Pour-Over' | 'Milk Coffee' | 'Signatures & Cold';
}

export type OwnerVerificationStatus = 'unregistered' | 'pending' | 'verified' | 'rejected';

export interface OwnerClaimRequest {
  id: string;
  shopId: string;
  shopName: string;
  ownerFullName: string;
  businessEmail: string;
  phoneNumber: string;
  dtiOrSecNumber: string;
  permitType: 'DTI Registration' | 'Mayor Permit' | 'Barangay Clearance' | 'BIR Certificate';
  permitPhotoUri?: string;
  submittedAt: string;
  reviewedAt?: string;
  status: OwnerVerificationStatus;
  rejectionReason?: string;
}

export interface CoffeeShop {
  id: string;
  name: string;
  vicinity: string;
  formattedAddress?: string;
  city?: string;
  regionId?: string;
  location: Location;
  rating?: number;
  userRatingsTotal?: number;
  openNow?: boolean;
  openingHours?: OpeningHours;
  photos?: Photo[];
  galleryUrls?: string[];
  phoneNumber?: string;
  website?: string;
  priceLevel?: number;
  priceRange?: PriceRange;
  menuHighlights?: MenuItem[];
  fullMenu?: MenuItem[];
  distance?: number;
  types?: string[];

  // Philippine Specialty & WFC attributes
  isVerified?: boolean;
  claimStatus?: 'unclaimed' | 'pending' | 'verified';
  claimedBy?: string;
  acceptsGcash?: boolean;
  vibeTags?: string[];
  seatingStatus?: LiveSeatingStatus;
  wifiSpeed?: string;
  hasOutlets?: boolean;
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

export type PriceTierFilter = 'all' | 'budget' | 'mid' | 'reserve';

export interface Filters {
  searchQuery: string;
  activeCategory: CategoryFilter;
  priceTier: PriceTierFilter;
  openNow: boolean;
  minRating: number | null;
  radiusMetres: number;
  gcashOnly: boolean;
}

export const DEFAULT_FILTERS: Filters = {
  searchQuery: '',
  activeCategory: 'specialty',
  priceTier: 'all',
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
