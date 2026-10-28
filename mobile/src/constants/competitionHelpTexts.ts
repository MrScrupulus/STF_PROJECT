/**
 * Textes d'aide pour les champs de création/édition de compétition.
 * Utilisés dans les Alert/Modal d'aide (mobile).
 */
export const COMPETITION_HELP = {
  maxFishCounted:
    "Nombre des meilleures prises (triées par points) comptabilisées dans le score. Ex : 15 = seuls les 15 meilleurs poissons comptent. Laisser vide ou 0 = toutes les prises validées comptent.",

  newSpeciesBonus:
    "Points bonus attribués pour chaque espèce différente pêchée au-delà de la première. Ex : 50 pts → 2 espèces = +50 pts, 3 espèces = +100 pts, etc.",

  newSpeciesBonusPoints:
    "Valeur du bonus en points par espèce supplémentaire (au-delà de la première).",

  quotaBonus:
    "Points bonus lorsque le quota d'une espèce est atteint (nombre de prises validées pour cette espèce ≥ quota). Activez cette option puis indiquez, pour chaque espèce avec un quota, le montant de bonus attribué quand ce quota est atteint.",

  speciesQuotaBonusPoints:
    'Nombre de points bonus pour cette espèce lorsque son quota est atteint. Obligatoire dès qu’un quota est défini pour cette ligne (tant que le bonus quota est activé).',
  speciesQuota:
    "Limite du nombre de prises de cette espèce comptabilisées. Ex : 8 = au plus 8 perches dans le top N. Laisser vide = pas de limite pour cette espèce.",

  speciesCoefficient:
    "Multiplicateur pour le score : points = taille (cm) × coefficient. Ex : 2.0 = une perche de 25 cm rapporte 50 pts.",

  type: "Street = pêche depuis le bord. Boat = en bateau. Float = à la float tube.",

  isRankingPublic:
    "Si activé, le classement sera visible par tous après la fin de la compétition. Sinon, visible uniquement par l'administrateur.",

  reglement:
    "Texte du règlement affiché aux participants. Des images peuvent être ajoutées depuis la page de modification.",

  hasNoLimit: "Uniquement en payant : pas de plafond de pêcheurs, sauf si vous en saisissez un.",

  maxParticipants:
    "Plafond de pêcheurs (membres d’équipes), pas d’équipes. Gratuit : 16 max. Payant : libre, ou sans limite.",

  isPaid:
    "Payant : pas de plafond par défaut (Stripe plus tard). Gratuit : 16 pêcheurs maximum, même en privé.",

  isPrivate:
    "Privé : visible dans la liste (badge), détails et inscription uniquement pour les e-mails invités. Le code reçu est nominatif.",
};
