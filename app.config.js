// app.config.js — dynamic Expo config with camera & GPS permissions
import 'dotenv/config';

export default {
  expo: {
    name: 'KapeRoute: Coffee Finder PH',
    slug: 'coffee-finder',
    version: '2.0.0',
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
          'KapeRoute uses your location to discover nearby specialty coffee shops in the Philippines and provide turn-by-turn road navigation.',
        NSCameraUsageDescription:
          'KapeRoute uses your camera to photograph DTI and Mayor business permits for owner verification and share coffee tasting notes.',
        NSPhotoLibraryUsageDescription:
          'KapeRoute accesses your photo library to upload business permits for verification and café tasting photos.',
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
            'KapeRoute needs your location to find nearby specialty coffee spots and provide road routing.',
        },
      ],
      [
        'expo-image-picker',
        {
          photosPermission:
            'Allow KapeRoute to access your photos to upload business permits and coffee tasting pictures.',
          cameraPermission:
            'Allow KapeRoute to access your camera to photograph business permits for owner verification and latte art.',
        },
      ],
      'expo-web-browser',
    ],
    extra: {
      eas: {
        projectId: '595103da-40ad-442e-b953-4b166af43855',
      },
    },
  },
};
