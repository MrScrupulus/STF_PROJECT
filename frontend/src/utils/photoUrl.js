const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

/**
 * Transforme photoUrl (path ou base64) en URI utilisable par <img src>.
 * - base64 (data:...) : utilisé tel quel
 * - path (catches/...) : préfixe avec l'URL de l'API
 */
export function resolvePhotoUri(photoUrl) {
  if (!photoUrl) return null;
  if (
    photoUrl.startsWith("data:") ||
    photoUrl.startsWith("http://") ||
    photoUrl.startsWith("https://")
  ) {
    return photoUrl;
  }
  const base = API_URL.replace(/\/$/, "");
  return `${base}/api/uploads/${photoUrl.replace(/^\//, "")}`;
}
