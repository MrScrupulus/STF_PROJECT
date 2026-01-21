"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { teamService } from "../../../services/teamService";
import styles from "../../../styles/pages/account/history.module.scss";
import ProtectedRoute from "../../../components/auth/ProtectedRoute";
import classNames from "classnames";
import layoutStyles from "../../../styles/components/layout/layout.module.scss";
import { toast } from "react-hot-toast";

export default function HistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [activeTab, setActiveTab] = useState("overview"); // overview, teams, catches
  const [catchesPage, setCatchesPage] = useState(1);
  const [catchesPages, setCatchesPages] = useState(1);
  const [allCatches, setAllCatches] = useState([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await teamService.getMyHistory(1, 10);
        if (response.success) {
          setHistory(response);
          setAllCatches(response.catches || []);
          setCatchesPage(response.catchesPagination?.page || 1);
          setCatchesPages(response.catchesPagination?.pages || 1);
        } else {
          setError("Erreur lors du chargement de l'historique");
        }
      } catch (error) {
        setError(error.message || "Erreur lors du chargement de l'historique");
        toast.error("Erreur lors du chargement de l'historique");
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const loadMoreCatches = async () => {
    if (catchesPage >= catchesPages || isLoadingMore) return;
    
    setIsLoadingMore(true);
    try {
      const nextPage = catchesPage + 1;
      const response = await teamService.getMyHistory(nextPage, 10);
      if (response.success) {
        const newCatches = response.catches || [];
        // Filtrer les doublons en vérifiant les IDs
        setAllCatches((prev) => {
          const existingIds = new Set(prev.map(c => c.id));
          const uniqueNewCatches = newCatches.filter(c => !existingIds.has(c.id));
          return [...prev, ...uniqueNewCatches];
        });
        setCatchesPage(response.catchesPagination?.page || nextPage);
        setCatchesPages(response.catchesPagination?.pages || catchesPages);
      }
    } catch (error) {
      toast.error("Erreur lors du chargement des prises supplémentaires");
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Gérer le body overflow quand la modal est ouverte
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        setSelectedImage(null);
      }
    };

    if (selectedImage) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [selectedImage]);

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className={classNames(layoutStyles.main, styles.history__container)}>
          <div className={styles.history__loading}>Chargement de l'historique...</div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className={classNames(layoutStyles.main, styles.history__container)}>
          <div className={styles.history__error}>Erreur : {error}</div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!history) {
    return (
      <ProtectedRoute>
        <div className={classNames(layoutStyles.main, styles.history__container)}>
          <div className={styles.history__error}>Aucune donnée disponible</div>
        </div>
      </ProtectedRoute>
    );
  }

  const stats = history.statistics || {};
  const teams = history.teams || [];
  const activeTeams = teams.filter((t) => t.isActive);
  const inactiveTeams = teams.filter((t) => !t.isActive);

  // Trier les prises par date décroissante (utiliser allCatches au lieu de catches)
  const sortedCatches = [...allCatches].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  return (
    <ProtectedRoute>
      <div className={classNames(layoutStyles.main, styles.history__container)}>
        <div className={styles.history__header}>
          <button
            onClick={() => router.back()}
            className={styles.history__back_button}
          >
            ← Retour
          </button>
          <h1 className={styles.history__title}>Mon Historique</h1>
        </div>

        {/* Onglets */}
        <div className={styles.history__tabs}>
          <button
            className={`${styles.history__tab} ${
              activeTab === "overview" ? styles["history__tab--active"] : ""
            }`}
            onClick={() => setActiveTab("overview")}
          >
            Vue d'ensemble
          </button>
          <button
            className={`${styles.history__tab} ${
              activeTab === "teams" ? styles["history__tab--active"] : ""
            }`}
            onClick={() => setActiveTab("teams")}
          >
            Équipes ({teams.length})
          </button>
          <button
            className={`${styles.history__tab} ${
              activeTab === "catches" ? styles["history__tab--active"] : ""
            }`}
            onClick={() => setActiveTab("catches")}
          >
            Prises ({catches.length})
          </button>
        </div>

        {/* Vue d'ensemble */}
        {activeTab === "overview" && (
          <div className={styles.history__overview}>
            {/* Statistiques principales */}
            <div className={styles.history__stats_grid}>
              <div className={styles.history__stat_card}>
                <div className={styles.history__stat_label}>Total de prises</div>
                <div className={styles.history__stat_value}>
                  {stats.totalCatches || 0}
                </div>
                <div className={styles.history__stat_description}>
                  {stats.validatedCatches || 0} validées
                </div>
              </div>

              <div className={styles.history__stat_card}>
                <div className={styles.history__stat_label}>Points totaux</div>
                <div className={styles.history__stat_value}>
                  {stats.totalPoints || 0}
                </div>
                <div className={styles.history__stat_description}>
                  Toutes compétitions confondues
                </div>
              </div>

              <div className={styles.history__stat_card}>
                <div className={styles.history__stat_label}>Équipes actives</div>
                <div className={styles.history__stat_value}>
                  {stats.activeTeamsCount || 0}
                </div>
                <div className={styles.history__stat_description}>
                  {stats.inactiveTeamsCount || 0} dissoutes
                </div>
              </div>
            </div>

            {/* Répartition par espèce */}
            {stats.speciesStats && stats.speciesStats.length > 0 && (
              <div className={styles.history__section}>
                <h2 className={styles.history__section_title}>
                  Répartition par espèce
                </h2>
                <div className={styles.history__species_list}>
                  {stats.speciesStats.map((species) => (
                    <div key={species.id} className={styles.history__species_item}>
                      <div className={styles.history__species_name}>
                        {species.name}
                      </div>
                      <div className={styles.history__species_count}>
                        {species.count} prise{species.count > 1 ? "s" : ""}
                      </div>
                      <div className={styles.history__species_points}>
                        {species.totalPoints} pts
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Équipes récentes */}
            {teams.length > 0 && (
              <div className={styles.history__section}>
                <h2 className={styles.history__section_title}>
                  Mes équipes ({teams.length})
                </h2>
                <div className={styles.history__teams_grid}>
                  {teams.slice(0, 6).map((team) => (
                    <div
                      key={team.id}
                      className={`${styles.history__team_card} ${
                        !team.isActive ? styles["history__team_card--inactive"] : ""
                      }`}
                    >
                      {!team.isActive && (
                        <div className={styles.history__team_badge}>
                          Dissoute
                        </div>
                      )}
                      <h3 className={styles.history__team_name}>{team.name}</h3>
                      <div className={styles.history__team_score}>
                        {team.totalScore || 0} pts
                      </div>
                      <div className={styles.history__team_members}>
                        {team.members.map((m) => m.firstname).join(", ")}
                      </div>
                      {team.competition && (
                        <div className={styles.history__team_competition}>
                          {team.competition.name}
                        </div>
                      )}
                      <div className={styles.history__team_catches}>
                        {team.catchesCount || 0} prise{team.catchesCount !== 1 ? "s" : ""}
                      </div>
                      {team.isActive && (
                        <Link
                          href={`/teams/${team.id}`}
                          className={styles.history__team_link}
                        >
                          Voir les détails
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
                {teams.length > 6 && (
                  <button
                    className={styles.history__show_more}
                    onClick={() => setActiveTab("teams")}
                  >
                    Voir toutes les équipes ({teams.length})
                  </button>
                )}
              </div>
            )}

            {/* Prises récentes */}
            {sortedCatches.length > 0 && (
              <div className={styles.history__section}>
                <h2 className={styles.history__section_title}>
                  Prises récentes
                </h2>
                <div className={styles.history__catches_grid}>
                  {sortedCatches.slice(0, 6).map((catchItem) => (
                    <div
                      key={catchItem.id}
                      className={styles.history__catch_card}
                    >
                      <div className={styles.history__catch_header}>
                        <h4 className={styles.history__catch_species}>
                          {catchItem.species.name}
                        </h4>
                        <div className={styles.history__catch_points}>
                          {catchItem.points} pts
                        </div>
                      </div>
                      <div className={styles.history__catch_details}>
                        <div>
                          <strong>Taille :</strong> {catchItem.size} cm
                        </div>
                        <div>
                          <strong>Équipe :</strong> {catchItem.team.name}
                        </div>
                        {catchItem.competition && (
                          <div>
                            <strong>Compétition :</strong>{" "}
                            {catchItem.competition.name}
                          </div>
                        )}
                        <div>
                          <strong>Date :</strong>{" "}
                          {new Date(catchItem.createdAt).toLocaleString("fr-FR")}
                        </div>
                      </div>
                      {catchItem.photoUrl && (
                        <div
                          className={styles.history__catch_photo}
                          onClick={() => setSelectedImage(catchItem.photoUrl)}
                        >
                          <img
                            src={catchItem.photoUrl}
                            alt={`${catchItem.species.name} de ${catchItem.size}cm`}
                            className={styles.history__catch_image}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {sortedCatches.length > 6 && (
                  <button
                    className={styles.history__show_more}
                    onClick={() => setActiveTab("catches")}
                  >
                    Voir toutes les prises ({sortedCatches.length})
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Liste des équipes */}
        {activeTab === "teams" && (
          <div className={styles.history__teams_section}>
            {activeTeams.length > 0 && (
              <div className={styles.history__section}>
                <h2 className={styles.history__section_title}>
                  Équipes actives ({activeTeams.length})
                </h2>
                <div className={styles.history__teams_grid}>
                  {activeTeams.map((team) => (
                    <div
                      key={team.id}
                      className={styles.history__team_card}
                    >
                      <h3 className={styles.history__team_name}>{team.name}</h3>
                      <div className={styles.history__team_score}>
                        {team.totalScore || 0} pts
                      </div>
                      <div className={styles.history__team_members}>
                        {team.members.map((m) => m.firstname).join(", ")}
                      </div>
                      {team.competition && (
                        <div className={styles.history__team_competition}>
                          {team.competition.name}
                        </div>
                      )}
                      <div className={styles.history__team_catches}>
                        {team.catchesCount || 0} prise{team.catchesCount !== 1 ? "s" : ""}
                      </div>
                      <Link
                        href={`/teams/${team.id}`}
                        className={styles.history__team_link}
                      >
                        Voir les détails
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {inactiveTeams.length > 0 && (
              <div className={styles.history__section}>
                <h2 className={styles.history__section_title}>
                  Équipes dissoutes ({inactiveTeams.length})
                </h2>
                <div className={styles.history__teams_grid}>
                  {inactiveTeams.map((team) => (
                    <div
                      key={team.id}
                      className={`${styles.history__team_card} ${
                        styles["history__team_card--inactive"]
                      }`}
                    >
                      <div className={styles.history__team_badge}>Dissoute</div>
                      <h3 className={styles.history__team_name}>{team.name}</h3>
                      <div className={styles.history__team_score}>
                        {team.totalScore || 0} pts
                      </div>
                      <div className={styles.history__team_members}>
                        {team.members.map((m) => m.firstname).join(", ")}
                      </div>
                      {team.competition && (
                        <div className={styles.history__team_competition}>
                          {team.competition.name}
                        </div>
                      )}
                      <div className={styles.history__team_catches}>
                        {team.catchesCount || 0} prise{team.catchesCount !== 1 ? "s" : ""}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {teams.length === 0 && (
              <div className={styles.history__empty}>
                <p>Aucune équipe dans votre historique.</p>
                <Link href="/teams/create" className={styles.history__create_link}>
                  Créer une équipe
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Liste des prises */}
        {activeTab === "catches" && (
          <div className={styles.history__catches_section}>
            {sortedCatches.length > 0 ? (
              <div className={styles.history__catches_grid}>
                {sortedCatches.map((catchItem) => (
                  <div
                    key={catchItem.id}
                    className={styles.history__catch_card}
                  >
                    <div className={styles.history__catch_header}>
                      <h4 className={styles.history__catch_species}>
                        {catchItem.species.name}
                      </h4>
                      <div className={styles.history__catch_points}>
                        {catchItem.points} pts
                      </div>
                    </div>
                    <div className={styles.history__catch_details}>
                      <div>
                        <strong>Taille :</strong> {catchItem.size} cm
                      </div>
                      <div>
                        <strong>Coefficient :</strong> {catchItem.species.coefficient}
                      </div>
                      <div>
                        <strong>Équipe :</strong> {catchItem.team.name}
                        {!catchItem.team.isActive && (
                          <span className={styles.history__catch_badge}>
                            (Dissoute)
                          </span>
                        )}
                      </div>
                      {catchItem.competition && (
                        <div>
                          <strong>Compétition :</strong>{" "}
                          <Link
                            href={`/competitions/${catchItem.competition.id}`}
                            className={styles.history__catch_link}
                          >
                            {catchItem.competition.name}
                          </Link>
                        </div>
                      )}
                      {catchItem.caughtBy && (
                        <div>
                          <strong>Pêché par :</strong> {catchItem.caughtBy.firstname}{" "}
                          {catchItem.caughtBy.lastname}
                        </div>
                      )}
                      <div>
                        <strong>Date :</strong>{" "}
                        {new Date(catchItem.createdAt).toLocaleString("fr-FR")}
                      </div>
                      {catchItem.comment && (
                        <div className={styles.history__catch_comment}>
                          <strong>Commentaire :</strong> {catchItem.comment}
                        </div>
                      )}
                      {!catchItem.isValidated && (
                        <div className={styles.history__catch_status}>
                          ⏳ En attente de validation
                        </div>
                      )}
                    </div>
                    {catchItem.photoUrl && (
                      <div
                        className={styles.history__catch_photo}
                        onClick={() => setSelectedImage(catchItem.photoUrl)}
                      >
                        <img
                          src={catchItem.photoUrl}
                          alt={`${catchItem.species.name} de ${catchItem.size}cm`}
                          className={styles.history__catch_image}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.history__empty}>
                <p>Aucune prise dans votre historique.</p>
                <Link href="/catch/add" className={styles.history__create_link}>
                  Ajouter une prise
                </Link>
              </div>
            )}
            {sortedCatches.length > 0 && catchesPage < catchesPages && (
              <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                <button
                  onClick={loadMoreCatches}
                  disabled={isLoadingMore}
                  className={styles.history__load_more_button}
                  style={{
                    padding: '0.75rem 2rem',
                    fontSize: '1rem',
                    backgroundColor: '#007AFF',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: isLoadingMore ? 'not-allowed' : 'pointer',
                    opacity: isLoadingMore ? 0.6 : 1,
                  }}
                >
                  {isLoadingMore ? 'Chargement...' : 'Charger plus de prises'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Modal pour agrandir l'image */}
        {selectedImage && (
          <div
            className={styles.history__image_modal}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setSelectedImage(null);
              }
            }}
          >
            <div className={styles.history__image_modal_content}>
              <button
                className={styles.history__image_modal_close}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImage(null);
                }}
                aria-label="Fermer"
              >
                ×
              </button>
              <img
                src={selectedImage}
                alt="Agrandissement"
                className={styles.history__image_modal_image}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
