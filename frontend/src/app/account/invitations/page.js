"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { teamService } from "../../../services/teamService";
import ProtectedRoute from "../../../components/auth/ProtectedRoute";
import classNames from "classnames";
import layoutStyles from "../../../styles/components/layout/layout.module.scss";
import styles from "../../../styles/pages/account/invitations.module.scss";
import { toast } from "react-hot-toast";
import { formatDateTime } from "../../../utils/dateUtils";

export default function InvitationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const tokenHandled = useRef(false);

  useEffect(() => {
    if (tokenHandled.current) {
      return;
    }
    const acceptToken = searchParams.get("acceptStaff");
    const rejectToken = searchParams.get("rejectStaff");
    if (!acceptToken && !rejectToken) {
      return;
    }
    tokenHandled.current = true;
    const run = async () => {
      try {
        if (acceptToken) {
          await teamService.acceptStaffInvitationByToken(acceptToken);
          toast.success("Vous êtes commissaire sur cette compétition.");
        } else if (rejectToken) {
          await teamService.rejectStaffInvitationByToken(rejectToken);
          toast.success("Invitation commissaire refusée.");
        }
        queryClient.invalidateQueries({ queryKey: ["my-invitations"] });
      } catch (error) {
        toast.error(error.response?.data?.message || error.message || "Impossible de traiter le lien d'invitation.");
      } finally {
        router.replace("/account/invitations");
      }
    };
    run();
  }, [searchParams, queryClient, router]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["my-invitations"],
    queryFn: async () => {
      const [teams, staff] = await Promise.all([
        teamService.getMyInvitations(),
        teamService.getMyStaffInvitations(),
      ]);
      return {
        invitations: teams?.invitations || [],
        staffInvitations: staff?.invitations || [],
      };
    },
  });

  const acceptMutation = useMutation({
    mutationFn: (invitationId) => teamService.acceptInvitation(invitationId),
    onSuccess: (_, invitationId) => {
      queryClient.invalidateQueries({ queryKey: ["my-invitations"] });
      queryClient.invalidateQueries({ queryKey: ["my-teams"] });
      queryClient.invalidateQueries({ queryKey: ["team"] });
      toast.success("Invitation acceptée. Vous êtes maintenant membre de l'équipe.");
    },
    onError: (error) => {
      const message = error.response?.data?.message || "Une erreur est survenue lors de l'acceptation de l'invitation. Veuillez réessayer.";
      toast.error(message);
    },
  });

  const acceptStaffMutation = useMutation({
    mutationFn: (invitationId) => teamService.acceptStaffInvitation(invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-invitations"] });
      toast.success("Vous êtes commissaire sur cette compétition.");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Impossible d'accepter l'invitation.");
    },
  });

  const rejectStaffMutation = useMutation({
    mutationFn: (invitationId) => teamService.rejectStaffInvitation(invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-invitations"] });
      toast.success("Invitation commissaire refusée.");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Impossible de refuser l'invitation.");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (invitationId) => teamService.rejectInvitation(invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-invitations"] });
      toast.success("Invitation rejetée.");
    },
    onError: (error) => {
      const message = error.response?.data?.message || "Une erreur est survenue lors du rejet de l'invitation. Veuillez réessayer.";
      toast.error(message);
    },
  });

  const handleAccept = (invitation) => {
    if (confirm(`Voulez-vous rejoindre l'équipe "${invitation.team.name}" ?`)) {
      acceptMutation.mutate(invitation.id);
    }
  };

  const handleReject = (invitation) => {
    if (confirm(`Voulez-vous rejeter l'invitation de l'équipe "${invitation.team.name}" ?`)) {
      rejectMutation.mutate(invitation.id);
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className={classNames(layoutStyles.main, styles.invitations__container)}>
          <div className={styles.invitations__loading}>Chargement...</div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className={classNames(layoutStyles.main, styles.invitations__container)}>
          <div className={styles.invitations__error}>
            Erreur lors du chargement des invitations
            <button onClick={() => refetch()} className={styles.invitations__retry_button}>
              Réessayer
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const invitations = data?.invitations || [];
  const staffInvitations = data?.staffInvitations || [];

  return (
    <ProtectedRoute>
      <div className={classNames(layoutStyles.main, styles.invitations__container)}>
        <h1 className={styles.invitations__title}>Mes Invitations</h1>
        {invitations.length === 0 && staffInvitations.length === 0 ? (
          <div className={styles.invitations__empty}>
            <p className={styles.invitations__empty_text}>Aucune invitation en attente</p>
            <p className={styles.invitations__empty_subtext}>
              Créez une équipe ou attendez qu'un membre vous invite à rejoindre son équipe.
            </p>
          </div>
        ) : (
          <div className={styles.invitations__list}>
            {staffInvitations.map((invitation) => (
              <div key={`staff-${invitation.id}`} className={styles.invitations__card}>
                <div className={styles.invitations__card_header}>
                  <h3 className={styles.invitations__team_name}>{invitation.competition?.name}</h3>
                  <span className={styles.invitations__date}>
                    {formatDateTime(invitation.createdAt)}
                  </span>
                </div>
                <div className={styles.invitations__card_body}>
                  <p className={styles.invitations__text}>
                    <span className={styles.invitations__invited_by}>
                      {invitation.invitedBy?.firstname} {invitation.invitedBy?.lastname}
                    </span>
                    {" vous invite comme commissaire"}
                  </p>
                </div>
                <div className={styles.invitations__card_actions}>
                  <button
                    className={`${styles.invitations__button} ${styles["invitations__button--reject"]}`}
                    onClick={() => {
                      if (confirm("Refuser d'être commissaire ?")) {
                        rejectStaffMutation.mutate(invitation.id);
                      }
                    }}
                    disabled={rejectStaffMutation.isPending}
                  >
                    Refuser
                  </button>
                  <button
                    className={`${styles.invitations__button} ${styles["invitations__button--accept"]}`}
                    onClick={() => {
                      if (confirm(`Devenir commissaire sur « ${invitation.competition?.name} » ?`)) {
                        acceptStaffMutation.mutate(invitation.id);
                      }
                    }}
                    disabled={acceptStaffMutation.isPending}
                  >
                    Accepter
                  </button>
                </div>
              </div>
            ))}
            {invitations.map((invitation) => (
              <div key={invitation.id} className={styles.invitations__card}>
                <div className={styles.invitations__card_header}>
                  <h3 className={styles.invitations__team_name}>{invitation.team.name}</h3>
                  <span className={styles.invitations__date}>
                    {formatDateTime(invitation.createdAt)}
                  </span>
                </div>
                <div className={styles.invitations__card_body}>
                  <p className={styles.invitations__text}>
                    <span className={styles.invitations__invited_by}>
                      {invitation.invitedBy.firstname} {invitation.invitedBy.lastname}
                    </span>
                    {" vous invite à rejoindre son équipe"}
                  </p>
                </div>
                <div className={styles.invitations__card_actions}>
                  <button
                    className={`${styles.invitations__button} ${styles["invitations__button--reject"]}`}
                    onClick={() => handleReject(invitation)}
                    disabled={rejectMutation.isPending}
                  >
                    Refuser
                  </button>
                  <button
                    className={`${styles.invitations__button} ${styles["invitations__button--accept"]}`}
                    onClick={() => handleAccept(invitation)}
                    disabled={acceptMutation.isPending}
                  >
                    Accepter
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
