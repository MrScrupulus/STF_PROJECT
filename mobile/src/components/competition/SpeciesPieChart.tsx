import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { SPECIES_COLORS } from '../../utils/speciesColors';

const screenWidth = Dimensions.get('window').width;

interface SpeciesStat {
  id: number;
  name: string;
  count: number;
}

interface SpeciesPieChartProps {
  speciesStats: SpeciesStat[];
  /** Par défaut : titre du graphique. Mettre false pour n’afficher que le camembert (ex. sous un titre de section parent). */
  showTitle?: boolean;
}

export default function SpeciesPieChart({ speciesStats, showTitle = true }: SpeciesPieChartProps) {
  if (!speciesStats || speciesStats.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Aucune donnée disponible</Text>
      </View>
    );
  }

  // Préparer les données pour le graphique
  const data = speciesStats.map((species, index) => ({
    name: species.name,
    population: species.count,
    color: SPECIES_COLORS[index % SPECIES_COLORS.length],
    legendFontColor: '#333',
    legendFontSize: 12,
  }));

  // Calculer le total pour les pourcentages
  const total = speciesStats.reduce((sum, species) => sum + species.count, 0);

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
  };

  return (
    <View style={styles.container}>
      {showTitle ? (
        <Text style={styles.title}>Répartition des espèces capturées</Text>
      ) : null}
      <PieChart
        data={data}
        width={screenWidth - 60}
        height={220}
        chartConfig={chartConfig}
        accessor="population"
        backgroundColor="transparent"
        paddingLeft="15"
        absolute // Affiche les valeurs absolues au lieu des pourcentages
      />
      <View style={styles.legend}>
        {speciesStats.map((species, index) => {
          const percentage = ((species.count / total) * 100).toFixed(1);
          return (
            <View key={species.id} style={styles.legendItem}>
              <View
                style={[
                  styles.legendColor,
                  { backgroundColor: SPECIES_COLORS[index % SPECIES_COLORS.length] },
                ]}
              />
              <Text style={styles.legendText}>
                {species.name}: {species.count} ({percentage}%)
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 14,
  },
  legend: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 10,
  },
  legendText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
});
