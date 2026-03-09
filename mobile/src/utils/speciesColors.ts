/**
 * Palette de couleurs partagée pour les espèces (camembert, carte, chronologie)
 */
export const SPECIES_COLORS = [
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#8884d8',
  '#82ca9d',
  '#ffc658',
  '#ff7300',
  '#a78bfa',
  '#34d399',
];

export function getSpeciesColor(
  speciesId: number | undefined,
  speciesStats: Array<{ id: number }> = []
): string {
  const index = speciesStats.findIndex((s) => s.id === speciesId);
  return SPECIES_COLORS[index >= 0 ? index % SPECIES_COLORS.length : 0];
}

/** Noms de couleurs supportés par pinColor sur Android (les hex ne fonctionnent pas) */
const ANDROID_PIN_COLORS = [
  'blue',
  'teal',
  'gold',
  'orange',
  'violet',
  'green',
  'yellow',
  'tomato',
  'purple',
  'aqua',
];

export function getPinColorForAndroid(
  speciesId: number | string | undefined,
  speciesStats: Array<{ id: number }> = []
): string {
  const id = speciesId != null ? Number(speciesId) : 0;
  const index = speciesStats.findIndex((s) => Number(s.id) === id);
  if (index >= 0) {
    return ANDROID_PIN_COLORS[index % ANDROID_PIN_COLORS.length];
  }
  return ANDROID_PIN_COLORS[Math.abs(id) % ANDROID_PIN_COLORS.length];
}
