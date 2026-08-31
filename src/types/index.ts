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

export type OutletRating = 'plentiful' | 'wall_only' | 'no_outlets' | 'laptop_ban';
export type BeanOrigin = 'sagada' | 'apo' | 'benguet' | 'barako' | 'bukidnon' | 'imported';
export type CafeFormat = 'commercial' | 'garage_popup' | 'mobile_van' | 'roastery';
export type NoiseLevel = 'quiet_zoom' | 'moderate' | 'social_loud';
export type AcLevel = 'high_chilly' | 'comfortable' | 'al_fresco_warm';

export interface InsiderTip {
  id: string;
  shopId: string;
  authorName: string;
  category: 'plugs' | 'parking' | 'off_menu' | 'vibe' | 'ac';
  text: string;
  upvotes: number;
  createdAt: string;
}

export interface SearchHistoryItem {
  id: string;
  query: string;
  timestamp: number;
  type?: 'keyword' | 'hotspot' | 'origin';
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
  outletRating?: OutletRating;
  beanOrigins?: BeanOrigin[];
  cafeFormat?: CafeFormat;
  noiseLevel?: NoiseLevel;
  acLevel?: AcLevel;
  insiderTips?: InsiderTip[];
  isPetFriendly?: boolean;
  hasAlFresco?: boolean;
  isSpecialty?: boolean;
  isNew?: boolean;

  // Community Tasting & Brew Recipes
  tastingNotes?: TastingNote[];
  brewRecipe?: BrewRecipe;

  // Merchant Barista Tip Jar
  merchantGcashNumber?: string;
  merchantGcashQrUrl?: string;
}

export interface HeartbeatEvent {
  id: string;
  shopId: string;
  shopName: string;
  type: 'navigation' | 'favorite' | 'tasting_note' | 'tip' | 'insider_tip';
  message: string;
  timeAgo: string;
  timestamp: number;
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
  | 'plentiful_plugs'
  | 'garahe_popup'
  | 'origin_sagada'
  | 'origin_apo'
  | 'origin_barako'
  | 'origin_benguet'
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
  outletRatingFilter?: OutletRating | 'all';
  beanOriginFilter?: BeanOrigin | 'all';
  garageOnly?: boolean;
}

export const DEFAULT_FILTERS: Filters = {
  searchQuery: '',
  activeCategory: 'specialty',
  priceTier: 'all',
  openNow: false,
  minRating: null,
  radiusMetres: 3500,
  gcashOnly: false,
  outletRatingFilter: 'all',
  beanOriginFilter: 'all',
  garageOnly: false,
};

// ---- Navigation types ----

export type NavigationMode = 'walking' | 'motorcycle' | 'driving' | 'transit';

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

export interface NavigationStep {
  id: string;
  instruction: string;
  distanceText: string;
  distanceMeters: number;
  durationText: string;
  maneuver: string;
  travelMode?: 'WALKING' | 'DRIVING' | 'TRANSIT' | 'BICYCLING';
  transitLine?: string;
  transitVehicle?: string;
  departureStop?: string;
  arrivalStop?: string;
  numStops?: number;
  startLocation: Location;
  endLocation: Location;
}

export interface NavigationRoute {
  coordinates: Location[];
  distanceMeters: number;
  durationSeconds: number;
  distanceText: string;
  durationText: string;
  steps: NavigationStep[];
  mode: NavigationMode;
  hasTransitOption?: boolean;
  transitSummary?: string;
  transitUnavailableReason?: string;
}

// ============================================================
// PHASE 2 TYPES: Community Reviews, Bean Marketplace & Events
// ============================================================

export type BrewMethod = 'V60 Pour Over' | 'AeroPress' | 'Espresso' | 'Cold Brew' | 'French Press' | 'Syphon';

export type TastingFlavorTag =
  | 'Floral'
  | 'Citrus & Bergamot'
  | 'Brown Sugar'
  | 'Dark Chocolate'
  | 'Wild Berry'
  | 'Jasmine'
  | 'Caramel'
  | 'Tropical Fruit'
  | 'Nutty & Cacao'
  | 'Smoky Barako';

export type ReviewerRole =
  | 'Coffee Explorer'
  | 'Licensed Q-Grader'
  | 'Head Roaster'
  | 'Professional Barista';

export interface CommunityReview {
  id: string;
  shopId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  reviewerRole?: ReviewerRole;
  rating: number; // 1 to 5
  brewMethod: BrewMethod;
  beanOriginTag?: BeanOrigin;
  flavorTags: TastingFlavorTag[];
  acidity: number; // 1 to 5
  sweetness: number; // 1 to 5
  body: number; // 1 to 5
  comment: string;
  photoUri?: string;
  helpfulCount: number;
  isHelpfulByMe?: boolean;
  createdAt: string;
}

export interface TableAlert {
  shopId: string;
  shopName: string;
  requestedAt: number;
}

export interface PassportCheckIn {
  id: string;
  shopId: string;
  shopName: string;
  region: string;
  island: 'Luzon' | 'Visayas' | 'Mindanao';
  timestamp: number;
  dateFormatted: string;
}

export type GrindType =
  | 'Whole Bean'
  | 'Espresso (Fine)'
  | 'Pour Over / Drip (Medium)'
  | 'French Press / Cold Brew (Coarse)';

export interface CoffeeBean {
  id: string;
  roasterShopId: string;
  roasterName: string;
  name: string;
  origin: string;
  region: string;
  altitudeMasl: number;
  varietal: string;
  process: 'Washed' | 'Natural' | 'Honey' | 'Anaerobic Slow Dry';
  roastLevel: 'Light' | 'Medium-Light' | 'Medium' | 'Dark';
  tastingNotes: string[];
  pricePhp: number;
  bagWeightGrams: number; // e.g. 250
  roastDate: string;
  inStock: boolean;
  imageUrl: string;
}

export interface CartItem {
  id: string;
  bean: CoffeeBean;
  grind: GrindType;
  quantity: number;
}

export interface CoffeeEvent {
  id: string;
  shopId: string;
  shopName: string;
  title: string;
  category: 'Cupping & Tasting' | 'Latte Art Throwdown' | 'Barista Workshop' | 'Weekend Roastery Pop-Up';
  description: string;
  eventDate: string;
  eventTime: string;
  venueAddress: string;
  pricePhp: number; // 0 for free
  maxSlots: number;
  bookedSlots: number;
  hostName: string;
  hostAvatar?: string;
  imageUrl: string;
  isRSVPed?: boolean;
}

export interface EventRSVP {
  eventId: string;
  eventTitle: string;
  shopName: string;
  eventDate: string;
  ticketCode: string;
  rsvpedAt: string;
}

