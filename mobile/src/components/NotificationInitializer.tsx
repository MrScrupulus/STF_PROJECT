import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { registerPushToken, setupNotificationListeners } from '../utils/notifications';
import { navigateFromNotificationData } from '../utils/notificationNavigation';
import * as Notifications from 'expo-notifications';

export default function NotificationInitializer() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const registerTokenWithRetry = async (retries = 4, delay = 1500) => {
      for (let i = 0; i < retries; i++) {
        try {
          await registerPushToken();
          break;
        } catch (error: any) {
          if (i < retries - 1) {
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }
          break;
        }
      }
    };

    registerTokenWithRetry().catch(() => {});

    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        registerTokenWithRetry().catch(() => {});
      }
    });

    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (!response) return;
        const data = response.notification.request.content.data as Record<string, unknown> | undefined;
        if (data) {
          setTimeout(() => navigateFromNotificationData(data as any), 250);
        }
      })
      .catch(() => {});

    const cleanup = setupNotificationListeners(
      () => {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
        queryClient.invalidateQueries({ queryKey: ['competitions'] });
        queryClient.invalidateQueries({ queryKey: ['competition'] });
        queryClient.invalidateQueries({ queryKey: ['admin-pending-catches'] });
        queryClient.invalidateQueries({ queryKey: ['catches'] });
      },
      (response) => {
        const data = response.notification.request.content.data as Record<string, unknown> | undefined;
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
        setTimeout(() => navigateFromNotificationData(data as any), 100);
      }
    );

    return () => {
      appStateSub.remove();
      cleanup();
    };
  }, [isAuthenticated, queryClient]);

  return null;
}
