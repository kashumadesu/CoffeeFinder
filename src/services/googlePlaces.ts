// ============================================================
// Google Places Service
// Wraps the Google Places API (Nearby Search + Place Details)
// and the Directions API.
// ============================================================

import axios from 'axios';
import {
  GOOGLE_PLACES_API_KEY,
  GOOGLE_PLACES_BASE_URL,
  SEARCH_KEYWORD,
  PLACE_TYPES,
} from '@constants';
import type { CoffeeShop, Filters, Location, OpeningHours, Photo } from '@types';

// ---------- Helpers ----------

/** Haversine distance in metres between two lat/lng points */
export function getDistanceMetres(a: Location, b: Location): number {
  const R = 6371000;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLng = ((b.longitude - a.longitude) * Math.PI) / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const chord =
    sinLat * sinLat +
    Math.cos((a.latitude * Math.PI) / 180) *
      Math.cos((b.latitude * Math.PI) / 180) *
      sinLng * sinLng;
  return R * 2 * Math.atan2(Math.sqrt(chord), Math.sqrt(1 - chord));
}

/** Format metres to a human-readable string */
export function formatDistance(metres: number): string {
  if (metres < 1000) return `${Math.round(metres)} m`;
  return `${(metres / 1000).toFixed(1)} km`;
}

// ---------- Nearby Search ----------

interface NearbyResult {
  place_id: string;
  name: string;
  vicinity: string;
  geometry: { location: { lat: number; lng: number } };
  rating?: number;
  user_ratings_total?: number;
  opening_hours?: { open_now: boolean };
  photos?: Array<{ photo_reference: string; width: number; height: number }>;
  price_level?: number;
  types?: string[];
}

/** Fetch nearby coffee shops from Google Places Nearby Search API */
export async function searchNearbyCoffee(
  userLocation: Location,
  filters: Filters,
): Promise<CoffeeShop[]> {
  const params = {
    location: `${userLocation.latitude},${userLocation.longitude}`,
    radius: filters.radiusMetres,
    type: PLACE_TYPES,
    keyword: SEARCH_KEYWORD,
    key: GOOGLE_PLACES_API_KEY,
    ...(filters.openNow ? { opennow: true } : {}),
  };

  const response = await axios.get(`${GOOGLE_PLACES_BASE_URL}/nearbysearch/json`, { params });

  if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
    throw new Error(`Places API error: ${response.data.status} — ${response.data.error_message ?? ''}`);
  }

  const results: NearbyResult[] = response.data.results ?? [];

  let shops: CoffeeShop[] = results.map((r) => ({
    id: r.place_id,
    name: r.name,
    vicinity: r.vicinity,
    location: { latitude: r.geometry.location.lat, longitude: r.geometry.location.lng },
    rating: r.rating,
    userRatingsTotal: r.user_ratings_total,
    openNow: r.opening_hours?.open_now,
    photos: r.photos?.map((p) => ({
      photoReference: p.photo_reference,
      width: p.width,
      height: p.height,
    })) as Photo[],
    priceLevel: r.price_level,
    types: r.types,
    distance: getDistanceMetres(userLocation, {
      latitude: r.geometry.location.lat,
      longitude: r.geometry.location.lng,
    }),
  }));

  // Apply client-side rating filter
  if (filters.minRating !== null) {
    shops = shops.filter((s) => (s.rating ?? 0) >= (filters.minRating as number));
  }

  // Sort by distance
  shops.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));

  return shops;
}

// ---------- Place Details ----------

interface DetailsResult {
  place_id: string;
  name: string;
  formatted_address?: string;
  formatted_phone_number?: string;
  website?: string;
  rating?: number;
  user_ratings_total?: number;
  opening_hours?: {
    open_now: boolean;
    weekday_text?: string[];
  };
  photos?: Array<{ photo_reference: string; width: number; height: number }>;
  price_level?: number;
  geometry: { location: { lat: number; lng: number } };
  types?: string[];
  vicinity?: string;
}

/** Fetch full details for a single place */
export async function getPlaceDetails(placeId: string): Promise<CoffeeShop> {
  const fields = [
    'place_id',
    'name',
    'formatted_address',
    'formatted_phone_number',
    'website',
    'rating',
    'user_ratings_total',
    'opening_hours',
    'photos',
    'price_level',
    'geometry',
    'types',
    'vicinity',
  ].join(',');

  const response = await axios.get(`${GOOGLE_PLACES_BASE_URL}/details/json`, {
    params: { place_id: placeId, fields, key: GOOGLE_PLACES_API_KEY },
  });

  if (response.data.status !== 'OK') {
    throw new Error(`Place Details error: ${response.data.status}`);
  }

  const r: DetailsResult = response.data.result;

  const hours: OpeningHours | undefined = r.opening_hours
    ? { openNow: r.opening_hours.open_now, weekdayText: r.opening_hours.weekday_text }
    : undefined;

  return {
    id: r.place_id,
    name: r.name,
    vicinity: r.vicinity ?? '',
    formattedAddress: r.formatted_address,
    location: { latitude: r.geometry.location.lat, longitude: r.geometry.location.lng },
    rating: r.rating,
    userRatingsTotal: r.user_ratings_total,
    openNow: r.opening_hours?.open_now,
    openingHours: hours,
    photos: r.photos?.map((p) => ({
      photoReference: p.photo_reference,
      width: p.width,
      height: p.height,
    })),
    phoneNumber: r.formatted_phone_number,
    website: r.website,
    priceLevel: r.price_level,
    types: r.types,
  };
}
