import { parseApiDate } from './dateUtils';

export type CompetitionLifecycleKey = 'upcoming' | 'ongoing' | 'paused' | 'ended';

export function getCompetitionLifecycleStatus(
  startDate: string,
  endDate: string,
  isPaused?: boolean
): { key: CompetitionLifecycleKey; text: string; isEnded: boolean; sortOrder: number } {
  const now = new Date();
  const start = parseApiDate(startDate) ?? now;
  const end = parseApiDate(endDate) ?? now;
  const nowM = Math.floor(now.getTime() / 60000);
  const startM = Math.floor(start.getTime() / 60000);
  const endM = Math.floor(end.getTime() / 60000);

  if (nowM < startM) {
    return { key: 'upcoming', text: 'À venir', isEnded: false, sortOrder: 2 };
  }
  if (nowM > endM) {
    return { key: 'ended', text: 'Terminée', isEnded: true, sortOrder: 3 };
  }
  if (isPaused) {
    return { key: 'paused', text: 'En pause', isEnded: false, sortOrder: 1 };
  }
  return { key: 'ongoing', text: 'En cours', isEnded: false, sortOrder: 1 };
}
