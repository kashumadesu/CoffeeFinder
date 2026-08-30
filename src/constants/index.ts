// ============================================================
// App Constants — Specialty Coffee (PH Edition)
// ============================================================

import { GOOGLE_MAPS_API_KEY } from '@env';
import type { CoffeeShop } from '@types';

export const GOOGLE_PLACES_API_KEY = GOOGLE_MAPS_API_KEY;
export const GOOGLE_PLACES_BASE_URL = 'https://maps.googleapis.com/maps/api/place';
export const GOOGLE_DIRECTIONS_BASE_URL = 'https://maps.googleapis.com/maps/api/directions';

export const getPhotoUrl = (photoRef: string, maxWidth = 800): string =>
  `${GOOGLE_PLACES_BASE_URL}/photo?maxwidth=${maxWidth}&photoreference=${photoRef}&key=${GOOGLE_PLACES_API_KEY}`;

// ---- Modern Design System Colors (Matching Mockup) ----
export const COLORS = {
  // Brand & Primaries
  primary: '#2A4736',        // Deep forest green (Active buttons, selected chips)
  primaryDark: '#1C3326',    // Darker forest green
  primaryLight: '#3D614C',   // Medium sage green
  primaryMuted: '#4F725E',
  
  // Backgrounds & Surfaces
  background: '#FAF8F3',     // Warm specialty cream background
  surface: '#FFFFFF',        // Pure white card surfaces
  surfaceSage: '#EAF4EE',    // Pale mint/sage container for Live Status & Wi-Fi
  surfaceWarm: '#F3EFE6',    // Soft sand container
  
  // Accents & Tags
  taupe: '#D2C4B5',          // Unselected map pins & search button bg
  taupeLight: '#E8DFD5',
  tagBrown: '#5D4037',       // Earth brown vibe pills (#QuietVibe, #SingleOrigin)
  tagBrownBg: '#EFEBE9',
  tagGreen: '#2A4736',       // Forest green vibe pills (#UnderratedGem)
  tagGreenBg: '#E8F1EC',
  
  // Typography
  textPrimary: '#1F1E1D',    // Deep charcoal/espresso text
  textSecondary: '#66625D',  // Medium grey/brown text
  textMuted: '#9B9690',      // Placeholder & secondary hints
  
  // Status & Badges
  gcash: '#007DFE',          // GCash brand blue
  gcashBg: '#E6F2FF',
  verified: '#27AE60',       // Verified green badge
  success: '#27AE60',        // Open badge / Live available
  warning: '#E67E22',        // Moderate seating
  danger: '#E74C3C',         // Busy / Closed
  star: '#F5A623',           // Star rating gold
  
  // UI Borders & Overlays
  border: '#E8E3DA',
  borderLight: '#F0ECE4',
  overlay: 'rgba(0,0,0,0.45)',
  mapPin: '#D2C4B5',
  mapPinSelected: '#1C3326',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const RADIUS = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  full: 999,
};

// Map defaults — Quezon City (Tomas Morato / Timog area matching mockup)
export const DEFAULT_REGION = {
  latitude: 14.6360,
  longitude: 121.0370,
  latitudeDelta: 0.025,
  longitudeDelta: 0.025,
};

export const PH_BOUNDARY = {
  north: 21.12,
  south: 4.64,
  west: 116.87,
  east: 126.60,
};

export const DELTA = {
  small: 0.01,
  medium: 0.025,
  large: 0.05,
};

export const SEARCH_KEYWORD = 'specialty coffee shop';
export const PLACE_TYPES = 'cafe';

// ---- Specialty Filter Chips (Matching Mockup) ----
export const SPECIALTY_CATEGORIES = [
  { id: 'specialty', label: '☕ Specialty' },
  { id: 'outlets', label: '⚡ Outlets' },
  { id: 'alfresco', label: '🌱 Al Fresco' },
  { id: 'petFriendly', label: '🐾 Pet Friendly' },
  { id: 'new', label: '🆕 New' },
  { id: 'fastWifi', label: '📶 Fast Wi-Fi' },
];

export const RADIUS_OPTIONS = [
  { label: '500m', value: 500 },
  { label: '1 km', value: 1000 },
  { label: '2.5 km', value: 2500 },
  { label: '5 km', value: 5000 },
];

export const RATING_OPTIONS = [
  { label: '3.5+', value: 3.5 },
  { label: '4.0+', value: 4.0 },
  { label: '4.5+', value: 4.5 },
];

export const PRICE_LABELS: Record<number, string> = {
  0: 'Free',
  1: '₱',
  2: '₱₱',
  3: '₱₱₱',
  4: '₱₱₱₱',
};

// ---- Rich Philippine Specialty Coffee Mock Dataset ----
// Positioned along Tomas Morato, Timog Ave, Quezon City & surrounding Metro Manila
export const PH_SPECIALTY_CAFES: CoffeeShop[] = [
  {
    id: 'ph-chapter-coffee',
    name: 'Chapter Coffee Roasters',
    vicinity: '143 Sct. Gandia St, Tomas Morato, Quezon City',
    formattedAddress: '143 Sct. Gandia St, Diliman, Quezon City, Metro Manila',
    city: 'Quezon City',
    location: { latitude: 14.6368, longitude: 121.0365 },
    rating: 4.7,
    userRatingsTotal: 1240,
    openNow: true,
    priceLevel: 2,
    distance: 750,
    isVerified: true,
    acceptsGcash: true,
    isSpecialty: true,
    hasOutlets: true,
    isPetFriendly: true,
    hasAlFresco: true,
    isNew: false,
    seatingStatus: 'moderate',
    wifiSpeed: 'Fast (200 Mbps+ verified)',
    vibeTags: ['#UnderratedGem', '#QuietVibe', '#SingleOrigin', '#LaptopFriendly'],
    phoneNumber: '+63 917 839 2819',
    website: 'https://chaptercoffee.ph',
    galleryUrls: [
      'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80',
      'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80',
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80',
    ],
    openingHours: {
      openNow: true,
      weekdayText: [
        'Monday: 7:00 AM – 10:00 PM',
        'Tuesday: 7:00 AM – 10:00 PM',
        'Wednesday: 7:00 AM – 10:00 PM',
        'Thursday: 7:00 AM – 10:00 PM',
        'Friday: 7:00 AM – 11:00 PM',
        'Saturday: 7:00 AM – 11:00 PM',
        'Sunday: 7:00 AM – 9:00 PM',
      ],
    },
  },
  {
    id: 'ph-yardstick-coffee',
    name: 'Yardstick Coffee',
    vicinity: 'Universal LMS Bldg, 106 Esteban St, Legazpi Village, Makati',
    formattedAddress: '106 Esteban St, Legazpi Village, Makati, Metro Manila',
    city: 'Makati',
    location: { latitude: 14.6345, longitude: 121.0392 },
    rating: 4.8,
    userRatingsTotal: 2150,
    openNow: true,
    priceLevel: 3,
    distance: 1100,
    isVerified: true,
    acceptsGcash: true,
    isSpecialty: true,
    hasOutlets: true,
    isPetFriendly: true,
    hasAlFresco: false,
    isNew: false,
    seatingStatus: 'available',
    wifiSpeed: 'Very Fast (350 Mbps+ verified)',
    vibeTags: ['#SpecialtyPioneer', '#PourOverBar', '#WorkFromCafe', '#ArtisanalRoast'],
    phoneNumber: '+63 2 8845 2880',
    website: 'https://yardstickcoffee.com',
    galleryUrls: [
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
      'https://images.unsplash.com/photo-1497636577773-f1231844b336?w=800&q=80',
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80',
    ],
    openingHours: {
      openNow: true,
      weekdayText: [
        'Monday: 7:00 AM – 9:00 PM',
        'Tuesday: 7:00 AM – 9:00 PM',
        'Wednesday: 7:00 AM – 9:00 PM',
        'Thursday: 7:00 AM – 9:00 PM',
        'Friday: 7:00 AM – 10:00 PM',
        'Saturday: 7:00 AM – 10:00 PM',
        'Sunday: 8:00 AM – 8:00 PM',
      ],
    },
  },
  {
    id: 'ph-habitual-coffee',
    name: 'Habitual Coffee',
    vicinity: 'Grand Tower, Tomas Morato Ave, Quezon City',
    formattedAddress: 'Tomas Morato Ave cor. Sct. Rallos, Quezon City, Metro Manila',
    city: 'Quezon City',
    location: { latitude: 14.6382, longitude: 121.0348 },
    rating: 4.6,
    userRatingsTotal: 890,
    openNow: true,
    priceLevel: 2,
    distance: 420,
    isVerified: true,
    acceptsGcash: true,
    isSpecialty: true,
    hasOutlets: true,
    isPetFriendly: false,
    hasAlFresco: true,
    isNew: false,
    seatingStatus: 'available',
    wifiSpeed: 'Fast (150 Mbps+ verified)',
    vibeTags: ['#AeropressSpecialists', '#QuietCorner', '#ThirdWave', '#GoodPastries'],
    phoneNumber: '+63 926 718 9012',
    website: 'https://habitual.ph',
    galleryUrls: [
      'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=800&q=80',
      'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&q=80',
      'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=800&q=80',
    ],
  },
  {
    id: 'ph-current-coffee',
    name: 'Current Coffee Roasters',
    vicinity: 'Timog Ave cor. Sct. Santiago, Quezon City',
    formattedAddress: 'Timog Avenue, South Triangle, Quezon City, Metro Manila',
    city: 'Quezon City',
    location: { latitude: 14.6341, longitude: 121.0332 },
    rating: 4.9,
    userRatingsTotal: 620,
    openNow: true,
    priceLevel: 2,
    distance: 890,
    isVerified: true,
    acceptsGcash: true,
    isSpecialty: true,
    hasOutlets: true,
    isPetFriendly: true,
    hasAlFresco: true,
    isNew: true,
    seatingStatus: 'moderate',
    wifiSpeed: 'Ultra Fast (500 Mbps+ Fiber)',
    vibeTags: ['#NewOpening', '#PourOverHeaven', '#SingleOrigin', '#ModernAesthetic'],
    phoneNumber: '+63 919 456 7890',
    galleryUrls: [
      'https://images.unsplash.com/photo-1507133750040-3a7f57a958f9?w=800&q=80',
      'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=800&q=80',
      'https://images.unsplash.com/photo-1498804103079-a6351b050096?w=800&q=80',
    ],
  },
  {
    id: 'ph-resonate-coffee',
    name: 'Resonate Coffee House',
    vicinity: 'Sct. Lozano St, Brgy. Laging Handa, Quezon City',
    formattedAddress: 'Sct. Lozano St, Quezon City, Metro Manila',
    city: 'Quezon City',
    location: { latitude: 14.6355, longitude: 121.0385 },
    rating: 4.7,
    userRatingsTotal: 480,
    openNow: true,
    priceLevel: 2,
    distance: 610,
    isVerified: false,
    acceptsGcash: true,
    isSpecialty: true,
    hasOutlets: true,
    isPetFriendly: true,
    hasAlFresco: false,
    isNew: false,
    seatingStatus: 'available',
    wifiSpeed: 'Fast (100 Mbps+)',
    vibeTags: ['#HiddenSanctuary', '#PourOver', '#PlantCafe', '#GreatMatcha'],
    galleryUrls: [
      'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&q=80',
      'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=800&q=80',
      'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=800&q=80',
    ],
  },
];
