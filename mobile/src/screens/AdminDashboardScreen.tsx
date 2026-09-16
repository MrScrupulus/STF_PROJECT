import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { navigateToCompetitions } from '../navigation/rootNavigationRef';
import { adminService } from '../services/adminService';
import { formatDateTime } from '../utils/dateUtils';
import Header from '../components/Header';
import FaIcon, { type AppIconName } from '../components/FaIcon';
import { useThemeColors } from '../contexts/ThemeContext';
import { type ThemeColors } from '../theme';

export default function AdminDashboardScreen() {
  const theme = useThemeColors();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const [catchesPage, setCatchesPage] = useState(1);
  const [catchesPages, setCatchesPages] = useState(1);
  const [allCatches, setAllCatches] = useState<any[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const { data: pendingCatchesData, isLoading: loadingCatches } = useQuery({
    queryKey: ['admin-pending-catches', catchesPage],
    queryFn: () => adminService.getPendingCatches(catchesPage, 10),
  });

  useEffect(() => {
    if (pendingCatchesData) {
      if (catchesPage === 1) {
        setAllCatches(pendingCatchesData.catches || []);
      } else {
        setAllCatches((prev) => {
          const existingIds = new Set(prev.map((c) => c.id));
          const uniqueNew = (pendingCatchesData.catches || []).filter(
            (c: any) => !existingIds.has(c.id)
          );
          return [...prev, ...uniqueNew];
        });
        setIsLoadingMore(false);
      }
      setCatchesPages(pendingCatchesData.pages || 1);
    }
  }, [pendingCatchesData, catchesPage]);

  const loadMoreCatches = () => {
    if (catchesPage < catchesPages && !isLoadingMore) {
      setIsLoadingMore(true);
      setCatchesPage((prev) => prev + 1);
    }
  };

  const { data: competitions, isLoading: loadingCompetitions } = useQuery({
    queryKey: ['admin-competitions'],
    queryFn: () => adminService.getCompetitions(),
  });

  const validateMutation = useMutation({
    mutationFn: (catchId: number) => adminService.validateCatch(catchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-catches'] });
      Alert.alert('Succès', 'Prise validée avec succès.');
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        'Une erreur est survenue lors de la validation. Veuillez réessayer.';
      Alert.alert('Erreur', message);
    },
  });

  const handleValidate = (catchId: number) => {
    Alert.alert('Valider la prise', 'Êtes-vous sûr de vouloir valider cette prise ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Valider', onPress: () => validateMutation.mutate(catchId) },
    ]);
  };

  const handleReject = (catchId: number) => {
    (navigation as any).navigate('AdminCatchValidation', { catchId, action: 'reject' });
  };

  const handleViewCatch = (catchId: number) => {
    (navigation as any).navigate('AdminCatchValidation', { catchId, action: 'view' });
  };

  if (loadingCatches || loadingCompetitions) {
    return (
      <>
        <Header title="Dashboard Admin" showBack={true} showMenu={true} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      </>
    );
  }

  const pendingCount = pendingCatchesData?.total || allCatches.length;
  const competitionsCount = competitions?.length || 0;
  const now = new Date();
  const activeCompetitions =
    competitions?.filter((c: any) => {
      const start = new Date(c.startDate);
      const end = new Date(c.endDate);
      return now >= start && now <= end;
    }).length || 0;
  const endedCompetitions =
    competitions?.filter((c: any) => {
      const end = new Date(String(c.endDate).replace(' ', 'T'));
      return !Number.isNaN(end.getTime()) && end < now;
    }) || [];

  const tiles: { label: string; hint: string; icon: AppIconName; onPress: () => void }[] = [
    {
      label: 'Compétitions',
      hint: 'Toutes les manches',
      icon: 'trophy',
      onPress: navigateToCompetitions,
    },
    {
      label: 'Créer',
      hint: 'Nouvelle manche',
      icon: 'plus',
      onPress: () => (navigation as any).navigate('CreateCompetition'),
    },
    {
      label: 'Saisie',
      hint: 'Ajouter une prise',
      icon: 'camera',
      onPress: () => (navigation as any).navigate('AdminAddCatch'),
    },
    {
      label: 'Pénalités',
      hint: 'Points & motifs',
      icon: 'flag',
      onPress: () => (navigation as any).navigate('AdminPenalty'),
    },
  ];

  return (
    <>
      <Header title="Dashboard Admin" showBack={true} showMenu={true} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.identityCard}>
          <View style={styles.avatar}>
            <FaIcon name="key" size={22} color={theme.onAccent} />
          </View>
          <View style={styles.identityText}>
            <Text style={styles.displayName}>Administration</Text>
            <Text style={styles.identityHint}>Validation, compétitions et exports PDF</Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, styles.statIconPending]}>
              <FaIcon name="check" size={14} color={theme.success} />
            </View>
            <Text style={styles.statValue}>{pendingCount}</Text>
            <Text style={styles.statLabel}>En attente</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, styles.statIconComp]}>
              <FaIcon name="trophy" size={14} color={theme.accent} />
            </View>
            <Text style={styles.statValue}>{competitionsCount}</Text>
            <Text style={styles.statLabel}>Compétitions</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, styles.statIconLive]}>
              <FaIcon name="play" size={14} color="#FF9500" />
            </View>
            <Text style={styles.statValue}>{activeCompetitions}</Text>
            <Text style={styles.statLabel}>En cours</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Actions</Text>
        <View style={styles.grid}>
          {tiles.map((tile) => (
            <TouchableOpacity
              key={tile.label}
              style={styles.tile}
              onPress={tile.onPress}
              activeOpacity={0.75}
            >
              <View style={styles.tileIcon}>
                <FaIcon name={tile.icon} size={20} color={theme.accent} />
              </View>
              <Text style={styles.tileLabel}>{tile.label}</Text>
              <Text style={styles.tileHint}>{tile.hint}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Prises en attente</Text>
        {pendingCount === 0 ? (
          <View style={styles.emptyCard}>
            <FaIcon name="circleCheck" size={28} color={theme.success} />
            <Text style={styles.emptyText}>Aucune prise en attente</Text>
            <Text style={styles.emptySubtext}>Toutes les prises ont été traitées.</Text>
          </View>
        ) : (
          <FlatList
            data={allCatches}
            keyExtractor={(item: any) => item.id.toString()}
            renderItem={({ item: catchItem }: any) => (
              <TouchableOpacity
                style={styles.catchCard}
                onPress={() => handleViewCatch(catchItem.id)}
                activeOpacity={0.8}
              >
                <View style={styles.catchHeader}>
                  <Text style={styles.catchTitle}>
                    {catchItem.species?.name || 'Espèce inconnue'}
                  </Text>
                  <Text style={styles.catchSize}>{catchItem.size} cm</Text>
                </View>
                <Text style={styles.catchTeam}>Équipe : {catchItem.team?.name || 'N/A'}</Text>
                {catchItem.caughtBy ? (
                  <Text style={styles.catchMember}>
                    Pêché par : {catchItem.caughtBy.firstname} {catchItem.caughtBy.lastname}
                  </Text>
                ) : null}
                <Text style={styles.catchDate}>{formatDateTime(catchItem.createdAt)}</Text>
                <View style={styles.catchActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.validateButton]}
                    onPress={() => handleValidate(catchItem.id)}
                    disabled={validateMutation.isPending}
                  >
                    <FaIcon name="circleCheck" size={16} color={theme.onAccent} />
                    <Text style={styles.actionButtonText}>Valider</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() => handleReject(catchItem.id)}
                    disabled={validateMutation.isPending}
                  >
                    <FaIcon name="circleXmark" size={16} color={theme.onAccent} />
                    <Text style={styles.actionButtonText}>Rejeter</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            )}
            onEndReached={loadMoreCatches}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              isLoadingMore ? (
                <View style={styles.loadingMore}>
                  <ActivityIndicator size="small" color={theme.accent} />
                  <Text style={styles.loadingMoreText}>Chargement…</Text>
                </View>
              ) : null
            }
            scrollEnabled={false}
          />
        )}

        {endedCompetitions.length > 0 ? (
          <>
            <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>
              PDF des compétitions terminées
            </Text>
            <View style={styles.listCard}>
              {endedCompetitions.map((item: any, index: number) => (
                <View
                  key={item.id}
                  style={[
                    styles.listRow,
                    index === endedCompetitions.length - 1 && styles.listRowLast,
                  ]}
                >
                  <View style={styles.listIcon}>
                    <FaIcon name="trophy" size={16} color={theme.accent} />
                  </View>
                  <Text style={styles.endedName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <TouchableOpacity
                    style={styles.pdfIconButton}
                    onPress={async () => {
                      try {
                        await adminService.downloadCompetitionPdf(item.id, item.name);
                      } catch (err: any) {
                        Alert.alert(
                          'Erreur',
                          err?.message || 'Impossible de générer le PDF.'
                        );
                      }
                    }}
                  >
                    <FaIcon name="filePdf" size={20} color="#C41E3A" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>
    </>
  );
}

const createStyles = (theme: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  identityCard: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  identityText: {
    flex: 1,
  },
  displayName: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.text,
  },
  identityHint: {
    fontSize: 14,
    color: theme.textMuted,
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.surface,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  statIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statIconPending: {
    backgroundColor: '#E8F8ED',
  },
  statIconComp: {
    backgroundColor: theme.accentMuted,
  },
  statIconLive: {
    backgroundColor: '#FFF4E5',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: theme.textMuted,
    textAlign: 'center',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
    marginLeft: 4,
  },
  sectionTitleSpaced: {
    marginTop: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tile: {
    width: '48.5%',
    backgroundColor: theme.surface,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  tileIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  tileLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.text,
  },
  tileHint: {
    fontSize: 12,
    color: theme.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  emptyCard: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: theme.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  catchCard: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  catchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  catchTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.text,
    flex: 1,
    marginRight: 8,
  },
  catchSize: {
    fontSize: 16,
    color: theme.accent,
    fontWeight: '700',
  },
  catchTeam: {
    fontSize: 14,
    color: theme.textMuted,
    marginBottom: 4,
  },
  catchMember: {
    fontSize: 14,
    color: theme.textMuted,
    marginBottom: 4,
  },
  catchDate: {
    fontSize: 12,
    color: theme.textMuted,
    marginBottom: 12,
  },
  catchActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 10,
  },
  validateButton: {
    backgroundColor: theme.success,
  },
  rejectButton: {
    backgroundColor: theme.danger,
  },
  actionButtonText: {
    color: theme.onAccent,
    fontWeight: '700',
    fontSize: 14,
  },
  loadingMore: {
    paddingVertical: 12,
    alignItems: 'center',
    gap: 6,
  },
  loadingMoreText: {
    fontSize: 13,
    color: theme.textMuted,
  },
  listCard: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    overflow: 'hidden',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  listRowLast: {
    borderBottomWidth: 0,
  },
  listIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  endedName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: theme.text,
    marginRight: 8,
  },
  pdfIconButton: {
    padding: 8,
  },
});
