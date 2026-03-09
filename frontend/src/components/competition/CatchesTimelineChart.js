"use client";

import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ZAxis } from "recharts";
import { getSpeciesColor } from "../../utils/speciesColors";

function parseCreatedAt(createdAt) {
  if (!createdAt) return null;
  const str = String(createdAt);
  const match = str.match(/(\d{4})-(\d{2})-(\d{2})[T\s](\d{1,2}):(\d{2})/);
  if (match) {
    const [, y, m, d, h, min] = match;
    return {
      date: new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10)),
      hour: parseInt(h, 10),
      minute: parseInt(min, 10) || 0,
      decimalHour: parseInt(h, 10) + (parseInt(min, 10) || 0) / 60,
    };
  }
  return null;
}

function parseCompetitionBounds(startDate, endDate) {
  if (!startDate || !endDate) return { startTime: 0, endTime: 24, startHour: 0, endHour: 24 };
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const startHour = start.getHours() + start.getMinutes() / 60;
    const endHour = end.getHours() + end.getMinutes() / 60;
    const totalHours = (end - start) / (1000 * 60 * 60);
    return { start, end, startHour, endHour, totalHours: Math.max(1, totalHours) };
  } catch {
    return { startTime: 0, endTime: 24, startHour: 0, endHour: 24, totalHours: 24 };
  }
}

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

  const { start, end, startHour, endHour, totalHours } = parseCompetitionBounds(startDate, endDate);

  // Chaque prise = 1 point : x = heures depuis début compétition, y = index espèce, fill = couleur
  const scatterData = [];
  const speciesIndexMap = {};
  let nextSpeciesIndex = 0;

  catches.forEach((c) => {
    const parsed = parseCreatedAt(c.createdAt);
    if (!parsed) return;

    const catchDate = new Date(parsed.date);
    catchDate.setHours(parsed.hour, parsed.minute, 0, 0);
    const x = (catchDate - start) / (1000 * 60 * 60); // heures depuis le début
    if (x < -0.5 || x > totalHours + 0.5) return;

    let speciesIndex = speciesIndexMap[c.species?.id];
    if (speciesIndex === undefined) {
      speciesIndex = nextSpeciesIndex++;
      speciesIndexMap[c.species?.id] = speciesIndex;
    }

    scatterData.push({
      x: Math.max(0, x),
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
  const xDomain = [0, totalHours];

  // Graduation des heures : toutes les 1h pour une meilleure visibilité
  const tickStep = totalHours > 18 ? 2 : 1;
  const xTicks = [];
  for (let h = Math.floor(startHour); h <= Math.ceil(endHour); h += tickStep) {
    xTicks.push(h);
  }

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.[0]) return null;
    const p = payload[0].payload;
    const hoursFromStart = p.x;
    const totalMins = Math.round(hoursFromStart * 60);
    const hourLabel = Math.floor(startHour) + Math.floor(totalMins / 60);
    const min = totalMins % 60;
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
          {hourLabel}h{min ? ` ${min}min` : ""} - {p.size} cm
        </div>
        {p.team && <div style={{ fontSize: "0.85rem", color: "#9ca3af", marginTop: 2 }}>{p.team}</div>}
      </div>
    );
  };

  return (
    <div style={{ width: "100%", minHeight: "320px" }}>
      <h3 style={{ marginBottom: "16px", fontSize: "1.1rem", color: "#333", textAlign: "center" }}>
        Prises dans le temps
        {totalHours <= 24 ? ` (${Math.floor(startHour)}h - ${Math.ceil(endHour)}h)` : ` (${totalHours.toFixed(0)}h)`}
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={true} />
          <XAxis
            type="number"
            dataKey="x"
            name="heure"
            domain={xDomain}
            ticks={Array.from({ length: Math.ceil(totalHours / tickStep) + 1 }, (_, i) => i * tickStep)}
            tickFormatter={(v) =>
              totalHours <= 24
                ? `${Math.floor(startHour + v) % 24}h`
                : `${Math.floor(v)}h`
            }
            tick={{ fontSize: 12, fill: "#374151", fontWeight: 500 }}
            stroke="#9ca3af"
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
          {speciesStats.map((s, i) => (
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
