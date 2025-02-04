"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { teamService } from "@/services/teamService";
import styles from "@/styles/pages/teams.module.scss";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function TeamsPage() {
  const router = useRouter();
  const [teams, setTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await teamService.getAll();
        setTeams(response.teams || []);
      } catch (error) {
        setError(
          error.message ||
            "Une erreur est survenue lors du chargement des équipes"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeams();
  }, []);

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  if (isLoading) return <div className={styles.loading}>Chargement...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <ProtectedRoute>
      <div className={styles.teams__container}>
        <div className={styles.teams__header}>
          <h1 className={styles.teams__title}>Mes Équipes</h1>
          <button
            onClick={() => router.push("/teams/create")}
            className={styles.teams__create_btn}
          >
            Créer une équipe
          </button>
        </div>

        <div className={styles.teams__grid}>
          {teams.map((team) => (
            <div key={team.id} className={styles.teams__card}>
              <div className={styles.teams__card_header}>
                <h2 className={styles.teams__team_name}>{team.name}</h2>
              </div>

              <div className={styles.teams__card_content}>
                <div className={styles.teams__members}>
                  {team.members?.map((member) => (
                    <div key={member.id} className={styles.teams__member}>
                      <div className={styles.teams__member_avatar}>
                        {getInitials(member.firstName + " " + member.lastName)}
                      </div>
                      <span className={styles.teams__member_name}>
                        {member.firstName} {member.lastName}
                      </span>
                    </div>
                  ))}
                </div>

                <div className={styles.teams__stats}>
                  <div className={styles.teams__stat}>
                    <div className={styles.teams__stat_value}>
                      {team.competitions?.length || 0}
                    </div>
                    <div className={styles.teams__stat_label}>Compétitions</div>
                  </div>
                  <div className={styles.teams__stat}>
                    <div className={styles.teams__stat_value}>
                      {team.totalPoints || 0}
                    </div>
                    <div className={styles.teams__stat_label}>Points</div>
                  </div>
                </div>

                <div className={styles.teams__actions}>
                  <button
                    onClick={() => router.push(`/teams/${team.id}`)}
                    className={`${styles.teams__action_btn} ${styles["teams__action_btn--view"]}`}
                  >
                    Voir
                  </button>
                  <button
                    onClick={() => router.push(`/teams/${team.id}/edit`)}
                    className={`${styles.teams__action_btn} ${styles["teams__action_btn--edit"]}`}
                  >
                    Modifier
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ProtectedRoute>
  );
}
