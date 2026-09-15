import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { getSpeciesColor } from '../../utils/speciesColors';
import { buildTimeTicks, parseCatchDate, parseTimeBounds } from '../../utils/timelineScale';

const CHART_WIDTH = Dimensions.get('window').width - 32;
const CHART_HEIGHT = 200;
const POINT_SIZE = 10;
const PLOT_LEFT = 12;
const PLOT_WIDTH = CHART_WIDTH - 24;

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
  const { start, durationMs } = useMemo(
    () => parseTimeBounds(startDate, endDate),
    [startDate, endDate]
  );

  const { points, uniqueSpecies } = useMemo(() => {
    const pts: Array<{ x: number; y: number; color: string; speciesName: string; size?: number }> = [];
    const map: Record<number, number> = {};
    const slots: Record<string, number> = {};
    let nextIdx = 0;

    catches.forEach((c) => {
      const date = parseCatchDate(c.createdAt);
      if (!date) return;
      const offsetMs = date.getTime() - start.getTime();
      if (offsetMs < -durationMs * 0.02 || offsetMs > durationMs * 1.02) return;

      let speciesIdx = map[c.species?.id ?? 0];
      if (speciesIdx === undefined) {
        speciesIdx = nextIdx++;
        map[c.species?.id ?? 0] = speciesIdx;
      }

      const slotKey = `${Math.floor(offsetMs / (15 * 60 * 1000))}_${speciesIdx}`;
      const slotIdx = slots[slotKey] ?? 0;
      slots[slotKey] = slotIdx + 1;

      const numSpecies = nextIdx;
      const baseY = (speciesIdx / Math.max(1, numSpecies)) * (CHART_HEIGHT - 40);
      const yOffset = slotIdx * 8;
      const y = Math.min(baseY + 20 + yOffset, CHART_HEIGHT - 25);

      pts.push({
        x: PLOT_LEFT + (Math.min(Math.max(offsetMs, 0), durationMs) / durationMs) * PLOT_WIDTH,
        y,
        color: getSpeciesColor(c.species?.id, speciesStats),
        speciesName: c.species?.name ?? '?',
        size: c.size,
      });
    });

    return { points: pts, uniqueSpecies: speciesStats?.length ? speciesStats : [] };
  }, [catches, start, durationMs, speciesStats]);

  const xTicks = useMemo(() => buildTimeTicks(start, durationMs), [start, durationMs]);

  if (!catches || catches.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Aucune prise avec horaire enregistrée</Text>
      </View>
    );
  }

  const durationHours = durationMs / (1000 * 60 * 60);
  const titleSuffix =
    durationHours < 24
      ? ` (${Math.max(1, Math.round(durationHours * 10) / 10)} h)`
      : ` (${Math.max(1, Math.round(durationHours / 24))} j)`;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Prises dans le temps{titleSuffix}</Text>
      <View style={styles.chartWrapper}>
        <View style={[styles.chartArea, { width: CHART_WIDTH, height: CHART_HEIGHT }]}>
          {xTicks.map((tick, i) => {
            const pos = PLOT_LEFT + (tick.offsetMs / durationMs) * PLOT_WIDTH;
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
        <View style={[styles.xLabels, { width: CHART_WIDTH }]}>
          {xTicks.map((tick, i) => {
            const left = PLOT_LEFT + (tick.offsetMs / durationMs) * PLOT_WIDTH;
            return (
              <Text
                key={`h-${i}`}
                style={[styles.xLabel, { left: Math.max(0, left - 22) }]}
                numberOfLines={1}
              >
                {tick.label}
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
    height: 28,
    marginTop: 8,
    position: 'relative',
  },
  xLabel: {
    position: 'absolute',
    fontSize: 10,
    fontWeight: '500',
    color: '#374151',
    width: 52,
    textAlign: 'center',
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
