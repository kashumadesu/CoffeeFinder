// ============================================================
// Directions Service — Google Directions API with Turn-by-Turn Steps & Multi-Modal Routing
// Supports Walk (🚶), Motorcycle (🏍️), 4-Wheels (🚗), and Transit / Rail (🚆)
// ============================================================

import polyline from '@mapbox/polyline';
import { GOOGLE_PLACES_API_KEY } from '@constants';
import type { Location, NavigationRoute, NavigationStep, NavigationMode } from '@types';

// In-memory cache for ultra-fast instant route loading
const routeCache = new Map<string, NavigationRoute>();

/** Strip HTML formatting from Google Directions instructions */
function cleanHtml(html: string): string {
  return html
    .replace(/<div[^>]*>/gi, ' - ')
    .replace(/<\/div>/gi, '')
    .replace(/<b[^>]*>/gi, '')
    .replace(/<\/b>/gi, '')
    .replace(/<span[^>]*>/gi, '')
    .replace(/<\/span>/gi, '')
    .replace(/<wbr\/>/gi, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Realistic fallback street grid waypoints and steps for offline mode */
export function generateFallbackRoute(
  orig: Location,
  dest: Location,
  mode: NavigationMode = 'walking',
): NavigationRoute {
  const dLat = dest.latitude - orig.latitude;
  const dLng = dest.longitude - orig.longitude;

  const R = 6371000;
  const radLat = ((dest.latitude - orig.latitude) * Math.PI) / 180;
  const radLng = ((dest.longitude - orig.longitude) * Math.PI) / 180;
  const a =
    Math.sin(radLat / 2) ** 2 +
    Math.cos((orig.latitude * Math.PI) / 180) *
      Math.cos((dest.latitude * Math.PI) / 180) *
      Math.sin(radLng / 2) ** 2;
  const straightLine = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceMeters = Math.round(straightLine * 1.35);

  // Speed matrix in Philippine urban roads
  let speedMps = 1.38; // Walk: 5 km/h
  if (mode === 'motorcycle') speedMps = 9.72; // Motor: 35 km/h (lane filtering)
  if (mode === 'driving') speedMps = 6.94; // Car / 4-Wheels: 25 km/h (city traffic)
  if (mode === 'transit') speedMps = 8.33; // Transit / MRT: 30 km/h

  const durationSeconds = Math.max(60, Math.round(distanceMeters / speedMps));

  const coords: Location[] = [
    orig,
    { latitude: orig.latitude + dLat * 0.32, longitude: orig.longitude },
    { latitude: orig.latitude + dLat * 0.32, longitude: orig.longitude + dLng * 0.55 },
    { latitude: orig.latitude + dLat * 0.78, longitude: orig.longitude + dLng * 0.55 },
    { latitude: orig.latitude + dLat * 0.78, longitude: dest.longitude },
    dest,
  ];

  const steps: NavigationStep[] = [
    {
      id: 'step-1',
      instruction: `Head ${dLat >= 0 ? 'north' : 'south'} along avenue`,
      distanceText: `${Math.round(distanceMeters * 0.3)} m`,
      distanceMeters: Math.round(distanceMeters * 0.3),
      durationText: `${Math.max(1, Math.round((durationSeconds * 0.3) / 60))} min`,
      maneuver: 'straight',
      startLocation: coords[0],
      endLocation: coords[1],
    },
    {
      id: 'step-2',
      instruction: `Turn ${dLng >= 0 ? 'right' : 'left'} onto connecting road`,
      distanceText: `${Math.round(distanceMeters * 0.4)} m`,
      distanceMeters: Math.round(distanceMeters * 0.4),
      durationText: `${Math.max(1, Math.round((durationSeconds * 0.4) / 60))} min`,
      maneuver: dLng >= 0 ? 'turn-right' : 'turn-left',
      startLocation: coords[1],
      endLocation: coords[3],
    },
    {
      id: 'step-3',
      instruction: `Arrive at café destination`,
      distanceText: `${Math.round(distanceMeters * 0.3)} m`,
      distanceMeters: Math.round(distanceMeters * 0.3),
      durationText: `${Math.max(1, Math.round((durationSeconds * 0.3) / 60))} min`,
      maneuver: 'arrive',
      startLocation: coords[3],
      endLocation: coords[5],
    },
  ];

  return {
    coordinates: coords,
    distanceMeters,
    durationSeconds,
    distanceText: distanceMeters >= 1000 ? `${(distanceMeters / 1000).toFixed(1)} km` : `${distanceMeters} m`,
    durationText: `${Math.max(1, Math.round(durationSeconds / 60))} min`,
    steps,
  };
}

/** Fetch full navigation route and turn-by-turn steps from Google Directions API */
export async function fetchDirectionsRoute(
  origin: Location,
  destination: Location,
  mode: NavigationMode = 'walking',
): Promise<NavigationRoute> {
  const cacheKey = `${origin.latitude.toFixed(3)},${origin.longitude.toFixed(3)}->${destination.latitude.toFixed(3)},${destination.longitude.toFixed(3)}_${mode}`;

  const cached = routeCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Map to Google Directions API mode parameter
  const googleApiMode = mode === 'motorcycle' ? 'driving' : mode === 'transit' ? 'transit' : mode;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6500);

    const url =
      `https://maps.googleapis.com/maps/api/directions/json` +
      `?origin=${origin.latitude},${origin.longitude}` +
      `&destination=${destination.latitude},${destination.longitude}` +
      `&mode=${googleApiMode}` +
      `&region=PH` +
      `&key=${GOOGLE_PLACES_API_KEY}`;

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    const data = await response.json();

    if (data.status === 'OK' && Array.isArray(data.routes) && data.routes.length > 0) {
      const route = data.routes[0];
      const encoded = route.overview_polyline.points;
      const decoded = polyline.decode(encoded);
      const coords: Location[] = decoded.map(([lat, lng]: [number, number]) => ({
        latitude: lat,
        longitude: lng,
      }));

      const leg = route.legs?.[0];
      const rawDistanceMeters = leg?.distance?.value ?? 0;
      let rawDurationSeconds = leg?.duration?.value ?? 0;

      // Motorcycle adjustment: ~30-35% faster in PH city traffic
      if (mode === 'motorcycle') {
        rawDurationSeconds = Math.max(60, Math.round(rawDurationSeconds * 0.68));
      }

      const distanceText = leg?.distance?.text ?? (rawDistanceMeters >= 1000 ? `${(rawDistanceMeters / 1000).toFixed(1)} km` : `${rawDistanceMeters} m`);
      const durationText = `${Math.max(1, Math.round(rawDurationSeconds / 60))} min`;

      // Parse turn-by-turn steps
      const steps: NavigationStep[] = (leg?.steps ?? []).map((s: any, idx: number) => {
        const instruction = cleanHtml(s.html_instructions || 'Continue along route');
        return {
          id: `step-${idx}-${Date.now()}`,
          instruction,
          distanceText: s.distance?.text || '',
          distanceMeters: s.distance?.value || 0,
          durationText: s.duration?.text || '',
          maneuver: s.maneuver || (idx === (leg.steps.length - 1) ? 'arrive' : 'straight'),
          startLocation: { latitude: s.start_location?.lat ?? 0, longitude: s.start_location?.lng ?? 0 },
          endLocation: { latitude: s.end_location?.lat ?? 0, longitude: s.end_location?.lng ?? 0 },
        };
      });

      const navRoute: NavigationRoute = {
        coordinates: coords,
        distanceMeters: rawDistanceMeters,
        durationSeconds: rawDurationSeconds,
        distanceText,
        durationText,
        steps: steps.length > 0 ? steps : generateFallbackRoute(origin, destination, mode).steps,
      };

      routeCache.set(cacheKey, navRoute);
      return navRoute;
    }
  } catch {
    // Silent fallback to realistic urban grid
  }

  const fallback = generateFallbackRoute(origin, destination, mode);
  routeCache.set(cacheKey, fallback);
  return fallback;
}
