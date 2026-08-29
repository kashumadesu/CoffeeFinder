# ? Coffee Finder

A React Native mobile app (iOS & Android) that uses **Google Maps** and **Google Places API** to find nearby coffee shops.

## Features
- ?? Interactive Google Map with custom coffee-cup pins
- ?? List view sorted by distance
- ?? Filters: Open Now, Min Rating, Search Radius
- ?? Shop details — photo carousel, hours, phone, website
- ?? Get Directions ? opens native Maps app
- ?? Favorites (persists with AsyncStorage)

---

## Prerequisites
- Node.js 18+ (https://nodejs.org)
- Expo CLI: `npm install -g expo-cli`
- Android Studio (Android) or Xcode (iOS, macOS only)
- Google Cloud account with billing enabled

---

## 1. Install Dependencies

```bash
cd CoffeeFinder
npm install
```

---

## 2. Set Up Google API Keys

### Enable these APIs in Google Cloud Console:
- Maps SDK for Android
- Maps SDK for iOS
- Places API (New)
- Directions API

### Add keys to the project:

**app.json** — map tile keys (per platform):
```json
"ios":     { "config": { "googleMapsApiKey": "YOUR_IOS_KEY" } }
"android": { "config": { "googleMaps": { "apiKey": "YOUR_ANDROID_KEY" } } }
```

**src/constants/index.ts** — Places/Directions key:
```ts
export const GOOGLE_PLACES_API_KEY = 'YOUR_BACKEND_KEY';
```

> ?? Never commit real API keys to git. Use a .env or secrets manager for production.

---

## 3. Run the App

```bash
# Android
npx expo run:android

# iOS (macOS only)
npx expo run:ios
```

> Note: react-native-maps requires a native build. Expo Go is not supported.

---

## Project Structure

```
CoffeeFinder/
+-- App.tsx                      # Root entry point
+-- app.json                     # Expo config + API keys
+-- src/
¦   +-- types/index.ts           # Shared TypeScript types
¦   +-- constants/index.ts       # Colors, spacing, API key
¦   +-- services/googlePlaces.ts # Places API + distance utils
¦   +-- store/useStore.ts        # Zustand global state
¦   +-- hooks/
¦   ¦   +-- useLocation.ts       # GPS permission + tracking
¦   ¦   +-- useFavorites.ts      # Favorites helper
¦   +-- components/
¦   ¦   +-- CoffeeMarker.tsx     # Custom map pin
¦   ¦   +-- ShopCard.tsx         # Card for list/bottom sheet
¦   ¦   +-- FilterBar.tsx        # Filter chips + modals
¦   ¦   +-- RatingStars.tsx      # Star rating display
¦   +-- screens/
¦   ¦   +-- MapScreen.tsx        # Map + bottom sheet list
¦   ¦   +-- ListScreen.tsx       # Full list view
¦   ¦   +-- DetailScreen.tsx     # Shop detail screen
¦   ¦   +-- FavoritesScreen.tsx  # Saved favorites
¦   +-- navigation/
¦       +-- AppNavigator.tsx     # Bottom tab + stack navigator
```

---

## Tech Stack
- React Native (Expo bare workflow)
- react-native-maps — Google Maps
- expo-location — GPS
- @react-navigation — navigation
- @gorhom/bottom-sheet — draggable panel
- Zustand — global state
- AsyncStorage — persistence
- axios — HTTP client
