"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationPreferencesService } from "../../../services/notificationPreferencesService";
import { authService } from "../../../services/authService";
import ProtectedRoute from "../../../components/auth/ProtectedRoute";
import classNames from "classnames";
import layoutStyles from "../../../styles/components/layout/layout.module.scss";
import styles from "../../../styles/pages/account/notification-preferences.module.scss";
import { toast } from "react-hot-toast";

export default function NotificationPreferencesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isAdmin, setIsAdmin] = useState(false);

  const { data: preferencesResponse, isLoading } = useQuery({
    queryKey: ["notification-preferences"],
    queryFn: () => notificationPreferencesService.get(),
  });

  const [preferences, setPreferences] = useState(null);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const response = await authService.getCurrentUser();
        const user = response.user || response;
        setIsAdmin(user.roles?.includes("ROLE_ADMIN") || false);
      } catch (error) {
        console.error("Error checking admin status:", error);
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
    mutationFn: (data) => notificationPreferencesService.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-preferences"] });
      toast.success("Préférences mises à jour avec succès.");
    },
    onError: (error) => {
      const message = error.response?.data?.message || "Une erreur est survenue lors de la mise à jour. Veuillez réessayer.";
      toast.error(message);
    },
  });

  const handleToggle = (key) => {
    if (!preferences) return;
    const newPreferences = { ...preferences, [key]: !preferences[key] };
    setPreferences(newPreferences);
    updateMutation.mutate({ [key]: newPreferences[key] });
  };

  if (isLoading || !preferences) {
    return (
      <ProtectedRoute>
        <div className={classNames(layoutStyles.main, styles.preferences__container)}>
          <div className={styles.preferences__loading}>Chargement...</div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className={classNames(layoutStyles.main, styles.preferences__container)}>
        <h1 className={styles.preferences__title}>Préférences notifications</h1>
        <div className={styles.preferences__content}>
          <h2 className={styles.preferences__section_title}>Notifications générales</h2>
          <p className={styles.preferences__section_description}>
            Choisissez les types de notifications que vous souhaitez recevoir
          </p>

          <div className={styles.preferences__list}>
            <div className={styles.preferences__item}>
              <div className={styles.preferences__item_info}>
                <label className={styles.preferences__item_label}>Prise validée</label>
                <p className={styles.preferences__item_description}>
                  Recevoir une notification quand votre prise est validée
                </p>
              </div>
              <label className={styles.preferences__switch}>
                <input
                  type="checkbox"
                  checked={preferences.catchValidated}
                  onChange={() => handleToggle("catchValidated")}
                />
                <span className={styles.preferences__slider}></span>
              </label>
            </div>

            <div className={styles.preferences__item}>
              <div className={styles.preferences__item_info}>
                <label className={styles.preferences__item_label}>Prise rejetée</label>
                <p className={styles.preferences__item_description}>
                  Recevoir une notification quand votre prise est rejetée
                </p>
              </div>
              <label className={styles.preferences__switch}>
                <input
                  type="checkbox"
                  checked={preferences.catchRejected}
                  onChange={() => handleToggle("catchRejected")}
                />
                <span className={styles.preferences__slider}></span>
              </label>
            </div>

            <div className={styles.preferences__item}>
              <div className={styles.preferences__item_info}>
                <label className={styles.preferences__item_label}>Invitation d'équipe</label>
                <p className={styles.preferences__item_description}>
                  Recevoir une notification quand vous êtes invité à rejoindre une équipe
                </p>
              </div>
              <label className={styles.preferences__switch}>
                <input
                  type="checkbox"
                  checked={preferences.teamInvitation}
                  onChange={() => handleToggle("teamInvitation")}
                />
                <span className={styles.preferences__slider}></span>
              </label>
            </div>

            <div className={styles.preferences__item}>
              <div className={styles.preferences__item_info}>
                <label className={styles.preferences__item_label}>Inscription compétition</label>
                <p className={styles.preferences__item_description}>
                  Recevoir une notification quand votre équipe s'inscrit à une compétition
                </p>
              </div>
              <label className={styles.preferences__switch}>
                <input
                  type="checkbox"
                  checked={preferences.competitionRegistered}
                  onChange={() => handleToggle("competitionRegistered")}
                />
                <span className={styles.preferences__slider}></span>
              </label>
            </div>

            <div className={styles.preferences__item}>
              <div className={styles.preferences__item_info}>
                <label className={styles.preferences__item_label}>Début de compétition</label>
                <p className={styles.preferences__item_description}>
                  Recevoir une notification quand une compétition commence
                </p>
              </div>
              <label className={styles.preferences__switch}>
                <input
                  type="checkbox"
                  checked={preferences.competitionStarted}
                  onChange={() => handleToggle("competitionStarted")}
                />
                <span className={styles.preferences__slider}></span>
              </label>
            </div>

            <div className={styles.preferences__item}>
              <div className={styles.preferences__item_info}>
                <label className={styles.preferences__item_label}>Fin de compétition</label>
                <p className={styles.preferences__item_description}>
                  Recevoir une notification quand une compétition se termine
                </p>
              </div>
              <label className={styles.preferences__switch}>
                <input
                  type="checkbox"
                  checked={preferences.competitionEnded}
                  onChange={() => handleToggle("competitionEnded")}
                />
                <span className={styles.preferences__slider}></span>
              </label>
            </div>

            <div className={styles.preferences__item}>
              <div className={styles.preferences__item_info}>
                <label className={styles.preferences__item_label}>Compétition en pause</label>
                <p className={styles.preferences__item_description}>
                  Recevoir une notification quand une compétition est mise en pause
                </p>
              </div>
              <label className={styles.preferences__switch}>
                <input
                  type="checkbox"
                  checked={preferences.competitionPaused}
                  onChange={() => handleToggle("competitionPaused")}
                />
                <span className={styles.preferences__slider}></span>
              </label>
            </div>

            <div className={styles.preferences__item}>
              <div className={styles.preferences__item_info}>
                <label className={styles.preferences__item_label}>Compétition reprise</label>
                <p className={styles.preferences__item_description}>
                  Recevoir une notification quand une compétition reprend
                </p>
              </div>
              <label className={styles.preferences__switch}>
                <input
                  type="checkbox"
                  checked={preferences.competitionResumed}
                  onChange={() => handleToggle("competitionResumed")}
                />
                <span className={styles.preferences__slider}></span>
              </label>
            </div>

            {isAdmin && (
              <>
                <h2 className={`${styles.preferences__section_title} ${styles["preferences__section_title--admin"]}`}>
                  Notifications administrateur
                </h2>
                <p className={styles.preferences__section_description}>
                  Notifications spécifiques aux administrateurs
                </p>

                <div className={styles.preferences__item}>
                  <div className={styles.preferences__item_info}>
                    <label className={styles.preferences__item_label}>Prise en attente</label>
                    <p className={styles.preferences__item_description}>
                      Recevoir une notification quand une nouvelle prise est en attente de validation
                    </p>
                  </div>
                  <label className={styles.preferences__switch}>
                    <input
                      type="checkbox"
                      checked={preferences.catchPending}
                      onChange={() => handleToggle("catchPending")}
                    />
                    <span className={styles.preferences__slider}></span>
                  </label>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
