import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation, useRoute } from '@react-navigation/native';
import { teamService } from '../services/teamService';
import Header from '../components/Header';
import { formatDateTime } from '../utils/dateUtils';
import { useThemeColors } from '../contexts/ThemeContext';
import { type ThemeColors } from '../theme';

interface Invitation {
  id: number;
  team: {
    id: number;
    name: string;
  };
  invitedBy: {
    id: number;
    firstname: string;
    lastname: string;
    email: string;
  };
  status: string;
  createdAt: string;
}

export default function InvitationsScreen() {
  const theme = useThemeColors();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const navigation = useNavigation();
  const route = useRoute<any>();
  const queryClient = useQueryClient();
  const tokenHandled = React.useRef(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['my-invitations'],
    queryFn: async () => {
      const [teams, staff] = await Promise.all([
        teamService.getMyInvitations(),
        teamService.getMyStaffInvitations(),
      ]);
      return {
        invitations: teams?.invitations || [],
        staffInvitations: staff?.invitations || [],
      };
    },
  });

  const acceptStaffMutation = useMutation({
    mutationFn: (invitationId: number) => teamService.acceptStaffInvitation(invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-invitations'] });
      queryClient.invalidateQueries({ queryKey: ['competition-staff'] });
      Alert.alert('Succès', 'Vous êtes commissaire sur cette compétition.');
    },
    onError: (error: any) => {
      Alert.alert('Erreur', error.response?.data?.message || "Impossible d'accepter l'invitation.");
    },
  });

  React.useEffect(() => {
    if (tokenHandled.current) {
      return;
    }
    const acceptToken = route.params?.acceptStaff as string | undefined;
    const rejectToken = route.params?.rejectStaff as string | undefined;
    if (!acceptToken && !rejectToken) {
      return;
    }
    tokenHandled.current = true;
    const run = async () => {
      try {
        if (acceptToken) {
          await teamService.acceptStaffInvitationByToken(acceptToken);
          queryClient.invalidateQueries({ queryKey: ['my-invitations'] });
          queryClient.invalidateQueries({ queryKey: ['competition-staff'] });
          Alert.alert('Succès', 'Vous êtes commissaire sur cette compétition.');
        } else if (rejectToken) {
          await teamService.rejectStaffInvitationByToken(rejectToken);
          queryClient.invalidateQueries({ queryKey: ['my-invitations'] });
          Alert.alert('Succès', 'Invitation commissaire refusée.');
        }
      } catch (error: any) {
        Alert.alert(
          'Erreur',
          error.response?.data?.message || error.message || "Impossible de traiter le lien d'invitation."
        );
      } finally {
        navigation.setParams({ acceptStaff: undefined, rejectStaff: undefined } as never);
      }
    };
    run();
  }, [route.params, queryClient, navigation]);

  const rejectStaffMutation = useMutation({
    mutationFn: (invitationId: number) => teamService.rejectStaffInvitation(invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-invitations'] });
      Alert.alert('Succès', 'Invitation commissaire refusée.');
    },
    onError: (error: any) => {
      Alert.alert('Erreur', error.response?.data?.message || "Impossible de refuser l'invitation.");
    },
  });

  const acceptMutation = useMutation({
    mutationFn: (invitationId: number) => teamService.acceptInvitation(invitationId),
    onSuccess: (_, invitationId) => {
      queryClient.invalidateQueries({ queryKey: ['my-invitations'] });
      queryClient.invalidateQueries({ queryKey: ['my-teams'] });
      queryClient.invalidateQueries({ queryKey: ['team'] });
      Alert.alert('Succès', 'Invitation acceptée. Vous êtes maintenant membre de l\'équipe.', [
        {
          text: 'Voir mon équipe',
          onPress: () => {
            const invitation = data?.invitations?.find((inv: Invitation) => inv.id === invitationId);
            if (invitation) {
              // @ts-ignore - navigation.navigate exists but TypeScript doesn't recognize it
              navigation.navigate('TeamDetail', { id: invitation.team.id });
            }
          },
        },
        { text: 'OK' },
      ]);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Une erreur est survenue lors de l\'acceptation de l\'invitation. Veuillez réessayer.';
      Alert.alert('Erreur', message);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (invitationId: number) => teamService.rejectInvitation(invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-invitations'] });
      Alert.alert('Succès', 'Invitation rejetée.');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Une erreur est survenue lors du rejet de l\'invitation. Veuillez réessayer.';
      Alert.alert('Erreur', message);
    },
  });

  const handleAccept = (invitation: Invitation) => {
    Alert.alert(
      'Accepter l\'invitation',
      `Voulez-vous rejoindre l'équipe "${invitation.team.name}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Accepter',
          onPress: () => acceptMutation.mutate(invitation.id),
        },
      ]
    );
  };

  const handleReject = (invitation: Invitation) => {
    Alert.alert(
      'Rejeter l\'invitation',
      `Voulez-vous rejeter l'invitation de l'équipe "${invitation.team.name}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Rejeter',
          style: 'destructive',
          onPress: () => rejectMutation.mutate(invitation.id),
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Header title="Mes Invitations" showBack={true} showMenu={true} />
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Header title="Mes Invitations" showBack={true} showMenu={true} />
        <Text style={styles.errorText}>Erreur lors du chargement des invitations</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const invitations: Invitation[] = data?.invitations || [];
  const staffInvitations = data?.staffInvitations || [];

  return (
    <>
      <Header title="Mes Invitations" showBack={true} showMenu={true} />
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      >
        <View style={styles.content}>
          {invitations.length === 0 && staffInvitations.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Aucune invitation en attente</Text>
              <Text style={styles.emptySubtext}>
                Créez une équipe ou attendez qu'un membre vous invite à rejoindre son équipe.
              </Text>
            </View>
          ) : (
            <>
            {staffInvitations.map((invitation: any) => (
              <View key={`staff-${invitation.id}`} style={styles.invitationCard}>
                <View style={styles.invitationHeader}>
                  <Text style={styles.teamName}>{invitation.competition?.name}</Text>
                  <Text style={styles.invitationDate}>
                    {formatDateTime(invitation.createdAt)}
                  </Text>
                </View>
                <View style={styles.invitationBody}>
                  <Text style={styles.invitationText}>
                    <Text style={styles.invitedByText}>
                      {invitation.invitedBy?.firstname} {invitation.invitedBy?.lastname}
                    </Text>
                    {' vous invite comme commissaire'}
                  </Text>
                </View>
                <View style={styles.invitationActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() =>
                      Alert.alert('Refuser', 'Refuser d’être commissaire ?', [
                        { text: 'Annuler', style: 'cancel' },
                        {
                          text: 'Refuser',
                          style: 'destructive',
                          onPress: () => rejectStaffMutation.mutate(invitation.id),
                        },
                      ])
                    }
                    disabled={rejectStaffMutation.isPending}
                  >
                    <Text style={styles.rejectButtonText}>Refuser</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.acceptButton]}
                    onPress={() =>
                      Alert.alert('Accepter', `Devenir commissaire sur « ${invitation.competition?.name} » ?`, [
                        { text: 'Annuler', style: 'cancel' },
                        {
                          text: 'Accepter',
                          onPress: () => acceptStaffMutation.mutate(invitation.id),
                        },
                      ])
                    }
                    disabled={acceptStaffMutation.isPending}
                  >
                    <Text style={styles.acceptButtonText}>Accepter</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            {invitations.map((invitation) => (
              <View key={invitation.id} style={styles.invitationCard}>
                <View style={styles.invitationHeader}>
                  <Text style={styles.teamName}>{invitation.team.name}</Text>
                  <Text style={styles.invitationDate}>
                    {formatDateTime(invitation.createdAt)}
                  </Text>
                </View>

                <View style={styles.invitationBody}>
                  <Text style={styles.invitationText}>
                    <Text style={styles.invitedByText}>
                      {invitation.invitedBy.firstname} {invitation.invitedBy.lastname}
                    </Text>
                    {' vous invite à rejoindre son équipe'}
                  </Text>
                </View>

                <View style={styles.invitationActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() => handleReject(invitation)}
                    disabled={rejectMutation.isPending}
                  >
                    <Text style={styles.rejectButtonText}>Refuser</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.acceptButton]}
                    onPress={() => handleAccept(invitation)}
                    disabled={acceptMutation.isPending}
                  >
                    <Text style={styles.acceptButtonText}>Accepter</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            </>
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
    backgroundColor: theme.bg,
  },
  errorText: {
    color: theme.danger,
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: theme.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: theme.onAccent,
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
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
  invitationCard: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  invitationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  teamName: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
    flex: 1,
  },
  invitationDate: {
    fontSize: 12,
    color: theme.textMuted,
  },
  invitationBody: {
    marginBottom: 16,
  },
  invitationText: {
    fontSize: 14,
    color: theme.textMuted,
    lineHeight: 20,
  },
  invitedByText: {
    fontWeight: '600',
    color: theme.text,
  },
  invitationActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButton: {
    backgroundColor: '#10b981',
  },
  acceptButtonText: {
    color: theme.onAccent,
    fontSize: 16,
    fontWeight: '600',
  },
  rejectButton: {
    backgroundColor: theme.surfaceRaised,
    borderWidth: 1,
    borderColor: theme.border,
  },
  rejectButtonText: {
    color: theme.textMuted,
    fontSize: 16,
    fontWeight: '600',
  },
});
