import type { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Gen2",
  slug: "gen2",
  scheme: "gen2",
  version: "0.1.0",
  orientation: "portrait",
  userInterfaceStyle: "light",
  platforms: ["android", "ios"],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.gen2.app",
    infoPlist: {
      NSCameraUsageDescription: "Gen2 uses the camera to log meals from photos.",
      NSPhotoLibraryUsageDescription: "Gen2 uses your photo library to log meals.",
      NSHealthShareUsageDescription: "Gen2 reads workouts, sleep, height, and weight to calculate your daily scores.",
      NSHealthUpdateUsageDescription: "Gen2 prepares HealthKit access for future health features."
    },
    associatedDomains: ["applinks:gen2.app"]
  },
  android: {
    package: "com.gen2.app",
    permissions: [
      "android.permission.ACTIVITY_RECOGNITION",
      "android.permission.CAMERA",
      "android.permission.health.READ_EXERCISE",
      "android.permission.health.READ_SLEEP",
      "android.permission.health.READ_HEIGHT",
      "android.permission.health.READ_WEIGHT"
    ],
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [{ scheme: "gen2" }, { scheme: "https", host: "gen2.app", pathPrefix: "/friend" }],
        category: ["BROWSABLE", "DEFAULT"]
      }
    ]
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    "expo-image-picker",
    [
      "expo-build-properties",
      {
        android: {
          minSdkVersion: 26,
          compileSdkVersion: 36,
          targetSdkVersion: 36
        },
        ios: {
          deploymentTarget: "16.4"
        }
      }
    ]
  ],
  experiments: {
    typedRoutes: true
  },
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    eas: {
      projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID
    }
  }
});
