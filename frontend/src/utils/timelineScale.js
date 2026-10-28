function pad2(n) {
  return n < 10 ? `0${n}` : String(n);
}

function wall(date) {
  try {
    const parts = new Intl.DateTimeFormat("fr-FR", {
      timeZone: "Europe/Paris",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(date);
    const g = (t) => parts.find((p) => p.type === t)?.value ?? "";
    const hourRaw = g("hour");
    if (hourRaw === "" || hourRaw == null) {
      throw new Error("hour");
    }
    let hour = Number(hourRaw);
    if (hour === 24) hour = 0;
    if (!Number.isFinite(hour)) {
      throw new Error("hour");
    }
    const day = g("day");
    const monthNum = g("month");
    const year = g("year");
    const monthLabel = date.toLocaleDateString("fr-FR", {
      timeZone: "Europe/Paris",
      month: "short",
      year: "2-digit",
    });
    const dayLabel = date.toLocaleDateString("fr-FR", {
      timeZone: "Europe/Paris",
      day: "numeric",
      month: "short",
    });
    return {
      hour,
      minute: Number(g("minute") || 0),
      dayKey: `${year}-${monthNum}-${day}`,
      dayLabel,
      monthLabel,
    };
  } catch {
    return {
      hour: date.getHours(),
      minute: date.getMinutes(),
      dayKey: `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`,
      dayLabel: date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
      monthLabel: date.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" }),
    };
  }
}

export function parseCatchDate(createdAt) {
  if (!createdAt) return null;
  const str = String(createdAt).trim();
  const hasTz = /[+-]\d{2}:\d{2}$/.test(str) || str.endsWith("Z");
  if (hasTz) {
    const d = new Date(str);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const match = str.match(/(\d{4})-(\d{2})-(\d{2})[T\s](\d{1,2}):(\d{2})/);
  if (match) {
    const iso = `${match[1]}-${match[2]}-${match[3]}T${String(match[4]).padStart(2, "0")}:${match[5]}:00`;
    const asUtc = Date.parse(`${iso}Z`);
    if (!Number.isNaN(asUtc)) {
      const probe = new Date(asUtc);
      const ph = wall(probe).hour;
      const pm = wall(probe).minute;
      const deltaMin = (Number(match[4]) - ph) * 60 + (Number(match[5]) - pm);
      return new Date(asUtc + deltaMin * 60 * 1000);
    }
  }
  const d = new Date(str);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function parseTimeBounds(startDate, endDate) {
  if (!startDate || !endDate) {
    return { start: new Date(0), durationMs: 24 * 60 * 60 * 1000 };
  }
  const start = parseCatchDate(startDate) ?? new Date(startDate);
  const end = parseCatchDate(endDate) ?? new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return { start: new Date(0), durationMs: 24 * 60 * 60 * 1000 };
  }
  return { start, durationMs: Math.max(60 * 1000, end.getTime() - start.getTime()) };
}

export function boundsFromCatchTimes(dates) {
  if (!dates?.length) return null;
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
  const fmt = (d) =>
    `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:00`;
  return {
    startDate: fmt(new Date(min - pad)),
    endDate: fmt(new Date(max + pad)),
  };
}

function formatHour(date) {
  return `${pad2(wall(date).hour)}h`;
}

function formatClock(date) {
  const w = wall(date);
  return `${pad2(w.hour)}h${w.minute ? pad2(w.minute) : ""}`;
}

const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

function chooseStep(durationMs) {
  if (durationMs <= 2 * HOUR) return 15 * MIN;
  if (durationMs <= 10 * HOUR) return HOUR;
  if (durationMs <= 22 * HOUR) return 2 * HOUR;
  if (durationMs <= 3 * DAY) return 3 * HOUR;
  if (durationMs <= 10 * DAY) return 6 * HOUR;
  if (durationMs <= 60 * DAY) return 7 * DAY;
  return 30 * DAY;
}

function labelFor(date, prevDayKey, showDays, step) {
  if (step >= DAY) {
    const w = wall(date);
    return step >= 20 * DAY ? w.monthLabel : w.dayLabel;
  }
  const w = wall(date);
  const hour = step < HOUR ? formatClock(date) : formatHour(date);
  if (showDays && w.dayKey !== prevDayKey) {
    return `${w.dayLabel} ${hour}`;
  }
  return hour;
}

export function buildTimeTicks(start, durationMs, maxTicks = 8) {
  const step = chooseStep(durationMs);
  const showDays = durationMs > 20 * HOUR && step < DAY;
  const ticks = [];
  const startMs = start.getTime();
  const endMs = startMs + durationMs;
  let prevDay = null;

  const pushTick = (offsetMs, date) => {
    const label = labelFor(date, prevDay, showDays, step);
    prevDay = wall(date).dayKey;
    ticks.push({ offsetMs, label });
  };

  pushTick(0, start);

  let t = Math.ceil((startMs + step * 0.4) / step) * step;
  while (t < endMs - step * 0.25 && ticks.length < maxTicks - 1) {
    const offsetMs = t - startMs;
    if (offsetMs > durationMs * 0.06) {
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
