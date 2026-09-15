import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Convertit une URI galerie/caméra (souvent HEIC sur iPhone) en JPEG base64.
 * Même format que les photos de prises, fiable avec Axios JSON.
 */
export async function uriToJpegDataUrl(uri: string): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(uri, [], {
    compress: 0.85,
    format: ImageManipulator.SaveFormat.JPEG,
    base64: true,
  });
  if (!result.base64) {
    throw new Error('Impossible de convertir l’image.');
  }
  return `data:image/jpeg;base64,${result.base64}`;
}
