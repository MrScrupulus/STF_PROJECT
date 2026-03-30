/**
 * Textes d'aide pour les champs de création/édition de compétition.
 * Utilisés en tooltip (desktop) et dans les modales d'aide (mobile).
 */
export const COMPETITION_HELP = {
  maxFishCounted:
    "Nombre des meilleures prises (triées par points) comptabilisées dans le score. Ex : 15 = seuls les 15 meilleurs poissons comptent. Laisser vide ou 0 = toutes les prises validées comptent.",

  newSpeciesBonus:
    "Points bonus attribués pour chaque espèce différente pêchée au-delà de la première. Ex : 50 pts → 2 espèces = +50 pts, 3 espèces = +100 pts, etc.",

  newSpeciesBonusPoints:
    "Valeur du bonus en points par espèce supplémentaire (au-delà de la première).",

  quotaBonus:
    "Points bonus quand le quota d'une espèce est atteint. Ex : si quota Perche = 8 et vous validez 10 perches, les 8 meilleures comptent et vous gagnez le bonus.",

  quotaBonusPoints:
    "Valeur du bonus en points pour chaque quota d'espèce atteint.",

  speciesQuota:
    "Limite du nombre de prises de cette espèce comptabilisées. Ex : 8 = au plus 8 perches dans le top N. Laisser vide = pas de limite pour cette espèce.",

  speciesCoefficient:
    "Multiplicateur pour le score : points = taille (cm) × coefficient. Ex : 2.0 = une perche de 25 cm rapporte 50 pts.",

  type: "Street = pêche depuis le bord. Boat = en bateau. Float = à la float tube.",

  isRankingPublic:
    "Si activé, le classement sera visible par tous après la fin de la compétition. Sinon, visible uniquement par l'administrateur.",

  reglement:
    "Texte du règlement affiché aux participants. Des images peuvent être ajoutées depuis la page de modification.",

  hasNoLimit: "Aucune limite sur le nombre d'équipes pouvant s'inscrire.",

  maxParticipants: "Nombre maximum de participants (tous membres d'équipes confondus).",
};
