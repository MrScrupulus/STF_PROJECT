import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { authService } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { setIsAuthenticated } = useAuth();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { data: userResponse, isLoading, isError, error } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const response = await authService.getCurrentUser();
      return response;
    },
    retry: false,
  });

  const user = userResponse?.user;

  const handleLogout = async () => {
    try {
      await authService.logout();
      // Invalider tous les caches React Query pour éviter d'afficher les données de l'ancien utilisateur
      queryClient.clear();
      // Mettre à jour l'état d'authentification pour que App.tsx change le stack
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await authService.deleteAccount();
      Alert.alert('Succès', 'Compte supprimé avec succès');
      // Invalider tous les caches React Query
      queryClient.clear();
      // Mettre à jour l'état d'authentification pour que App.tsx change le stack
      setIsAuthenticated(false);
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Une erreur est survenue lors de la suppression. Veuillez réessayer.';
      Alert.alert('Erreur', message);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  const errStatus = isError && error instanceof AxiosError ? error.response?.status : undefined;
  if (isError && (errStatus === 401 || errStatus === 403)) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.sessionHint}>Session expirée, redirection…</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Utilisateur non trouvé</Text>
      </View>
    );
  }

  return (
    <>
      <Header title="Mon Profil" showBack={true} showMenu={true} />
      <ScrollView style={styles.container}>
        <View style={styles.content}>

        <View style={styles.infoSection}>
          {user.username && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Pseudo:</Text>
              <Text style={styles.infoValue}>{user.username}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nom:</Text>
            <Text style={styles.infoValue}>{user.lastname}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Prénom:</Text>
            <Text style={styles.infoValue}>{user.firstname}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{user.email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Téléphone:</Text>
            <Text style={styles.infoValue}>
              {user.phone_number || 'Non renseigné'}
            </Text>
          </View>
        </View>

        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('EditProfile' as never)}
          >
            <Text style={styles.actionButtonText}>Modifier mon profil</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('ChangePassword' as never)}
          >
            <Text style={styles.actionButtonText}>Modifier le mot de passe</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('History' as never)}
          >
            <Text style={styles.actionButtonText}>Voir mon historique</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Invitations' as never)}
          >
            <Text style={styles.actionButtonText}>Mes invitations</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('NotificationPreferences' as never)}
          >
            <Text style={styles.actionButtonText}>🔔 Préférences notifications</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dangerZone}>
          <Text style={styles.dangerZoneTitle}>Zone dangereuse</Text>
          <Text style={styles.dangerZoneText}>
            La suppression de votre compte est irréversible. Toutes vos données seront définitivement effacées.
          </Text>
          <TouchableOpacity
            style={styles.dangerButton}
            onPress={() => setShowDeleteModal(true)}
          >
            <Text style={styles.dangerButtonText}>Supprimer mon compte</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Déconnexion</Text>
        </TouchableOpacity>
      </View>

      {/* Modal de confirmation de suppression */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirmer la suppression</Text>
            <Text style={styles.modalText}>
              Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.modalButtonCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonConfirm}
                onPress={() => {
                  setShowDeleteModal(false);
                  handleDeleteAccount();
                }}
              >
                <Text style={styles.modalButtonConfirmText}>Confirmer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      </ScrollView>
      <Footer />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    color: '#333',
  },
  infoSection: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  actionsSection: {
    marginBottom: 24,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dangerZone: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#ff3b30',
  },
  dangerZoneTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ff3b30',
    marginBottom: 8,
  },
  dangerZoneText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  dangerButton: {
    backgroundColor: '#ff3b30',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  dangerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#ff3b30',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 16,
  },
  sessionHint: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  modalText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButtonCancel: {
    flex: 1,
    backgroundColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  modalButtonCancelText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonConfirm: {
    flex: 1,
    backgroundColor: '#ff3b30',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  modalButtonConfirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

