import { parseApiDate } from './dateUtils';

export function parseCatchDate(createdAt: string | undefined | null): Date | null {
  return parseApiDate(createdAt);
}

function pad2(n: number) {
  return n < 10 ? `0${n}` : String(n);
}

function formatLocalStamp(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:00`;
}

export function parseTimeBounds(
  startDate?: string,
  endDate?: string
): { start: Date; durationMs: number } {
  if (!startDate || !endDate) {
    return { start: new Date(0), durationMs: 24 * 60 * 60 * 1000 };
  }
  const start = parseCatchDate(startDate) ?? new Date(startDate);
  const end = parseCatchDate(endDate) ?? new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return { start: new Date(0), durationMs: 24 * 60 * 60 * 1000 };
  }
  const durationMs = Math.max(60 * 1000, end.getTime() - start.getTime());
  return { start, durationMs };
}

/** Padding autour des prises pour l’historique (pas une compétition à dates fixes). */
export function boundsFromCatchTimes(
  dates: Date[]
): { startDate: string; endDate: string } | null {
  if (!dates.length) return null;
  let min = Infinity;
  let max = -Infinity;
  for (const d of dates) {
    const t = d.getTime();
    min = Math.min(min, t);
    max = Math.max(max, t);
  }
  const span = Math.max(0, max - min);
  const pad = Math.min(
    12 * 60 * 60 * 1000,
    Math.max(5 * 60 * 1000, span === 0 ? 30 * 60 * 1000 : span * 0.08)
  );
  return {
    startDate: formatLocalStamp(new Date(min - pad)),
    endDate: formatLocalStamp(new Date(max + pad)),
  };
}

/** Heure / jour locaux : Intl+timeZone renvoie souvent 00h sur React Native. */
function wall(date: Date) {
  return {
    hour: date.getHours(),
    minute: date.getMinutes(),
    dayKey: `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`,
    dayLabel: date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
    monthLabel: date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
  };
}

function formatHour(date: Date) {
  return `${pad2(wall(date).hour)}h`;
}

function formatClock(date: Date) {
  const w = wall(date);
  return `${pad2(w.hour)}h${w.minute ? pad2(w.minute) : ''}`;
}

export type TimeTick = { offsetMs: number; label: string };

const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

/**
 * Si une large partie de la compétition n’a aucune prise (ex. 2ᵉ jour vide),
 * on cadre l’axe sur la période utile.
 */
export function tightenBoundsToCatches(
  start: Date,
  durationMs: number,
  catchDates: Date[]
): { start: Date; durationMs: number } {
  if (!catchDates.length) {
    return { start, durationMs };
  }
  const startMs = start.getTime();
  const endMs = startMs + durationMs;
  const minC = Math.min(...catchDates.map((d) => d.getTime()));
  const maxC = Math.max(...catchDates.map((d) => d.getTime()));
  const span = Math.max(HOUR, maxC - minC);
  const pad = Math.min(2 * HOUR, Math.max(20 * MIN, span * 0.08));
  const emptyHead = minC - startMs;
  const emptyTail = endMs - maxC;
  let displayStart = startMs;
  let displayEnd = endMs;
  if (emptyHead > 6 * HOUR && emptyHead > durationMs * 0.2) {
    displayStart = Math.max(startMs, minC - pad);
  }
  if (emptyTail > 6 * HOUR && emptyTail > durationMs * 0.2) {
    displayEnd = Math.min(endMs, maxC + pad);
  }
  return {
    start: new Date(displayStart),
    durationMs: Math.max(HOUR, displayEnd - displayStart),
  };
}

function chooseStep(durationMs: number): number {
  if (durationMs <= 2 * HOUR) return 15 * MIN;
  if (durationMs <= 10 * HOUR) return HOUR;
  if (durationMs <= 22 * HOUR) return 2 * HOUR;
  if (durationMs <= 3 * DAY) return 3 * HOUR;
  if (durationMs <= 10 * DAY) return 6 * HOUR;
  if (durationMs <= 60 * DAY) return 7 * DAY;
  return 30 * DAY;
}

function labelFor(date: Date, prevDayKey: string | null, showDays: boolean, step: number): string {
  if (step >= DAY) {
    const w = wall(date);
    return step >= 20 * DAY ? w.monthLabel : w.dayLabel;
  }
  const w = wall(date);
  const hour = step < HOUR ? formatClock(date) : formatHour(date);
  if (showDays && w.dayKey !== prevDayKey) {
    return `${w.dayLabel}\n${hour}`;
  }
  return hour;
}

/**
 * Graduations horaires. Le jour n’apparaît qu’au premier tick de chaque journée.
 */
export function buildTimeTicks(start: Date, durationMs: number, maxTicks = 10): TimeTick[] {
  const step = chooseStep(durationMs);
  const showDays = durationMs > 20 * HOUR && step < DAY;
  const ticks: TimeTick[] = [];
  const startMs = start.getTime();
  const endMs = startMs + durationMs;

  let prevDay: string | null = null;
  const pushTick = (offsetMs: number, date: Date) => {
    const label = labelFor(date, prevDay, showDays, step);
    prevDay = wall(date).dayKey;
    ticks.push({ offsetMs, label });
  };

  pushTick(0, start);

  let t = Math.ceil((startMs + step * 0.35) / step) * step;
  while (t < endMs - step * 0.2 && ticks.length < maxTicks - 1) {
    const offsetMs = t - startMs;
    if (offsetMs > durationMs * 0.04) {
      pushTick(offsetMs, new Date(t));
    }
    t += step;
  }

  const endDate = new Date(endMs);
  const endLabel = labelFor(endDate, prevDay, showDays, step);
  const last = ticks[ticks.length - 1];
  if (!last || last.label !== endLabel) {
    ticks.push({ offsetMs: durationMs, label: endLabel });
  } else {
    last.offsetMs = durationMs;
  }

  return ticks;
}
