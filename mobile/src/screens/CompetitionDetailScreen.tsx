import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Image,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { competitionsService } from '../services/competitionsService';
import { teamService } from '../services/teamService';
import { authService } from '../services/authService';
import { adminService } from '../services/adminService';
import { formatDateTimeLocal, formatDateTime, formatCompetitionDateRange, parseApiDate } from '../utils/dateUtils';
import { getCompetitionLifecycleStatus } from '../utils/competitionStatus';
import { API_BASE_URL } from '../config/api';
import Header from '../components/Header';
import FaIcon from '../components/FaIcon';
import PerimeterMapView from '../components/PerimeterMapView';
import SpeciesPieChart from '../components/competition/SpeciesPieChart';
import CatchesTimelineChart from '../components/competition/CatchesTimelineChart';
import CatchesMapView from '../components/competition/CatchesMapView';
import ImageView from 'react-native-image-viewing';
import ZoomablePhotoViewer from '../components/ZoomablePhotoViewer';
import { resolvePhotoUri } from '../utils/photoUrl';
import { useThemeColors } from '../contexts/ThemeContext';
import { type ThemeColors } from '../theme';

export default function CompetitionDetailScreen({ route }: any) {
  const theme = useThemeColors();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { id } = route.params ?? {};
  const competitionId =
    typeof id === 'string' ? parseInt(id, 10) : typeof id === 'number' ? id : NaN;
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'myTeam' | 'reglement'>('info');
  const [showPauses, setShowPauses] = useState(false);
  const [showAllRanking, setShowAllRanking] = useState(false);
  const [showMoreStats, setShowMoreStats] = useState(false);
  const [showTop3, setShowTop3] = useState(false);
  const [reglementImageViewerVisible, setReglementImageViewerVisible] = useState(false);
  const [reglementImageViewerIndex, setReglementImageViewerIndex] = useState(0);
  const [pdfDownloading, setPdfDownloading] = useState(false);
  const [myTeamPhoto, setMyTeamPhoto] = useState<string | null>(null);

  const { data: competitionResponse, isLoading, isError, error } = useQuery({
    queryKey: ['competition', competitionId],
    queryFn: () => competitionsService.getOne(competitionId),
    enabled: Number.isFinite(competitionId) && competitionId > 0,
    refetchInterval: 20000,
  });

  const competition = (competitionResponse as any)?.success !== undefined
    ? ((competitionResponse as any).success ? { ...(competitionResponse as any), success: undefined } : null)
    : competitionResponse;

  const { data: myTeamsData } = useQuery({
    queryKey: ['my-teams'],
    queryFn: () => teamService.getMyTeams(),
  });

  const myCompetitionTeamId = React.useMemo(() => {
    const fromApi = (competition as any)?.myTeamId;
    if (fromApi) return fromApi;
    const uid = currentUser?.id;
    const teams = (competition as any)?.teams;
    if (!uid || !Array.isArray(teams)) return null;
    const t = teams.find((team: any) =>
      (team.members || team.archivedMembers)?.some((m: any) => m.id === uid)
    );
    return t?.id ?? null;
  }, [(competition as any)?.myTeamId, (competition as any)?.teams, currentUser?.id]);

  const { data: myTeamResponse, isLoading: loadingMyTeam } = useQuery({
    queryKey: ['team', myCompetitionTeamId],
    queryFn: () => teamService.getOne(myCompetitionTeamId as number),
    enabled: !!myCompetitionTeamId,
  });
  const myTeamDetail = myTeamResponse?.team;

  const speciesData = competition?.species && competition.species.length > 0
    ? competition.species
    : null;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userResponse = await authService.getCurrentUser();
        if (userResponse.success && userResponse.user) {
          setCurrentUser(userResponse.user);
          setIsAdmin(userResponse.user.roles?.includes('ROLE_ADMIN') || false);
        }
      } catch (error: any) {
        const res = error.response;
        console.error('Error fetching user:', {
          status: res?.status,
          data: res?.data,
          url: API_BASE_URL + '/api/auth/me',
        });
      }
    };
    fetchUser();
  }, []);

  // Charger les stats au montage et quand les dépendances changent
  useEffect(() => {
    if (!competition) return;
    // Le classement est visible si : classement public OU admin
    // (Si l'admin publie le classement, il est visible même si la compétition n'est pas terminée)
    const rankingVisible = competition.isRankingPublic || isAdmin;
    if (!rankingVisible) return;
    if (loadingStats) return; // Éviter les appels multiples simultanés

    const loadStats = async () => {
      setLoadingStats(true);
      try {
        const response = await competitionsService.getPublicStats(competitionId);
        if (response.success && response.stats) {
          setStats(response.stats);
        }
      } catch (error) {
        console.error('Error loading stats:', error);
        // Ne pas afficher d'erreur si c'est juste que les stats ne sont pas disponibles
        if ((error as any)?.response?.status !== 403) {
          // Seulement logger les autres erreurs
        }
      } finally {
        setLoadingStats(false);
      }
    };

    loadStats();
  }, [competition?.isRankingPublic, competition?.endDate, isAdmin, competitionId]);

  // Recharger les stats quand l'écran est focus (quand on revient dessus)
  // Utiliser un ref pour éviter les appels multiples
  const lastFocusTime = React.useRef<number>(0);
  const isLoadingRef = React.useRef<boolean>(false);
  
  // Synchroniser le ref avec l'état
  useEffect(() => {
    isLoadingRef.current = loadingStats;
  }, [loadingStats]);
  
  useFocusEffect(
    React.useCallback(() => {
      if (!competition) return;
      const rankingVisible = competition.isRankingPublic || isAdmin;
      if (!rankingVisible) return;
      if (isLoadingRef.current) return; // Éviter les appels multiples simultanés
      
      // Éviter les appels trop fréquents (minimum 2 secondes entre les appels)
      const now = Date.now();
      if (now - lastFocusTime.current < 2000) return;
      lastFocusTime.current = now;

      // Invalider les requêtes pour forcer le rafraîchissement
      queryClient.invalidateQueries({ queryKey: ['competition', competitionId] });
      
      // Recharger les stats seulement si on n'est pas déjà en train de charger
      if (!isLoadingRef.current) {
        isLoadingRef.current = true;
        setLoadingStats(true);
        
        const loadStats = async () => {
          try {
            const response = await competitionsService.getPublicStats(competitionId);
            if (response.success && response.stats) {
              setStats(response.stats);
            }
          } catch (error: any) {
            // Ne pas logger les erreurs 403 (stats non disponibles) car c'est normal
            if (error?.response?.status !== 403 && error?.message !== 'Network Error') {
              console.error('Error loading stats:', error);
            }
          } finally {
            setLoadingStats(false);
            isLoadingRef.current = false;
          }
        };

        loadStats();
      }
    }, [competitionId, competition?.isRankingPublic, isAdmin, queryClient])
  );


  const unregisterMutation = useMutation({
    mutationFn: () => competitionsService.unregisterFromCompetition(competitionId),
    onSuccess: () => {
      Alert.alert('Succès', 'Vous avez quitté la compétition avec succès');
      queryClient.invalidateQueries({ queryKey: ['competition', competitionId] });
      queryClient.invalidateQueries({ queryKey: ['competitions'] });
      queryClient.invalidateQueries({ queryKey: ['my-teams'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Une erreur est survenue lors de la désinscription. Veuillez réessayer.';
      Alert.alert('Erreur', message);
    },
  });

  const registerMutation = useMutation({
    mutationFn: ({ teamId, competitionId }: { teamId: number; competitionId: number }) =>
      teamService.registerToCompetition(teamId, competitionId),
    onSuccess: () => {
      // Invalider toutes les requêtes liées pour forcer le rafraîchissement
      queryClient.invalidateQueries({ queryKey: ['competition', competitionId] });
      queryClient.invalidateQueries({ queryKey: ['my-teams'] });
      queryClient.invalidateQueries({ queryKey: ['competitions'] });
      Alert.alert('Succès', 'Équipe inscrite à la compétition avec succès.');
      setShowRegisterForm(false);
      setSelectedTeamId(null);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Une erreur est survenue lors de l\'inscription. Veuillez réessayer.';
      Alert.alert('Erreur', message);
    },
  });

  // Mutation pour créer une équipe individuelle
  const createIndividualTeamMutation = useMutation({
    mutationFn: async () => {
      const currentUser = await authService.getCurrentUser();
      const teamName = currentUser?.user?.firstname && currentUser?.user?.lastname
        ? `${currentUser.user.firstname} ${currentUser.user.lastname}`.trim()
        : 'Mon équipe';
      return teamService.create({ name: teamName });
    },
    onSuccess: (response: any) => {
      // Invalider les requêtes pour que la nouvelle équipe soit visible
      queryClient.invalidateQueries({ queryKey: ['my-teams'] });
      // Après création de l'équipe, inscrire directement à la compétition
      if (response.team?.id) {
        registerMutation.mutate({ teamId: response.team.id, competitionId: competitionId });
      } else {
        Alert.alert('Erreur', 'Une erreur est survenue lors de la création de l\'équipe. Veuillez réessayer.');
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Une erreur est survenue lors de la création de l\'équipe. Veuillez réessayer.';
      Alert.alert('Erreur', message);
    },
  });

  // Mutation pour mettre en pause/reprendre
  const pauseMutation = useMutation({
    mutationFn: (isPaused: boolean) => adminService.togglePause(competitionId, isPaused),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competition', competitionId] });
      const comp = competition as any;
      Alert.alert('Succès', comp?.isPaused ? 'Compétition reprise' : 'Compétition mise en pause');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Une erreur est survenue lors de la modification. Veuillez réessayer.';
      Alert.alert('Erreur', message);
    },
  });

  // Mutation pour publier/masquer le classement
  const rankingMutation = useMutation({
    mutationFn: (isPublic: boolean) =>
      adminService.updateCompetition(competitionId, { isRankingPublic: isPublic }),
    onSuccess: (_data, isPublic) => {
      queryClient.invalidateQueries({ queryKey: ['competition', competitionId] });
      Alert.alert(
        'Succès',
        isPublic
          ? 'Le classement est maintenant public et visible par tous'
          : 'Le classement est maintenant privé et visible uniquement par les administrateurs'
      );
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Une erreur est survenue lors de la publication du classement. Veuillez réessayer.';
      Alert.alert('Erreur', message);
    },
  });

  const handleTogglePause = () => {
    const comp = competition as any;
    const newPauseState = !comp?.isPaused;
    Alert.alert(
      newPauseState ? 'Mettre en pause' : 'Reprendre',
      `Êtes-vous sûr de vouloir ${newPauseState ? 'mettre en pause' : 'reprendre'} cette compétition ?\n\n${newPauseState ? 'Aucune prise ne pourra être ajoutée pendant la pause.' : 'Les prises pourront à nouveau être ajoutées.'}`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: newPauseState ? 'Mettre en pause' : 'Reprendre',
          onPress: () => pauseMutation.mutate(newPauseState),
        },
      ]
    );
  };

  if (!Number.isFinite(competitionId) || competitionId <= 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Identifiant de compétition invalide</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  if (isError) {
    const status = (error as any)?.response?.status;
    const msg =
      (error as any)?.response?.data?.message ||
      (error as any)?.message;
    const hint =
      status === 404
        ? 'Compétition non trouvée'
        : status === 401
          ? 'Session expirée : reconnectez-vous.'
          : status === 403
            ? (msg ?? 'Accès refusé')
            : msg ?? 'Impossible de charger cette compétition';
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{hint}</Text>
      </View>
    );
  }

  if (!competition) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Compétition non trouvée</Text>
      </View>
    );
  }

  const myTeams = (myTeamsData?.teams || []).filter((team: any) => !team.isPersonalJournal);
  
  // Date actuelle pour les comparaisons
  const now = new Date();
  
  // Équipes encore libres (une équipe figée reste collée à sa manche)
  
  const availableTeams = myTeams.filter((team: any) => !team.competition);
  
  // Vérifier si déjà inscrit à cette compétition spécifique (et que la compétition est active)
  const isAlreadyRegistered = myTeams.some((team: any) => {
    if (!team.competition) return false;
    
    // Vérifier uniquement si l'équipe est inscrite à CETTE compétition spécifique
    if (team.competition.id === competition.id) {
      const teamCompetitionEndDate = parseApiDate(team.competition.endDate);
      if (!teamCompetitionEndDate) return false;
      return teamCompetitionEndDate >= now;
    }
    
    return false;
  });

  // Vérifier si l'utilisateur a une équipe inscrite à une autre compétition active
  // (pour empêcher l'inscription à plusieurs compétitions simultanées)
  const hasActiveCompetition = myTeams.some((team: any) => {
    if (!team.competition) return false;
    
    // Si l'équipe est inscrite à une autre compétition (pas celle-ci), vérifier qu'elle est active
    if (team.competition.id !== competition.id) {
      const otherCompetitionEndDate = parseApiDate(team.competition.endDate);
      if (!otherCompetitionEndDate) return false;
      return otherCompetitionEndDate >= now;
    }
    
    return false;
  });
  
  const hasAvailableTeams = availableTeams.length > 0;
  const competitionEndDate = parseApiDate(competition.endDate);
  const competitionStartDate = parseApiDate(competition.startDate);
  const isEnded = (competition as any).isEnded || (competitionEndDate !== null && competitionEndDate < now);
  const hasNotStarted = competitionStartDate !== null && now < competitionStartDate;
  // Vérifier si c'est une compétition individuelle (teamSize === 1)
  const isIndividualCompetition = (competition as any)?.teamSize === 1;
  // On ne peut s'inscrire que si :
  // - La compétition n'est pas terminée
  // - On n'est pas déjà inscrit à cette compétition
  // - On n'a pas d'autre compétition active (sauf si c'est une compétition individuelle)
  // - On a des équipes disponibles OU c'est une compétition individuelle
  const canRegister = !isEnded && !isAlreadyRegistered && !hasActiveCompetition && (hasAvailableTeams || isIndividualCompetition);
  
  // Fonction pour déterminer le statut de la compétition
  const getCompetitionStatus = () => {
    const status = getCompetitionLifecycleStatus(
      competition.startDate,
      competition.endDate,
      (competition as any).isPaused
    );
    const styleMap = {
      upcoming: styles.statusUpcoming,
      ongoing: styles.statusOngoing,
      paused: styles.statusPaused,
      ended: styles.statusEnded,
    };
    return { ...status, style: styleMap[status.key] };
  };
  
  const status = getCompetitionStatus();

  const handleRegister = () => {
    if (!selectedTeamId) {
      Alert.alert('Erreur', 'Veuillez sélectionner une équipe');
      return;
    }
    registerMutation.mutate({ teamId: selectedTeamId, competitionId: competitionId });
  };

  const handleRegisterClick = () => {
    // Pour les compétitions individuelles, créer automatiquement une équipe si nécessaire
    if (isIndividualCompetition && !hasAvailableTeams) {
      createIndividualTeamMutation.mutate();
      return;
    }
    // Sinon, afficher le formulaire de sélection
    setShowRegisterForm(true);
  };

  const teamsToShow = competition.teams || [];
  const sortedTeams = [...teamsToShow].sort((a: any, b: any) =>
    (b.totalScore || 0) - (a.totalScore || 0)
  );
  const userTeamIndex = currentUser
    ? sortedTeams.findIndex((t: any) => t.members?.some((m: any) => m.id === currentUser.id))
    : -1;
  const rankingVisible = competition.isRankingPublic || isAdmin;
  const displayedTeams = (() => {
    if (!rankingVisible) {
      if (userTeamIndex >= 0) {
        return [{ team: sortedTeams[userTeamIndex], rank: userTeamIndex + 1 }];
      }
      return [];
    }
    if (showAllRanking) return sortedTeams.map((t: any, i: number) => ({ team: t, rank: i + 1 }));
    const top5 = sortedTeams.slice(0, 5).map((t: any, i: number) => ({ team: t, rank: i + 1 }));
    const userInTop5 = userTeamIndex >= 0 && userTeamIndex < 5;
    if (userInTop5) return top5;
    if (userTeamIndex >= 0) return [...top5, { team: sortedTeams[userTeamIndex], rank: userTeamIndex + 1 }];
    return top5;
  })();

  return (
    <>
      <Header title={competition.name} showBack={true} showMenu={true} />
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Text style={styles.date}>
              {formatCompetitionDateRange(competition.startDate, competition.endDate)}
            </Text>
            <View style={styles.badgesContainer}>
              {competition.isRegistered && !status.isEnded && (
                <View style={styles.registeredBadge}>
                  <Text style={styles.registeredBadgeText}>✓ Inscrit</Text>
                </View>
              )}
              {competition.isRegistered && status.isEnded && (
                <View style={styles.participatedBadge}>
                  <Text style={styles.participatedBadgeText}>✓ Participé</Text>
                </View>
              )}
              <View style={[styles.statusBadge, status.style]}>
                <Text style={styles.statusBadgeText}>{status.text}</Text>
              </View>
            </View>
          </View>

        {competition.description && (
          <Text style={styles.description}>{competition.description}</Text>
        )}

        {/* Onglets */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'info' && styles.tabActive]}
            onPress={() => setActiveTab('info')}
          >
            <Text style={[styles.tabText, activeTab === 'info' && styles.tabTextActive]}>
              Infos
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'myTeam' && styles.tabActive]}
            onPress={() => setActiveTab('myTeam')}
          >
            <Text style={[styles.tabText, activeTab === 'myTeam' && styles.tabTextActive]}>
              Mon équipe
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'reglement' && styles.tabActive]}
            onPress={() => setActiveTab('reglement')}
          >
            <Text style={[styles.tabText, activeTab === 'reglement' && styles.tabTextActive]}>
              Règlement
            </Text>
          </TouchableOpacity>
        </View>

        {/* Contenu selon l'onglet actif */}
        {activeTab === 'reglement' ? (
          <View style={styles.speciesTabContent}>
            <Text style={styles.sectionTitle}>Règles et barème</Text>
            <Text style={styles.rulesIntro}>
              Paramètres définis par l&apos;organisateur (système de score et options de la compétition).
            </Text>
            <View style={styles.rulesCard}>
              <View style={styles.ruleRow}>
                <Text style={styles.ruleLabel}>Équipes</Text>
                <Text style={styles.ruleValue}>
                  {(competition as any).teamSize ?? '—'} membre(s) par équipe
                </Text>
              </View>
              <View style={styles.ruleRow}>
                <Text style={styles.ruleLabel}>Participants</Text>
                <Text style={styles.ruleValue}>
                  {(competition as any).hasNoLimit
                    ? 'Pas de limite d’équipes / inscriptions'
                    : `Maximum ${(competition as any).maxParticipants ?? '—'} participants (équipes)`}
                </Text>
              </View>
              <View style={styles.ruleRow}>
                <Text style={styles.ruleLabel}>Prises comptées au score</Text>
                <Text style={styles.ruleValue}>
                  {(competition as any).maxFishCounted != null &&
                  (competition as any).maxFishCounted !== ''
                    ? `Les ${(competition as any).maxFishCounted} meilleures prises (par points) par équipe`
                    : 'Toutes les prises validées (classement par points selon barème espèces)'}
                </Text>
              </View>
              <View style={styles.ruleRow}>
                <Text style={styles.ruleLabel}>Bonus « nouvelle espèce »</Text>
                <Text style={styles.ruleValue}>
                  {(competition as any).newSpeciesBonusEnabled
                    ? `Oui — +${(competition as any).newSpeciesBonusPoints ?? '—'} pts par nouvelle espèce dans la manche`
                    : 'Non'}
                </Text>
              </View>
              <View style={styles.ruleRow}>
                <Text style={styles.ruleLabel}>Bonus quota atteint</Text>
                <Text style={styles.ruleValue}>
                  {(competition as any).quotaBonusEnabled
                    ? 'Oui — montant défini pour chaque espèce dotée d’un quota'
                    : 'Non'}
                </Text>
              </View>
              {(competition as any).isBonusEnabled ? (
                <View style={styles.ruleRow}>
                  <Text style={styles.ruleLabel}>Points bonus par espèce</Text>
                  <Text style={styles.ruleValue}>
                    Activé — certaines espèces ont des points de base bonus (voir le détail ci-dessous).
                  </Text>
                </View>
              ) : null}
            </View>

            {speciesData && speciesData.length > 0 ? (
              <>
                <Text style={[styles.sectionTitle, styles.rulesSubTitle]}>Barème des espèces</Text>
                <View style={styles.rulesCard}>
                  {speciesData.map((s: any) => (
                    <View key={s.id} style={styles.ruleSpeciesBlock}>
                      <Text style={styles.ruleSpeciesName}>{s.name}</Text>
                      <Text style={styles.ruleSpeciesDetail}>
                        Coefficient ×{s.coefficient}
                        {s.quota != null && s.quota !== '' ? ` · Quota : ${s.quota} prise(s) max comptées` : ''}
                        {(competition as any).quotaBonusEnabled &&
                        s.quota != null &&
                        s.quota !== '' &&
                        s.quotaBonusPoints != null &&
                        s.quotaBonusPoints !== ''
                          ? ` · Bonus si quota atteint : +${s.quotaBonusPoints} pts`
                          : ''}
                        {s.basePoints != null && Number(s.basePoints) > 0
                          ? ` · Bonus espèce : +${s.basePoints} pts`
                          : ''}
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            ) : null}

            <Text style={[styles.sectionTitle, styles.rulesSubTitle]}>Règlement complémentaire</Text>
            <Text style={styles.rulesIntro}>
              Texte libre et éventuelles images ajoutés par l&apos;organisateur.
            </Text>
            {(() => {
              const imageUrls = ((competition as any).reglementImageUrls?.length > 0)
                ? (competition as any).reglementImageUrls
                : (competition as any).reglementImageUrl
                  ? [(competition as any).reglementImageUrl]
                  : [];
              const imageSources = imageUrls.map((url: string) => ({ uri: url }));
              return imageUrls.length > 0 ? (
                <>
                  {imageUrls.map((url: string, idx: number) => (
                    <TouchableOpacity
                      key={idx}
                      activeOpacity={0.9}
                      onPress={() => {
                        setReglementImageViewerIndex(idx);
                        setReglementImageViewerVisible(true);
                      }}
                    >
                      <Image
                        source={{ uri: url }}
                        style={{ width: '100%', height: 300, resizeMode: 'contain', marginBottom: 16 }}
                      />
                    </TouchableOpacity>
                  ))}
                  <ImageView
                    images={imageSources}
                    imageIndex={reglementImageViewerIndex}
                    visible={reglementImageViewerVisible}
                    onRequestClose={() => setReglementImageViewerVisible(false)}
                  />
                  {(competition as any).reglement ? (
                    <Text style={styles.reglementText}>{(competition as any).reglement}</Text>
                  ) : null}
                </>
              ) : (competition as any).reglement ? (
                <Text style={styles.reglementText}>{(competition as any).reglement}</Text>
              ) : (
                <Text style={styles.emptyText}>
                  Aucun texte ni image complémentaire — les règles officielles figurent ci-dessus.
                </Text>
              );
            })()}
          </View>
        ) : activeTab === 'myTeam' ? (
          <View style={styles.speciesTabContent}>
            {!myCompetitionTeamId ? (
              <Text style={styles.emptyText}>
                Vous n&apos;êtes pas inscrit à cette compétition. Inscrivez votre équipe depuis l&apos;onglet Infos.
              </Text>
            ) : loadingMyTeam ? (
              <ActivityIndicator size="large" color={theme.accent} style={{ marginTop: 32 }} />
            ) : myTeamDetail ? (
              (() => {
                const validatedOfficialCatches = (myTeamDetail.catches || []).filter(
                  (c: any) => c.isValidated && !c.rejectionReason
                );
                const speciesCountById = new Map<number, { id: number; name: string; count: number }>();
                for (const c of validatedOfficialCatches) {
                  if (!c.species?.id) continue;
                  const prev = speciesCountById.get(c.species.id);
                  if (prev) prev.count += 1;
                  else speciesCountById.set(c.species.id, { id: c.species.id, name: c.species.name, count: 1 });
                }
                const speciesStats = Array.from(speciesCountById.values());
                const catchesForMap = validatedOfficialCatches.map((c: any) => ({
                  ...c,
                  team: myTeamDetail.name ? { name: myTeamDetail.name } : undefined,
                }));
                const roster =
                  (myTeamDetail.archivedMembers && myTeamDetail.archivedMembers.length > 0)
                    ? myTeamDetail.archivedMembers
                    : (myTeamDetail.members || []);
                const memberScores = roster.map((m: any) => {
                  const mine = validatedOfficialCatches.filter((c: any) => c.caughtBy?.id === m.id);
                  return {
                    id: m.id,
                    name: `${m.firstname || ''} ${m.lastname || ''}`.trim() || 'Membre',
                    catchCount: mine.length,
                    points: mine.reduce((sum: number, c: any) => sum + (Number(c.points) || 0), 0),
                  };
                });
                return (
              <>
                <Text style={styles.sectionTitle}>{myTeamDetail.name}</Text>
                {myTeamDetail.registrationNumber ? (
                  <Text style={styles.infoText}>N° {myTeamDetail.registrationNumber}</Text>
                ) : null}
                <View style={styles.myTeamScoreRow}>
                  <View style={styles.myTeamScoreCard}>
                    <Text style={styles.myTeamScoreLabel}>Score équipe</Text>
                    <Text style={styles.myTeamScoreValue}>{myTeamDetail.totalScore || 0} pts</Text>
                  </View>
                  <View style={styles.myTeamScoreCard}>
                    <Text style={styles.myTeamScoreLabel}>Prises validées</Text>
                    <Text style={styles.myTeamScoreValue}>{validatedOfficialCatches.length}</Text>
                  </View>
                </View>
                {memberScores.length > 0 ? (
                  <View style={styles.myTeamMembersBlock}>
                    {memberScores.map((m: any) => (
                      <View key={m.id} style={styles.myTeamMemberRow}>
                        <Text style={styles.myTeamMemberName}>{m.name}</Text>
                        <Text style={styles.myTeamMemberMeta}>
                          {m.points} pts · {m.catchCount} prise{m.catchCount > 1 ? 's' : ''}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : null}

                <Text style={styles.sectionTitle}>Statistiques de l&apos;équipe</Text>
                {validatedOfficialCatches.length === 0 ? (
                  <Text style={styles.emptyText}>
                    Les cartes, le camembert et la chronologie apparaissent dès qu’une prise est validée.
                  </Text>
                ) : (
                  <>
                    {catchesForMap.length > 0 ? (
                      <CatchesMapView
                        catches={catchesForMap}
                        speciesStats={speciesStats}
                        height={280}
                      />
                    ) : null}
                    {speciesStats.length > 0 ? (
                      <SpeciesPieChart speciesStats={speciesStats} />
                    ) : null}
                    {catchesForMap.length > 0 ? (
                      <CatchesTimelineChart
                        catches={catchesForMap}
                        startDate={myTeamDetail.competition?.startDate || competition.startDate}
                        endDate={myTeamDetail.competition?.endDate || competition.endDate}
                        speciesStats={speciesStats}
                      />
                    ) : null}
                  </>
                )}

                <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Prises</Text>
                {(myTeamDetail.catches || []).length === 0 ? (
                  <Text style={styles.emptyText}>Aucune prise pour le moment.</Text>
                ) : (
                  (myTeamDetail.catches || []).map((c: any) => (
                    <View key={c.id} style={styles.myTeamCatchRow}>
                      {c.photoUrl ? (
                        <TouchableOpacity
                          onPress={() => setMyTeamPhoto(resolvePhotoUri(c.photoUrl))}
                        >
                          <Image
                            source={{ uri: resolvePhotoUri(c.photoUrl) ?? '' }}
                            style={styles.myTeamCatchPhoto}
                            resizeMode="cover"
                          />
                        </TouchableOpacity>
                      ) : null}
                      <Text style={styles.myTeamCatchName}>{c.species?.name || 'Prise'}</Text>
                      <Text style={styles.myTeamCatchMeta}>
                        {c.size != null ? `${c.size} cm` : ''}
                        {c.points != null ? ` · ${c.points} pts` : ''}
                        {c.caughtBy ? ` · ${c.caughtBy.firstname}` : ''}
                      </Text>
                      {c.createdAt ? (
                        <Text style={styles.myTeamCatchMeta}>{formatDateTime(c.createdAt)}</Text>
                      ) : null}
                    </View>
                  ))
                )}
                <ZoomablePhotoViewer
                  uri={myTeamPhoto}
                  visible={!!myTeamPhoto}
                  onClose={() => setMyTeamPhoto(null)}
                />
              </>
                );
              })()
            ) : (
              <Text style={styles.emptyText}>Impossible de charger votre équipe.</Text>
            )}
          </View>
        ) : (
          <View>
            <View style={styles.infoSection}>
          <Text style={styles.infoText}>
            Taille d'équipe: {(competition as any).teamSize} membre(s)
          </Text>
          <Text style={styles.infoText}>
            Équipes inscrites:{' '}
            {(competition as any).enrolledTeamsCount ?? competition.teams?.length ?? 0}
          </Text>
          {(competition as any).isPaused && (
            <View style={styles.pausedBadge}>
              <FaIcon name="pause" size={16} color={theme.onAccent} />
              <Text style={styles.pausedText}>Compétition en pause</Text>
            </View>
          )}
        </View>

        {/* Affichage des périmètres */}
        {competition.perimeters && competition.perimeters.length > 0 && (
          <View style={styles.perimeterSection}>
            <PerimeterMapView perimeters={competition.perimeters} height={250} />
          </View>
        )}

        {/* Actions admin */}
        {isAdmin && (
          <View style={styles.adminActions}>
            {/* Tant que la manche n'est pas terminée : accès édition (y compris zones), pas seulement avant le coup d'envoi */}
            {!isEnded && (
              <TouchableOpacity
                style={[styles.adminButton, styles.editButton]}
                onPress={() => (navigation as any).navigate('EditCompetition', { id: competition.id })}
              >
                <Text style={styles.adminButtonText}>Modifier la compétition</Text>
              </TouchableOpacity>
            )}
            {!isEnded && (
              <TouchableOpacity
                style={[
                  styles.adminButton,
                  (competition as any).isPaused ? styles.resumeButton : styles.pauseButton,
                ]}
                onPress={handleTogglePause}
                disabled={pauseMutation.isPending}
              >
                <Text style={styles.adminButtonText}>
                  {pauseMutation.isPending
                    ? '...'
                    : (competition as any).isPaused
                    ? 'Reprendre la compétition'
                    : 'Mettre en pause'}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.adminButton,
                (competition as any).isRankingPublic ? styles.rankingPublicButton : styles.rankingPrivateButton,
              ]}
              onPress={() => {
                const comp = competition as any;
                const newValue = !comp?.isRankingPublic;
                Alert.alert(
                  newValue ? 'Publier le classement' : 'Masquer le classement',
                  newValue
                    ? 'Le classement sera visible par tous les utilisateurs. Continuer ?'
                    : 'Le classement sera visible uniquement par les administrateurs. Continuer ?',
                  [
                    { text: 'Annuler', style: 'cancel' },
                    {
                      text: newValue ? 'Publier' : 'Masquer',
                      onPress: () => rankingMutation.mutate(newValue),
                    },
                  ]
                );
              }}
              disabled={rankingMutation.isPending}
            >
              <Text style={styles.adminButtonText}>
                {rankingMutation.isPending
                  ? '...'
                  : (competition as any).isRankingPublic
                  ? 'Masquer le classement'
                  : 'Publier le classement'}
              </Text>
            </TouchableOpacity>
            {isEnded && (
              <TouchableOpacity
                style={[styles.adminButton, styles.pdfButton]}
                onPress={async () => {
                  try {
                    setPdfDownloading(true);
                    await adminService.downloadCompetitionPdf(competition.id, competition.name);
                  } catch (err: any) {
                    Alert.alert('Erreur', err?.message || 'Impossible de générer le PDF.');
                  } finally {
                    setPdfDownloading(false);
                  }
                }}
                disabled={pdfDownloading}
              >
                <View style={styles.pdfButtonInner}>
                  <FaIcon name="filePdf" size={18} color={theme.onAccent} />
                  <Text style={styles.adminButtonText}>
                    {pdfDownloading ? 'Génération…' : 'PDF classement & stats'}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Pauses programmées - masqué si compétition terminée */}
        {!isEnded && (competition as any).scheduledPauses && (competition as any).scheduledPauses.length > 0 && (
          <View style={styles.scheduledPausesSection}>
            <TouchableOpacity
              style={styles.pauseToggleButton}
              onPress={() => setShowPauses(!showPauses)}
              activeOpacity={0.7}
            >
              <FaIcon name="clock" size={16} color={theme.text} />
              <Text style={styles.pauseToggleButtonText}>
                {showPauses ? 'Masquer les pauses' : 'Afficher les pauses'}
              </Text>
            </TouchableOpacity>
            {showPauses &&
              (competition as any).scheduledPauses.map((pause: any) => {
              const now = new Date();
              const startDate = new Date(pause.startDate.replace(' ', 'T'));
              const endDate = new Date(pause.endDate.replace(' ', 'T'));
              const isActive = now >= startDate && now <= endDate;

              return (
                <View key={pause.id} style={styles.pauseCard}>
                  <View style={styles.pauseHeader}>
                    <Text style={styles.pauseDates}>
                      {formatDateTimeLocal(pause.startDate)} - {formatDateTimeLocal(pause.endDate)}
                    </Text>
                    {isActive && (
                      <View style={styles.activeBadge}>
                        <Text style={styles.activeBadgeText}>En cours</Text>
                      </View>
                    )}
                  </View>
                  {pause.reason && (
                    <Text style={styles.pauseReason}>{pause.reason}</Text>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Inscription */}
        {!showRegisterForm ? (
          <View style={styles.actionsSection}>
            {isAlreadyRegistered ? (
              <View style={styles.alreadyRegistered}>
                <Text style={styles.alreadyRegisteredText}>
                  ✓ Vous êtes déjà inscrit à cette compétition
                </Text>
                {/* Afficher le bouton "quitter" uniquement si la compétition est à venir (pas encore commencée) */}
                {status.text === 'À venir' && competition.startDate && new Date(competition.startDate) > now && (
                  <TouchableOpacity
                    style={[styles.unregisterButton, unregisterMutation.isPending && styles.unregisterButtonDisabled]}
                    onPress={() => {
                      Alert.alert(
                        'Quitter la compétition',
                        'Êtes-vous sûr de vouloir quitter cette compétition ?',
                        [
                          { text: 'Annuler', style: 'cancel' },
                          {
                            text: 'Quitter',
                            style: 'destructive',
                            onPress: () => unregisterMutation.mutate(),
                          },
                        ]
                      );
                    }}
                    disabled={unregisterMutation.isPending}
                  >
                    <Text style={styles.unregisterButtonText}>
                      {unregisterMutation.isPending ? 'Désinscription...' : 'Quitter la compétition'}
                    </Text>
                  </TouchableOpacity>
                )}
                {status.text !== 'À venir' && (
                  <Text style={[styles.alreadyRegisteredText, { marginTop: 8, fontSize: 12, color: theme.textMuted }]}>
                    Vous ne pouvez quitter que les compétitions à venir.
                  </Text>
                )}
              </View>
            ) : hasActiveCompetition ? (
              <View style={styles.noTeams}>
                <Text style={styles.noTeamsText}>
                  Vous êtes déjà inscrit à une autre compétition active. Vous ne pouvez pas vous inscrire à plusieurs compétitions simultanément.
                </Text>
              </View>
            ) : canRegister ? (
              <TouchableOpacity
                style={styles.registerButton}
                onPress={handleRegisterClick}
                disabled={createIndividualTeamMutation.isPending || registerMutation.isPending}
              >
                <Text style={styles.registerButtonText}>
                  {createIndividualTeamMutation.isPending || registerMutation.isPending
                    ? 'Inscription...'
                    : isIndividualCompetition ? "S'inscrire" : 'Inscrire mon équipe'}
                </Text>
              </TouchableOpacity>
            ) : !hasAvailableTeams && !isEnded ? (
              <View style={styles.noTeams}>
                {isIndividualCompetition ? (
                  <>
                    <Text style={styles.noTeamsText}>
                      Vous pouvez vous inscrire directement à cette compétition individuelle.
                    </Text>
                    <TouchableOpacity
                      style={styles.registerButton}
                      onPress={handleRegisterClick}
                      disabled={createIndividualTeamMutation.isPending || registerMutation.isPending}
                    >
                      <Text style={styles.registerButtonText}>
                        {createIndividualTeamMutation.isPending || registerMutation.isPending
                          ? 'Inscription...'
                          : "S'inscrire"}
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <Text style={styles.noTeamsText}>
                      Vous n'avez pas d'équipe disponible
                    </Text>
                    <TouchableOpacity
                      style={styles.createTeamButton}
                      onPress={() => navigation.navigate('CreateTeam' as never)}
                    >
                      <Text style={styles.createTeamButtonText}>
                        Créer une équipe
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            ) : isEnded ? (
              <Text style={styles.endedText}>
                Cette compétition est terminée
              </Text>
            ) : null}
          </View>
        ) : (
          <View style={styles.registerForm}>
            <Text style={styles.registerFormTitle}>
              Inscrire une équipe à cette compétition
            </Text>
            {hasAvailableTeams ? (
              <>
                <Text style={styles.label}>Sélectionnez votre équipe:</Text>
                {availableTeams.map((team: any) => (
                  <TouchableOpacity
                    key={team.id}
                    style={[
                      styles.teamOption,
                      selectedTeamId === team.id && styles.teamOptionSelected,
                    ]}
                    onPress={() => setSelectedTeamId(team.id)}
                  >
                    <Text style={styles.teamOptionName}>{team.name}</Text>
                    <Text style={styles.teamOptionMembers}>
                      {team.members?.length || 0} membre(s)
                    </Text>
                  </TouchableOpacity>
                ))}
                <View style={styles.formActions}>
                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      (!selectedTeamId || registerMutation.isPending) && styles.submitButtonDisabled,
                    ]}
                    onPress={handleRegister}
                    disabled={!selectedTeamId || registerMutation.isPending}
                  >
                    <Text style={styles.submitButtonText}>
                      {registerMutation.isPending ? 'Inscription...' : 'Confirmer'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setShowRegisterForm(false);
                      setSelectedTeamId(null);
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Annuler</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : !isEnded ? (
              <View style={styles.noTeams}>
                {isIndividualCompetition ? (
                  <>
                    <Text style={styles.noTeamsText}>
                      Vous pouvez vous inscrire directement à cette compétition individuelle.
                    </Text>
                    <TouchableOpacity
                      style={styles.registerButton}
                      onPress={handleRegisterClick}
                      disabled={createIndividualTeamMutation.isPending || registerMutation.isPending}
                    >
                      <Text style={styles.registerButtonText}>
                        {createIndividualTeamMutation.isPending || registerMutation.isPending
                          ? 'Inscription...'
                          : "S'inscrire"}
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <Text style={styles.noTeamsText}>
                      Vous n'avez pas d'équipe disponible
                    </Text>
                    <TouchableOpacity
                      style={styles.createTeamButton}
                      onPress={() => navigation.navigate('CreateTeam' as never)}
                    >
                      <Text style={styles.createTeamButtonText}>
                        Créer une équipe
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            ) : null}
          </View>
        )}

        {/* Classement */}
        {(!rankingVisible || (competition.teams && competition.teams.length > 0)) && (
          <View style={styles.rankingSection}>
            <Text style={styles.sectionTitle}>
              {isEnded && rankingVisible
                ? 'Classement final'
                : rankingVisible
                ? isAdmin && !competition.isRankingPublic
                  ? 'Classement (masqué aux participants)'
                  : 'Classement'
                : 'Votre équipe'}
            </Text>

            {!rankingVisible && (
              <Text style={styles.enrolledCountText}>
                {(() => {
                  const n =
                    (competition as any).enrolledTeamsCount ?? teamsToShow.length ?? 0;
                  return `${n} équipe${n > 1 ? 's' : ''} inscrite${n > 1 ? 's' : ''}`;
                })()}
              </Text>
            )}

            {!competition.isRankingPublic && !isAdmin && (
              <View style={styles.rankingInfo}>
                <FaIcon name="lock" size={16} color={theme.accent} />
                <Text style={styles.rankingInfoText}>
                  Le classement n'a pas encore été publié par l'administrateur
                </Text>
              </View>
            )}

            {displayedTeams.map(({ team, rank }: { team: any; rank: number }) => {
              const isUserTeam = currentUser && team.members?.some(
                (member: any) => member.id === currentUser.id
              );
              const showScore = competition.isRankingPublic || isAdmin || isUserTeam;

              return (
                <TouchableOpacity
                  key={team.id}
                  style={[styles.teamRow, isUserTeam && styles.teamRowUser]}
                  onPress={() => (navigation as any).navigate('TeamDetail', { id: team.id })}
                >
                  {(isEnded || rankingVisible) && rankingVisible && (
                    <Text style={styles.teamRank}>#{rank}</Text>
                  )}
                  <View style={styles.teamInfo}>
                    <Text style={[styles.teamName, isUserTeam && styles.teamNameUser]}>{team.name}</Text>
                    {team.registrationNumber && (
                      <Text style={styles.teamNumber}>N° {team.registrationNumber}</Text>
                    )}
                    <Text style={styles.teamMembers}>
                      {team.members?.map((m: any) => m.firstname).join(', ') || '-'}
                    </Text>
                  </View>
                  {showScore && (
                    <Text style={styles.teamScore}>
                      {team.totalScore || 0} pts
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
            {rankingVisible && sortedTeams.length > 5 && (
              <TouchableOpacity
                style={styles.showMoreRanking}
                onPress={() => setShowAllRanking(!showAllRanking)}
              >
                <Text style={styles.showMoreRankingText}>
                  {showAllRanking ? 'Afficher moins' : `Afficher plus (${sortedTeams.length} équipes)`}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        </View>
        )}

        {/* Statistiques - uniquement dans l'onglet Infos */}
        {activeTab === 'info' && rankingVisible && stats && (
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Statistiques</Text>
            {loadingStats ? (
              <ActivityIndicator size="small" color={theme.accent} />
            ) : (
              <>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Total de poissons</Text>
                  <Text style={styles.statValue}>{stats.totalCatches || 0}</Text>
                </View>

                {stats.speciesStats && stats.speciesStats.length > 0 && (
                  <View style={styles.speciesSection}>
                    <SpeciesPieChart speciesStats={stats.speciesStats} />

                    {stats.catchesForMap && stats.catchesForMap.length > 0 && (
                      <View style={styles.statsExpand}>
                        <TouchableOpacity
                          style={styles.showMoreStatsBtn}
                          onPress={() => setShowMoreStats(!showMoreStats)}
                        >
                          <Text style={styles.showMoreStatsText}>
                            {showMoreStats ? 'Masquer les statistiques avancées' : 'Afficher plus de statistiques'}
                          </Text>
                        </TouchableOpacity>
                        {showMoreStats && (
                          <View style={styles.statsExpanded}>
                            <CatchesMapView
                              catches={stats.catchesForMap}
                              speciesStats={stats.speciesStats}
                              height={280}
                            />
                            <CatchesTimelineChart
                              catches={stats.catchesForMap}
                              startDate={competition.startDate}
                              endDate={competition.endDate}
                              speciesStats={stats.speciesStats}
                            />
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                )}

                {stats.top3BySpecies && Object.keys(stats.top3BySpecies).length > 0 && (
                  <View style={styles.top3Section}>
                    <TouchableOpacity
                      style={styles.showTop3Btn}
                      onPress={() => setShowTop3(!showTop3)}
                    >
                      <Text style={styles.showTop3BtnText}>
                        {showTop3 ? 'Masquer le top 3' : 'Afficher le top 3 par espèce'}
                      </Text>
                    </TouchableOpacity>
                    {showTop3 && (
                      <>
                        <Text style={styles.subsectionTitle}>Top 3 par espèce</Text>
                        {Object.entries(stats.top3BySpecies).map(([speciesId, top3]: [string, any]) => {
                      const speciesInfo = stats.speciesStats?.find(
                        (s: any) => s.id === parseInt(speciesId)
                      );
                      if (!speciesInfo || top3.length === 0) return null;

                      return (
                        <View key={speciesId} style={styles.top3Species}>
                          <Text style={styles.top3SpeciesTitle}>{speciesInfo.name}</Text>
                          {top3.map((catchItem: any, idx: number) => (
                            <View key={catchItem.id} style={styles.top3Item}>
                              <Text style={styles.top3Rank}>#{idx + 1}</Text>
                              <View style={styles.top3Details}>
                                <Text style={styles.top3Size}>
                                  {catchItem.size} cm - {catchItem.points} pts
                                </Text>
                                <Text style={styles.top3Team}>
                                  {catchItem.team.name}
                                  {catchItem.team.registrationNumber && ` (N° ${catchItem.team.registrationNumber})`}
                                </Text>
                                {catchItem.caughtBy && (
                                  <Text style={styles.top3CaughtBy}>
                                    Pêché par: {catchItem.caughtBy.firstname} {catchItem.caughtBy.lastname}
                                  </Text>
                                )}
                              </View>
                            </View>
                          ))}
                        </View>
                      );
                    })}
                      </>
                    )}
                  </View>
                )}
              </>
            )}
          </View>
        )}
        </View>
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
    color: theme.text,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  date: {
    fontSize: 16,
    color: theme.textMuted,
    flex: 1,
  },
  badgesContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    flexWrap: 'wrap',
    marginLeft: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.onAccent,
  },
  registeredBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: theme.accentMuted,
    borderWidth: 1,
    borderColor: theme.accent,
  },
  registeredBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.accent,
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
  statusUpcoming: {
    backgroundColor: '#60a5fa',
  },
  statusOngoing: {
    backgroundColor: '#34d399',
  },
  statusPaused: {
    backgroundColor: '#f59e0b',
  },
  statusEnded: {
    backgroundColor: '#f87171',
  },
  description: {
    fontSize: 14,
    color: theme.textMuted,
    marginBottom: 16,
    lineHeight: 20,
  },
  infoSection: {
    backgroundColor: theme.surface,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 14,
    color: theme.textMuted,
    marginBottom: 4,
  },
  actionsSection: {
    marginBottom: 24,
  },
  alreadyRegistered: {
    backgroundColor: '#d4edda',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  alreadyRegisteredText: {
    color: '#155724',
    fontSize: 14,
    marginBottom: 12,
  },
  unregisterButton: {
    backgroundColor: '#ef4444',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  unregisterButtonDisabled: {
    opacity: 0.6,
  },
  unregisterButtonText: {
    color: theme.onAccent,
    fontSize: 16,
    fontWeight: '600',
  },
  registerButton: {
    backgroundColor: theme.accent,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  registerButtonText: {
    color: theme.onAccent,
    fontSize: 16,
    fontWeight: '600',
  },
  noTeams: {
    backgroundColor: '#fff3cd',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  noTeamsText: {
    color: '#856404',
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
  createTeamButton: {
    backgroundColor: theme.accent,
    padding: 12,
    borderRadius: 8,
  },
  createTeamButtonText: {
    color: theme.onAccent,
    fontSize: 14,
    fontWeight: '600',
  },
  endedText: {
    color: theme.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
  registerForm: {
    backgroundColor: theme.surface,
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  registerFormTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: theme.text,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: theme.text,
  },
  teamOption: {
    backgroundColor: theme.bg,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  teamOptionSelected: {
    borderColor: theme.accent,
    backgroundColor: '#e3f2fd',
  },
  teamOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 4,
  },
  teamOptionMembers: {
    fontSize: 14,
    color: theme.textMuted,
  },
  formActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  submitButton: {
    flex: 1,
    backgroundColor: theme.accent,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: theme.onAccent,
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: theme.surfaceRaised,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: theme.text,
    fontSize: 14,
    fontWeight: '600',
  },
  rankingSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    color: theme.text,
  },
  rankingInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: theme.accentMuted,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  rankingInfoText: {
    flex: 1,
    color: theme.text,
    fontSize: 14,
    lineHeight: 20,
  },
  enrolledCountText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 10,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  teamRowUser: {
    backgroundColor: theme.accentMuted,
    borderLeftWidth: 4,
    borderLeftColor: theme.accent,
  },
  showMoreRanking: {
    marginTop: 8,
    padding: 12,
    backgroundColor: theme.surfaceRaised,
    borderRadius: 8,
    alignItems: 'center',
  },
  showMoreRankingText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.textMuted,
  },
  teamRank: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.accent,
    marginRight: 12,
    width: 40,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 4,
  },
  teamNameUser: {
    color: theme.text,
  },
  teamNumber: {
    fontSize: 12,
    color: theme.textMuted,
    marginBottom: 2,
  },
  teamMembers: {
    fontSize: 14,
    color: theme.textMuted,
  },
  teamScore: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.accent,
  },
  statsSection: {
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: theme.surface,
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: theme.textMuted,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.accent,
  },
  speciesSection: {
    marginBottom: 16,
  },
  statsExpand: {
    marginTop: 16,
  },
  showMoreStatsBtn: {
    padding: 12,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#93c5fd',
    borderRadius: 8,
    alignItems: 'center',
  },
  showMoreStatsText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1d4ed8',
  },
  statsExpanded: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  showTop3Btn: {
    padding: 12,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#93c5fd',
  },
  showTop3BtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1d4ed8',
    textAlign: 'center',
  },
  subsectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: theme.text,
  },
  speciesItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: theme.surface,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  speciesName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  speciesCount: {
    fontSize: 14,
    color: theme.textMuted,
  },
  top3Section: {
    marginTop: 16,
  },
  top3Species: {
    marginBottom: 16,
  },
  top3SpeciesTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: theme.text,
  },
  top3Item: {
    flexDirection: 'row',
    backgroundColor: theme.surface,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  top3Rank: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.accent,
    marginRight: 12,
    width: 30,
  },
  top3Details: {
    flex: 1,
  },
  top3Size: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 4,
  },
  top3Team: {
    fontSize: 14,
    color: theme.textMuted,
    marginBottom: 2,
  },
  top3CaughtBy: {
    fontSize: 12,
    color: theme.textMuted,
  },
  errorText: {
    color: theme.danger,
    fontSize: 16,
  },
  pausedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FF9500',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  pausedText: {
    color: theme.onAccent,
    fontSize: 14,
    fontWeight: '600',
  },
  adminActions: {
    marginBottom: 24,
  },
  adminButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  editButton: {
    backgroundColor: theme.accent,
  },
  pauseButton: {
    backgroundColor: '#FF9500',
  },
  resumeButton: {
    backgroundColor: theme.success,
  },
  rankingPublicButton: {
    backgroundColor: theme.success,
  },
  rankingPrivateButton: {
    backgroundColor: '#8E8E93',
  },
  pdfButton: {
    backgroundColor: '#C41E3A',
  },
  pdfButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  adminButtonText: {
    color: theme.onAccent,
    fontSize: 16,
    fontWeight: '600',
  },
  scheduledPausesSection: {
    marginBottom: 24,
  },
  pauseToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.surface,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 12,
  },
  pauseToggleButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.text,
  },
  pauseCard: {
    backgroundColor: theme.surface,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
  },
  pauseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  pauseDates: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    flex: 1,
  },
  activeBadge: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  activeBadgeText: {
    color: theme.onAccent,
    fontSize: 12,
    fontWeight: '600',
  },
  pauseReason: {
    fontSize: 12,
    color: theme.textMuted,
    marginTop: 4,
  },
  perimeterSection: {
    marginBottom: 24,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginTop: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: theme.accent,
  },
  tabText: {
    fontSize: 12,
    color: theme.textMuted,
    fontWeight: '500',
  },
  tabTextActive: {
    color: theme.accent,
    fontWeight: '600',
  },
  speciesTabContent: {
    marginTop: 16,
  },
  myTeamScoreRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  myTeamScoreCard: {
    flex: 1,
    backgroundColor: theme.surface,
    borderRadius: 8,
    padding: 12,
  },
  myTeamScoreLabel: {
    fontSize: 13,
    color: theme.textMuted,
    marginBottom: 4,
  },
  myTeamScoreValue: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.text,
  },
  myTeamMembersBlock: {
    marginBottom: 16,
    gap: 8,
  },
  myTeamMemberRow: {
    backgroundColor: theme.surface,
    borderRadius: 8,
    padding: 12,
  },
  myTeamMemberName: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.text,
  },
  myTeamMemberMeta: {
    fontSize: 13,
    color: theme.textMuted,
    marginTop: 2,
  },
  myTeamCatchPhoto: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: theme.surfaceRaised,
  },
  myTeamCatchRow: {
    backgroundColor: theme.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  myTeamCatchName: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.text,
  },
  myTeamCatchMeta: {
    fontSize: 13,
    color: theme.textMuted,
    marginTop: 2,
  },
  myTeamOpenButton: {
    marginTop: 8,
    backgroundColor: theme.accent,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  myTeamOpenButtonText: {
    color: theme.onAccent,
    fontSize: 15,
    fontWeight: '600',
  },
  speciesCard: {
    backgroundColor: theme.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  speciesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  speciesCardName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
  },
  bonusBadge: {
    backgroundColor: '#ff9500',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  bonusText: {
    color: theme.onAccent,
    fontSize: 12,
    fontWeight: '600',
  },
  speciesInfo: {
    marginTop: 8,
  },
  speciesCoefficient: {
    fontSize: 14,
    color: theme.accent,
    fontWeight: '600',
    marginBottom: 4,
  },
  speciesBasePoints: {
    fontSize: 14,
    color: theme.textMuted,
  },
  reglementText: {
    fontSize: 15,
    color: theme.text,
    lineHeight: 22,
    marginTop: 8,
  },
  rulesIntro: {
    fontSize: 14,
    color: theme.textMuted,
    lineHeight: 20,
    marginBottom: 12,
  },
  rulesSubTitle: {
    marginTop: 20,
  },
  rulesCard: {
    backgroundColor: theme.surface,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 4,
  },
  ruleRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  ruleLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 4,
  },
  ruleValue: {
    fontSize: 14,
    color: theme.text,
    lineHeight: 20,
  },
  ruleSpeciesBlock: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  ruleSpeciesName: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 4,
  },
  ruleSpeciesDetail: {
    fontSize: 13,
    color: theme.textMuted,
    lineHeight: 18,
  },
  emptyText: {
    fontSize: 16,
    color: theme.textMuted,
    textAlign: 'center',
    marginTop: 32,
  },
  myStatsSection: {
    marginBottom: 24,
    backgroundColor: theme.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  myStatsHint: {
    fontSize: 13,
    color: theme.textMuted,
    marginBottom: 12,
  },
  myStatsErrorText: {
    fontSize: 14,
    color: '#b91c1c',
    marginVertical: 8,
  },
  myStatsBlock: {
    marginBottom: 16,
  },
  myStatsBlockTeam: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  myStatsSubsectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 10,
  },
  myStatsKpis: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  myStatsKpi: {
    flex: 1,
    backgroundColor: theme.surfaceRaised,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  myStatsKpiLabel: {
    fontSize: 12,
    color: theme.textMuted,
    marginBottom: 4,
  },
  myStatsKpiValue: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.accent,
  },
  myStatsTimelineTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    marginTop: 8,
    marginBottom: 8,
  },
  myStatsTimelineRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  myStatsTimelineDate: {
    fontSize: 11,
    color: theme.textMuted,
    marginBottom: 2,
  },
  myStatsTimelineBody: {
    fontSize: 14,
    color: theme.text,
  },
  byMemberRow: {
    marginBottom: 12,
  },
  byMemberTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.textMuted,
    marginBottom: 6,
  },
  byMemberLine: {
    fontSize: 13,
    color: theme.text,
    marginBottom: 4,
  },
  myStatsViz: {
    marginTop: 8,
    marginBottom: 8,
  },
});
