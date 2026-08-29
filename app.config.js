// app.config.js — dynamic Expo config that reads from .env
// This replaces app.json so we can inject environment variables
// into native configuration (Google Maps API keys) securely.

import 'dotenv/config'; // loads .env into process.env

export default {
  expo: {
    name: 'Coffee Finder',
    slug: 'coffee-finder',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#4A2C2A',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'com.yourcompany.coffeefinder',
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          'Coffee Finder needs your location to show nearby coffee shops.',
        NSLocationAlwaysUsageDescription:
          'Coffee Finder needs your location to show nearby coffee shops.',
      },
      config: {
        // Reads from .env → process.env
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#4A2C2A',
      },
      package: 'com.yourcompany.coffeefinder',
      permissions: [
        'android.permission.ACCESS_COARSE_LOCATION',
        'android.permission.ACCESS_FINE_LOCATION',
      ],
      config: {
        googleMaps: {
          // Reads from .env → process.env
          apiKey: process.env.GOOGLE_MAPS_API_KEY,
        },
      },
    },
    plugins: [
      [
        'expo-location',
        {
          locationAlwaysAndWhenInUsePermission:
            'Coffee Finder needs your location to find nearby coffee shops.',
        },
      ],
    ],
    extra: {
      eas: {
        projectId: 'YOUR_EAS_PROJECT_ID',
      },
    },
  },
};
