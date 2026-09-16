import React, { useState } from 'react';
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
import FaIcon, { type AppIconName } from '../components/FaIcon';
import { useThemeColors } from '../contexts/ThemeContext';
import { type ThemeColors } from '../theme';

export default function ProfileScreen() {
  const theme = useThemeColors();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

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
      queryClient.clear();
      setIsAuthenticated(false);
    } catch (err) {
      console.error('Erreur lors de la déconnexion:', err);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await authService.deleteAccount();
      Alert.alert('Succès', 'Compte supprimé avec succès');
      queryClient.clear();
      setIsAuthenticated(false);
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Une erreur est survenue lors de la suppression. Veuillez réessayer.';
      Alert.alert('Erreur', message);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  const errStatus = isError && error instanceof AxiosError ? error.response?.status : undefined;
  if (isError && (errStatus === 401 || errStatus === 403)) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.accent} />
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

  const displayName = [user.firstname, user.lastname].filter(Boolean).join(' ') || user.username || 'Mon profil';
  const initials = [user.firstname, user.lastname]
    .filter(Boolean)
    .map((part: string) => part.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2) || (user.username ? user.username.charAt(0).toUpperCase() : '?');

  const go = (screen: string, params?: object) => {
    // @ts-ignore
    navigation.navigate(screen, params);
  };

  const tiles: { label: string; hint: string; icon: AppIconName; onPress: () => void }[] = [
    {
      label: 'Modifier',
      hint: 'Profil',
      icon: 'edit',
      onPress: () => go('EditProfile'),
    },
    {
      label: 'Sécurité',
      hint: 'Mot de passe',
      icon: 'lock',
      onPress: () => go('ChangePassword'),
    },
    {
      label: 'Historique',
      hint: 'Prises & stats',
      icon: 'history',
      onPress: () => go('History', { initialTab: 'stats' }),
    },
    {
      label: 'Invitations',
      hint: 'Équipes',
      icon: 'envelope',
      onPress: () => go('Invitations'),
    },
  ];

  const rows: { label: string; hint: string; icon: AppIconName; onPress: () => void }[] = [
    {
      label: 'Réglages',
      hint: 'Préférences de l’application',
      icon: 'gear',
      onPress: () => go('Settings'),
    },
    {
      label: 'Notifications et e-mails',
      hint: 'Push, alertes et mails',
      icon: 'bell',
      onPress: () => go('NotificationPreferences'),
    },
  ];

  return (
    <>
      <Header title="Mon Profil" showBack={true} showMenu={true} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.identityCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.identityText}>
            <Text style={styles.displayName}>{displayName}</Text>
            {user.username ? <Text style={styles.username}>@{user.username}</Text> : null}
            <Text style={styles.identityEmail}>{user.email}</Text>
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Informations</Text>
          {user.username ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Pseudo</Text>
              <Text style={styles.infoValue}>{user.username}</Text>
            </View>
          ) : null}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nom</Text>
            <Text style={styles.infoValue}>{user.lastname}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Prénom</Text>
            <Text style={styles.infoValue}>{user.firstname}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user.email}</Text>
          </View>
          <View style={[styles.infoRow, styles.infoRowLast]}>
            <Text style={styles.infoLabel}>Téléphone</Text>
            <Text style={styles.infoValue}>{user.phone_number || 'Non renseigné'}</Text>
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

        <View style={styles.listCard}>
          {rows.map((row, index) => (
            <TouchableOpacity
              key={row.label}
              style={[styles.listRow, index === rows.length - 1 && styles.listRowLast]}
              onPress={row.onPress}
              activeOpacity={0.7}
            >
              <View style={styles.listIcon}>
                <FaIcon name={row.icon} size={18} color={theme.accent} />
              </View>
              <View style={styles.listText}>
                <Text style={styles.listLabel}>{row.label}</Text>
                <Text style={styles.listHint}>{row.hint}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.75}>
          <FaIcon name="logout" size={18} color={theme.danger} />
          <Text style={styles.logoutButtonText}>Déconnexion</Text>
        </TouchableOpacity>

        <View style={styles.dangerZone}>
          <Text style={styles.dangerZoneTitle}>Zone dangereuse</Text>
          <Text style={styles.dangerZoneText}>
            La suppression de votre compte est irréversible. Toutes vos données seront
            définitivement effacées.
          </Text>
          <TouchableOpacity
            style={styles.dangerButton}
            onPress={() => setShowDeleteModal(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.dangerButtonText}>Supprimer mon compte</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

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
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: theme.onAccent,
    fontSize: 22,
    fontWeight: '700',
  },
  identityText: {
    flex: 1,
  },
  displayName: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.text,
  },
  username: {
    fontSize: 14,
    color: theme.accent,
    marginTop: 2,
  },
  identityEmail: {
    fontSize: 14,
    color: theme.textMuted,
    marginTop: 4,
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
  infoSection: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    gap: 12,
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  infoLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.textMuted,
  },
  infoValue: {
    fontSize: 15,
    color: theme.text,
    flex: 1,
    textAlign: 'right',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
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
  listCard: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
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
  listText: {
    flex: 1,
  },
  listLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  listHint: {
    fontSize: 13,
    color: theme.textMuted,
    marginTop: 2,
  },
  chevron: {
    fontSize: 22,
    color: theme.textMuted,
    fontWeight: '300',
    marginLeft: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.surface,
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: '#ffd0cd',
  },
  logoutButtonText: {
    color: theme.danger,
    fontSize: 16,
    fontWeight: '700',
  },
  dangerZone: {
    backgroundColor: '#fff5f5',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ffc9c6',
  },
  dangerZoneTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.danger,
    marginBottom: 8,
  },
  dangerZoneText: {
    fontSize: 14,
    color: theme.textMuted,
    marginBottom: 16,
    lineHeight: 20,
  },
  dangerButton: {
    backgroundColor: theme.danger,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  dangerButtonText: {
    color: theme.onAccent,
    fontSize: 16,
    fontWeight: '700',
  },
  errorText: {
    color: theme.danger,
    fontSize: 16,
  },
  sessionHint: {
    marginTop: 12,
    fontSize: 14,
    color: theme.textMuted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 24,
    width: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: theme.text,
  },
  modalText: {
    fontSize: 16,
    color: theme.textMuted,
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
    backgroundColor: theme.surfaceRaised,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  modalButtonCancelText: {
    color: theme.text,
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonConfirm: {
    flex: 1,
    backgroundColor: theme.danger,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  modalButtonConfirmText: {
    color: theme.onAccent,
    fontSize: 16,
    fontWeight: '600',
  },
});
