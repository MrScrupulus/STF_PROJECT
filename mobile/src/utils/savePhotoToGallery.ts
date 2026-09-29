import * as MediaLibrary from 'expo-media-library/legacy';
import { Platform } from 'react-native';

const ALBUM_NAME = 'Street Fishing';

export async function savePhotoToGallery(uri: string): Promise<boolean> {
  if (Platform.OS === 'web' || !uri) {
    return false;
  }

  try {
    let permission = await MediaLibrary.getPermissionsAsync(true);
    if (permission.status !== 'granted' && permission.status !== 'limited') {
      permission = await MediaLibrary.requestPermissionsAsync(true);
    }
    if (permission.status !== 'granted' && permission.status !== 'limited') {
      permission = await MediaLibrary.requestPermissionsAsync();
    }

    if (permission.status !== 'granted' && permission.status !== 'limited') {
      return false;
    }

    const localUri = uri.startsWith('file:') || uri.startsWith('content:') || uri.startsWith('ph:')
      ? uri
      : uri.startsWith('/')
        ? `file://${uri}`
        : uri;

    const mediaLibrary = MediaLibrary as typeof MediaLibrary & {
      saveToLibraryAsync?: (localUri: string) => Promise<void>;
    };
    if (typeof mediaLibrary.saveToLibraryAsync === 'function') {
      await mediaLibrary.saveToLibraryAsync(localUri);
      return true;
    }

    const asset = await MediaLibrary.createAssetAsync(localUri);
    try {
      const album = await MediaLibrary.getAlbumAsync(ALBUM_NAME);
      if (album) {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      } else {
        await MediaLibrary.createAlbumAsync(ALBUM_NAME, asset, false);
      }
    } catch {
      // L’asset est déjà dans la galerie.
    }

    return true;
  } catch (error) {
    console.warn('Copie galerie impossible:', error);
    return false;
  }
}
