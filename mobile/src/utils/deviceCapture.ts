import { Alert, Linking, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { uriToJpegDataUrl } from './imageUpload';

export type GpsPoint = { latitude: number; longitude: number };

function openAppSettings() {
  if (Platform.OS === 'ios') {
    Linking.openURL('app-settings:');
  } else {
    Linking.openSettings();
  }
}

export async function captureJpegFromCamera(): Promise<{ dataUrl: string; uri: string } | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (permission.status !== 'granted') {
    Alert.alert(
      'Caméra requise',
      'Autorisez l’appareil photo dans les paramètres de l’application pour photographier une prise.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Ouvrir les paramètres', onPress: openAppSettings },
      ]
    );
    return null;
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    // Le recadrage natif Android casse souvent la caméra sur APK.
    allowsEditing: Platform.OS === 'ios',
    quality: 0.7,
    exif: false,
    base64: false,
  });

  if (result.canceled || !result.assets[0]?.uri) {
    return null;
  }

  const uri = result.assets[0].uri;
  const dataUrl = await uriToJpegDataUrl(uri);
  return { dataUrl, uri };
}

export async function getPreciseGpsPosition(): Promise<GpsPoint> {
  const servicesOn = await Location.hasServicesEnabledAsync();
  if (!servicesOn) {
    if (Platform.OS === 'android') {
      try {
        await Location.enableNetworkProviderAsync();
      } catch {
        throw new Error(
          'La localisation est désactivée. Activez le GPS (précision élevée) dans les paramètres Android.'
        );
      }
    } else {
      throw new Error('La localisation est désactivée. Activez-la dans les réglages.');
    }
  }

  const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    const err = new Error(
      canAskAgain === false
        ? 'Permission de localisation refusée. Activez-la dans les paramètres.'
        : 'Permission de localisation refusée.'
    ) as Error & { code: string; canAskAgain?: boolean };
    err.code = 'permission';
    err.canAskAgain = canAskAgain;
    throw err;
  }

  const lastKnown = await Location.getLastKnownPositionAsync();
  const fresh = Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
    mayShowUserSettingsDialog: true,
  });

  const pos = await Promise.race([
    fresh,
    new Promise<Location.LocationObject>((resolve, reject) => {
      setTimeout(() => {
        if (lastKnown) {
          resolve(lastKnown);
          return;
        }
        reject(
          new Error(
            'Impossible d’obtenir le GPS à temps. Sortez à l’extérieur, activez la localisation précise, puis réessayez.'
          )
        );
      }, 12000);
    }),
  ]);

  return {
    latitude: pos.coords.latitude,
    longitude: pos.coords.longitude,
  };
}

export { openAppSettings };
