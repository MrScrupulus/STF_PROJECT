import React, { useState } from 'react';
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
  Modal,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRoute, useNavigation } from '@react-navigation/native';
import { adminService, PendingCatch } from '../services/adminService';
import { formatDateTime } from '../utils/dateUtils';
import Header from '../components/Header';

export default function AdminCatchValidationScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { catchId, action } = route.params as { catchId: number; action: 'view' | 'reject' };

  const [rejectionReason, setRejectionReason] = useState('');
  const [showImageModal, setShowImageModal] = useState(false);

  const { data: catchData, isLoading } = useQuery({
    queryKey: ['admin-catch', catchId],
    queryFn: () => adminService.getCatchById(catchId),
    enabled: !!catchId,
  });

  const validateMutation = useMutation({
    mutationFn: () => adminService.validateCatch(catchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-catches'] });
      queryClient.invalidateQueries({ queryKey: ['admin-catch', catchId] });
      Alert.alert('Succès', 'Prise validée avec succès !', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Une erreur est survenue lors de la validation. Veuillez réessayer.';
      Alert.alert('Erreur', message);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (reason: string) => adminService.rejectCatch(catchId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-catches'] });
      queryClient.invalidateQueries({ queryKey: ['admin-catch', catchId] });
      Alert.alert('Succès', 'Prise rejetée avec succès !', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Une erreur est survenue lors du rejet. Veuillez réessayer.';
      Alert.alert('Erreur', message);
    },
  });

  const handleValidate = () => {
    Alert.alert(
      'Valider la prise',
      'Êtes-vous sûr de vouloir valider cette prise ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Valider',
          onPress: () => validateMutation.mutate(),
        },
      ]
    );
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      Alert.alert('Erreur', 'Veuillez indiquer un motif de rejet');
      return;
    }
    Alert.alert(
      'Rejeter la prise',
      'Êtes-vous sûr de vouloir rejeter cette prise ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Rejeter',
          style: 'destructive',
          onPress: () => rejectMutation.mutate(rejectionReason),
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <>
        <Header title="Détail de la prise" showBack={true} showMenu={true} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </>
    );
  }

  if (!catchData) {
    return (
      <>
        <Header title="Détail de la prise" showBack={true} showMenu={true} />
        <View style={styles.center}>
          <Text style={styles.errorText}>Prise non trouvée</Text>
          <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
            <Text style={styles.buttonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  return (
    <>
      <Header title="Détail de la prise" showBack={true} showMenu={true} />
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          {/* Informations principales */}
          <View style={styles.card}>
            <Text style={styles.label}>Espèce</Text>
            <Text style={styles.value}>{catchData.species?.name || 'N/A'}</Text>

            <Text style={styles.label}>Taille</Text>
            <Text style={styles.value}>{catchData.size} cm</Text>

            <Text style={styles.label}>Points</Text>
            <Text style={styles.value}>{catchData.points} pts</Text>

            <Text style={styles.label}>Équipe</Text>
            <Text style={styles.value}>{catchData.team?.name || 'N/A'}</Text>
            {catchData.team?.registrationNumber && (
              <>
                <Text style={styles.label}>Numéro d'inscription</Text>
                <Text style={styles.value}>N° {catchData.team.registrationNumber}</Text>
              </>
            )}

            {catchData.caughtBy && (
              <>
                <Text style={styles.label}>Pêché par</Text>
                <Text style={styles.value}>
                  {catchData.caughtBy.firstname} {catchData.caughtBy.lastname}
                </Text>
              </>
            )}

            <Text style={styles.label}>Date</Text>
            <Text style={styles.value}>
              {formatDateTime(catchData.createdAt)}
            </Text>

            {catchData.comment && (
              <>
                <Text style={styles.label}>Commentaire</Text>
                <Text style={styles.value}>{catchData.comment}</Text>
              </>
            )}
          </View>

          {/* Photo */}
          {catchData.photoUrl && (
            <View style={styles.card}>
              <Text style={styles.label}>Photo</Text>
              <TouchableOpacity onPress={() => setShowImageModal(true)}>
                <Image
                  source={{ uri: catchData.photoUrl }}
                  style={styles.thumbnail}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            </View>
          )}

          {/* Formulaire de rejet */}
          {action === 'reject' && (
            <View style={styles.card}>
              <Text style={styles.label}>Motif de rejet *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Indiquez le motif de rejet..."
                value={rejectionReason}
                onChangeText={setRejectionReason}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            {action === 'view' && (
              <>
                <TouchableOpacity
                  style={[styles.actionButton, styles.validateButton]}
                  onPress={handleValidate}
                  disabled={validateMutation.isPending}
                >
                  {validateMutation.isPending ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.actionButtonText}>✓ Valider</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.rejectButton]}
                  onPress={() => setRejectionReason('')}
                >
                  <Text style={styles.actionButtonText}>✗ Rejeter</Text>
                </TouchableOpacity>
              </>
            )}
            {action === 'reject' && (
              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton, styles.fullWidth]}
                onPress={handleReject}
                disabled={rejectMutation.isPending || !rejectionReason.trim()}
              >
                {rejectMutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.actionButtonText}>Confirmer le rejet</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Modal pour la photo */}
      <Modal
        visible={showImageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImageModal(false)}
      >
        <View style={styles.imageModalOverlay}>
          <TouchableOpacity
            style={styles.imageModalClose}
            onPress={() => setShowImageModal(false)}
          >
            <Text style={styles.imageModalCloseText}>✕</Text>
          </TouchableOpacity>
          {catchData.photoUrl && (
            <Image
              source={{ uri: catchData.photoUrl }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
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
  card: {
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
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginTop: 12,
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: '#333',
  },
  thumbnail: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  fullWidth: {
    flex: 1,
  },
  validateButton: {
    backgroundColor: '#34C759',
  },
  rejectButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  imageModalOverlay: {
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalCloseText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
});
