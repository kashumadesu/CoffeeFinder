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
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#FAF8F3',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'com.coffeefinder.ph',
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          'Coffee Finder uses your location to discover nearby specialty coffee shops in the Philippines and provide road navigation.',
        NSCameraUsageDescription:
          'Coffee Finder uses your camera to photograph DTI and Mayor business permits for owner verification and share coffee tasting notes.',
        NSPhotoLibraryUsageDescription:
          'Coffee Finder accesses your photo library to upload business permits for verification and café tasting photos.',
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
      package: 'com.coffeefinder.ph',
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
            'Allow Coffee Finder to access your photos to upload business permits and coffee tasting pictures.',
          cameraPermission:
            'Allow Coffee Finder to access your camera to photograph business permits for owner verification and latte art.',
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
