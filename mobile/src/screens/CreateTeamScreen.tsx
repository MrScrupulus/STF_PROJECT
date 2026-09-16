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
import { useNavigation } from '@react-navigation/native';
import { teamService } from '../services/teamService';
import Header from '../components/Header';
import { useThemeColors } from '../contexts/ThemeContext';
import { type ThemeColors } from '../theme';

export default function CreateTeamScreen() {
  const theme = useThemeColors();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    participant2Email: '',
  });

  const { data: teamsData, isLoading: checkingTeam } = useQuery({
    queryKey: ['my-teams'],
    queryFn: () => teamService.getMyTeams(),
  });

  const { data: historyData } = useQuery({
    queryKey: ['my-history'],
    queryFn: () => teamService.getMyHistory(),
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; participant2Email?: string }) =>
      teamService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-teams'] });
      Alert.alert('Succès', 'Équipe créée avec succès.', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Teams' as never),
        },
      ]);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Une erreur est survenue lors de la création. Veuillez réessayer.';
      Alert.alert('Erreur', message);
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: (teamId: number) => teamService.reactivate(teamId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-teams'] });
      Alert.alert('Succès', 'Équipe réactivée avec succès.', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Teams' as never),
        },
      ]);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Une erreur est survenue lors de la réactivation. Veuillez réessayer.';
      Alert.alert('Erreur', message);
    },
  });

  const activeTeams = teamsData?.teams?.filter((t: any) => t.isActive !== false) || [];
  const inactiveTeams = historyData?.teams?.filter((t: any) => t.isActive === false) || [];

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un nom d\'équipe');
      return;
    }

    createMutation.mutate({
      name: formData.name.trim(),
      participant2Email: formData.participant2Email.trim() || undefined,
    });
  };

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

  if (checkingTeam) {
    return (
      <>
        <Header title="Créer une équipe" showBack={true} showMenu={true} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      </>
    );
  }

  if (activeTeams.length > 0) {
    return (
      <>
        <Header title="Créer une équipe" showBack={true} showMenu={true} />
        <ScrollView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Vous avez déjà une équipe</Text>
          <Text style={styles.message}>
            Vous êtes déjà membre de l'équipe{' '}
            <Text style={styles.teamName}>{activeTeams[0].name}</Text>.
          </Text>
          <Text style={styles.message}>
            Pour créer ou rejoindre une nouvelle équipe, vous devez d'abord quitter votre équipe actuelle.
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('Teams' as never)}
          >
            <Text style={styles.buttonText}>Retour à mon équipe</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      </>
    );
  }

  return (
    <>
      <Header title="Créer une équipe" showBack={true} showMenu={true} />
      <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>Créer une équipe</Text>

          {/* Proposer de réactiver une équipe inactive */}
          {inactiveTeams.length > 0 && (
            <View style={styles.reactivateSection}>
              <Text style={styles.reactivateTitle}>
                Ou réactiver une équipe existante
              </Text>
              <Text style={styles.reactivateDescription}>
                Vous avez {inactiveTeams.length} équipe{inactiveTeams.length > 1 ? 's' : ''} dissoute{inactiveTeams.length > 1 ? 's' : ''}.
                Vous pouvez la réactiver pour éviter de créer une nouvelle équipe.
              </Text>
              {inactiveTeams.map((team: any) => (
                <View key={team.id} style={styles.inactiveTeamCard}>
                  <Text style={styles.inactiveTeamName}>{team.name}</Text>
                  <Text style={styles.inactiveTeamInfo}>
                    Membres : {team.members?.map((m: any) => m.firstname).join(', ') || 'Aucun'}
                  </Text>
                  <Text style={styles.inactiveTeamInfo}>
                    Score historique : {team.totalScore || 0} pts
                  </Text>
                  <TouchableOpacity
                    style={styles.reactivateButton}
                    onPress={() => handleReactivate(team.id)}
                    disabled={reactivateMutation.isPending}
                  >
                    <Text style={styles.reactivateButtonText}>
                      Réactiver cette équipe
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
              <View style={styles.divider}>
                <Text style={styles.dividerText}>OU</Text>
              </View>
            </View>
          )}

          <View style={styles.form}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Nom de l'équipe *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Les Pêcheurs Pro"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Email du coéquipier (optionnel)</Text>
              <TextInput
                style={styles.input}
                placeholder="email@example.com"
                value={formData.participant2Email}
                onChangeText={(text) => setFormData({ ...formData, participant2Email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
              <Text style={styles.helpText}>
                Vous pouvez créer l'équipe seul et inviter un membre plus tard.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, createMutation.isPending && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <ActivityIndicator color={theme.onAccent} />
              ) : (
                <Text style={styles.submitButtonText}>Créer l'équipe</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const createStyles = (theme: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  scrollContent: {
    flexGrow: 1,
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
    marginBottom: 24,
    color: theme.text,
  },
  message: {
    fontSize: 16,
    color: theme.textMuted,
    marginBottom: 12,
    lineHeight: 24,
  },
  teamName: {
    fontWeight: '600',
    color: theme.accent,
  },
  reactivateSection: {
    marginBottom: 24,
  },
  reactivateTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: theme.text,
  },
  reactivateDescription: {
    fontSize: 14,
    color: theme.textMuted,
    marginBottom: 16,
    lineHeight: 20,
  },
  inactiveTeamCard: {
    backgroundColor: theme.surface,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  inactiveTeamName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: theme.text,
  },
  inactiveTeamInfo: {
    fontSize: 14,
    color: theme.textMuted,
    marginBottom: 4,
  },
  reactivateButton: {
    backgroundColor: theme.accent,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  reactivateButtonText: {
    color: theme.onAccent,
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textMuted,
  },
  form: {
    marginTop: 8,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: theme.text,
  },
  input: {
    backgroundColor: theme.surface,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  helpText: {
    fontSize: 12,
    color: theme.textMuted,
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: theme.accent,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: theme.onAccent,
    fontSize: 18,
    fontWeight: '600',
  },
  button: {
    backgroundColor: theme.accent,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: theme.onAccent,
    fontSize: 16,
    fontWeight: '600',
  },
});
