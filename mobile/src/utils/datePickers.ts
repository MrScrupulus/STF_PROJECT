import type { ThemeColors } from '../theme';

export function stripToMinute(date: Date): Date {
  const next = new Date(date);
  next.setSeconds(0, 0);
  return next;
}

/** Envoi API : heure locale Paris du device, secondes à 00 (évite le décalage 8h00 → 8h01). */
export function formatLocalDateTimeForApi(date: Date): string {
  const d = stripToMinute(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}:00`;
}

export function datePickerThemeProps(theme: ThemeColors) {
  return {
    themeVariant: (theme.statusBar === 'light' ? 'dark' : 'light') as 'dark' | 'light',
    textColor: theme.text,
    accentColor: theme.accent,
  };
}
