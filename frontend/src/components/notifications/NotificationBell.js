"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "../../services/notificationService";
import styles from "../../styles/components/notifications/NotificationBell.module.scss";
import { formatDateTime, formatRelativeTime } from "../../utils/dateUtils";

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  // Récupérer les notifications non lues
  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ["notifications", "unread"],
    queryFn: async () => {
      const response = await notificationService.getUnread();
      return response;
    },
    refetchInterval: 30000, // Rafraîchir toutes les 30 secondes
  });

  // Récupérer le nombre de notifications non lues
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["notifications", "count"],
    queryFn: async () => {
      return await notificationService.getUnreadCount();
    },
    refetchInterval: 30000,
  });

  const notifications = notificationsData?.notifications || [];
  const count = notificationsData?.unreadCount || unreadCount;

  // Mutation pour marquer une notification comme lue
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId) => notificationService.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  // Mutation pour marquer toutes les notifications comme lues
  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      setIsOpen(false);
    },
  });

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
    setIsOpen(false);
  };

  const getNotificationIcon = (type) => {
    const icons = {
      catch_validated: "✅",
      catch_rejected: "❌",
      catch_pending: "⏳",
      team_invitation: "👥",
      competition_registered: "📝",
      competition_started: "🚀",
      competition_ended: "🏁",
      competition_paused: "⏸️",
      competition_resumed: "▶️",
    };
    return icons[type] || "🔔";
  };

  const getNotificationClass = (type) => {
    const classes = {
      catch_validated: styles.notification__validated,
      catch_rejected: styles.notification__rejected,
      catch_pending: styles.notification__pending,
      team_invitation: styles.notification__invitation,
      competition_registered: styles.notification__registered,
      competition_started: styles.notification__started,
      competition_ended: styles.notification__ended,
      competition_paused: styles.notification__paused,
      competition_resumed: styles.notification__resumed,
    };
    return classes[type] || "";
  };

  return (
    <div className={styles.notification_bell}>
      <button
        className={styles.notification_bell__button}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <span className={styles.notification_bell__icon}>🔔</span>
        {count > 0 && (
          <span className={styles.notification_bell__badge}>{count > 99 ? "99+" : count}</span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className={styles.notification_bell__overlay}
            onClick={() => setIsOpen(false)}
          />
          <div className={styles.notification_bell__dropdown}>
            <div className={styles.notification_bell__header}>
              <h3>Notifications</h3>
              {notifications.length > 0 && (
                <button
                  className={styles.notification_bell__mark_all}
                  onClick={() => markAllAsReadMutation.mutate()}
                  disabled={markAllAsReadMutation.isPending}
                >
                  Tout marquer comme lu
                </button>
              )}
            </div>

            <div className={styles.notification_bell__list}>
              {isLoading ? (
                <div className={styles.notification_bell__loading}>Chargement...</div>
              ) : notifications.length === 0 ? (
                <div className={styles.notification_bell__empty}>
                  Aucune notification
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`${styles.notification_bell__item} ${
                      !notification.isRead ? styles.notification_bell__item_unread : ""
                    } ${getNotificationClass(notification.type)}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className={styles.notification_bell__icon}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className={styles.notification_bell__content}>
                      <p className={styles.notification_bell__message}>
                        {notification.message}
                      </p>
                      <span className={styles.notification_bell__time}>
                        {formatRelativeTime(notification.createdAt)}
                      </span>
                    </div>
                    {!notification.isRead && (
                      <div className={styles.notification_bell__dot} />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
