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
        console.log('Données de la notification:', JSON.stringify(data, null, 2));
        
        // Utiliser setTimeout pour s'assurer que la navigation se fait après le rendu
        setTimeout(() => {
          // Navigation selon le type de notification
          if (data?.type === 'team_invitation' && data?.teamId) {
            console.log('Navigation vers Invitations');
            // @ts-ignore
            navigation.navigate('Invitations');
          } else if (data?.type === 'catch_pending' && data?.catchId) {
            console.log('Navigation vers AdminCatchValidation');
            // @ts-ignore
            navigation.navigate('AdminCatchValidation', { catchId: data.catchId, action: 'view' });
          } else if ((data?.type === 'catch_validated' || data?.type === 'catch_rejected')) {
            // Rediriger vers la page de l'équipe avec la prise concernée
            console.log('Type:', data?.type, 'teamId:', data?.teamId, 'catchId:', data?.catchId);
            if (data?.teamId) {
              console.log('Navigation vers TeamDetail', { id: data.teamId, highlightCatchId: data.catchId });
              try {
                // @ts-ignore
                navigation.navigate('TeamDetail', { id: parseInt(data.teamId), highlightCatchId: parseInt(data.catchId) });
              } catch (error) {
                console.error('Erreur lors de la navigation vers TeamDetail:', error);
              }
            } else {
              console.warn('teamId manquant dans les données de notification');
            }
          } else if (data?.competitionId) {
            console.log('Navigation vers CompetitionDetail');
            // @ts-ignore
            navigation.navigate('CompetitionDetail', { id: data.competitionId });
          } else {
            console.warn('Type de notification non géré ou données manquantes:', data);
          }
        }, 100);
      }
    );

    return cleanup;
  }, [isAuthenticated, navigation]);

  return null;
}
