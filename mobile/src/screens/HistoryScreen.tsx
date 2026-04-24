import React, { useState, useEffect, useMemo } from 'react';
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
import { useNavigation, useRoute } from '@react-navigation/native';
import { teamService } from '../services/teamService';
import { competitionsService } from '../services/competitionsService';
import { formatDateTime } from '../utils/dateUtils';
import { resolvePhotoUri } from '../utils/photoUrl';
import Header from '../components/Header';
import CatchesMapView from '../components/competition/CatchesMapView';
import CatchesTimelineChart from '../components/competition/CatchesTimelineChart';
import SpeciesPieChart from '../components/competition/SpeciesPieChart';

export type HistoryTab = 'catches' | 'competitions' | 'stats';

function normalizeInitialTab(t: string | undefined): HistoryTab {
  if (t === 'overview') return 'stats';
  if (t === 'teams') return 'competitions';
  if (t === 'catches' || t === 'competitions' || t === 'stats') return t;
  return 'catches';
}

function groupTeamsByCompetition(teams: any[]) {
  const map = new Map<number, { competition: any; teams: any[] }>();
  for (const team of teams) {
    const comp = team.competition;
    if (!comp?.id) continue;
    const id = comp.id;
    if (!map.has(id)) {
      map.set(id, { competition: comp, teams: [] });
    }
    map.get(id)!.teams.push(team);
  }
  return Array.from(map.values()).sort((a, b) => {
    const da = a.competition.startDate ? new Date(a.competition.startDate).getTime() : 0;
    const db = b.competition.startDate ? new Date(b.competition.startDate).getTime() : 0;
    return db - da;
  });
}

function timelineBounds(timeline: any[]): { startDate?: string; endDate?: string } {
  if (!timeline?.length) return {};
  let min = Infinity;
  let max = -Infinity;
  for (const t of timeline) {
    const d = new Date(t.createdAt).getTime();
    if (!isNaN(d)) {
      min = Math.min(min, d);
      max = Math.max(max, d);
    }
  }
  if (min === Infinity) return {};
  const padMs = 60 * 60 * 1000;
  return {
    startDate: new Date(min - padMs).toISOString(),
    endDate: new Date(max + padMs).toISOString(),
  };
}

export default function HistoryScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const initialTabParam = (route.params as { initialTab?: string } | undefined)?.initialTab;

  const [activeTab, setActiveTab] = useState<HistoryTab>(() => normalizeInitialTab(initialTabParam));
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const [catchesPage, setCatchesPage] = useState(1);
  const [catchesPages, setCatchesPages] = useState(1);
  const [allCatches, setAllCatches] = useState<any[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    setActiveTab(normalizeInitialTab(initialTabParam));
  }, [initialTabParam]);

  const { data: history, isLoading, error } = useQuery({
    queryKey: ['my-history-base'],
    queryFn: () => teamService.getMyHistory(1, 10),
  });

  const { data: moreCatchesData, isLoading: isLoadingMoreCatches } = useQuery({
    queryKey: ['my-history-catches', catchesPage],
    queryFn: () => teamService.getMyHistory(catchesPage, 10),
    enabled: catchesPage > 1,
  });

  const { data: globalStatsPayload, isLoading: globalStatsLoading } = useQuery({
    queryKey: ['me-global-stats'],
    queryFn: () => competitionsService.getMyGlobalStats(),
    enabled: !!history && !error,
  });

  useEffect(() => {
    if (history && catchesPage === 1) {
      setAllCatches(history.catches || []);
      setCatchesPages(history.catchesPagination?.pages || 1);
    }
  }, [history]);

  useEffect(() => {
    if (moreCatchesData && catchesPage > 1) {
      const newCatches = moreCatchesData.catches || [];
      setAllCatches((prev) => {
        const existingIds = new Set(prev.map((c: any) => c.id));
        const uniqueNewCatches = newCatches.filter((c: any) => !existingIds.has(c.id));
        return [...prev, ...uniqueNewCatches];
      });
      setCatchesPages(moreCatchesData.catchesPagination?.pages || catchesPages);
      setIsLoadingMore(false);
    }
  }, [moreCatchesData, catchesPage]);

  const teamsEarly = history?.teams ?? [];
  const competitionsGrouped = useMemo(() => groupTeamsByCompetition(teamsEarly), [teamsEarly]);
  const orphanTeams = useMemo(
    () =>
      teamsEarly.filter((t: any) => !t.competition?.id && !t.isPersonalJournal),
    [teamsEarly]
  );

  const globalStatsEarly = globalStatsPayload?.success ? globalStatsPayload.stats : null;
  const { startDate: tlStart, endDate: tlEnd } = useMemo(
    () => timelineBounds(globalStatsEarly?.timeline || []),
    [globalStatsEarly?.timeline]
  );

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

  const sortedCatches = [...allCatches].sort(
    (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const loadMoreCatches = async () => {
    if (catchesPage >= catchesPages || isLoadingMore || isLoadingMoreCatches) return;
    setIsLoadingMore(true);
    setCatchesPage((prev) => prev + 1);
  };

  const globalStats = globalStatsEarly;

  const catchCountLabel = history?.statistics?.totalCatches || allCatches.length;
  const compTabCount = competitionsGrouped.length;

  return (
    <>
      <Header title="Historique & prises" showBack={true} showMenu={true} />
      <View style={styles.container}>
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'catches' && styles.tabActive]}
            onPress={() => setActiveTab('catches')}
          >
            <View style={styles.tabInner}>
              <Text style={[styles.tabLine1, activeTab === 'catches' && styles.tabLine1Active]}>Prises</Text>
              <Text style={styles.tabLine2}>{catchCountLabel}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'competitions' && styles.tabActive]}
            onPress={() => setActiveTab('competitions')}
          >
            <View style={styles.tabInner}>
              <Text style={[styles.tabLine1, activeTab === 'competitions' && styles.tabLine1Active]}>
                Compétitions
              </Text>
              <Text style={styles.tabLine2}>{compTabCount}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'stats' && styles.tabActive]}
            onPress={() => setActiveTab('stats')}
          >
            <View style={styles.tabInner}>
              <Text style={[styles.tabLine1, activeTab === 'stats' && styles.tabLine1Active]}>Stats</Text>
            </View>
          </TouchableOpacity>
        </View>

        {activeTab === 'catches' ? (
          <CatchesTab
            catches={sortedCatches}
            onImagePress={setSelectedImage}
            onLoadMore={catchesPage < catchesPages ? loadMoreCatches : undefined}
            isLoadingMore={isLoadingMore || isLoadingMoreCatches}
          />
        ) : activeTab === 'competitions' ? (
          <ScrollView style={styles.content}>
            <CompetitionsTab
              grouped={competitionsGrouped}
              orphanTeams={orphanTeams}
              navigation={navigation}
            />
          </ScrollView>
        ) : (
          <ScrollView style={styles.content}>
            <StatsTab
              stats={stats}
              teams={teams}
              navigation={navigation}
              setActiveTab={setActiveTab}
              globalStats={globalStats}
              globalStatsLoading={globalStatsLoading}
              timelineStart={tlStart}
              timelineEnd={tlEnd}
            />
          </ScrollView>
        )}

        <Modal
          visible={!!selectedImage}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setSelectedImage(null)}
        >
          <View style={styles.imageModal}>
            <TouchableOpacity style={styles.imageModalClose} onPress={() => setSelectedImage(null)}>
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

function StatsTab({
  stats,
  teams,
  navigation,
  setActiveTab,
  globalStats,
  globalStatsLoading,
  timelineStart,
  timelineEnd,
}: any) {
  return (
    <View style={styles.overview}>
      <View style={styles.statsGrid}>
        <TouchableOpacity
          style={styles.statCard}
          onPress={() => setActiveTab('catches')}
          activeOpacity={0.7}
        >
          <Text style={styles.statLabel}>Total de prises</Text>
          <Text style={styles.statValue}>{stats.totalCatches || 0}</Text>
          <Text style={styles.statDescription}>{stats.validatedCatches || 0} validées</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.statCard}
          onPress={() => setActiveTab('competitions')}
          activeOpacity={0.7}
        >
          <Text style={styles.statLabel}>Compétitions</Text>
          <Text style={styles.statValue}>{stats.competitionsCount || 0}</Text>
          <Text style={styles.statDescription}>Participations</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.statCard}
          onPress={() => setActiveTab('competitions')}
          activeOpacity={0.7}
        >
          <Text style={styles.statLabel}>Équipes</Text>
          <Text style={styles.statValue}>{stats.activeTeamsCount || 0}</Text>
          <Text style={styles.statDescription}>{stats.inactiveTeamsCount || 0} dissoutes</Text>
        </TouchableOpacity>
      </View>

      {stats.speciesStats && stats.speciesStats.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Répartition par espèce (validées)</Text>
          <SpeciesPieChart
            speciesStats={stats.speciesStats.map((s: any) => ({
              id: s.id,
              name: s.name,
              count: s.count,
            }))}
            showTitle={false}
          />
          {stats.speciesStats.map((species: any) => (
            <View key={species.id} style={styles.speciesItem}>
              <Text style={styles.speciesName}>{species.name}</Text>
              <Text style={styles.speciesCount}>
                {species.count} prise{species.count > 1 ? 's' : ''}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vue globale (prises validées)</Text>
        <Text style={styles.globalHint}>
          Volume et localisation de vos prises validées (toutes compétitions). Les points et classements restent
          visibles sur chaque compétition ou équipe.
        </Text>
        {globalStatsLoading && (
          <View style={styles.inlineLoading}>
            <ActivityIndicator size="small" color="#007AFF" />
          </View>
        )}
        {!globalStatsLoading && globalStats && (
          <>
            <View style={styles.globalKpis}>
              <Text style={styles.globalKpiText}>{globalStats.totalCatches ?? 0} prises validées</Text>
            </View>
            {globalStats.catchesForMap?.length > 0 && (
              <CatchesMapView
                catches={globalStats.catchesForMap}
                speciesStats={globalStats.speciesStats || []}
                height={320}
              />
            )}
            {globalStats.timeline?.length > 0 && timelineStart && timelineEnd && (
              <CatchesTimelineChart
                catches={globalStats.timeline}
                startDate={timelineStart}
                endDate={timelineEnd}
                speciesStats={globalStats.speciesStats || []}
              />
            )}
          </>
        )}
      </View>

      {teams.filter((t: any) => !t.isPersonalJournal).length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Mes équipes ({teams.filter((t: any) => !t.isPersonalJournal).length})
          </Text>
          {teams
            .filter((t: any) => !t.isPersonalJournal)
            .slice(0, 6)
            .map((team: any) => (
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
              <Text style={styles.teamMembers}>{team.members.map((m: any) => m.firstname).join(', ')}</Text>
              {team.competition && <Text style={styles.teamCompetition}>{team.competition.name}</Text>}
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

function CompetitionsTab({ grouped, orphanTeams, navigation }: any) {
  if ((!grouped || grouped.length === 0) && (!orphanTeams || orphanTeams.length === 0)) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Aucune compétition dans votre historique</Text>
      </View>
    );
  }

  return (
    <View style={styles.competitionsTab}>
      <Text style={styles.competitionsIntro}>
        Toutes vos participations : compétitions en cours et terminées (équipes actives ou dissoutes).
      </Text>
      {grouped.map(({ competition, teams: compTeams }: any) => {
        const severalTeams = compTeams.length > 1;
        const teamsReminder = severalTeams
          ? `Plusieurs équipes : ${compTeams
              .map((t: any) => `${t.name}${t.isActive ? '' : ' (dissoute)'}`)
              .join(' · ')}`
          : null;

        return (
          <TouchableOpacity
            key={competition.id}
            style={styles.competitionCard}
            onPress={() =>
              navigation.navigate('CompetitionDetail' as never, { id: competition.id } as never)
            }
            activeOpacity={0.7}
          >
            <Text style={styles.competitionTitle}>{competition.name}</Text>
            {(competition.startDate || competition.endDate) && (
              <Text style={styles.competitionDates}>
                {competition.startDate ? formatDateTime(competition.startDate) : '—'}
                {' → '}
                {competition.endDate ? formatDateTime(competition.endDate) : '—'}
              </Text>
            )}
            {teamsReminder && <Text style={styles.competitionTeamsReminder}>{teamsReminder}</Text>}
            <Text style={styles.competitionHint}>Voir la compétition →</Text>
          </TouchableOpacity>
        );
      })}

      {orphanTeams.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Équipes sans compétition liée</Text>
          {orphanTeams.map((team: any) => (
            <TouchableOpacity
              key={team.id}
              style={[styles.teamCard, !team.isActive && styles.teamCardInactive]}
              onPress={() => {
                if (team.isActive) {
                  navigation.navigate('TeamDetail' as never, { id: team.id } as never);
                }
              }}
            >
              <Text style={styles.teamName}>{team.name}</Text>
              <Text style={styles.teamScore}>{team.totalScore || 0} pts</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

function CatchesTab({ catches, onImagePress, onLoadMore, isLoadingMore }: any) {
  return (
    <FlatList
      style={styles.content}
      contentContainerStyle={styles.catchesTab}
      data={catches}
      keyExtractor={(item: any) => item.id.toString()}
      renderItem={({ item: catchItem }: any) => (
        <View key={catchItem.id} style={styles.catchCard}>
          <View style={styles.catchHeader}>
            <Text style={styles.catchSpecies}>{catchItem.species.name}</Text>
          </View>
          <View style={styles.catchDetails}>
            <Text style={styles.catchDetail}>
              Taille: <Text style={styles.catchValue}>{catchItem.size} cm</Text>
            </Text>
            {catchItem.team?.name && (
              <Text style={styles.catchDetail}>
                Équipe: <Text style={styles.catchValue}>{catchItem.team.name}</Text>
              </Text>
            )}
            {catchItem.competition?.name && (
              <Text style={styles.catchDetail}>
                Compétition: <Text style={styles.catchValue}>{catchItem.competition.name}</Text>
              </Text>
            )}
            {catchItem.createdAt && (
              <Text style={styles.catchDetail}>
                Date:{' '}
                <Text style={styles.catchValue}>{formatDateTime(catchItem.createdAt)}</Text>
              </Text>
            )}
          </View>
          {catchItem.photoUrl && (
            <TouchableOpacity
              style={styles.catchPhoto}
              onPress={() => onImagePress(resolvePhotoUri(catchItem.photoUrl) ?? catchItem.photoUrl)}
            >
              <Image
                source={{ uri: resolvePhotoUri(catchItem.photoUrl) ?? '' }}
                style={styles.catchImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          )}
          {catchItem.rejectionReason ? (
            <View style={styles.catchStatusRejected}>
              <Text style={styles.catchStatusText}>❌ Rejetée: {catchItem.rejectionReason}</Text>
            </View>
          ) : !catchItem.isValidated ? (
            <View style={styles.catchStatusPending}>
              <Text style={styles.catchStatusText}>⏳ En attente de validation</Text>
            </View>
          ) : null}
        </View>
      )}
      onEndReached={() => {
        if (onLoadMore && !isLoadingMore) {
          onLoadMore();
        }
      }}
      onEndReachedThreshold={0.5}
      ListFooterComponent={
        isLoadingMore ? (
          <View style={styles.loadingMore}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={styles.loadingMoreText}>Chargement...</Text>
          </View>
        ) : null
      }
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Aucune prise dans votre historique</Text>
        </View>
      }
    />
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
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#007AFF',
  },
  tabInner: {
    alignItems: 'center',
  },
  tabLine1: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  tabLine1Active: {
    color: '#007AFF',
    fontWeight: '600',
  },
  tabLine2: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
    textAlign: 'center',
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
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 22,
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
  globalHint: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
    lineHeight: 18,
  },
  globalKpis: {
    marginBottom: 12,
  },
  globalKpiText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  inlineLoading: {
    paddingVertical: 16,
    alignItems: 'center',
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
    marginLeft: 12,
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
  competitionsTab: {
    padding: 16,
  },
  competitionsIntro: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 16,
  },
  competitionCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  competitionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  competitionDates: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  competitionTeamsReminder: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    lineHeight: 16,
  },
  competitionHint: {
    fontSize: 13,
    color: '#007AFF',
    marginTop: 8,
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
    marginBottom: 8,
  },
  catchSpecies: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
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
  loadingMore: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingMoreText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
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
