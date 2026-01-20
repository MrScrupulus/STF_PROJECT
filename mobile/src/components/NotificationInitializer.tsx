import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { registerPushToken, setupNotificationListeners } from '../utils/notifications';
import { useNavigation } from '@react-navigation/native';

/**
 * Composant qui initialise les notifications push quand l'utilisateur est connecté
 */
export default function NotificationInitializer() {
  const { isAuthenticated } = useAuth();
  const navigation = useNavigation();

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    // Enregistrer le token push
    registerPushToken().catch((error) => {
      console.error('Erreur lors de l\'enregistrement du token push:', error);
    });

    // Configurer les listeners de notifications
    const cleanup = setupNotificationListeners(
      (notification) => {
        console.log('Notification reçue:', notification);
        // Vous pouvez ajouter une logique ici pour afficher une alerte ou mettre à jour l'UI
      },
      (response) => {
        console.log('Notification tapée:', response);
        const data = response.notification.request.content.data;
        
        // Navigation selon le type de notification
        if (data?.type === 'team_invitation' && data?.teamId) {
          // @ts-ignore
          navigation.navigate('Invitations');
        } else if (data?.type === 'catch_pending' && data?.catchId) {
          // @ts-ignore
          navigation.navigate('AdminCatchValidation', { catchId: data.catchId, action: 'view' });
        } else if (data?.competitionId) {
          // @ts-ignore
          navigation.navigate('CompetitionDetail', { id: data.competitionId });
        }
      }
    );

    return cleanup;
  }, [isAuthenticated, navigation]);

  return null;
}
