import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { notificationService, Notification } from '../services/notificationService';
import { formatRelativeTime } from '../utils/dateUtils';
import Header from '../components/Header';
import FaIcon, { type AppIconName } from '../components/FaIcon';
import { useThemeColors } from '../contexts/ThemeContext';
import { type ThemeColors } from '../theme';

export default function NotificationsScreen() {
  const theme = useThemeColors();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const { data: notificationsData, isLoading, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationService.getAll(),
    refetchInterval: 30000, // Rafraîchir toutes les 30 secondes
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: number) => notificationService.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const getNotificationIcon = (type: string): AppIconName => {
    const icons: { [key: string]: AppIconName } = {
      catch_validated: 'circleCheck',
      catch_rejected: 'circleXmark',
      catch_pending: 'hourglass',
      team_invitation: 'users',
      competition_registered: 'file',
      competition_started: 'rocket',
      competition_ended: 'flagCheckered',
      competition_paused: 'pause',
      competition_resumed: 'play',
    };
    return icons[type] || 'bell';
  };

  const handleNotificationPress = (notification: Notification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
  };

  const notifications = notificationsData?.notifications || [];
  const unreadCount = notificationsData?.unreadCount || 0;

  return (
    <>
      <Header title="Notifications" showBack={true} showMenu={true} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={theme.accent} />
          </View>
        ) : (
          <>
            {unreadCount > 0 && (
              <View style={styles.headerActions}>
                <TouchableOpacity
                  style={styles.markAllButton}
                  onPress={() => markAllAsReadMutation.mutate()}
                  disabled={markAllAsReadMutation.isPending}
                >
                  <Text style={styles.markAllButtonText}>
                    {markAllAsReadMutation.isPending
                      ? '...'
                      : `Marquer tout comme lu (${unreadCount})`}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {notifications.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Aucune notification</Text>
                <Text style={styles.emptySubtext}>
                  Vous serez notifié(e) des événements importants (invitations, validations, etc.).
                </Text>
              </View>
            ) : (
              <View style={styles.notificationsList}>
                {notifications.map((notification) => (
                  <TouchableOpacity
                    key={notification.id}
                    style={[
                      styles.notificationItem,
                      !notification.isRead && styles.notificationItemUnread,
                    ]}
                    onPress={() => handleNotificationPress(notification)}
                  >
                    <View style={styles.notificationIcon}>
                      <FaIcon name={getNotificationIcon(notification.type)} size={18} color={theme.accent} />
                    </View>
                    <View style={styles.notificationContent}>
                      <Text
                        style={[
                          styles.notificationMessage,
                          !notification.isRead && styles.notificationMessageUnread,
                        ]}
                      >
                        {notification.message}
                      </Text>
                      <Text style={styles.notificationTime}>
                        {formatRelativeTime(notification.createdAt)}
                      </Text>
                    </View>
                    {!notification.isRead && <View style={styles.unreadDot} />}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}
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
    minHeight: 200,
  },
  headerActions: {
    marginBottom: 16,
  },
  markAllButton: {
    backgroundColor: theme.accent,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  markAllButtonText: {
    color: theme.onAccent,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: theme.textMuted,
  },
  notificationsList: {
    gap: 12,
  },
  notificationItem: {
    flexDirection: 'row',
    backgroundColor: theme.surface,
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  notificationItemUnread: {
    backgroundColor: '#eff6ff',
    borderLeftColor: '#3b82f6',
  },
  notificationIcon: {
    marginRight: 12,
    justifyContent: 'center',
  },
  notificationIconText: {
    fontSize: 24,
  },
  notificationContent: {
    flex: 1,
  },
  notificationMessage: {
    fontSize: 15,
    color: theme.text,
    marginBottom: 4,
    lineHeight: 20,
  },
  notificationMessageUnread: {
    fontWeight: '600',
  },
  notificationTime: {
    fontSize: 12,
    color: theme.textMuted,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3b82f6',
    alignSelf: 'center',
    marginLeft: 8,
  },
});
