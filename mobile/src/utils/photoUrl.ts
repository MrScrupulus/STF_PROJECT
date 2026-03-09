import { API_BASE_URL } from '../config/api';

/**
 * Transforme photoUrl (path ou base64) en URI utilisable par Image.
 * - base64 (data:...) : utilisé tel quel
 * - path (catches/...) : préfixe avec l'URL de l'API
 */
export function resolvePhotoUri(photoUrl: string | null | undefined): string | null {
  if (!photoUrl) return null;
  if (photoUrl.startsWith('data:') || photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) {
    return photoUrl;
  }
  const base = API_BASE_URL.replace(/\/$/, '');
  return `${base}/api/uploads/${photoUrl.replace(/^\//, '')}`;
}
