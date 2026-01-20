"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

export default function SpeciesPieChart({ speciesStats }) {
  if (!speciesStats || speciesStats.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
        Aucune donnée disponible
      </div>
    );
  }

  // Préparer les données pour le graphique
  const data = speciesStats.map((species) => ({
    name: species.name,
    value: species.count,
    id: species.id,
  }));

  // Fonction pour formater le tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = ((data.value / data.payload.total) * 100).toFixed(1);
      return (
        <div style={{
          backgroundColor: 'white',
          padding: '10px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <p style={{ margin: 0, fontWeight: 'bold' }}>{data.name}</p>
          <p style={{ margin: '5px 0 0 0', color: '#666' }}>
            {data.value} prise{data.value > 1 ? 's' : ''} ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  // Calculer le total pour les pourcentages
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const dataWithTotal = data.map(item => ({ ...item, total }));

  return (
    <div style={{ width: '100%', minWidth: '300px' }}>
      <h3 style={{ marginBottom: '20px', fontSize: '1.2rem', color: '#333', textAlign: 'center' }}>
        Répartition des espèces capturées
      </h3>
      <div style={{ marginBottom: '20px' }}>
        <ResponsiveContainer width="100%" height={300} minHeight={300}>
          <PieChart>
            <Pie
              data={dataWithTotal}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      {/* Légende améliorée similaire au mobile */}
      <div style={{
        marginTop: '20px',
        paddingTop: '20px',
        borderTop: '1px solid #e0e0e0',
      }}>
        {speciesStats.map((species, index) => {
          const percentage = ((species.count / total) * 100).toFixed(1);
          return (
            <div
              key={species.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '12px',
                padding: '8px',
                borderRadius: '4px',
                backgroundColor: index % 2 === 0 ? '#f9fafb' : 'transparent',
              }}
            >
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: COLORS[index % COLORS.length],
                  marginRight: '12px',
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', color: '#333', marginBottom: '2px' }}>
                  {species.name}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#666' }}>
                  {species.count} prise{species.count > 1 ? 's' : ''} ({percentage}%)
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
