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

    // Fonction pour enregistrer le token avec retry
    const registerTokenWithRetry = async (retries = 3, delay = 1000) => {
      for (let i = 0; i < retries; i++) {
        try {
          await registerPushToken();
          break; // Succès, sortir de la boucle
        } catch (error: any) {
          // Si c'est une erreur 401 ou 502 et qu'il reste des tentatives, réessayer
          if ((error.response?.status === 401 || error.response?.status === 502) && i < retries - 1) {
            console.log(`Tentative ${i + 1}/${retries} échouée (${error.response?.status}), nouvelle tentative dans ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          // Pour les erreurs 502, ne pas logger d'erreur car c'est probablement temporaire
          if (error.response?.status !== 502) {
            console.warn('Erreur lors de l\'enregistrement du token push:', error.response?.status || error.message);
          }
          break;
        }
      }
    };

    // Enregistrer le token push avec retry
    registerTokenWithRetry().catch((error) => {
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
