"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { teamService } from "../../../services/teamService";
import styles from "../../../styles/pages/teams.module.scss";
import ProtectedRoute from "../../../components/auth/ProtectedRoute";
import classNames from "classnames";
import layoutStyles from "../../../styles/components/layout/layout.module.scss";
import { toast } from "react-hot-toast";

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [team, setTeam] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const response = await teamService.getById(undefined, params.id);
        if (response.success && response.team) {
          setTeam(response.team);
        } else {
          setError("Équipe non trouvée");
        }
      } catch (error) {
        setError(error.message || "Erreur lors du chargement de l'équipe");
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchTeam();
    }
  }, [params.id]);

  // Gérer le body overflow quand la modal est ouverte
  useEffect(() => {
    if (selectedImage) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Nettoyage au démontage
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedImage]);

  // Trier les prises par points décroissants
  const sortedCatches = team?.catches
    ? [...team.catches].sort((a, b) => b.points - a.points)
    : [];

  // Calculer le top 5 des prises
  const top5Catches = sortedCatches.slice(0, 5);
  const baseScore = top5Catches.reduce((sum, catchItem) => sum + catchItem.points, 0);

  if (isLoading) {
    return (
      <div className={classNames(layoutStyles.main, styles.loading)}>
        Chargement...
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className={classNames(layoutStyles.main, styles.error)}>
        <p>{error || "Équipe non trouvée"}</p>
        <Link href="/teams" className={styles.teams__back_link}>
          Retour aux équipes
        </Link>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className={classNames(layoutStyles.main, styles.teams__container)}>
        <div className={styles.teams__detail_header}>
          <button
            onClick={() => router.back()}
            className={styles.teams__back_button}
          >
            ← Retour
          </button>
          <h1 className={styles.teams__title}>{team.name}</h1>
        </div>

        {team.competition && (
          <div className={styles.teams__competition_info}>
            <strong>Compétition :</strong>
            <Link
              href={`/competitions/${team.competition.id}`}
              className={styles.teams__competition_link}
            >
              {team.competition.name}
            </Link>
            {team.registrationNumber && (
              <span className={styles.teams__registration_number}>
                (N° {team.registrationNumber})
              </span>
            )}
          </div>
        )}

        {/* Résumé des scores en haut pour un aperçu rapide */}
        {team.catches && team.catches.length > 0 && (
          <div className={styles.teams__score_summary}>
            <div className={styles.teams__score_card}>
              <div className={styles.teams__score_label}>Score Total</div>
              <div className={styles.teams__score_value} style={{ fontWeight: '900' }}>{team.totalScore || 0}</div>
              <div className={styles.teams__score_description}>
                Score de base + Bonus
              </div>
            </div>
            <div className={styles.teams__score_card}>
              <div className={styles.teams__score_label}>Score Base</div>
              <div className={styles.teams__score_value} style={{ fontWeight: '900' }}>{baseScore}</div>
              <div className={styles.teams__score_description}>
                Top 5 meilleures prises
              </div>
            </div>
            <div className={styles.teams__score_card}>
              <div className={styles.teams__score_label}>Bonus Espèces</div>
              <div className={styles.teams__score_value} style={{ fontWeight: '900' }}>{team.bonus || 0}</div>
              <div className={styles.teams__score_description}>
                {team.bonus > 0 ? `${Math.floor((team.bonus || 0) / 50) + 1} espèces différentes` : 'Aucun bonus'}
              </div>
            </div>
          </div>
        )}

        <div className={styles.teams__members_section}>
          <h2 className={styles.teams__section_title}>Membres de l'équipe</h2>
          <div className={styles.teams__members}>
            {team.members?.map((member) => (
              <div key={member.id} className={styles.teams__member}>
                <div className={styles.teams__member_avatar}>
                  {getInitials(
                    (member.firstname || member.firstName || "") +
                      " " +
                      (member.lastname || member.lastName || "")
                  )}
                </div>
                <span className={styles.teams__member_name}>
                  {member.firstname || member.firstName}{" "}
                  {member.lastname || member.lastName}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.teams__catches_section}>
          <h2 className={styles.teams__section_title}>
            Prises enregistrées ({team.catches?.length || 0})
          </h2>

          {!team.catches || team.catches.length === 0 ? (
            <div className={styles.teams__empty_catches}>
              <p>Aucune prise enregistrée pour le moment.</p>
              <Link
                href="/catch/add"
                className={styles.teams__add_catch_link}
              >
                Ajouter une prise
              </Link>
            </div>
          ) : (
            <div className={styles.teams__catches_grid}>
              {sortedCatches.map((catchItem, index) => {
                const isTop5 = index < 5;
                return (
                  <div
                    key={catchItem.id}
                    className={`${styles.teams__catch_card} ${
                      isTop5 ? styles["teams__catch_card--top5"] : ""
                    }`}
                  >
                    {isTop5 && (
                      <div className={styles.teams__catch_top5_badge}>
                        Top {index + 1}
                      </div>
                    )}
                    <div className={styles.teams__catch_header}>
                      <h3 className={styles.teams__catch_species}>
                        {catchItem.species.name}
                      </h3>
                      <div className={styles.teams__catch_points}>
                        {catchItem.points} pts
                      </div>
                    </div>

                    <div className={styles.teams__catch_details}>
                      <div className={styles.teams__catch_detail_row}>
                        <span className={styles.teams__catch_label}>Taille :</span>
                        <span className={styles.teams__catch_value} style={{ fontWeight: '900' }}>
                          {catchItem.size} cm
                        </span>
                      </div>
                      <div className={styles.teams__catch_detail_row}>
                        <span className={styles.teams__catch_label}>
                          Coefficient :
                        </span>
                        <span className={styles.teams__catch_value} style={{ fontWeight: '900' }}>
                          {catchItem.species.coefficient}
                        </span>
                      </div>
                      {catchItem.caughtBy && (
                        <div className={styles.teams__catch_detail_row}>
                          <span className={styles.teams__catch_label}>
                            Pêché par :
                          </span>
                          <span className={styles.teams__catch_value} style={{ fontWeight: '900' }}>
                            {catchItem.caughtBy.firstname}{" "}
                            {catchItem.caughtBy.lastname}
                          </span>
                        </div>
                      )}
                      {catchItem.comment && (
                        <div className={styles.teams__catch_comment}>
                          <span className={styles.teams__catch_label}>
                            Commentaire :
                          </span>
                          <p>{catchItem.comment}</p>
                        </div>
                      )}
                      {catchItem.createdAt && (
                        <div className={styles.teams__catch_detail_row}>
                          <span className={styles.teams__catch_label}>
                            Date :
                          </span>
                          <span className={styles.teams__catch_value} style={{ fontWeight: '900' }}>
                            {new Date(catchItem.createdAt).toLocaleString("fr-FR")}
                          </span>
                        </div>
                      )}
                    </div>

                    {catchItem.photoUrl && (
                      <div 
                        className={styles.teams__catch_photo}
                        onClick={() => setSelectedImage(catchItem.photoUrl)}
                      >
                        <img
                          src={catchItem.photoUrl}
                          alt={`${catchItem.species.name} de ${catchItem.size}cm`}
                          className={styles.teams__catch_image}
                          style={{
                            width: '150px',
                            height: '150px',
                            objectFit: 'cover',
                            display: 'block'
                          }}
                        />
                      </div>
                    )}

                    {!catchItem.isValidated && (
                      <div className={styles.teams__catch_status}>
                        ⏳ En attente de validation
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal pour agrandir l'image */}
        {selectedImage && (
          <div 
            className={styles.teams__image_modal}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setSelectedImage(null);
              }
            }}
          >
            <div className={styles.teams__image_modal_content}>
              <button 
                className={styles.teams__image_modal_close}
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
                className={styles.teams__image_modal_image}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

function getInitials(name) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}
