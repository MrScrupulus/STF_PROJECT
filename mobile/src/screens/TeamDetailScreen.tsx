import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  Modal,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { teamService, Team } from '../services/teamService';
import Header from '../components/Header';

export default function TeamDetailScreen({ route }: any) {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { id } = route.params;
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  const { data: teamData, isLoading, error } = useQuery({
    queryKey: ['team', id],
    queryFn: () => teamService.getOne(id),
  });

  const inviteMutation = useMutation({
    mutationFn: (email: string) => teamService.inviteMember(id, email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', id] });
      Alert.alert('Succès', 'Invitation envoyée avec succès !');
      setInviteEmail('');
      setShowInviteForm(false);
    },
    onError: (error: any) => {
      Alert.alert('Erreur', error.response?.data?.message || 'Erreur lors de l\'invitation');
    },
  });

  const leaveTeamMutation = useMutation({
    mutationFn: () => teamService.leaveTeam(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-teams'] });
      queryClient.invalidateQueries({ queryKey: ['team', id] });
      Alert.alert('Succès', 'Vous avez quitté l\'équipe avec succès', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    },
    onError: (error: any) => {
      Alert.alert('Erreur', error.response?.data?.message || 'Erreur lors de la sortie de l\'équipe');
    },
  });

  const handleLeaveTeam = () => {
    // Vérifier si l'équipe est inscrite dans une compétition active
    if (team && team.competition && (team.competition as any).endDate) {
      const now = new Date();
      const competitionEndDate = new Date((team.competition as any).endDate);
      const isCompetitionActive = competitionEndDate >= now;
      
      if (isCompetitionActive) {
        Alert.alert(
          'Action impossible',
          'Vous ne pouvez pas quitter une équipe inscrite dans une compétition en cours. Attendez la fin de la compétition.',
          [{ text: 'OK' }]
        );
        return;
      }
    }
    
    Alert.alert(
      'Quitter l\'équipe',
      'Êtes-vous sûr de vouloir quitter cette équipe ? Cette action est irréversible.',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Quitter',
          style: 'destructive',
          onPress: () => leaveTeamMutation.mutate(),
        },
      ]
    );
  };

  const team = teamData?.team;

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error || !team) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Erreur lors du chargement</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Séparer les prises rejetées des autres
  const rejectedCatches = team?.catches
    ? team.catches.filter((catchItem: any) => catchItem.rejectionReason)
    : [];
  
  // Filtrer les prises non rejetées et les trier par points décroissants
  const validCatches = team?.catches
    ? team.catches
        .filter((catchItem: any) => !catchItem.rejectionReason)
        .sort((a: any, b: any) => b.points - a.points)
    : [];
  
  const top5Catches = validCatches.slice(0, 5);
  const otherCatches = validCatches.slice(5);
  const baseScore = top5Catches.reduce((sum: number, catchItem: any) => sum + catchItem.points, 0);

  const maxTeamSize = team.competition?.teamSize || 2;
  const canInvite = team.members && team.members.length < maxTeamSize;

  return (
    <>
      <Header title={team.name} showBack={true} showMenu={true} />
      <ScrollView style={styles.container}>
        <View style={styles.content}>

        {team.competition && (
          <View style={styles.competitionInfo}>
            <Text style={styles.competitionLabel}>Compétition :</Text>
            <Text style={styles.competitionName}>{team.competition.name}</Text>
            {team.registrationNumber && (
              <Text style={styles.registrationNumber}>
                N° {team.registrationNumber}
              </Text>
            )}
          </View>
        )}

        {/* Résumé des scores */}
        {team?.catches && team.catches.length > 0 && (
          <View style={styles.scoreSummary}>
            <View style={styles.scoreCard}>
              <Text style={styles.scoreLabel}>Score Total</Text>
              <Text style={styles.scoreValue}>{team.totalScore || 0}</Text>
              <Text style={styles.scoreDescription}>Score de base + Bonus</Text>
            </View>
            <View style={styles.scoreCard}>
              <Text style={styles.scoreLabel}>Score Base</Text>
              <Text style={styles.scoreValue}>{baseScore}</Text>
              <Text style={styles.scoreDescription}>Top 5 meilleures prises</Text>
            </View>
            <View style={styles.scoreCard}>
              <Text style={styles.scoreLabel}>Bonus Espèces</Text>
              <Text style={styles.scoreValue}>{team.bonus ?? 0}</Text>
              <Text style={styles.scoreDescription}>
                {(team.bonus ?? 0) > 0 ? `${Math.floor((team.bonus ?? 0) / 50) + 1} espèces différentes` : 'Aucun bonus'}
              </Text>
            </View>
          </View>
        )}

        {/* Membres */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Membres de l'équipe</Text>
          {team.members?.map((member: any) => (
            <View key={member.id} style={styles.memberCard}>
              <View style={styles.memberAvatar}>
                <Text style={styles.memberInitials}>
                  {member.firstname?.[0]}{member.lastname?.[0]}
                </Text>
              </View>
              <Text style={styles.memberName}>
                {member.firstname} {member.lastname}
              </Text>
            </View>
          ))}

          {/* Formulaire d'invitation */}
          {canInvite && (
            <View style={styles.inviteSection}>
              {!showInviteForm ? (
                <TouchableOpacity
                  style={styles.inviteButton}
                  onPress={() => setShowInviteForm(true)}
                >
                  <Text style={styles.inviteButtonText}>+ Inviter un membre</Text>
                  {team.competition && (
                    <Text style={styles.inviteSubtext}>
                      ({team.members?.length || 0} / {team.competition.teamSize} membres)
                    </Text>
                  )}
                </TouchableOpacity>
              ) : (
                <View style={styles.inviteForm}>
                  <Text style={styles.inviteFormTitle}>Inviter un membre</Text>
                  <TextInput
                    style={styles.inviteInput}
                    placeholder="Email du membre à inviter"
                    value={inviteEmail}
                    onChangeText={setInviteEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  <View style={styles.inviteActions}>
                    <TouchableOpacity
                      style={styles.inviteSubmitButton}
                      onPress={() => {
                        if (!inviteEmail.trim()) {
                          Alert.alert('Erreur', 'Veuillez entrer un email');
                          return;
                        }
                        inviteMutation.mutate(inviteEmail);
                      }}
                      disabled={inviteMutation.isPending}
                    >
                      <Text style={styles.inviteSubmitButtonText}>
                        {inviteMutation.isPending ? 'Envoi...' : 'Envoyer'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.inviteCancelButton}
                      onPress={() => {
                        setShowInviteForm(false);
                        setInviteEmail('');
                      }}
                    >
                      <Text style={styles.inviteCancelButtonText}>Annuler</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Bouton quitter l'équipe */}
          {(() => {
            // Vérifier si l'équipe est inscrite dans une compétition active
            const canLeave = !team || !team.competition || !(team.competition as any).endDate || (() => {
              const now = new Date();
              const competitionEndDate = new Date((team.competition as any).endDate);
              return competitionEndDate < now;
            })();
            
            return (
              <View style={styles.leaveTeamSection}>
                <TouchableOpacity
                  style={[
                    styles.leaveTeamButton,
                    !canLeave && styles.leaveTeamButtonDisabled
                  ]}
                  onPress={handleLeaveTeam}
                  disabled={leaveTeamMutation.isPending || !canLeave}
                >
                  {leaveTeamMutation.isPending ? (
                    <ActivityIndicator color="#ff3b30" />
                  ) : (
                    <Text style={[
                      styles.leaveTeamButtonText,
                      !canLeave && styles.leaveTeamButtonTextDisabled
                    ]}>
                      {canLeave ? 'Quitter l\'équipe' : 'Impossible de quitter (compétition en cours)'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            );
          })()}
        </View>

        {/* Prises */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Prises enregistrées ({team.catches?.length || 0})
          </Text>

          {!team.catches || team.catches.length === 0 ? (
            <View style={styles.emptyCatches}>
              <Text style={styles.emptyText}>Aucune prise enregistrée</Text>
            </View>
          ) : (
            <>
              {/* Top 5 */}
              {top5Catches.length > 0 && (
                <View style={styles.top5Section}>
                  <Text style={styles.top5Title}>🏆 Top 5 prises comptabilisées</Text>
                  {top5Catches.map((catchItem: any, index: number) => (
                    <CatchCard
                      key={catchItem.id}
                      catchItem={catchItem}
                      index={index}
                      isTop5={true}
                      onImagePress={(uri: string) => setSelectedImage(uri)}
                    />
                  ))}
                </View>
              )}

              {/* Autres prises */}
              {otherCatches.length > 0 && (
                <View style={styles.otherCatchesSection}>
                  <Text style={styles.otherCatchesTitle}>
                    Autres prises ({otherCatches.length})
                  </Text>
                  {otherCatches.map((catchItem: any) => (
                    <CatchCard
                      key={catchItem.id}
                      catchItem={catchItem}
                      onImagePress={(uri: string) => setSelectedImage(uri)}
                    />
                  ))}
                </View>
              )}

              {/* Prises refusées */}
              {rejectedCatches.length > 0 && (
                <View style={styles.rejectedCatchesSection}>
                  <Text style={styles.rejectedCatchesTitle}>
                    ❌ Prises refusées ({rejectedCatches.length})
                  </Text>
                  {rejectedCatches.map((catchItem: any) => (
                    <CatchCard
                      key={catchItem.id}
                      catchItem={catchItem}
                      isRejected={true}
                      onImagePress={(uri: string) => setSelectedImage(uri)}
                    />
                  ))}
                </View>
              )}
            </>
          )}
        </View>
      </View>

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
      </ScrollView>
    </>
  );
}

function CatchCard({ catchItem, index, isTop5, isRejected, onImagePress }: any) {
  return (
    <View style={styles.catchCard}>
      {isTop5 && (
        <View style={styles.top5Badge}>
          <Text style={styles.top5BadgeText}>Top {index + 1}</Text>
        </View>
      )}
      <View style={styles.catchHeader}>
        <Text style={styles.catchSpecies}>{catchItem.species.name}</Text>
        <Text style={styles.catchPoints}>{catchItem.points} pts</Text>
      </View>
      <View style={styles.catchDetails}>
        <View style={styles.catchDetailRow}>
          <Text style={styles.catchLabel}>Taille :</Text>
          <Text style={styles.catchValue}>{catchItem.size} cm</Text>
        </View>
        <View style={styles.catchDetailRow}>
          <Text style={styles.catchLabel}>Coefficient :</Text>
          <Text style={styles.catchValue}>{catchItem.species.coefficient}</Text>
        </View>
        {catchItem.caughtBy && (
          <View style={styles.catchDetailRow}>
            <Text style={styles.catchLabel}>Pêché par :</Text>
            <Text style={styles.catchValue}>
              {catchItem.caughtBy.firstname} {catchItem.caughtBy.lastname}
            </Text>
          </View>
        )}
        {catchItem.comment && (
          <View style={styles.catchComment}>
            <Text style={styles.catchLabel}>Commentaire :</Text>
            <Text style={styles.catchCommentText}>{catchItem.comment}</Text>
          </View>
        )}
        {catchItem.createdAt && (
          <View style={styles.catchDetailRow}>
            <Text style={styles.catchLabel}>Date :</Text>
            <Text style={styles.catchValue}>
              {new Date(catchItem.createdAt).toLocaleString('fr-FR')}
            </Text>
          </View>
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
          <Text style={styles.catchStatusRejectedTitle}>❌ Motif de rejet :</Text>
          <Text style={styles.catchStatusRejectedText}>{catchItem.rejectionReason}</Text>
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
    marginBottom: 16,
    color: '#333',
  },
  competitionInfo: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  competitionLabel: {
    fontSize: 14,
    color: '#666',
  },
  competitionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 4,
  },
  registrationNumber: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  scoreSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 8,
  },
  scoreCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#007AFF',
    marginBottom: 4,
  },
  scoreDescription: {
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
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberInitials: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  memberName: {
    fontSize: 16,
    color: '#333',
  },
  inviteSection: {
    marginTop: 12,
  },
  inviteButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  inviteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  inviteSubtext: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
    opacity: 0.9,
  },
  inviteForm: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
  },
  inviteFormTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  inviteInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  inviteActions: {
    flexDirection: 'row',
    gap: 8,
  },
  inviteSubmitButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  inviteSubmitButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  inviteCancelButton: {
    flex: 1,
    backgroundColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  inviteCancelButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
  },
  leaveTeamSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  leaveTeamButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ff3b30',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  leaveTeamButtonText: {
    color: '#ff3b30',
    fontSize: 16,
    fontWeight: '600',
  },
  leaveTeamButtonDisabled: {
    opacity: 0.5,
    borderColor: '#ccc',
  },
  leaveTeamButtonTextDisabled: {
    color: '#999',
  },
  top5Section: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#10b981',
  },
  top5Title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    color: '#047857',
    textAlign: 'center',
  },
  otherCatchesSection: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  otherCatchesTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#1e40af',
    textAlign: 'center',
  },
  catchCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  top5Badge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  top5BadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
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
  catchDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  catchLabel: {
    fontSize: 14,
    color: '#666',
  },
  catchValue: {
    fontSize: 14,
    fontWeight: '900',
    color: '#333',
  },
  catchComment: {
    marginTop: 8,
  },
  catchCommentText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
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
  catchStatusRejectedTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#721c24',
    marginBottom: 4,
  },
  catchStatusRejectedText: {
    fontSize: 14,
    color: '#721c24',
  },
  catchStatusText: {
    fontSize: 14,
    color: '#333',
  },
  rejectedCatchesSection: {
    marginTop: 24,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#dc3545',
  },
  rejectedCatchesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#991b1b',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyCatches: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 16,
    marginBottom: 16,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 15,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
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
