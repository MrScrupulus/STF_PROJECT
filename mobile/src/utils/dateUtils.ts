/**
 * Utilitaires pour la gestion des dates et heures
 */

/**
 * Parse une date au format backend de façon fiable (compatible Safari/iOS).
 * Gère : ISO avec timezone (2025-01-25T11:59:00+01:00), ou Y-m-d H:i:s.
 * Ne pas ajouter 'Z' : les dates compétition sont en Europe/Paris.
 */
export function parseApiDate(dateString: string | null | undefined): Date | null {
  if (!dateString || typeof dateString !== 'string') return null;
  try {
    const s = dateString.trim();
    const hasTz = /[+-]\d{2}:\d{2}$/.test(s) || s.endsWith('Z');
    const toParse = hasTz ? s : s.replace(' ', 'T');
    const date = new Date(toParse);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

/**
 * Extrait l'heure (HH:mm) depuis une chaîne de date API.
 * Utilisé pour l'affichage car toLocaleTimeString(timeZone) est peu fiable sur React Native/Expo.
 * Pour "2025-01-25T11:59:00+01:00" ou "2025-01-25 11:59:00" → "11:59"
 */
function extractTimeFromApiDate(dateString: string | null | undefined): string | null {
  if (!dateString || typeof dateString !== 'string') return null;
  const s = dateString.trim();
  // ISO: 2025-01-25T11:59:00 ou 2025-01-25T11:59:00+01:00
  const isoMatch = s.match(/T(\d{1,2}):(\d{2})(?::\d{2})?(?:[+-]\d{2}:\d{2}|Z)?/);
  if (isoMatch) return `${isoMatch[1].padStart(2, '0')}:${isoMatch[2]}`;
  // Format Y-m-d H:i:s
  const spaceMatch = s.match(/\s(\d{1,2}):(\d{2})(?::\d{2})?/);
  if (spaceMatch) return `${spaceMatch[1].padStart(2, '0')}:${spaceMatch[2]}`;
  return null;
}

/**
 * Formate une date en tenant compte du fuseau horaire
 * Le backend envoie les dates au format 'Y-m-d H:i:s' (probablement en UTC)
 * Cette fonction les convertit en heure locale
 */
export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) {
    return 'Date inconnue';
  }

  try {
    // Si la date n'a pas de fuseau horaire, on suppose qu'elle est en UTC
    // et on la convertit en heure locale
    const date = new Date(dateString + 'Z'); // Ajouter 'Z' pour indiquer UTC
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Paris', // Forcer le fuseau horaire français
    });
  } catch (error) {
    console.error('Erreur lors du formatage de la date:', error);
    return 'Date invalide';
  }
}

/**
 * Formate une date sans l'heure
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) {
    return 'Date inconnue';
  }

  try {
    const date = new Date(dateString + 'Z');
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'Europe/Paris',
    });
  } catch (error) {
    console.error('Erreur lors du formatage de la date:', error);
    return 'Date invalide';
  }
}

/**
 * Vérifie si une date est passée (après l'heure actuelle)
 */
export function isDatePast(dateString: string | null | undefined): boolean {
  if (!dateString) {
    return false;
  }

  try {
    const date = new Date(dateString + 'Z');
    const now = new Date();
    return date < now;
  } catch (error) {
    console.error('Erreur lors de la vérification de la date:', error);
    return false;
  }
}

/**
 * Vérifie si une date est dans le futur (avant l'heure actuelle)
 */
export function isDateFuture(dateString: string | null | undefined): boolean {
  if (!dateString) {
    return false;
  }

  try {
    const date = new Date(dateString + 'Z');
    const now = new Date();
    return date > now;
  } catch (error) {
    console.error('Erreur lors de la vérification de la date:', error);
    return false;
  }
}

/**
 * Vérifie si l'heure actuelle est entre deux dates
 */
export function isDateBetween(
  startDate: string | null | undefined,
  endDate: string | null | undefined
): boolean {
  if (!startDate || !endDate) {
    return false;
  }

  try {
    const start = new Date(startDate + 'Z');
    const end = new Date(endDate + 'Z');
    const now = new Date();
    return now >= start && now <= end;
  } catch (error) {
    console.error('Erreur lors de la vérification de la date:', error);
    return false;
  }
}

/**
 * Formate une date qui est déjà en Europe/Paris (sans conversion UTC)
 * Utilisé pour les pauses programmées qui sont déjà converties par le backend
 */
export function formatDateTimeLocal(dateString: string | null | undefined): string {
  if (!dateString) {
    return 'Date inconnue';
  }

  try {
    // Le backend envoie les dates déjà en Europe/Paris au format 'Y-m-d H:i:s'
    // On ne doit pas ajouter "Z" car cela indiquerait UTC et ajouterait une heure supplémentaire
    const dateStr = dateString.replace(' ', 'T');
    const date = new Date(dateStr);
    // Afficher directement sans conversion timezone car c'est déjà en heure locale
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    console.error('Erreur lors du formatage de la date:', error);
    return 'Date invalide';
  }
}

/**
 * Formate une date relative (il y a X minutes/heures/jours)
 */
export function formatRelativeTime(dateString: string | null | undefined): string {
  if (!dateString) {
    return 'Date inconnue';
  }

  try {
    const date = new Date(dateString + 'Z');
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) {
      return "À l'instant";
    } else if (diffMinutes < 60) {
      return `Il y a ${diffMinutes} min`;
    } else if (diffHours < 24) {
      return `Il y a ${diffHours}h`;
    } else if (diffDays < 7) {
      return `Il y a ${diffDays}j`;
    } else {
      return formatDateTime(dateString);
    }
  } catch (error) {
    console.error('Erreur lors du formatage de la date relative:', error);
    return formatDateTime(dateString);
  }
}

/**
 * Formate une date de compétition (sans heure)
 * Le backend envoie les dates en ISO avec timezone Europe/Paris (ex: 2025-01-25T11:59:00+01:00)
 */
export function formatCompetitionDate(dateString: string | null | undefined): string {
  if (!dateString) {
    return 'Date inconnue';
  }

  try {
    const date = parseApiDate(dateString);
    if (!date) return 'Date invalide';
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Europe/Paris',
    });
  } catch (error) {
    console.error('Erreur lors du formatage de la date:', error);
    return 'Date invalide';
  }
}

/**
 * Formate une heure de compétition (ex: "11:59")
 * Extrait directement de la chaîne pour éviter les soucis timezone sur React Native/Expo
 */
export function formatCompetitionTime(dateString: string | null | undefined): string {
  const extracted = extractTimeFromApiDate(dateString);
  if (extracted) return extracted;
  const date = parseApiDate(dateString);
  if (!date) return 'Heure inconnue';
  try {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Paris',
    });
  } catch {
    return 'Heure invalide';
  }
}

/**
 * Formate les dates de début et fin d'une compétition
 * Affiche de manière optimisée selon si c'est le même jour ou non
 */
export function formatCompetitionDateRange(startDate: string | null | undefined, endDate: string | null | undefined): string {
  if (!startDate || !endDate) {
    return 'Dates inconnues';
  }

  try {
    const start = parseApiDate(startDate);
    const end = parseApiDate(endDate);
    if (!start || !end) return 'Dates invalides';
    
    // Utiliser Intl.DateTimeFormat pour obtenir les dates en Europe/Paris
    const formatter = new Intl.DateTimeFormat('fr-FR', {
      timeZone: 'Europe/Paris',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    });
    
    const startFormatted = formatter.format(start);
    const endFormatted = formatter.format(end);
    
    // Vérifier si les dates sont le même jour
    const isSameDay = startFormatted === endFormatted;
    
    if (isSameDay) {
      // Même jour : afficher date + heures début et fin
      const dateStr = formatCompetitionDate(startDate);
      const startTime = formatCompetitionTime(startDate);
      const endTime = formatCompetitionTime(endDate);
      return `${dateStr} de ${startTime} à ${endTime}`;
    } else {
      // Jours différents : afficher les deux dates avec heures
      const startStr = formatCompetitionDate(startDate);
      const endStr = formatCompetitionDate(endDate);
      const startTime = formatCompetitionTime(startDate);
      const endTime = formatCompetitionTime(endDate);
      return `${startStr} à ${startTime} - ${endStr} à ${endTime}`;
    }
  } catch (error) {
    console.error('Erreur lors du formatage des dates:', error);
    return 'Dates invalides';
  }
}
