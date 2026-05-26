import { KeyboardTypeOptions, Platform } from 'react-native';

/**
 * Clavier avec séparateur décimal disponible selon les plateformes.
 * Sur Android, `decimal-pad` cache souvent le point ET la virgule.
 */
export const fishSizeKeyboardType: KeyboardTypeOptions =
  Platform.OS === 'android' ? 'numbers-and-punctuation' : 'decimal-pad';

/**
 * N'autoriser que les chiffres et un seul séparateur décimal (, ou .).
 * Les séparateurs suivants sont ignorés (ex. 11.5.2 → 11.52 en pratique on pourrait tronquer — ici on enlève les ,/. en trop).
 */
export function sanitizeFishSizeInput(_previous: string, raw: string): string {
  const allowed = raw.replace(/[^\d.,]/g, '');
  if (!allowed) {
    return '';
  }

  let sepIndex = -1;
  let sepChar = '';
  for (let i = 0; i < allowed.length; i++) {
    const c = allowed[i];
    if (c === '.' || c === ',') {
      sepIndex = i;
      sepChar = c;
      break;
    }
  }

  if (sepIndex === -1) {
    return allowed.replace(/\D/g, '');
  }

  const intPart = allowed.slice(0, sepIndex).replace(/\D/g, '');
  const fracPart = allowed.slice(sepIndex + 1).replace(/\D/g, '');
  return intPart + sepChar + fracPart;
}

/** Interprète la taille saisie (virgule ou point décimal). */
export function parseFishSizeCm(value: string): number {
  if (!value.trim()) {
    return NaN;
  }
  const normalized = value.replace(/\s/g, '').replace(',', '.');
  const n = Number.parseFloat(normalized);
  return Number.isFinite(n) ? n : NaN;
}
