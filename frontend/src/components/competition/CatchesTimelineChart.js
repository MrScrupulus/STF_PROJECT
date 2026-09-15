"use client";

import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ZAxis } from "recharts";
import { getSpeciesColor } from "../../utils/speciesColors";
import { buildTimeTicks, parseCatchDate, parseTimeBounds } from "../../utils/timelineScale";

export default function CatchesTimelineChart({
  catches = [],
  startDate,
  endDate,
  speciesStats = [],
}) {
  if (!catches || catches.length === 0) {
    return (
      <div style={{ padding: "20px", textAlign: "center", color: "#666" }}>
        Aucune prise avec horaire enregistrée
      </div>
    );
  }

  const { start, durationMs } = parseTimeBounds(startDate, endDate);
  const durationHours = durationMs / (1000 * 60 * 60);

  const scatterData = [];
  const speciesIndexMap = {};
  let nextSpeciesIndex = 0;

  catches.forEach((c) => {
    const catchDate = parseCatchDate(c.createdAt);
    if (!catchDate) return;

    const x = (catchDate - start) / (1000 * 60 * 60);
    if (x < -durationHours * 0.02 || x > durationHours * 1.02) return;

    let speciesIndex = speciesIndexMap[c.species?.id];
    if (speciesIndex === undefined) {
      speciesIndex = nextSpeciesIndex++;
      speciesIndexMap[c.species?.id] = speciesIndex;
    }

    scatterData.push({
      x: Math.max(0, Math.min(x, durationHours)),
      y: speciesIndex,
      speciesId: c.species?.id,
      speciesName: c.species?.name ?? "?",
      size: c.size,
      team: c.team?.name,
      caughtBy: c.caughtBy,
      fill: getSpeciesColor(c.species?.id, speciesStats),
    });
  });

  const uniqueSpeciesCount = Object.keys(speciesIndexMap).length || 1;
  const yDomain = [0, Math.max(uniqueSpeciesCount - 0.5, 0.5)];
  const xDomain = [0, durationHours];
  const ticksMeta = buildTimeTicks(start, durationMs);
  const xTicks = ticksMeta.map((t) => t.offsetMs / (1000 * 60 * 60));

  const titleSuffix =
    durationHours < 24
      ? ` (${Math.max(1, Math.round(durationHours * 10) / 10)} h)`
      : ` (${Math.max(1, Math.round(durationHours / 24))} j)`;

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.[0]) return null;
    const p = payload[0].payload;
    const at = new Date(start.getTime() + p.x * 60 * 60 * 1000);
    return (
      <div
        style={{
          background: "white",
          padding: "10px 14px",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        }}
      >
        <div style={{ fontWeight: 600, color: "#374151" }}>{p.speciesName}</div>
        <div style={{ color: "#6b7280", marginTop: 4 }}>
          {at.toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
          {" — "}
          {p.size} cm
        </div>
        {p.team && <div style={{ fontSize: "0.85rem", color: "#9ca3af", marginTop: 2 }}>{p.team}</div>}
      </div>
    );
  };

  return (
    <div style={{ width: "100%", minHeight: "320px" }}>
      <h3 style={{ marginBottom: "16px", fontSize: "1.1rem", color: "#333", textAlign: "center" }}>
        Prises dans le temps{titleSuffix}
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={true} />
          <XAxis
            type="number"
            dataKey="x"
            name="heure"
            domain={xDomain}
            ticks={xTicks}
            tickFormatter={(v) => {
              let best = ticksMeta[0];
              let bestDiff = Infinity;
              ticksMeta.forEach((t) => {
                const hours = t.offsetMs / (1000 * 60 * 60);
                const diff = Math.abs(hours - v);
                if (diff < bestDiff) {
                  bestDiff = diff;
                  best = t;
                }
              });
              return best?.label ?? "";
            }}
            tick={{ fontSize: 11, fill: "#374151", fontWeight: 500 }}
            stroke="#9ca3af"
            interval={0}
          />
          <YAxis
            type="number"
            dataKey="y"
            domain={yDomain}
            tick={false}
            axisLine={false}
            tickLine={false}
          />
          <ZAxis range={[50, 200]} />
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: "3 3", stroke: "#9ca3af" }} />
          <Scatter name="Prises" data={scatterData}>
            {scatterData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      {speciesStats?.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "12px", marginTop: "12px" }}>
          {speciesStats.map((s) => (
            <span key={s.id} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem" }}>
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  backgroundColor: getSpeciesColor(s.id, speciesStats),
                }}
              />
              {s.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
