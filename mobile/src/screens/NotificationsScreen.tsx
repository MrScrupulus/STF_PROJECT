import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Animated,
  PanResponder,
  FlatList,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService, Notification } from '../services/notificationService';
import { formatRelativeTime } from '../utils/dateUtils';
import Header from '../components/Header';
import FaIcon, { type AppIconName } from '../components/FaIcon';
import { navigateFromNotificationData } from '../utils/notificationNavigation';
import { useThemeColors } from '../contexts/ThemeContext';
import { type ThemeColors } from '../theme';

const SWIPE_ACTION_WIDTH = 72;

function SwipeToDeleteRow({
  children,
  onDelete,
  theme,
}: {
  children: React.ReactNode;
  onDelete: () => void;
  theme: ThemeColors;
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const startX = useRef(0);

  const snapTo = (toValue: number) => {
    Animated.spring(translateX, {
      toValue,
      useNativeDriver: true,
      bounciness: 0,
      speed: 20,
    }).start();
  };

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy) * 1.4,
      onPanResponderGrant: () => {
        translateX.stopAnimation((v) => {
          startX.current = v;
        });
      },
      onPanResponderMove: (_, g) => {
        const next = Math.min(0, Math.max(-SWIPE_ACTION_WIDTH, startX.current + g.dx));
        translateX.setValue(next);
      },
      onPanResponderRelease: (_, g) => {
        const next = startX.current + g.dx;
        if (next < -SWIPE_ACTION_WIDTH * 0.45) {
          snapTo(-SWIPE_ACTION_WIDTH);
          return;
        }
        snapTo(0);
      },
    })
  ).current;

  return (
    <View style={stylesSwipe.row}>
      <View style={[stylesSwipe.deleteRail, { backgroundColor: theme.danger }]}>
        <TouchableOpacity
          style={stylesSwipe.deleteHit}
          onPress={onDelete}
          accessibilityRole="button"
          accessibilityLabel="Supprimer la notification"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <FaIcon name="circleXmark" size={26} color={theme.onAccent} />
        </TouchableOpacity>
      </View>
      <Animated.View
        style={[
          stylesSwipe.cardWrap,
          { transform: [{ translateX }], backgroundColor: theme.surface },
        ]}
        {...pan.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
}

const stylesSwipe = StyleSheet.create({
  row: {
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  deleteRail: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: SWIPE_ACTION_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteHit: {
    width: SWIPE_ACTION_WIDTH,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardWrap: {
    zIndex: 2,
  },
});

export default function NotificationsScreen() {
  const theme = useThemeColors();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const { data: notificationsData, isLoading, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationService.getAll(),
    refetchInterval: 15000,
  });

  const invalidateNotifs = () => {
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
  };

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: number) => notificationService.markAsRead(notificationId),
    onSuccess: invalidateNotifs,
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: invalidateNotifs,
  });

  const deleteOneMutation = useMutation({
    mutationFn: (notificationId: number) => notificationService.deleteOne(notificationId),
    onSuccess: invalidateNotifs,
  });

  const deleteAllMutation = useMutation({
    mutationFn: () => notificationService.deleteAll(),
    onSuccess: invalidateNotifs,
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
      team_invitation: 'userPlus',
      competition_registered: 'flag',
      competition_started: 'rocket',
      competition_ended: 'flagCheckered',
      competition_paused: 'pause',
      competition_resumed: 'play',
      ranking_published: 'trophy',
    };
    return icons[type] || 'bell';
  };

  const getNotificationIconColor = (type: string): string => {
    if (type === 'catch_validated' || type === 'competition_resumed') return theme.success;
    if (type === 'catch_rejected') return theme.danger;
    return theme.accent;
  };

  const handleNotificationPress = (notification: Notification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
    navigateFromNotificationData({
      type: notification.type,
      ...(notification.data || {}),
    });
  };

  const handleDeleteAll = () => {
    Alert.alert(
      'Tout supprimer',
      'Supprimer définitivement toutes vos notifications ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => deleteAllMutation.mutate(),
        },
      ]
    );
  };

  const notifications = notificationsData?.notifications || [];
  const unreadCount = notificationsData?.unreadCount || 0;

  return (
    <>
      <Header title="Notifications" showBack={true} showMenu={true} />
      {isLoading ? (
        <View style={[styles.container, styles.center]}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      ) : (
        <FlatList
          style={styles.container}
          contentContainerStyle={styles.content}
          data={notifications}
          keyExtractor={(item) => String(item.id)}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.accent}
              colors={[theme.accent]}
            />
          }
          ListHeaderComponent={
            notifications.length > 0 ? (
              <View style={styles.headerActions}>
                {unreadCount > 0 ? (
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
                ) : null}
                <TouchableOpacity
                  style={styles.deleteAllButton}
                  onPress={handleDeleteAll}
                  disabled={deleteAllMutation.isPending}
                >
                  <Text style={styles.deleteAllButtonText}>
                    {deleteAllMutation.isPending ? '...' : 'Tout supprimer'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Aucune notification</Text>
              <Text style={styles.emptySubtext}>
                Vous serez notifié(e) des événements importants (invitations, validations, etc.).
              </Text>
            </View>
          }
          renderItem={({ item: notification }) => (
            <SwipeToDeleteRow
              theme={theme}
              onDelete={() => deleteOneMutation.mutate(notification.id)}
            >
              <TouchableOpacity
                style={[
                  styles.notificationItem,
                  !notification.isRead && styles.notificationItemUnread,
                ]}
                onPress={() => handleNotificationPress(notification)}
              >
                <View style={styles.notificationIcon}>
                  <FaIcon
                    name={getNotificationIcon(notification.type)}
                    size={16}
                    color={getNotificationIconColor(notification.type)}
                  />
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
            </SwipeToDeleteRow>
          )}
        />
      )}
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
    flexGrow: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  headerActions: {
    marginBottom: 16,
    gap: 8,
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
  deleteAllButton: {
    backgroundColor: theme.surface,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.danger,
  },
  deleteAllButtonText: {
    color: theme.danger,
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
  emptySubtext: {
    fontSize: 14,
    color: theme.textMuted,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  notificationItem: {
    flexDirection: 'row',
    backgroundColor: theme.surface,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: theme.border,
  },
  notificationItemUnread: {
    backgroundColor: theme.accentMuted,
    borderLeftColor: theme.accent,
  },
  notificationIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.surfaceRaised,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: '#ef4444',
    alignSelf: 'center',
    marginLeft: 8,
  },
});
