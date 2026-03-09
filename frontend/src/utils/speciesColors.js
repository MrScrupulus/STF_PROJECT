/**
 * Palette de couleurs partagée pour les espèces (camembert, carte, chronologie)
 */
export const SPECIES_COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7300",
  "#a78bfa",
  "#34d399",
];

/**
 * Retourne la couleur d'une espèce en fonction de son index dans speciesStats.
 * @param {number} speciesId - ID de l'espèce
 * @param {Array<{id: number}>} speciesStats - Liste des espèces (ordre du camembert)
 * @returns {string} Couleur hex
 */
export function getSpeciesColor(speciesId, speciesStats = []) {
  const index = speciesStats.findIndex((s) => s.id === speciesId);
  return SPECIES_COLORS[index >= 0 ? index % SPECIES_COLORS.length : 0];
}
