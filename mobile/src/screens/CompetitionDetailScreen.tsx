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
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { competitionsService } from '../services/competitionsService';
import { teamService } from '../services/teamService';
import { authService } from '../services/authService';
import { adminService } from '../services/adminService';
import { speciesService } from '../services/speciesService';
import { formatDateTimeLocal, formatCompetitionDate, formatCompetitionDateRange } from '../utils/dateUtils';
import Header from '../components/Header';
import PerimeterMapView from '../components/PerimeterMapView';
import SpeciesPieChart from '../components/competition/SpeciesPieChart';

export default function CompetitionDetailScreen({ route }: any) {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { id } = route.params;
  const competitionId = typeof id === 'string' ? parseInt(id, 10) : id;
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'species'>('info');

  const { data: competitionResponse, isLoading } = useQuery({
    queryKey: ['competition', competitionId],
    queryFn: () => competitionsService.getOne(competitionId),
  });

  const competition = (competitionResponse as any)?.success !== undefined
    ? ((competitionResponse as any).success ? { ...(competitionResponse as any), success: undefined } : null)
    : competitionResponse;

  const { data: myTeamsData } = useQuery({
    queryKey: ['my-teams'],
    queryFn: () => teamService.getMyTeams(),
  });

  // Utiliser les espèces de la compétition si disponibles
  const speciesData = competition?.species && competition.species.length > 0
    ? competition.species
    : null;
  const loadingSpecies = false; // Les espèces sont déjà dans les données de la compétition

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userResponse = await authService.getCurrentUser();
        if (userResponse.success && userResponse.user) {
          setCurrentUser(userResponse.user);
          setIsAdmin(userResponse.user.roles?.includes('ROLE_ADMIN') || false);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
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
      queryClient.invalidateQueries({ queryKey: ['competition', competitionId] });
      queryClient.invalidateQueries({ queryKey: ['my-teams'] });
      Alert.alert('Succès', 'Équipe inscrite avec succès !');
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
    mutationFn: (isPublic: boolean) => adminService.updateCompetition(competitionId, {
      ...competition,
      isRankingPublic: isPublic,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competition', competitionId] });
      const comp = competition as any;
      Alert.alert(
        'Succès',
        comp?.isRankingPublic
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

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
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

  const myTeams = myTeamsData?.teams || [];
  
  // Date actuelle pour les comparaisons
  const now = new Date();
  
  // Filtrer les équipes disponibles (sans compétition ou avec compétition terminée)
  
  const availableTeams = myTeams.filter((team: any) => {
    if (!team.competition) return true;
    // Considérer l'équipe comme disponible si sa compétition est terminée
    const teamCompetitionEndDate = new Date(team.competition.endDate);
    return teamCompetitionEndDate < now;
  });
  
  // Vérifier si déjà inscrit à cette compétition spécifique (et que la compétition est active)
  // OU si l'utilisateur a une équipe inscrite à une autre compétition active
  const isAlreadyRegistered = myTeams.some((team: any) => {
    if (!team.competition) return false;
    
    // Si l'équipe est inscrite à cette compétition, vérifier qu'elle est active
    if (team.competition.id === competition.id) {
      const teamCompetitionEndDate = new Date(team.competition.endDate);
      return teamCompetitionEndDate >= now; // En cours ou à venir
    }
    
    // Si l'équipe est inscrite à une autre compétition, vérifier qu'elle est active
    // Si oui, on ne peut pas s'inscrire à une nouvelle compétition
    const otherCompetitionEndDate = new Date(team.competition.endDate);
    if (otherCompetitionEndDate >= now) {
      // L'équipe est inscrite à une compétition active (en cours ou à venir)
      return true; // On considère qu'on est déjà inscrit (à une autre compétition active)
    }
    
    return false;
  });
  
  const hasAvailableTeams = availableTeams.length > 0;
  const isEnded = (competition as any).isEnded || new Date(competition.endDate) < now;
  // Vérifier si c'est une compétition individuelle (teamSize === 1)
  const isIndividualCompetition = (competition as any)?.teamSize === 1;
  const canRegister = !isEnded && !isAlreadyRegistered && (hasAvailableTeams || isIndividualCompetition);
  
  // Fonction pour déterminer le statut de la compétition
  const getCompetitionStatus = () => {
    const now = new Date();
    const start = new Date(competition.startDate);
    const end = new Date(competition.endDate);
    
    if (now < start) {
      return { text: 'À venir', style: styles.statusUpcoming };
    } else if (now >= start && now <= end) {
      return { text: 'En cours', style: styles.statusOngoing };
    } else {
      return { text: 'Terminée', style: styles.statusEnded };
    }
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

  return (
    <>
      <Header title={competition.name} showBack={true} showMenu={true} />
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Text style={styles.date}>
              {formatCompetitionDateRange(competition.startDate, competition.endDate)}
            </Text>
            <View style={[styles.statusBadge, status.style]}>
              <Text style={styles.statusBadgeText}>{status.text}</Text>
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
              Informations
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'species' && styles.tabActive]}
            onPress={() => setActiveTab('species')}
          >
            <Text style={[styles.tabText, activeTab === 'species' && styles.tabTextActive]}>
              Espèces
            </Text>
          </TouchableOpacity>
        </View>

        {/* Contenu selon l'onglet actif */}
        {activeTab === 'species' ? (
          <View style={styles.speciesTabContent}>
            {loadingSpecies ? (
              <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 32 }} />
            ) : speciesData && speciesData.length > 0 ? (
              <>
                <Text style={styles.sectionTitle}>Espèces disponibles</Text>
                {speciesData.map((compSpecies: any) => (
                  <View key={compSpecies.id} style={styles.speciesCard}>
                    <View style={styles.speciesHeader}>
                      <Text style={styles.speciesCardName}>{compSpecies.name}</Text>
                      {compSpecies.isBonusEnabled && (
                        <View style={styles.bonusBadge}>
                          <Text style={styles.bonusText}>Bonus</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.speciesInfo}>
                      <Text style={styles.speciesCoefficient}>
                        Coefficient: {compSpecies.coefficient}
                      </Text>
                      {compSpecies.basePoints !== undefined && compSpecies.basePoints !== null && (
                        <Text style={styles.speciesBasePoints}>
                          Points bonus: {compSpecies.basePoints}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </>
            ) : (
              <Text style={styles.emptyText}>Aucune espèce configurée pour cette compétition</Text>
            )}
          </View>
        ) : (
          <View>
            <View style={styles.infoSection}>
          <Text style={styles.infoText}>
            Taille d'équipe: {(competition as any).teamSize} membre(s)
          </Text>
          <Text style={styles.infoText}>
            Équipes inscrites: {competition.teams?.length || 0}
          </Text>
          {(competition as any).isPaused && (
            <View style={styles.pausedBadge}>
              <Text style={styles.pausedText}>⏸️ Compétition en pause</Text>
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
                    ? '▶️ Reprendre la compétition'
                    : '⏸️ Mettre en pause'}
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
                  ? '🔒 Masquer le classement'
                  : '✅ Publier le classement'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Pauses programmées - masqué si compétition terminée */}
        {!isEnded && (competition as any).scheduledPauses && (competition as any).scheduledPauses.length > 0 && (
          <View style={styles.scheduledPausesSection}>
            <Text style={styles.sectionTitle}>⏰ Pauses programmées</Text>
            {(competition as any).scheduledPauses.map((pause: any) => {
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
                {status.text === 'À venir' && (
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
        {competition.teams && competition.teams.length > 0 && (
          <View style={styles.rankingSection}>
            <Text style={styles.sectionTitle}>
              {isEnded && competition.isRankingPublic
                ? 'Classement final'
                : competition.isRankingPublic
                ? 'Classement'
                : isAdmin
                ? 'Classement (admin)'
                : 'Votre équipe'}
            </Text>

            {!competition.isRankingPublic && !isAdmin && (
              <View style={styles.rankingInfo}>
                <Text style={styles.rankingInfoText}>
                  🔒 Le classement n'a pas encore été publié par l'administrateur
                </Text>
              </View>
            )}

            {sortedTeams.map((team: any, index: number) => {
              const isUserTeam = currentUser && team.members?.some(
                (member: any) => member.id === currentUser.id
              );
              // Le score est visible si : classement public OU admin OU équipe de l'utilisateur
              const showScore = competition.isRankingPublic || isAdmin || isUserTeam;

              return (
                <TouchableOpacity
                  key={team.id}
                  style={styles.teamRow}
                  onPress={() => (navigation as any).navigate('TeamDetail', { id: team.id })}
                >
                  {isEnded && competition.isRankingPublic && (
                    <Text style={styles.teamRank}>#{index + 1}</Text>
                  )}
                  <View style={styles.teamInfo}>
                    <Text style={styles.teamName}>{team.name}</Text>
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
          </View>
        )}
          </View>
        )}

        {/* Statistiques */}
        {competition.isRankingPublic && stats && (
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Statistiques</Text>
            {loadingStats ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Total de poissons</Text>
                  <Text style={styles.statValue}>{stats.totalCatches || 0}</Text>
                </View>

                {stats.speciesStats && stats.speciesStats.length > 0 && (
                  <View style={styles.speciesSection}>
                    <SpeciesPieChart speciesStats={stats.speciesStats} />
                  </View>
                )}

                {stats.top3BySpecies && Object.keys(stats.top3BySpecies).length > 0 && (
                  <View style={styles.top3Section}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    color: '#333',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  date: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 12,
  },
  statusBadgeText: {
    fontSize: 12,
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
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  infoSection: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
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
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  registerButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  registerButtonText: {
    color: '#fff',
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
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
  },
  createTeamButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  endedText: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
  },
  registerForm: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  registerFormTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  teamOption: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  teamOptionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#e3f2fd',
  },
  teamOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  teamOptionMembers: {
    fontSize: 14,
    color: '#666',
  },
  formActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#333',
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
    color: '#333',
  },
  rankingInfo: {
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  rankingInfoText: {
    color: '#856404',
    fontSize: 14,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  teamRank: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginRight: 12,
    width: 40,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  teamNumber: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  teamMembers: {
    fontSize: 14,
    color: '#666',
  },
  teamScore: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  statsSection: {
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  speciesSection: {
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  speciesItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  speciesName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  speciesCount: {
    fontSize: 14,
    color: '#666',
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
    color: '#333',
  },
  top3Item: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  top3Rank: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginRight: 12,
    width: 30,
  },
  top3Details: {
    flex: 1,
  },
  top3Size: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  top3Team: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  top3CaughtBy: {
    fontSize: 12,
    color: '#999',
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 16,
  },
  pausedBadge: {
    backgroundColor: '#FF9500',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
    alignItems: 'center',
  },
  pausedText: {
    color: '#fff',
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
  pauseButton: {
    backgroundColor: '#FF9500',
  },
  resumeButton: {
    backgroundColor: '#34C759',
  },
  rankingPublicButton: {
    backgroundColor: '#34C759',
  },
  rankingPrivateButton: {
    backgroundColor: '#8E8E93',
  },
  adminButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scheduledPausesSection: {
    marginBottom: 24,
  },
  pauseCard: {
    backgroundColor: '#fff',
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
    color: '#333',
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
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  pauseReason: {
    fontSize: 12,
    color: '#666',
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
    borderBottomColor: '#e5e5e5',
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
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  speciesTabContent: {
    marginTop: 16,
  },
  speciesCard: {
    backgroundColor: '#fff',
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
    color: '#333',
  },
  bonusBadge: {
    backgroundColor: '#ff9500',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  bonusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  speciesInfo: {
    marginTop: 8,
  },
  speciesCoefficient: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 4,
  },
  speciesBasePoints: {
    fontSize: 14,
    color: '#666',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 32,
  },
});
