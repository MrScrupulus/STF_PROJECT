/**
 * Utilitaires pour la gestion des dates et heures
 */

/**
 * Formate une date en tenant compte du fuseau horaire
 * Le backend envoie les dates au format 'Y-m-d H:i:s' (probablement en UTC)
 * Cette fonction les convertit en heure locale
 */
export function formatDateTime(dateString) {
  if (!dateString) {
    return "Date inconnue";
  }

  try {
    // Si la date n'a pas de fuseau horaire, on suppose qu'elle est en UTC
    // et on la convertit en heure locale
    const date = new Date(dateString + "Z"); // Ajouter 'Z' pour indiquer UTC
    return date.toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Paris", // Forcer le fuseau horaire français
    });
  } catch (error) {
    console.error("Erreur lors du formatage de la date:", error);
    return "Date invalide";
  }
}

/**
 * Formate une date sans l'heure
 */
export function formatDate(dateString) {
  if (!dateString) {
    return "Date inconnue";
  }

  try {
    const date = new Date(dateString + "Z");
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "Europe/Paris",
    });
  } catch (error) {
    console.error("Erreur lors du formatage de la date:", error);
    return "Date invalide";
  }
}

/**
 * Formate une date relative (il y a X minutes/heures/jours)
 */
export function formatRelativeTime(dateString) {
  if (!dateString) {
    return "Date inconnue";
  }

  try {
    const date = new Date(dateString + "Z");
    const now = new Date();
    const diffMs = now - date;
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) {
      return "À l'instant";
    } else if (diffMinutes < 60) {
      return `Il y a ${diffMinutes} minute${diffMinutes > 1 ? "s" : ""}`;
    } else if (diffHours < 24) {
      return `Il y a ${diffHours} heure${diffHours > 1 ? "s" : ""}`;
    } else if (diffDays < 7) {
      return `Il y a ${diffDays} jour${diffDays > 1 ? "s" : ""}`;
    } else {
      return formatDateTime(dateString);
    }
  } catch (error) {
    console.error("Erreur lors du formatage de la date relative:", error);
    return "Date invalide";
  }
}
