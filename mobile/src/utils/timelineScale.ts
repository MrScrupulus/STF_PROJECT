export function parseCatchDate(createdAt: string | undefined | null): Date | null {
  if (!createdAt) return null;
  const str = String(createdAt);
  const match = str.match(/(\d{4})-(\d{2})-(\d{2})[T\s](\d{1,2}):(\d{2})/);
  if (match) {
    const date = new Date(
      parseInt(match[1], 10),
      parseInt(match[2], 10) - 1,
      parseInt(match[3], 10)
    );
    date.setHours(parseInt(match[4], 10), parseInt(match[5], 10) || 0, 0, 0);
    return date;
  }
  const d = new Date(str);
  return Number.isNaN(d.getTime()) ? null : d;
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

function formatClock(date: Date) {
  return `${pad2(date.getHours())}h${date.getMinutes() ? pad2(date.getMinutes()) : ''}`;
}

function formatDay(date: Date) {
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function formatMonth(date: Date) {
  return date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
}

export type TimeTick = { offsetMs: number; label: string };

/**
 * 6–8 graduations selon la durée réelle (minutes → mois).
 */
export function buildTimeTicks(start: Date, durationMs: number, maxTicks = 7): TimeTick[] {
  const MIN = 60 * 1000;
  const HOUR = 60 * MIN;
  const DAY = 24 * HOUR;

  let step: number;
  let labelFn: (d: Date) => string;

  if (durationMs <= 2 * HOUR) {
    step = 15 * MIN;
    labelFn = formatClock;
  } else if (durationMs <= 8 * HOUR) {
    step = HOUR;
    labelFn = (d) => `${pad2(d.getHours())}h`;
  } else if (durationMs <= 36 * HOUR) {
    step = 3 * HOUR;
    labelFn = (d) => `${formatDay(d)} ${pad2(d.getHours())}h`;
  } else if (durationMs <= 10 * DAY) {
    step = DAY;
    labelFn = formatDay;
  } else if (durationMs <= 60 * DAY) {
    step = 7 * DAY;
    labelFn = formatDay;
  } else {
    step = 30 * DAY;
    labelFn = formatMonth;
  }

  const ticks: TimeTick[] = [];
  const startMs = start.getTime();
  ticks.push({ offsetMs: 0, label: labelFn(start) });

  let t = Math.ceil((startMs + step * 0.4) / step) * step;
  const endMs = startMs + durationMs;
  while (t < endMs - step * 0.25 && ticks.length < maxTicks - 1) {
    const offsetMs = t - startMs;
    if (offsetMs > durationMs * 0.06) {
      ticks.push({ offsetMs, label: labelFn(new Date(t)) });
    }
    t += step;
  }

  const endLabel = labelFn(new Date(endMs));
  const last = ticks[ticks.length - 1];
  if (!last || last.label !== endLabel) {
    ticks.push({ offsetMs: durationMs, label: endLabel });
  } else {
    last.offsetMs = durationMs;
  }

  return ticks;
}
