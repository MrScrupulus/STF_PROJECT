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
import { useNavigation } from '@react-navigation/native';
import { teamService } from '../services/teamService';
import Header from '../components/Header';
import { formatDateTime } from '../utils/dateUtils';

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
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['my-invitations'],
    queryFn: async () => {
      const response = await teamService.getMyInvitations();
      return response;
    },
  });

  const acceptMutation = useMutation({
    mutationFn: (invitationId: number) => teamService.acceptInvitation(invitationId),
    onSuccess: (_, invitationId) => {
      queryClient.invalidateQueries({ queryKey: ['my-invitations'] });
      queryClient.invalidateQueries({ queryKey: ['my-teams'] });
      queryClient.invalidateQueries({ queryKey: ['team'] });
      Alert.alert('Succès', 'Invitation acceptée ! Vous êtes maintenant membre de l\'équipe.', [
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
      Alert.alert('Succès', 'Invitation rejetée');
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
        <ActivityIndicator size="large" color="#007AFF" />
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

  return (
    <>
      <Header title="Mes Invitations" showBack={true} showMenu={true} />
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      >
        <View style={styles.content}>
          {invitations.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Aucune invitation en attente</Text>
              <Text style={styles.emptySubtext}>
                Créez une équipe ou attendez qu'un membre vous invite à rejoindre son équipe.
              </Text>
            </View>
          ) : (
            invitations.map((invitation) => (
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
            ))
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
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
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
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  invitationCard: {
    backgroundColor: '#fff',
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
    color: '#1f2937',
    flex: 1,
  },
  invitationDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  invitationBody: {
    marginBottom: 16,
  },
  invitationText: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  invitedByText: {
    fontWeight: '600',
    color: '#1f2937',
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
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  rejectButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  rejectButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
  },
});
