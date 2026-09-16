import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { notificationPreferencesService, NotificationPreferences } from '../services/notificationPreferencesService';
import { authService } from '../services/authService';
import Header from '../components/Header';
import { useThemeColors } from '../contexts/ThemeContext';
import { type ThemeColors } from '../theme';

export default function NotificationPreferencesScreen() {
  const theme = useThemeColors();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const [isAdmin, setIsAdmin] = useState(false);

  const { data: preferencesResponse, isLoading } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: () => notificationPreferencesService.get(),
  });

  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const response = await authService.getCurrentUser();
        const user = response.user || response;
        setIsAdmin(user.roles?.includes('ROLE_ADMIN') || false);
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    };
    checkAdmin();
  }, []);

  useEffect(() => {
    if (preferencesResponse?.preferences) {
      setPreferences(preferencesResponse.preferences);
    }
  }, [preferencesResponse]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<NotificationPreferences>) =>
      notificationPreferencesService.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
      Alert.alert('Succès', 'Préférences mises à jour avec succès.');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Une erreur est survenue lors de la mise à jour. Veuillez réessayer.';
      Alert.alert('Erreur', message);
    },
  });

  const handleToggle = (key: keyof NotificationPreferences) => {
    if (!preferences) return;
    const newPreferences = { ...preferences, [key]: !preferences[key] };
    setPreferences(newPreferences);
    updateMutation.mutate({ [key]: newPreferences[key] });
  };

  if (isLoading || !preferences) {
    return (
      <>
        <Header title="Préférences notifications" showBack={true} showMenu={false} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      </>
    );
  }

  return (
    <>
      <Header title="Préférences notifications" showBack={true} showMenu={false} />
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Notifications générales</Text>
          <Text style={styles.sectionDescription}>
            Choisissez les types de notifications que vous souhaitez recevoir
          </Text>

          <View style={styles.preferenceItem}>
            <View style={styles.preferenceInfo}>
              <Text style={styles.preferenceLabel}>Notifications par email</Text>
              <Text style={styles.preferenceDescription}>
                Recevoir également les notifications par email (en plus des notifications push)
              </Text>
            </View>
            <Switch
              value={preferences.receiveEmailNotifications ?? true}
              onValueChange={() => handleToggle('receiveEmailNotifications')}
            />
          </View>

          {/* Notifications générales */}
          <View style={styles.preferenceItem}>
            <View style={styles.preferenceInfo}>
              <Text style={styles.preferenceLabel}>Prise validée</Text>
              <Text style={styles.preferenceDescription}>
                Recevoir une notification quand votre prise est validée
              </Text>
            </View>
            <Switch
              value={preferences.catchValidated}
              onValueChange={() => handleToggle('catchValidated')}
            />
          </View>

          <View style={styles.preferenceItem}>
            <View style={styles.preferenceInfo}>
              <Text style={styles.preferenceLabel}>Prise rejetée</Text>
              <Text style={styles.preferenceDescription}>
                Recevoir une notification quand votre prise est rejetée
              </Text>
            </View>
            <Switch
              value={preferences.catchRejected}
              onValueChange={() => handleToggle('catchRejected')}
            />
          </View>

          <View style={styles.preferenceItem}>
            <View style={styles.preferenceInfo}>
              <Text style={styles.preferenceLabel}>Invitation d'équipe</Text>
              <Text style={styles.preferenceDescription}>
                Recevoir une notification quand vous êtes invité à rejoindre une équipe
              </Text>
            </View>
            <Switch
              value={preferences.teamInvitation}
              onValueChange={() => handleToggle('teamInvitation')}
            />
          </View>

          <View style={styles.preferenceItem}>
            <View style={styles.preferenceInfo}>
              <Text style={styles.preferenceLabel}>Inscription compétition</Text>
              <Text style={styles.preferenceDescription}>
                Recevoir une notification quand votre équipe s'inscrit à une compétition
              </Text>
            </View>
            <Switch
              value={preferences.competitionRegistered}
              onValueChange={() => handleToggle('competitionRegistered')}
            />
          </View>

          <View style={styles.preferenceItem}>
            <View style={styles.preferenceInfo}>
              <Text style={styles.preferenceLabel}>Début de compétition</Text>
              <Text style={styles.preferenceDescription}>
                Recevoir une notification quand une compétition commence
              </Text>
            </View>
            <Switch
              value={preferences.competitionStarted}
              onValueChange={() => handleToggle('competitionStarted')}
            />
          </View>

          <View style={styles.preferenceItem}>
            <View style={styles.preferenceInfo}>
              <Text style={styles.preferenceLabel}>Fin de compétition</Text>
              <Text style={styles.preferenceDescription}>
                Recevoir une notification quand une compétition se termine
              </Text>
            </View>
            <Switch
              value={preferences.competitionEnded}
              onValueChange={() => handleToggle('competitionEnded')}
            />
          </View>

          <View style={styles.preferenceItem}>
            <View style={styles.preferenceInfo}>
              <Text style={styles.preferenceLabel}>Compétition en pause</Text>
              <Text style={styles.preferenceDescription}>
                Recevoir une notification quand une compétition est mise en pause
              </Text>
            </View>
            <Switch
              value={preferences.competitionPaused}
              onValueChange={() => handleToggle('competitionPaused')}
            />
          </View>

          <View style={styles.preferenceItem}>
            <View style={styles.preferenceInfo}>
              <Text style={styles.preferenceLabel}>Compétition reprise</Text>
              <Text style={styles.preferenceDescription}>
                Recevoir une notification quand une compétition reprend
              </Text>
            </View>
            <Switch
              value={preferences.competitionResumed}
              onValueChange={() => handleToggle('competitionResumed')}
            />
          </View>

          {/* Notifications admin uniquement */}
          {isAdmin && (
            <>
              <Text style={[styles.sectionTitle, styles.adminSectionTitle]}>
                Notifications administrateur
              </Text>
              <Text style={styles.sectionDescription}>
                Notifications spécifiques aux administrateurs
              </Text>

              <View style={styles.preferenceItem}>
                <View style={styles.preferenceInfo}>
                  <Text style={styles.preferenceLabel}>Prise en attente</Text>
                  <Text style={styles.preferenceDescription}>
                    Recevoir une notification quand une nouvelle prise est en attente de validation
                  </Text>
                </View>
                <Switch
                  value={preferences.catchPending}
                  onValueChange={() => handleToggle('catchPending')}
                />
              </View>
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.text,
    marginTop: 8,
    marginBottom: 8,
  },
  adminSectionTitle: {
    marginTop: 24,
    color: theme.accent,
  },
  sectionDescription: {
    fontSize: 14,
    color: theme.textMuted,
    marginBottom: 16,
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.surface,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  preferenceInfo: {
    flex: 1,
    marginRight: 16,
  },
  preferenceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 4,
  },
  preferenceDescription: {
    fontSize: 12,
    color: theme.textMuted,
    lineHeight: 16,
  },
});
