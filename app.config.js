// app.config.js — dynamic Expo config with camera & GPS permissions
import 'dotenv/config';

export default {
  expo: {
    name: 'Coffee Finder',
    slug: 'coffee-finder',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: false,
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#FAF8F3',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'com.yourcompany.coffeefinder',
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          'Coffee Finder needs your location to discover nearby specialty cafés in the Philippines.',
        NSLocationAlwaysUsageDescription:
          'Coffee Finder needs your location to discover nearby specialty cafés.',
        NSCameraUsageDescription:
          'Coffee Finder uses your camera to let you take photos of your coffee pour-over and latte art.',
        NSPhotoLibraryUsageDescription:
          'Coffee Finder uses your photo library to attach photos to your community tasting reviews.',
      },
      config: {
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#2A4736',
      },
      package: 'com.yourcompany.coffeefinder',
      permissions: [
        'android.permission.ACCESS_COARSE_LOCATION',
        'android.permission.ACCESS_FINE_LOCATION',
        'android.permission.CAMERA',
        'android.permission.READ_EXTERNAL_STORAGE',
        'android.permission.WRITE_EXTERNAL_STORAGE',
      ],
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY,
        },
      },
    },
    plugins: [
      [
        'expo-location',
        {
          locationAlwaysAndWhenInUsePermission:
            'Coffee Finder needs your location to find nearby specialty coffee spots.',
        },
      ],
      [
        'expo-image-picker',
        {
          photosPermission:
            'Allow Coffee Finder to access your photos to attach coffee tasting review pictures.',
          cameraPermission:
            'Allow Coffee Finder to access your camera to take photos of your brew.',
        },
      ],
    ],
    extra: {
      eas: {
        projectId: '595103da-40ad-442e-b953-4b166af43855',
      },
    },
  },
};
