import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Modal,
  FlatList,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { teamService } from '../services/teamService';
import { formatDateTime } from '../utils/dateUtils';
import Header from '../components/Header';

export default function HistoryScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<'overview' | 'teams' | 'catches'>('overview');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const { data: history, isLoading, error } = useQuery({
    queryKey: ['my-history'],
    queryFn: () => teamService.getMyHistory(),
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error || !history) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Erreur lors du chargement</Text>
      </View>
    );
  }

  const stats = history.statistics || {};
  const teams = history.teams || [];
  const catches = history.catches || [];
  const sortedCatches = [...catches].sort(
    (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <>
      <Header title="Historique" showBack={true} showMenu={true} />
      <View style={styles.container}>

      {/* Onglets */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
            Vue d'ensemble
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'teams' && styles.tabActive]}
          onPress={() => setActiveTab('teams')}
        >
          <Text style={[styles.tabText, activeTab === 'teams' && styles.tabTextActive]}>
            Équipes ({teams.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'catches' && styles.tabActive]}
          onPress={() => setActiveTab('catches')}
        >
          <Text style={[styles.tabText, activeTab === 'catches' && styles.tabTextActive]}>
            Prises ({catches.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'overview' && (
          <OverviewTab stats={stats} teams={teams} navigation={navigation} />
        )}
        {activeTab === 'teams' && (
          <TeamsTab teams={teams} navigation={navigation} />
        )}
        {activeTab === 'catches' && (
          <CatchesTab catches={sortedCatches} onImagePress={setSelectedImage} />
        )}
      </ScrollView>

      {/* Modal pour agrandir l'image */}
      <Modal
        visible={!!selectedImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <View style={styles.imageModal}>
          <TouchableOpacity
            style={styles.imageModalClose}
            onPress={() => setSelectedImage(null)}
          >
            <Text style={styles.imageModalCloseText}>×</Text>
          </TouchableOpacity>
          {selectedImage && (
            <Image
              source={{ uri: selectedImage }}
              style={styles.imageModalImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
      </View>
    </>
  );
}

function OverviewTab({ stats, teams, navigation }: any) {
  return (
    <View style={styles.overview}>
      {/* Statistiques principales */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total de prises</Text>
          <Text style={styles.statValue}>{stats.totalCatches || 0}</Text>
          <Text style={styles.statDescription}>
            {stats.validatedCatches || 0} validées
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Points totaux</Text>
          <Text style={styles.statValue}>{stats.totalPoints || 0}</Text>
          <Text style={styles.statDescription}>
            Toutes compétitions confondues
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Équipes actives</Text>
          <Text style={styles.statValue}>{stats.activeTeamsCount || 0}</Text>
          <Text style={styles.statDescription}>
            {stats.inactiveTeamsCount || 0} dissoutes
          </Text>
        </View>
      </View>

      {/* Répartition par espèce */}
      {stats.speciesStats && stats.speciesStats.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Répartition par espèce</Text>
          {stats.speciesStats.map((species: any) => (
            <View key={species.id} style={styles.speciesItem}>
              <Text style={styles.speciesName}>{species.name}</Text>
              <Text style={styles.speciesCount}>
                {species.count} prise{species.count > 1 ? 's' : ''}
              </Text>
              <Text style={styles.speciesPoints}>{species.totalPoints} pts</Text>
            </View>
          ))}
        </View>
      )}

      {/* Équipes récentes */}
      {teams.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mes équipes ({teams.length})</Text>
          {teams.slice(0, 6).map((team: any) => (
            <TouchableOpacity
              key={team.id}
              style={[styles.teamCard, !team.isActive && styles.teamCardInactive]}
              onPress={() => {
                if (team.isActive) {
                  navigation.navigate('TeamDetail' as never, { id: team.id } as never);
                }
              }}
            >
              {!team.isActive && (
                <View style={styles.teamBadge}>
                  <Text style={styles.teamBadgeText}>Dissoute</Text>
                </View>
              )}
              <Text style={styles.teamName}>{team.name}</Text>
              <Text style={styles.teamScore}>{team.totalScore || 0} pts</Text>
              <Text style={styles.teamMembers}>
                {team.members.map((m: any) => m.firstname).join(', ')}
              </Text>
              {team.competition && (
                <Text style={styles.teamCompetition}>{team.competition.name}</Text>
              )}
              <Text style={styles.teamCatches}>
                {team.catchesCount || 0} prise{team.catchesCount !== 1 ? 's' : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

function TeamsTab({ teams, navigation }: any) {
  return (
    <View style={styles.teamsTab}>
      {teams.map((team: any) => (
        <TouchableOpacity
          key={team.id}
          style={[styles.teamCard, !team.isActive && styles.teamCardInactive]}
          onPress={() => {
            if (team.isActive) {
              navigation.navigate('TeamDetail' as never, { id: team.id } as never);
            }
          }}
        >
          {!team.isActive && (
            <View style={styles.teamBadge}>
              <Text style={styles.teamBadgeText}>Dissoute</Text>
            </View>
          )}
          <Text style={styles.teamName}>{team.name}</Text>
          <Text style={styles.teamScore}>{team.totalScore || 0} pts</Text>
          <Text style={styles.teamMembers}>
            {team.members.map((m: any) => m.firstname).join(', ')}
          </Text>
          {team.competition && (
            <Text style={styles.teamCompetition}>{team.competition.name}</Text>
          )}
          <Text style={styles.teamCatches}>
            {team.catchesCount || 0} prise{team.catchesCount !== 1 ? 's' : ''}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function CatchesTab({ catches, onImagePress }: any) {
  return (
    <View style={styles.catchesTab}>
      {catches.map((catchItem: any) => (
        <View key={catchItem.id} style={styles.catchCard}>
          <View style={styles.catchHeader}>
            <Text style={styles.catchSpecies}>{catchItem.species.name}</Text>
            <Text style={styles.catchPoints}>{catchItem.points} pts</Text>
          </View>
          <View style={styles.catchDetails}>
            <Text style={styles.catchDetail}>
              Taille: <Text style={styles.catchValue}>{catchItem.size} cm</Text>
            </Text>
            <Text style={styles.catchDetail}>
              Coefficient: <Text style={styles.catchValue}>{catchItem.species.coefficient}</Text>
            </Text>
            {catchItem.createdAt && (
              <Text style={styles.catchDetail}>
                Date: <Text style={styles.catchValue}>
                  {formatDateTime(catchItem.createdAt)}
                </Text>
              </Text>
            )}
          </View>
          {catchItem.photoUrl && (
            <TouchableOpacity
              style={styles.catchPhoto}
              onPress={() => onImagePress(catchItem.photoUrl)}
            >
              <Image
                source={{ uri: catchItem.photoUrl }}
                style={styles.catchImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          )}
          {catchItem.rejectionReason ? (
            <View style={styles.catchStatusRejected}>
              <Text style={styles.catchStatusText}>
                ❌ Rejetée: {catchItem.rejectionReason}
              </Text>
            </View>
          ) : !catchItem.isValidated ? (
            <View style={styles.catchStatusPending}>
              <Text style={styles.catchStatusText}>⏳ En attente de validation</Text>
            </View>
          ) : (
            <View style={styles.catchStatusValidated}>
              <Text style={styles.catchStatusText}>✅ Validée</Text>
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  backButton: {
    marginBottom: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tab: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  tabTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  overview: {
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statDescription: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  speciesItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  speciesName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  speciesCount: {
    fontSize: 14,
    color: '#666',
    marginRight: 12,
  },
  speciesPoints: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  teamCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    position: 'relative',
  },
  teamCardInactive: {
    opacity: 0.7,
  },
  teamBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ff9500',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  teamBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  teamName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  teamScore: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  teamMembers: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  teamCompetition: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  teamCatches: {
    fontSize: 14,
    color: '#999',
  },
  teamsTab: {
    padding: 16,
  },
  catchesTab: {
    padding: 16,
  },
  catchCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  catchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  catchSpecies: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  catchPoints: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  catchDetails: {
    marginBottom: 8,
  },
  catchDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  catchValue: {
    fontWeight: '600',
    color: '#333',
  },
  catchPhoto: {
    marginTop: 8,
    marginBottom: 8,
  },
  catchImage: {
    width: 150,
    height: 150,
    borderRadius: 8,
  },
  catchStatusPending: {
    backgroundColor: '#fff3cd',
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  catchStatusValidated: {
    backgroundColor: '#d4edda',
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  catchStatusRejected: {
    backgroundColor: '#f8d7da',
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  catchStatusText: {
    fontSize: 14,
    color: '#333',
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 16,
  },
  imageModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalClose: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1,
  },
  imageModalCloseText: {
    color: '#fff',
    fontSize: 40,
    fontWeight: '300',
  },
  imageModalImage: {
    width: '90%',
    height: '80%',
  },
});
