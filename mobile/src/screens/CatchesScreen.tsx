import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { catchesService } from '../services/catchesService';

export default function CatchesScreen() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['catches'],
    queryFn: () => catchesService.getAll(),
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

  const renderCatch = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{item.species.name}</Text>
      <Text style={styles.cardInfo}>Longueur: {item.length} cm</Text>
      <Text style={styles.cardInfo}>Points: {item.points}</Text>
      <Text style={styles.cardInfo}>
        Équipe: {item.team.name}
      </Text>
      <Text style={styles.cardInfo}>
        Statut: {item.isValidated ? 'Validé' : 'En attente'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={data || []}
        renderItem={renderCatch}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>Aucune prise enregistrée</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  list: {
    padding: 16,
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
  cardInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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

