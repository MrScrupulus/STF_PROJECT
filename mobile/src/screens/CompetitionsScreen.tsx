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
import { formatCompetitionDateRange } from '../utils/dateUtils';
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
      return { text: 'À venir', style: styles.statusUpcoming, sortOrder: 2 };
    } else if (now >= start && now <= end) {
      return { text: 'En cours', style: styles.statusOngoing, sortOrder: 1 };
    } else {
      return { text: 'Terminée', style: styles.statusEnded, sortOrder: 3 };
    }
  };


  const renderCompetition = ({ item }: { item: Competition }) => {
    const status = getCompetitionStatus(item.startDate, item.endDate);
    const isEnded = status.text === 'Terminée';
    const handlePress = () => {
      (navigation as any).navigate('CompetitionDetail', { id: item.id });
    };
    
    return (
      <TouchableOpacity
        style={[styles.card, isEnded && styles.cardEnded]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <View style={styles.badgesContainer}>
            <View style={[styles.statusBadge, status.style]}>
              <Text style={styles.statusBadgeText}>{status.text}</Text>
            </View>
            {item.isRegistered && (
              <View style={styles.registeredBadge}>
                <Text style={styles.registeredBadgeText}>✓ Inscrit</Text>
              </View>
            )}
          </View>
        </View>
        <Text style={styles.cardDate}>
          {formatCompetitionDateRange(item.startDate, item.endDate)}
        </Text>
        {item.teams && item.teams.length > 0 && (
          <Text style={styles.cardTeams}>{item.teams.length} équipe(s)</Text>
        )}
        <View style={styles.moreInfoContainer}>
          <Text style={styles.moreInfoText}>+ d'infos</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <Header title="Compétitions" showBack={true} showMenu={true} />
      <View style={styles.container}>
        <FlatList
          data={[...(data || [])].sort((a, b) => {
            const statusA = getCompetitionStatus(a.startDate, a.endDate);
            const statusB = getCompetitionStatus(b.startDate, b.endDate);
            return statusA.sortOrder - statusB.sortOrder;
          })}
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
  cardEnded: {
    opacity: 0.7,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgesContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    flexWrap: 'wrap',
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
  registeredBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#dbeafe',
  },
  registeredBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1e40af',
  },
  cardDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  cardTeams: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  moreInfoContainer: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  moreInfoText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
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

