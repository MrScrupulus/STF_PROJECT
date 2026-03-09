import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { getSpeciesColor } from '../../utils/speciesColors';

const CHART_WIDTH = Dimensions.get('window').width - 32;
const CHART_HEIGHT = 200;
const POINT_SIZE = 10;

function parseCreatedAt(createdAt: string | undefined) {
  if (!createdAt) return null;
  const str = String(createdAt);
  const match = str.match(/(\d{4})-(\d{2})-(\d{2})[T\s](\d{1,2}):(\d{2})/);
  if (match) {
    const date = new Date(parseInt(match[1], 10), parseInt(match[2], 10) - 1, parseInt(match[3], 10));
    const hour = parseInt(match[4], 10);
    const minute = parseInt(match[5], 10) || 0;
    date.setHours(hour, minute, 0, 0);
    return date;
  }
  return null;
}

function parseBounds(startDate?: string, endDate?: string) {
  if (!startDate || !endDate) return { start: new Date(0), totalHours: 24 };
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalHours = Math.max(1, (end.getTime() - start.getTime()) / (1000 * 60 * 60));
    return { start, totalHours };
  } catch {
    return { start: new Date(0), totalHours: 24 };
  }
}

interface CatchItem {
  id?: number;
  createdAt?: string;
  species?: { id: number; name: string };
  size?: number;
  team?: { name: string };
}

interface CatchesTimelineChartProps {
  catches: CatchItem[];
  startDate?: string;
  endDate?: string;
  speciesStats?: Array<{ id: number; name?: string }>;
}

export default function CatchesTimelineChart({
  catches = [],
  startDate,
  endDate,
  speciesStats = [],
}: CatchesTimelineChartProps) {
  const { start, totalHours } = useMemo(() => parseBounds(startDate, endDate), [startDate, endDate]);

  const { points, uniqueSpecies } = useMemo(() => {
    const pts: Array<{ x: number; y: number; color: string; speciesName: string; size?: number }> = [];
    const map: Record<number, number> = {};
    const slots: Record<string, number> = {};
    let nextIdx = 0;

    catches.forEach((c) => {
      const date = parseCreatedAt(c.createdAt);
      if (!date) return;
      const x = (date.getTime() - start.getTime()) / (1000 * 60 * 60);
      if (x < -0.5 || x > totalHours + 0.5) return;

      let speciesIdx = map[c.species?.id ?? 0];
      if (speciesIdx === undefined) {
        speciesIdx = nextIdx++;
        map[c.species?.id ?? 0] = speciesIdx;
      }

      const slotKey = `${Math.floor(x * 2)}_${speciesIdx}`;
      const slotIdx = slots[slotKey] ?? 0;
      slots[slotKey] = slotIdx + 1;

      const numSpecies = nextIdx;
      const baseY = (speciesIdx / Math.max(1, numSpecies)) * (CHART_HEIGHT - 40);
      const yOffset = slotIdx * 8;
      const y = Math.min(baseY + 20 + yOffset, CHART_HEIGHT - 25);

      pts.push({
        x: (x / totalHours) * (CHART_WIDTH - 24) + 12,
        y,
        color: getSpeciesColor(c.species?.id, speciesStats),
        speciesName: c.species?.name ?? '?',
        size: c.size,
      });
    });

    const speciesList = speciesStats?.length ? speciesStats : [];
    return { points: pts, uniqueSpecies: speciesList };
  }, [catches, start, totalHours, speciesStats]);

  if (!catches || catches.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Aucune prise avec horaire enregistrée</Text>
      </View>
    );
  }

  const startHour = start.getHours() + start.getMinutes() / 60;
  const tickStep = totalHours > 18 ? 2 : 1;
  const xTicks = useMemo(() => {
    const ticks: number[] = [];
    for (let h = 0; h <= totalHours; h += tickStep) {
      ticks.push(h);
    }
    if (ticks[ticks.length - 1] < totalHours - 0.01) {
      ticks.push(totalHours);
    }
    return ticks;
  }, [totalHours, tickStep]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Prises dans le temps</Text>
      <View style={styles.chartWrapper}>
        <View style={[styles.chartArea, { width: CHART_WIDTH, height: CHART_HEIGHT }]}>
          {/* Lignes verticales de graduation (heures) */}
          {xTicks.map((hoursFromStart, i) => {
            const pos = Math.min(hoursFromStart / totalHours, 1) * (CHART_WIDTH - 24) + 12;
            return <View key={`vl-${i}`} style={[styles.gridLine, { left: pos }]} />;
          })}
          {points.map((p, i) => (
            <View
              key={i}
              style={[
                styles.point,
                {
                  left: p.x - POINT_SIZE / 2,
                  top: p.y - POINT_SIZE / 2,
                  width: POINT_SIZE,
                  height: POINT_SIZE,
                  borderRadius: POINT_SIZE / 2,
                  backgroundColor: p.color,
                },
              ]}
            />
          ))}
        </View>
        <View style={[styles.xLabels, { width: CHART_WIDTH, position: 'relative' }]}>
          {xTicks.map((hoursFromStart, i) => {
            const label =
              totalHours <= 24
                ? `${Math.floor(startHour + hoursFromStart) % 24}h`
                : hoursFromStart === 0
                  ? '0h'
                  : `+${hoursFromStart}h`;
            const prevLabel =
              i > 0
                ? totalHours <= 24
                  ? `${Math.floor(startHour + xTicks[i - 1]) % 24}h`
                  : xTicks[i - 1] === 0
                    ? '0h'
                    : `+${xTicks[i - 1]}h`
                : null;
            if (prevLabel === label) return null;
            const left = Math.min(hoursFromStart / totalHours, 1) * (CHART_WIDTH - 24) + 12;
            return (
              <Text key={`h-${i}`} style={[styles.xLabel, { position: 'absolute', left: left - 8 }]}>
                {label}
              </Text>
            );
          })}
        </View>
      </View>
      {uniqueSpecies.length > 0 && (
        <View style={styles.legend}>
          {uniqueSpecies.map((s) => (
            <View key={s.id} style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  { backgroundColor: getSpeciesColor(s.id, speciesStats) },
                ]}
              />
              <Text style={styles.legendText}>{s.name}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  chartWrapper: {
    alignItems: 'center',
  },
  chartArea: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#e5e7eb',
  },
  point: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  xLabels: {
    height: 24,
    marginTop: 8,
  },
  xLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#374151',
  },
  empty: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 14,
  },
});
