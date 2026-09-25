import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/** Accessible après le 1er déverrouillage : évite KeychainException en arrière-plan / au lancement iOS. */
const iosOptions: SecureStore.SecureStoreOptions =
  Platform.OS === 'ios'
    ? { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK }
    : {};

export async function getSecureItem(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key, iosOptions);
  } catch {
    return null;
  }
}

export async function setSecureItem(key: string, value: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(key, value, iosOptions);
  } catch {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      // Keychain indisponible (appareil verrouillé, Face ID, etc.)
    }
  }
}

export async function deleteSecureItem(key: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    // ignore
  }
}
