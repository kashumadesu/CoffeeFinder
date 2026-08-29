// ============================================================
// App Constants
// ============================================================

// Replace with your actual key from Google Cloud Console
// https://console.cloud.google.com/apis/credentials
export const GOOGLE_PLACES_API_KEY = 'YOUR_GOOGLE_PLACES_API_KEY_HERE';

export const GOOGLE_PLACES_BASE_URL = 'https://maps.googleapis.com/maps/api/place';
export const GOOGLE_DIRECTIONS_BASE_URL = 'https://maps.googleapis.com/maps/api/directions';

// Photo proxy – generates a URL to fetch a photo from Places API
export const getPhotoUrl = (photoRef: string, maxWidth = 800): string =>
  `${GOOGLE_PLACES_BASE_URL}/photo?maxwidth=${maxWidth}&photoreference=${photoRef}&key=${GOOGLE_PLACES_API_KEY}`;

// Colors
export const COLORS = {
  primary: '#4A2C2A',      // Deep espresso brown
  primaryLight: '#7B4F3A', // Latte brown
  accent: '#D4A853',       // Golden caramel
  background: '#FAF7F2',   // Warm cream
  surface: '#FFFFFF',
  textPrimary: '#1A1A1A',
  textSecondary: '#6B6B6B',
  textMuted: '#AAAAAA',
  success: '#27AE60',      // Open badge
  danger: '#E74C3C',       // Closed badge
  border: '#E8E0D6',
  overlay: 'rgba(0,0,0,0.45)',
  mapPin: '#D4A853',
  mapPinSelected: '#4A2C2A',
  favorite: '#E74C3C',
  star: '#F5A623',
};

// Layout
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 20,
  full: 999,
};

// Map defaults
export const DEFAULT_REGION = {
  latitude: 37.7749,   // San Francisco (fallback if location denied)
  longitude: -122.4194,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

export const DELTA = {
  small: 0.01,
  medium: 0.02,
  large: 0.05,
};

// Search
export const SEARCH_KEYWORD = 'coffee shop';
export const PLACE_TYPES = 'cafe';

// Filter options exposed in UI
export const RADIUS_OPTIONS = [
  { label: '500m', value: 500 },
  { label: '1 km', value: 1000 },
  { label: '2 km', value: 2000 },
  { label: '5 km', value: 5000 },
];

export const RATING_OPTIONS = [
  { label: '3.5+', value: 3.5 },
  { label: '4.0+', value: 4.0 },
  { label: '4.5+', value: 4.5 },
];

// Re-export formatting utility so components can use @constants/index
export { formatDistance } from '@services/googlePlaces';

// Price level map
export const PRICE_LABELS: Record<number, string> = {
  0: 'Free',
  1: '$',
  2: '$$',
  3: '$$$',
  4: '$$$$',
};
