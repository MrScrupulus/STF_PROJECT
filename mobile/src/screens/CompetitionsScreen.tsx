import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { competitionsService, Competition } from '../services/competitionsService';
import Header from '../components/Header';

export default function CompetitionsScreen() {
  const navigation = useNavigation();
  const { data, isLoading, error } = useQuery({
    queryKey: ['competitions'],
    queryFn: () => competitionsService.getAll(),
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

  const getCompetitionStatus = (startDate: string, endDate: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (now < start) {
      return { text: 'À venir', style: styles.statusUpcoming };
    } else if (now >= start && now <= end) {
      return { text: 'En cours', style: styles.statusOngoing };
    } else {
      return { text: 'Terminée', style: styles.statusEnded };
    }
  };

  const renderCompetition = ({ item }: { item: Competition }) => {
    const status = getCompetitionStatus(item.startDate, item.endDate);
    
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => (navigation as any).navigate('CompetitionDetail', { id: item.id })}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <View style={[styles.statusBadge, status.style]}>
            <Text style={styles.statusBadgeText}>{status.text}</Text>
          </View>
        </View>
        <Text style={styles.cardDate}>
          {new Date(item.startDate).toLocaleDateString('fr-FR')} -{' '}
          {new Date(item.endDate).toLocaleDateString('fr-FR')}
        </Text>
        {item.teams && item.teams.length > 0 && (
          <Text style={styles.cardTeams}>{item.teams.length} équipe(s)</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <>
      <Header title="Compétitions" showBack={true} showMenu={true} />
      <View style={styles.container}>
        <FlatList
          data={data || []}
          renderItem={renderCompetition}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>Aucune compétition</Text>
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  statusUpcoming: {
    backgroundColor: '#60a5fa',
  },
  statusOngoing: {
    backgroundColor: '#34d399',
  },
  statusEnded: {
    backgroundColor: '#f87171',
  },
  cardDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  cardTeams: {
    fontSize: 12,
    color: '#999',
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

