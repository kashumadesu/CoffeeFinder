// ============================================================
// App Constants — Specialty Coffee (PH Edition)
// ============================================================

import { GOOGLE_MAPS_API_KEY } from '@env';
import type { CoffeeShop, RegionHub } from '@types';

export const GOOGLE_PLACES_API_KEY = GOOGLE_MAPS_API_KEY;
export const GOOGLE_PLACES_BASE_URL = 'https://maps.googleapis.com/maps/api/place';
export const GOOGLE_DIRECTIONS_BASE_URL = 'https://maps.googleapis.com/maps/api/directions';

export const getPhotoUrl = (photoRef: string, maxWidth = 800): string =>
  `${GOOGLE_PLACES_BASE_URL}/photo?maxwidth=${maxWidth}&photoreference=${photoRef}&key=${GOOGLE_PLACES_API_KEY}`;

// ---- Modern Design System Colors ----
export const COLORS = {
  primary: '#2A4736',        // Deep forest green
  primaryDark: '#1C3326',    // Darker forest green
  primaryLight: '#3D614C',   // Medium sage green
  primaryMuted: '#4F725E',
  
  background: '#FAF8F3',     // Warm specialty cream
  surface: '#FFFFFF',        // Pure white card
  surfaceSage: '#EAF4EE',    // Pale mint container
  surfaceWarm: '#F3EFE6',    // Soft sand
  
  taupe: '#D2C4B5',          // Unselected map pins & search button
  taupeLight: '#E8DFD5',
  tagBrown: '#5D4037',       // Earth brown vibe pills
  tagBrownBg: '#EFEBE9',
  tagGreen: '#2A4736',       // Forest green vibe pills
  tagGreenBg: '#E8F1EC',
  
  textPrimary: '#1F1E1D',
  textSecondary: '#66625D',
  textMuted: '#9B9690',
  
  gcash: '#007DFE',
  gcashBg: '#E6F2FF',
  verified: '#27AE60',
  success: '#27AE60',
  warning: '#E67E22',
  danger: '#E74C3C',
  star: '#F5A623',
  route: '#2A4736',          // Navigation Polyline Color
  
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

// ---- Philippine Regional Coffee Hubs (100% Offline Accessible) ----
export const REGION_HUBS: RegionHub[] = [
  {
    id: 'manila',
    name: 'Metro Manila',
    island: 'Luzon',
    latitude: 14.6360,
    longitude: 121.0370,
    latitudeDelta: 0.025,
    longitudeDelta: 0.025,
  },
  {
    id: 'benguet',
    name: 'Baguio & Benguet',
    island: 'Luzon (Cordillera)',
    latitude: 16.4023,
    longitude: 120.5960,
    latitudeDelta: 0.03,
    longitudeDelta: 0.03,
  },
  {
    id: 'sagada',
    name: 'Sagada',
    island: 'Luzon (Highlands)',
    latitude: 17.0825,
    longitude: 120.9015,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  },
  {
    id: 'cebu',
    name: 'Cebu City',
    island: 'Visayas',
    latitude: 10.3157,
    longitude: 123.8854,
    latitudeDelta: 0.03,
    longitudeDelta: 0.03,
  },
  {
    id: 'siargao',
    name: 'Siargao Island',
    island: 'Mindanao',
    latitude: 9.7895,
    longitude: 126.1554,
    latitudeDelta: 0.03,
    longitudeDelta: 0.03,
  },
];

export const DEFAULT_REGION = {
  latitude: REGION_HUBS[0].latitude,
  longitude: REGION_HUBS[0].longitude,
  latitudeDelta: REGION_HUBS[0].latitudeDelta,
  longitudeDelta: REGION_HUBS[0].longitudeDelta,
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

// Specialty Filter Chips
export const SPECIALTY_CATEGORIES = [
  { id: 'specialty', label: '☕ Specialty' },
  { id: 'outlets', label: '⚡ Outlets' },
  { id: 'alfresco', label: '🌱 Al Fresco' },
  { id: 'petFriendly', label: '🐾 Pet Friendly' },
  { id: 'new', label: '🆕 New' },
  { id: 'fastWifi', label: '📶 Fast Wi-Fi' },
];

export const FLAVOR_TAGS = [
  '🌸 Jasmine',
  '🍋 Bergamot',
  '🍯 Wild Honey',
  '🍫 Dark Chocolate',
  '🫐 Blueberry',
  '🥭 Dried Mango',
  '🥜 Roasted Hazelnut',
  '🌾 Muscovado Sugar',
  '🍊 Citrus Zest',
];

export const PRICE_LABELS: Record<number, string> = {
  0: 'Free',
  1: '₱',
  2: '₱₱',
  3: '₱₱₱',
  4: '₱₱₱₱',
};

// ---- Rich Philippine Specialty Dataset with Tasting Notes & Recipes ----
export const PH_SPECIALTY_CAFES: CoffeeShop[] = [
  {
    id: 'ph-chapter-coffee',
    name: 'Chapter Coffee Roasters',
    vicinity: '143 Sct. Gandia St, Tomas Morato, Quezon City',
    formattedAddress: '143 Sct. Gandia St, Diliman, Quezon City, Metro Manila',
    city: 'Quezon City',
    regionId: 'manila',
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
    brewRecipe: {
      beanOrigin: 'Benguet Atok (Arabica Typica)',
      roastLevel: 'Light Roast',
      ratio: '1:15 (15g coffee / 225g water)',
      temperature: '92°C',
      grindSize: 'Medium-Fine',
      brewTime: '2m 40s',
    },
    tastingNotes: [
      {
        id: 'tn-1',
        shopId: 'ph-chapter-coffee',
        author: 'Maria C. (Barista)',
        rating: 5,
        notes: ['🌸 Jasmine', '🍋 Bergamot', '🍯 Wild Honey'],
        brewMethod: 'V60 Pour-Over',
        comment: 'Bright floral aroma with sweet honey aftertaste. Best pour-over in Tomas Morato!',
        createdAt: '2 hours ago',
      },
      {
        id: 'tn-2',
        shopId: 'ph-chapter-coffee',
        author: 'Joshua P.',
        rating: 5,
        notes: ['🥭 Dried Mango', '🍫 Dark Chocolate'],
        brewMethod: 'Flat White (Oat)',
        comment: 'Super smooth espresso with natural sweetness. Very laptop friendly with fast Wi-Fi.',
        createdAt: '1 day ago',
      },
    ],
  },
  {
    id: 'ph-yardstick-coffee',
    name: 'Yardstick Coffee',
    vicinity: '106 Esteban St, Legazpi Village, Makati',
    formattedAddress: '106 Esteban St, Legazpi Village, Makati, Metro Manila',
    city: 'Makati',
    regionId: 'manila',
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
    brewRecipe: {
      beanOrigin: 'Golden Ticket Espresso Blend',
      roastLevel: 'Medium Roast',
      ratio: '1:2 (18g in / 36g out)',
      temperature: '93°C',
      grindSize: 'Fine',
      brewTime: '28s',
    },
    tastingNotes: [
      {
        id: 'tn-3',
        shopId: 'ph-yardstick-coffee',
        author: 'Bea L.',
        rating: 5,
        notes: ['🍫 Dark Chocolate', '🥜 Roasted Hazelnut', '🌾 Muscovado Sugar'],
        brewMethod: 'Yardshake / Espresso',
        comment: 'Legendary coffee experience. The baristas know their craft inside out.',
        createdAt: 'Yesterday',
      },
    ],
  },
  {
    id: 'ph-habitual-coffee',
    name: 'Habitual Coffee',
    vicinity: 'Grand Tower, Tomas Morato Ave, Quezon City',
    formattedAddress: 'Tomas Morato Ave cor. Sct. Rallos, Quezon City, Metro Manila',
    city: 'Quezon City',
    regionId: 'manila',
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
    galleryUrls: [
      'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=800&q=80',
      'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&q=80',
      'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=800&q=80',
    ],
    brewRecipe: {
      beanOrigin: 'Mt. Apo (Davao del Sur Arabica)',
      roastLevel: 'Light-Medium',
      ratio: '1:14 (Inverted Aeropress)',
      temperature: '88°C',
      grindSize: 'Medium',
      brewTime: '1m 45s',
    },
  },
  {
    id: 'ph-sagada-brew',
    name: 'Sagada Brew & Roastery',
    vicinity: 'Poblacion, Sagada, Mountain Province',
    formattedAddress: 'Poblacion Main Road, Sagada, Mountain Province',
    city: 'Sagada',
    regionId: 'sagada',
    location: { latitude: 17.0825, longitude: 120.9015 },
    rating: 4.9,
    userRatingsTotal: 740,
    openNow: true,
    priceLevel: 1,
    distance: 850,
    isVerified: true,
    acceptsGcash: true,
    isSpecialty: true,
    hasOutlets: true,
    isPetFriendly: true,
    hasAlFresco: true,
    isNew: false,
    seatingStatus: 'available',
    wifiSpeed: 'Fast (100 Mbps Starlink)',
    vibeTags: ['#HighlandOrigin', '#SingleEstate', '#MountainBreeze', '#AuthenticArabica'],
    galleryUrls: [
      'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&q=80',
      'https://images.unsplash.com/photo-1507133750040-3a7f57a958f9?w=800&q=80',
      'https://images.unsplash.com/photo-1498804103079-a6351b050096?w=800&q=80',
    ],
    brewRecipe: {
      beanOrigin: 'Sagada Arabica (Peaberry Single-Estate)',
      roastLevel: 'Medium Roast',
      ratio: '1:16 (French Press)',
      temperature: '91°C',
      grindSize: 'Coarse',
      brewTime: '4m 00s',
    },
    tastingNotes: [
      {
        id: 'tn-4',
        shopId: 'ph-sagada-brew',
        author: 'Datu K.',
        rating: 5,
        notes: ['🍫 Dark Chocolate', '🌾 Muscovado Sugar', '🍊 Citrus Zest'],
        brewMethod: 'Sagada Drip',
        comment: 'Drinking origin coffee right in the mountain breeze is unforgettable.',
        createdAt: '3 days ago',
      },
    ],
  },
  {
    id: 'ph-siargao-shaka',
    name: 'White Banana Coffee & Roastery',
    vicinity: 'Tourism Rd, General Luna, Siargao',
    formattedAddress: 'Tourism Road, General Luna, Siargao Island',
    city: 'Siargao',
    regionId: 'siargao',
    location: { latitude: 9.7895, longitude: 126.1554 },
    rating: 4.8,
    userRatingsTotal: 920,
    openNow: true,
    priceLevel: 2,
    distance: 500,
    isVerified: true,
    acceptsGcash: true,
    isSpecialty: true,
    hasOutlets: true,
    isPetFriendly: true,
    hasAlFresco: true,
    isNew: true,
    seatingStatus: 'moderate',
    wifiSpeed: 'Fiber Wi-Fi (150 Mbps)',
    vibeTags: ['#IslandVibes', '#ColdBrewMaster', '#PlantBased', '#SurferApproved'],
    galleryUrls: [
      'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=800&q=80',
      'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=800&q=80',
      'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=800&q=80',
    ],
    brewRecipe: {
      beanOrigin: 'Bukidnon Single Origin',
      roastLevel: 'Light-Medium',
      ratio: '1:10 (16-hour Slow Cold Drip)',
      temperature: 'Cold Brew (4°C)',
      grindSize: 'Coarse',
      brewTime: '16 hours',
    },
  },
];
