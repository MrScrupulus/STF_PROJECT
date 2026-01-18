import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { speciesService, Species } from '../services/speciesService';
import Header from '../components/Header';

export default function SpeciesScreen() {
  const { data: species, isLoading, error } = useQuery({
    queryKey: ['species'],
    queryFn: () => speciesService.getAll(),
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Erreur lors du chargement</Text>
      </View>
    );
  }

  const renderSpecies = ({ item }: { item: Species }) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{item.name}</Text>
      <View style={styles.pointsInfo}>
        <Text style={styles.coefficient}>
          Coefficient: {item.coefficient}
        </Text>
        {item.isBonus && (
          <View style={styles.bonusBadge}>
            <Text style={styles.bonusText}>Points bonus</Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <>
      <Header title="Espèces" showBack={true} showMenu={true} />
      <View style={styles.container}>
        <FlatList
        data={species || []}
        renderItem={renderSpecies}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>Aucune espèce</Text>
          </View>
        }
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  list: {
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  pointsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  coefficient: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  bonusBadge: {
    backgroundColor: '#ff9500',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  bonusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 16,
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
  },
});
