import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { notificationPreferencesService } from '../services/notificationPreferencesService';
import * as SecureStore from 'expo-secure-store';

// Configuration des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Demande les permissions de notification
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    // Configurer le canal de notification Android (nécessaire pour les notifications en background)
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Notifications STF',
        importance: Notifications.AndroidImportance.MAX, // Importance maximale pour recevoir même quand l'app est fermée
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowAnnouncements: true,
        },
      });
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Permission de notification refusée');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erreur lors de la demande de permission:', error);
    return false;
  }
}

/**
 * Obtient le token Expo Push
 */
export async function getExpoPushToken(): Promise<string | null> {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      return null;
    }

    // Récupérer le Project ID depuis app.json (extra.eas.projectId) ou variable d'environnement
    const projectId = 
      Constants.expoConfig?.extra?.eas?.projectId || 
      process.env.EXPO_PROJECT_ID || 
      null;
    
    if (!projectId) {
      console.warn('EXPO_PROJECT_ID non configuré. Les notifications push peuvent ne pas fonctionner.');
      // Essayer sans projectId (fonctionne en développement local)
      const tokenData = await Notifications.getExpoPushTokenAsync();
      return tokenData.data;
    }
    
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    return tokenData.data;
  } catch (error) {
    console.error('Erreur lors de la récupération du token Expo:', error);
    return null;
  }
}

/**
 * Enregistre le token Expo Push sur le serveur
 */
export async function registerPushToken(): Promise<void> {
  try {
    // Vérifier que l'utilisateur est authentifié avant d'enregistrer le token
    const token = await SecureStore.getItemAsync('jwtToken');
    if (!token) {
      console.log('Token JWT non trouvé, enregistrement du token push reporté');
      return;
    }

    const expoToken = await getExpoPushToken();
    if (expoToken) {
      await notificationPreferencesService.update({ expoPushToken: expoToken });
      console.log('Token Expo Push enregistré avec succès');
    }
  } catch (error: any) {
    // Si c'est une erreur 401, c'est normal si l'utilisateur n'est pas encore authentifié
    if (error.response?.status === 401) {
      console.log('Erreur 401 lors de l\'enregistrement du token push (utilisateur non authentifié)');
      return;
    }
    // Si c'est une erreur 502 (Bad Gateway), c'est probablement un problème temporaire du backend
    // On ne log pas d'erreur pour éviter les logs inutiles
    if (error.response?.status === 502) {
      console.log('Erreur 502 lors de l\'enregistrement du token push (backend temporairement indisponible)');
      return;
    }
    // Pour les autres erreurs, logger mais ne pas bloquer
    console.warn('Erreur lors de l\'enregistrement du token push:', error.response?.status || error.message);
  }
}

/**
 * Configure les listeners de notifications
 */
export function setupNotificationListeners(
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationTapped?: (response: Notifications.NotificationResponse) => void
): () => void {
  // Listener pour les notifications reçues en foreground
  const receivedListener = Notifications.addNotificationReceivedListener((notification) => {
    console.log('Notification reçue:', notification);
    if (onNotificationReceived) {
      onNotificationReceived(notification);
    }
  });

  // Listener pour les notifications tapées
  const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
    console.log('Notification tapée:', response);
    if (onNotificationTapped) {
      onNotificationTapped(response);
    }
  });

  // Retourner une fonction pour nettoyer les listeners
  return () => {
    receivedListener.remove();
    responseListener.remove();
  };
}
