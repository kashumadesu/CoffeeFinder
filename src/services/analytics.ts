// ============================================================
// Analytics Service — Free Firebase Event Tracking & Telemetry
// ============================================================

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@services/firebase';

export interface AnalyticsEvent {
  eventName: string;
  params: Record<string, any>;
  timestamp?: any;
}

/**
 * Log analytics event to Firebase Cloud Firestore
 * (100% Free on Spark Plan, visible in real time in your Firebase Console)
 */
export const logEvent = async (
  eventName: string,
  params: Record<string, any> = {},
): Promise<void> => {
  try {
    // In development, also logs to console for instant local inspection
    if (__DEV__) {
      console.log(`[Analytics] 📊 ${eventName}`, params);
    }

    // Persist to Cloud Firestore analytics_events collection
    const eventsRef = collection(db, 'analytics_events');
    await addDoc(eventsRef, {
      eventName,
      params,
      createdAt: serverTimestamp(),
      platform: 'ios',
      appVersion: '2.0.0',
    });
  } catch (error) {
    // Analytics logging will never disrupt user flow
  }
};

/** Log search query and bean origin searches */
export const logSearchEvent = (
  keyword: string,
  regionId: string,
  resultsCount: number,
) => {
  return logEvent('search_query', { keyword, regionId, resultsCount });
};

/** Log when user applies a budget or amenity filter */
export const logFilterEvent = (filterType: string, filterValue: any) => {
  return logEvent('filter_applied', { filterType, filterValue });
};

/** Log when user views a café's detailed menu */
export const logCafeView = (shopId: string, shopName: string, vicinity: string) => {
  return logEvent('cafe_detail_viewed', { shopId, shopName, vicinity });
};

/** Log primary conversion: starting in-app road navigation */
export const logNavigationEvent = (
  shopId: string,
  shopName: string,
  mode: string,
  distanceM: number,
) => {
  return logEvent('navigation_started', {
    shopId,
    shopName,
    mode,
    distanceM,
    etaMinutes: Math.round(distanceM / (mode === 'walking' ? 80 : 320)),
  });
};

/** Log viral discovery: sharing café to Instagram/Messenger/TikTok */
export const logShareEvent = (shopId: string, shopName: string) => {
  return logEvent('cafe_shared', { shopId, shopName });
};

/** Log favoriting and coffee passport stamps */
export const logFavoriteEvent = (
  shopId: string,
  shopName: string,
  isFavorite: boolean,
) => {
  return logEvent('favorite_toggled', { shopId, shopName, isFavorite });
};

/** Log offline trek pack download */
export const logTrekPackDownloaded = (regionId: string, regionName: string) => {
  return logEvent('trek_pack_downloaded', { regionId, regionName });
};

/** Log barista tip jar engagement */
export const logBaristaTipEvent = (
  shopId: string,
  shopName: string,
  amount: number,
) => {
  return logEvent('barista_tip_initiated', { shopId, shopName, amount });
};

/** Log owner claim submission */
export const logOwnerClaimEvent = (
  shopId: string,
  shopName: string,
  permitType: string,
) => {
  return logEvent('owner_claim_submitted', { shopId, shopName, permitType });
};

/** Phase 2: Log tasting review submission */
export const logReviewSubmitted = (
  shopId: string,
  rating: number,
  brewMethod: string,
  flavorTags: string[],
) => {
  return logEvent('review_submitted', {
    shopId,
    rating,
    brewMethod,
    flavorTagsCount: flavorTags.length,
  });
};

/** Phase 2: Log helpful vote on cupping review */
export const logReviewHelpfulVote = (reviewId: string) => {
  return logEvent('review_helpful_voted', { reviewId });
};
