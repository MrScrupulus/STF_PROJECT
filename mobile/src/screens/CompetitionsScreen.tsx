import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation, useRoute } from '@react-navigation/native';
import { competitionsService, Competition } from '../services/competitionsService';
import { formatCompetitionDateRange } from '../utils/dateUtils';
import Header from '../components/Header';
import { useThemeColors } from '../contexts/ThemeContext';
import { type ThemeColors } from '../theme';

const FILTERS = {
  ALL: 'all',
  ONGOING: 'ongoing',
  UPCOMING: 'upcoming',
  ENDED: 'ended',
  PARTICIPATED: 'participated',
};

export default function CompetitionsScreen() {
  const theme = useThemeColors();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const navigation = useNavigation();
  const route = useRoute();
  const routeParams = route.params as { filter?: string } | undefined;
  const [activeFilter, setActiveFilter] = useState(
    routeParams?.filter === 'participated' ? FILTERS.PARTICIPATED : FILTERS.ALL
  );
  const { data, isLoading, error } = useQuery({
    queryKey: ['competitions'],
    queryFn: () => competitionsService.getAll(),
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.accent} />
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
      return { text: 'À venir', style: styles.statusUpcoming, sortOrder: 2, isEnded: false };
    } else if (now >= start && now <= end) {
      return { text: 'En cours', style: styles.statusOngoing, sortOrder: 1, isEnded: false };
    } else {
      return { text: 'Terminée', style: styles.statusEnded, sortOrder: 3, isEnded: true };
    }
  };

  // Filtrer les compétitions selon le filtre actif
  const filteredData = (data || []).filter((competition) => {
    if (activeFilter === FILTERS.ALL) return true;
    if (activeFilter === FILTERS.PARTICIPATED) {
      // Afficher seulement les compétitions auxquelles l'utilisateur est inscrit ou a participé
      return competition.isRegistered === true;
    }
    const status = getCompetitionStatus(competition.startDate, competition.endDate);
    if (activeFilter === FILTERS.ONGOING) return status.text === 'En cours';
    if (activeFilter === FILTERS.UPCOMING) return status.text === 'À venir';
    if (activeFilter === FILTERS.ENDED) return status.text === 'Terminée';
    return true;
  });


  const renderCompetition = ({ item }: { item: Competition }) => {
    const status = getCompetitionStatus(item.startDate, item.endDate);
    const isEnded = status.isEnded;
    const handlePress = () => {
      (navigation as any).navigate('CompetitionDetail', { id: item.id });
    };
    
    return (
      <TouchableOpacity
        style={[
          styles.card,
          isEnded && styles.cardEnded,
          item.coverImageUrl ? styles.cardWithCover : null,
        ]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        {item.coverImageUrl ? (
          <View style={styles.coverWrap}>
            <Image source={{ uri: item.coverImageUrl }} style={styles.cover} resizeMode="cover" />
          </View>
        ) : null}
        <View style={[styles.cardBody, item.coverImageUrl ? styles.cardBodyWithCover : null]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <View style={styles.badgesContainer}>
              {item.isRegistered && !isEnded && (
                <View style={styles.registeredBadge}>
                  <Text style={styles.registeredBadgeText}>✓ Inscrit</Text>
                </View>
              )}
              {item.isRegistered && isEnded && (
                <View style={styles.participatedBadge}>
                  <Text style={styles.participatedBadgeText}>✓ Participé</Text>
                </View>
              )}
              <View style={[styles.statusBadge, status.style]}>
                <Text style={styles.statusBadgeText}>{status.text}</Text>
              </View>
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
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <Header title="Compétitions" showBack={false} showMenu={true}  />
      <View style={styles.container}>
        <View style={styles.filtersWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filtersContainer}
            contentContainerStyle={styles.filtersContent}
          >
          <TouchableOpacity
            style={[
              styles.filterButton,
              activeFilter === FILTERS.ALL && styles.filterButtonActive,
            ]}
            onPress={() => setActiveFilter(FILTERS.ALL)}
          >
            <Text
              style={[
                styles.filterButtonText,
                activeFilter === FILTERS.ALL && styles.filterButtonTextActive,
              ]}
            >
              Toutes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              activeFilter === FILTERS.ONGOING && styles.filterButtonActive,
              activeFilter === FILTERS.ONGOING && styles.filterButtonOngoing,
            ]}
            onPress={() => setActiveFilter(FILTERS.ONGOING)}
          >
            <Text
              style={[
                styles.filterButtonText,
                activeFilter === FILTERS.ONGOING && styles.filterButtonTextActive,
              ]}
            >
              En cours
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              activeFilter === FILTERS.UPCOMING && styles.filterButtonActive,
              activeFilter === FILTERS.UPCOMING && styles.filterButtonUpcoming,
            ]}
            onPress={() => setActiveFilter(FILTERS.UPCOMING)}
          >
            <Text
              style={[
                styles.filterButtonText,
                activeFilter === FILTERS.UPCOMING && styles.filterButtonTextActive,
              ]}
            >
              À venir
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              activeFilter === FILTERS.ENDED && styles.filterButtonActive,
              activeFilter === FILTERS.ENDED && styles.filterButtonEnded,
            ]}
            onPress={() => setActiveFilter(FILTERS.ENDED)}
          >
            <Text
              style={[
                styles.filterButtonText,
                activeFilter === FILTERS.ENDED && styles.filterButtonTextActive,
              ]}
            >
              Terminées
            </Text>
          </TouchableOpacity>
          </ScrollView>
        </View>
        <FlatList
          data={[...filteredData].sort((a, b) => {
            const statusA = getCompetitionStatus(a.startDate, a.endDate);
            const statusB = getCompetitionStatus(b.startDate, b.endDate);
            return statusA.sortOrder - statusB.sortOrder;
          })}
          renderItem={renderCompetition}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>
                {activeFilter === FILTERS.ALL
                  ? 'Aucune compétition'
                  : activeFilter === FILTERS.PARTICIPATED
                  ? 'Aucune compétition à laquelle vous avez participé'
                  : activeFilter === FILTERS.ONGOING
                  ? 'Aucune compétition en cours'
                  : activeFilter === FILTERS.UPCOMING
                  ? 'Aucune compétition à venir'
                  : 'Aucune compétition terminée'}
              </Text>
              {activeFilter === FILTERS.ONGOING && (
                <Text style={styles.emptySubtext}>
                  Consultez les compétitions à venir pour vous inscrire.
                </Text>
              )}
              {activeFilter === FILTERS.UPCOMING && (
                <Text style={styles.emptySubtext}>
                  De nouvelles compétitions seront bientôt disponibles.
                </Text>
              )}
              {activeFilter === FILTERS.ENDED && (
                <Text style={styles.emptySubtext}>
                  Aucune compétition n'a encore été terminée.
                </Text>
              )}
              {activeFilter === FILTERS.PARTICIPATED && (
                <Text style={styles.emptySubtext}>
                  Vous n'avez pas encore participé à une compétition.
                </Text>
              )}
            </View>
          }
        />
      </View>
    </>
  );
}

const createStyles = (theme: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  filtersWrapper: {
    flexShrink: 0,
    flexGrow: 0,
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  filtersContainer: {
    flexShrink: 0,
    flexGrow: 0,
  },
  filtersContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    alignItems: 'flex-start',
    alignContent: 'flex-start',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.surfaceRaised,
    borderWidth: 1,
    borderColor: theme.border,
    marginRight: 8,
    minWidth: 'auto',
    width: 'auto',
    flexShrink: 0,
    flexGrow: 0,
  },
  filterButtonActive: {
    borderWidth: 1,
    backgroundColor: '#6b7280',
    borderColor: '#6b7280',
  },
  filterButtonOngoing: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  filterButtonUpcoming: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  filterButtonEnded: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.textMuted,
  },
  filterButtonTextActive: {
    color: theme.onAccent,
    fontWeight: '600',
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: theme.surface,
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
  cardWithCover: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  coverWrap: {
    width: 72,
    height: 72,
    marginRight: 12,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: theme.surfaceRaised,
  },
  cover: {
    width: 72,
    height: 72,
  },
  cardBody: {
    flex: 1,
    minWidth: 0,
  },
  cardBodyWithCover: {
    padding: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  badgesContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
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
    color: theme.onAccent,
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
  participatedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#fef3c7',
  },
  participatedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#92400e',
  },
  cardDate: {
    fontSize: 12,
    color: theme.textMuted,
    marginBottom: 4,
  },
  cardTeams: {
    fontSize: 12,
    color: theme.textMuted,
    marginBottom: 8,
  },
  moreInfoContainer: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  moreInfoText: {
    color: theme.accent,
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: theme.danger,
    fontSize: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.textMuted,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 20,
  },
});

