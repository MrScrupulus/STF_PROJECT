import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { PROVIDER_GOOGLE } from 'react-native-maps';

/** Expo Go fournit déjà une carte ; l’APK Android a besoin d’une clé Maps SDK. */
export function androidStandaloneMapsMissingKey(): boolean {
  if (Platform.OS !== 'android') {
    return false;
  }
  if (Constants.appOwnership === 'expo') {
    return false;
  }
  return !Constants.expoConfig?.extra?.googleMapsConfigured;
}

/** Props communes pour que les tuiles Google s’affichent dans un ScrollView Android. */
export function androidGoogleMapProps() {
  if (Platform.OS !== 'android') {
    return {};
  }
  return {
    provider: PROVIDER_GOOGLE,
    googleRenderer: 'LEGACY' as const,
    loadingEnabled: true,
    loadingBackgroundColor: '#e5e7eb',
    userInterfaceStyle: 'light' as const,
    pitchEnabled: false,
    rotateEnabled: false,
    toolbarEnabled: false,
  };
}
