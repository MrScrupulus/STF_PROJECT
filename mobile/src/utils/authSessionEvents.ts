/**
 * Permet à l'intercepteur axios (hors React) de forcer la déconnexion
 * (token expiré / invalide) en notifiant le contexte d'auth.
 */
type SessionExpiredHandler = () => void;

let sessionExpiredHandler: SessionExpiredHandler | null = null;

export function setAuthSessionExpiredHandler(handler: SessionExpiredHandler | null): void {
  sessionExpiredHandler = handler;
}

export function triggerAuthSessionExpired(): void {
  try {
    sessionExpiredHandler?.();
  } catch (e) {
    console.warn('authSessionEvents: erreur handler session expirée', e);
  }
}
