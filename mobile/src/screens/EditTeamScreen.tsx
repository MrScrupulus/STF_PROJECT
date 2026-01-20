import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation, useRoute } from '@react-navigation/native';
import { teamService } from '../services/teamService';
import { authService } from '../services/authService';
import Header from '../components/Header';

export default function EditTeamScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const queryClient = useQueryClient();
  const { id } = route.params as { id: number };
  const [teamName, setTeamName] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const { data: teamData, isLoading } = useQuery({
    queryKey: ['team', id],
    queryFn: () => teamService.getOne(id),
  });

  const team = teamData?.team;

  // Charger l'utilisateur actuel
  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const response = await authService.getCurrentUser();
        const user = response.user || response;
        setCurrentUser(user);
      } catch (error) {
        console.error('Erreur chargement utilisateur:', error);
      }
    };
    loadCurrentUser();
  }, []);

  // Initialiser les données du formulaire
  useEffect(() => {
    if (team) {
      setTeamName(team.name || '');
      setSelectedMemberIds(team.members?.map((m: any) => m.id) || []);
    }
  }, [team]);

  const updateMutation = useMutation({
    mutationFn: (data: { name?: string; memberIds?: number[] }) =>
      teamService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', id] });
      queryClient.invalidateQueries({ queryKey: ['my-teams'] });
      Alert.alert('Succès', 'Équipe modifiée avec succès', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    },
    onError: (error: any) => {
      Alert.alert('Erreur', error.response?.data?.message || 'Erreur lors de la modification');
    },
  });

  const handleSubmit = () => {
    if (!teamName.trim()) {
      Alert.alert('Erreur', 'Le nom de l\'équipe est requis');
      return;
    }

    if (selectedMemberIds.length === 0) {
      Alert.alert('Erreur', 'L\'équipe doit avoir au moins un membre');
      return;
    }

    // Vérifier que l'utilisateur actuel est dans la liste
    if (currentUser && !selectedMemberIds.includes(currentUser.id)) {
      Alert.alert('Erreur', 'Vous devez rester membre de l\'équipe');
      return;
    }

    updateMutation.mutate({
      name: teamName.trim(),
      memberIds: selectedMemberIds,
    });
  };

  const toggleMember = (memberId: number) => {
    // Ne pas permettre de retirer l'utilisateur actuel
    if (currentUser && memberId === currentUser.id) {
      Alert.alert('Information', 'Vous ne pouvez pas vous retirer de l\'équipe');
      return;
    }

    if (selectedMemberIds.includes(memberId)) {
      setSelectedMemberIds(selectedMemberIds.filter((id) => id !== memberId));
    } else {
      // Vérifier la taille maximale de l'équipe
      const maxTeamSize = team?.competition?.teamSize || 2;
      if (selectedMemberIds.length >= maxTeamSize) {
        Alert.alert('Erreur', `L'équipe ne peut pas avoir plus de ${maxTeamSize} membre(s)`);
        return;
      }
      setSelectedMemberIds([...selectedMemberIds, memberId]);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Header title="Modifier l'équipe" showBack={true} showMenu={false} />
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!team) {
    return (
      <View style={styles.center}>
        <Header title="Modifier l'équipe" showBack={true} showMenu={false} />
        <Text style={styles.errorText}>Équipe non trouvée</Text>
      </View>
    );
  }

  // Vérifier si l'équipe est dans une compétition active
  const isInActiveCompetition = team.competition && (() => {
    const now = new Date();
    const competitionEndDate = team.competition.endDate ? new Date(team.competition.endDate) : null;
    return competitionEndDate && competitionEndDate >= now;
  })();

  const maxTeamSize = team.competition?.teamSize || 2;
  const allMembers = team.members || [];

  return (
    <>
      <Header title="Modifier l'équipe" showBack={true} showMenu={false} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          {isInActiveCompetition && (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                ⚠️ Cette équipe est inscrite dans une compétition active. La modification n'est pas autorisée.
              </Text>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.label}>Nom de l'équipe</Text>
            <TextInput
              style={styles.input}
              value={teamName}
              onChangeText={setTeamName}
              placeholder="Nom de l'équipe"
              editable={!isInActiveCompetition}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>
              Membres ({selectedMemberIds.length} / {maxTeamSize})
            </Text>
            <Text style={styles.sectionDescription}>
              Sélectionnez les membres de l'équipe. Vous devez rester membre.
            </Text>

            {allMembers.map((member: any) => {
              const isSelected = selectedMemberIds.includes(member.id);
              const isCurrentUser = currentUser && member.id === currentUser.id;

              return (
                <TouchableOpacity
                  key={member.id}
                  style={[
                    styles.memberItem,
                    isSelected && styles.memberItemSelected,
                    isCurrentUser && styles.memberItemCurrent,
                  ]}
                  onPress={() => !isInActiveCompetition && toggleMember(member.id)}
                  disabled={isInActiveCompetition || isCurrentUser}
                >
                  <View style={styles.memberInfo}>
                    <View style={styles.memberAvatar}>
                      <Text style={styles.memberInitials}>
                        {member.firstname?.[0]}{member.lastname?.[0]}
                      </Text>
                    </View>
                    <View style={styles.memberDetails}>
                      <Text style={styles.memberName}>
                        {member.firstname} {member.lastname}
                        {isCurrentUser && ' (Vous)'}
                      </Text>
                      <Text style={styles.memberEmail}>{member.email}</Text>
                    </View>
                  </View>
                  {isSelected && (
                    <View style={styles.checkbox}>
                      <Text style={styles.checkboxText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {!isInActiveCompetition && (
            <TouchableOpacity
              style={[styles.submitButton, updateMutation.isPending && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Enregistrer les modifications</Text>
              )}
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
  },
  warningBox: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffc107',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  warningText: {
    color: '#856404',
    fontSize: 14,
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  memberItem: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  memberItemSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  memberItemCurrent: {
    backgroundColor: '#f9f9f9',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
    fontSize: 16,
    fontWeight: '600',
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  memberEmail: {
    fontSize: 14,
    color: '#666',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
