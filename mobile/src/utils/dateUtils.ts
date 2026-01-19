/**
 * Utilitaires pour la gestion des dates et heures
 */

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
