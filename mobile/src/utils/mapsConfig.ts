import { Platform } from 'react-native';
import Constants from 'expo-constants';

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
