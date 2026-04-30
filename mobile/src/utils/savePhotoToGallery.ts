import * as MediaLibrary from 'expo-media-library';
import { Platform } from 'react-native';

const ALBUM_NAME = 'Street Fishing';

export async function savePhotoToGallery(uri: string): Promise<boolean> {
  if (Platform.OS === 'web' || !uri) {
    return false;
  }

  try {
    let permission = await MediaLibrary.getPermissionsAsync();
    if (permission.status !== 'granted') {
      permission = await MediaLibrary.requestPermissionsAsync(true);
    }

    if (permission.status !== 'granted') {
      return false;
    }

    const asset = await MediaLibrary.createAssetAsync(uri);

    try {
      const album = await MediaLibrary.getAlbumAsync(ALBUM_NAME);
      if (album) {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      } else {
        await MediaLibrary.createAlbumAsync(ALBUM_NAME, asset, false);
      }
    } catch (albumError) {
      // L'asset est déjà dans la galerie ; l'album est un confort, pas bloquant.
      console.warn('Album galerie impossible:', albumError);
    }

    return true;
  } catch (error) {
    console.warn('Copie galerie impossible:', error);
    return false;
  }
}
