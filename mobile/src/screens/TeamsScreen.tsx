import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { teamService, Team } from '../services/teamService';
import { authService } from '../services/authService';
import Header from '../components/Header';

export default function TeamsScreen() {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState<any>(null);

  React.useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await authService.getCurrentUser();
        if (response.success && response.user) {
          setCurrentUser(response.user);
        }
      } catch (error) {
        console.error('Erreur chargement utilisateur:', error);
      }
    };
    loadUser();
  }, []);

  const { data: teamsData, isLoading, error } = useQuery({
    queryKey: ['my-teams'],
    queryFn: () => teamService.getMyTeams(),
  });

  const reactivateMutation = useMutation({
    mutationFn: (teamId: number) => teamService.reactivate(teamId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-teams'] });
      Alert.alert('Succès', 'Équipe réactivée avec succès');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Une erreur est survenue lors de la réactivation. Veuillez réessayer.';
      Alert.alert('Erreur', message);
    },
  });

  const handleReactivate = (teamId: number) => {
    Alert.alert(
      'Réactiver l\'équipe',
      'Le score sera réinitialisé à zéro pour la nouvelle compétition.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Réactiver',
          onPress: () => reactivateMutation.mutate(teamId),
        },
      ]
    );
  };

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

  const teams = teamsData?.teams || [];

  const renderTeam = ({ item }: { item: Team }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('TeamDetail' as never, { id: item.id } as never)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        {item.isActive === false && (
          <View style={styles.inactiveBadge}>
            <Text style={styles.inactiveText}>Inactive</Text>
          </View>
        )}
      </View>
      
      {item.competition && (
        <Text style={styles.cardCompetition}>
          Compétition: {item.competition.name}
        </Text>
      )}
      
      <Text style={styles.cardMembers}>
        Membres: {item.members?.map((m: any) => m.firstname).join(', ') || 'Aucun'}
      </Text>
      
      {item.totalScore !== undefined && (
        <Text style={styles.cardScore}>Score: {item.totalScore} pts</Text>
      )}

      {item.isActive === false && (
        <TouchableOpacity
          style={styles.reactivateButton}
          onPress={() => handleReactivate(item.id)}
        >
          <Text style={styles.reactivateButtonText}>Réactiver l'équipe</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  return (
    <>
      <Header title="Mon équipe" showBack={true} showMenu={true} />
      <View style={styles.container}>
        <FlatList
        data={teams}
        renderItem={renderTeam}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>Aucune équipe</Text>
            <Text style={styles.emptySubtext}>
              Créez votre première équipe pour participer aux compétitions.
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => navigation.navigate('CreateTeam' as never)}
            >
              <Text style={styles.createButtonText}>Créer une équipe</Text>
            </TouchableOpacity>
          </View>
        }
        ListHeaderComponent={
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => navigation.navigate('CreateTeam' as never)}
          >
            <Text style={styles.createButtonText}>+ Créer une équipe</Text>
          </TouchableOpacity>
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
  inactiveBadge: {
    backgroundColor: '#ff9500',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  inactiveText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  cardCompetition: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  cardMembers: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  cardScore: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginTop: 8,
  },
  reactivateButton: {
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
    alignItems: 'center',
  },
  reactivateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  createButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 16,
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
    marginBottom: 16,
  },
});
