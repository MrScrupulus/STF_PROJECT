import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { competitionsService } from '../services/competitionsService';

export default function CompetitionDetailScreen({ route }: any) {
  const { id } = route.params;
  const { data, isLoading, error } = useQuery({
    queryKey: ['competition', id],
    queryFn: () => competitionsService.getOne(id),
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Erreur lors du chargement</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{data.name}</Text>
        <Text style={styles.date}>
          Du {new Date(data.startDate).toLocaleDateString('fr-FR')} au{' '}
          {new Date(data.endDate).toLocaleDateString('fr-FR')}
        </Text>

        {data.teams && data.teams.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Classement</Text>
            {data.teams
              .sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))
              .map((team, index) => (
                <View key={team.id} style={styles.teamRow}>
                  <Text style={styles.teamRank}>#{index + 1}</Text>
                  <Text style={styles.teamName}>{team.name}</Text>
                  <Text style={styles.teamScore}>{team.totalScore || 0} pts</Text>
                </View>
              ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  date: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  teamRank: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginRight: 16,
    width: 30,
  },
  teamName: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  teamScore: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 16,
  },
});

