"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { teamService } from "../../../services/teamService";
import styles from "../../../styles/pages/teams.module.scss";
import { useAuth } from "../../../components/auth/ConditionalAuth";
import Link from "next/link";
import classNames from "classnames";
import layoutStyles from "../../../styles/components/layout/layout.module.scss";
import { toast } from "react-hot-toast";

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, currentUser: authUser, isLoading: authLoading } = useAuth();
  const [team, setTeam] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);

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
        // Gérer gracieusement les erreurs 401 (non authentifié)
        if (error?.status === 401 || (error?.message && error.message.includes("401"))) {
          // L'équipe peut être consultée sans authentification, donc cette erreur ne devrait pas arriver
          // Mais on la gère quand même au cas où
          setError("Erreur d'authentification lors du chargement de l'équipe");
        } else {
          setError(error?.message || "Erreur lors du chargement de l'équipe");
        }
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

  // Séparer les prises rejetées des autres
  const rejectedCatches = team?.catches
    ? team.catches.filter(catchItem => catchItem.rejectionReason)
    : [];
  
  // Filtrer les prises non rejetées et les trier par points décroissants
  const validCatches = team?.catches
    ? team.catches
        .filter(catchItem => !catchItem.rejectionReason)
        .sort((a, b) => b.points - a.points)
    : [];

  // Calculer le top 5 des prises (celles qui comptent pour le score)
  const top5Catches = validCatches.slice(0, 5);
  const baseScore = top5Catches.reduce((sum, catchItem) => sum + catchItem.points, 0);
  
  // Séparer les top 5 des autres prises
  const otherCatches = validCatches.slice(5);

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
    <div className={classNames(layoutStyles.main, styles.teams__container)}>
      {/* Message d'information si l'utilisateur n'est pas connecté */}
      {!isAuthenticated && !authLoading && (
        <div style={{
          backgroundColor: "#e3f2fd",
          border: "1px solid #2196f3",
          borderRadius: "8px",
          padding: "16px",
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "10px"
        }}>
          <div>
            <strong style={{ color: "#1976d2" }}>Consultation uniquement</strong>
            <p style={{ margin: "8px 0 0 0", color: "#555" }}>
              Connectez-vous pour inviter des membres ou effectuer d'autres actions sur cette équipe.
            </p>
          </div>
          <Link 
            href="/login"
            style={{
              padding: "10px 20px",
              backgroundColor: "#007AFF",
              color: "white",
              textDecoration: "none",
              borderRadius: "5px",
              fontWeight: "600",
              whiteSpace: "nowrap"
            }}
          >
            Se connecter
          </Link>
        </div>
      )}
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
          
          {/* Formulaire d'invitation si l'équipe n'est pas complète */}
          {(() => {
            // Déterminer la taille maximale de l'équipe
            // Si l'équipe est inscrite à une compétition, utiliser la taille requise par la compétition
            // Sinon, permettre jusqu'à 2 membres minimum
            const maxTeamSize = team.competition?.teamSize || 2;
            return team.members && team.members.length < maxTeamSize;
          })() && isAuthenticated && (
            <div className={styles.teams__invite_section}>
              {!showInviteForm ? (
                <button
                  onClick={() => setShowInviteForm(true)}
                  className={styles.teams__invite_button}
                >
                  + Inviter un membre
                </button>
              ) : (
                <div className={styles.teams__invite_form}>
                  <h3 className={styles.teams__invite_title}>
                    Inviter un membre
                    {team.competition && (
                      <span style={{ fontSize: '0.875rem', fontWeight: 'normal', color: '#6b7280', display: 'block', marginTop: '0.25rem' }}>
                        ({team.members?.length || 0} / {team.competition.teamSize} membres)
                      </span>
                    )}
                  </h3>
                  <div className={styles.teams__invite_input_group}>
                    <input
                      type="email"
                      placeholder="Email du membre à inviter"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className={styles.teams__invite_input}
                      disabled={isInviting}
                    />
                    <div className={styles.teams__invite_actions}>
                      <button
                        onClick={async () => {
                          if (!isAuthenticated) {
                            toast.error("Vous devez être connecté pour inviter un membre.");
                            router.push("/login");
                            return;
                          }
                          
                          if (!inviteEmail.trim()) {
                            toast.error("Veuillez entrer un email");
                            return;
                          }
                          
                          setIsInviting(true);
                          try {
                            const response = await teamService.inviteMember(team.id, inviteEmail);
                            if (response.success) {
                              toast.success("Invitation envoyée avec succès.");
                              setInviteEmail("");
                              setShowInviteForm(false);
                              // Recharger les données de l'équipe
                              const updatedResponse = await teamService.getById(undefined, params.id);
                              if (updatedResponse.success && updatedResponse.team) {
                                setTeam(updatedResponse.team);
                              }
                            } else {
                              toast.error(response.message || "Erreur lors de l'invitation");
                            }
                          } catch (error) {
                            toast.error(error.message || "Erreur lors de l'invitation");
                          } finally {
                            setIsInviting(false);
                          }
                        }}
                        className={styles.teams__invite_submit}
                        disabled={isInviting}
                      >
                        {isInviting ? "Envoi..." : "Envoyer l'invitation"}
                      </button>
                      <button
                        onClick={() => {
                          setShowInviteForm(false);
                          setInviteEmail("");
                        }}
                        className={styles.teams__invite_cancel}
                        disabled={isInviting}
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
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
            <>
              {/* Top 5 prises (celles qui comptent pour le score) */}
              {top5Catches.length > 0 && (
                <div className={styles.teams__top5_section}>
                  <h3 className={styles.teams__top5_title}>
                    🏆 Top 5 prises comptabilisées pour le score
                  </h3>
                  <div className={styles.teams__catches_grid}>
                    {top5Catches.map((catchItem, index) => (
                      <div
                        key={catchItem.id}
                        className={`${styles.teams__catch_card} ${styles["teams__catch_card--top5"]}`}
                      >
                        <div className={styles.teams__catch_top5_badge}>
                          Top {index + 1}
                        </div>
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

                        {catchItem.rejectionReason ? (
                          <div className={styles.teams__catch_status_rejected}>
                            ❌ Rejetée: {catchItem.rejectionReason}
                          </div>
                        ) : !catchItem.isValidated ? (
                          <div className={styles.teams__catch_status}>
                            ⏳ En attente de validation
                          </div>
                        ) : (
                          <div className={styles.teams__catch_status_validated}>
                            ✅ Validée
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Autres prises */}
              {otherCatches.length > 0 && (
                <div className={styles.teams__other_catches_section}>
                  <h3 className={styles.teams__other_catches_title}>
                    Autres prises ({otherCatches.length})
                  </h3>
                  <div className={styles.teams__catches_grid}>
                    {otherCatches.map((catchItem) => (
                      <div
                        key={catchItem.id}
                        className={styles.teams__catch_card}
                      >
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

                        {catchItem.rejectionReason ? (
                          <div className={styles.teams__catch_status_rejected}>
                            ❌ Rejetée: {catchItem.rejectionReason}
                          </div>
                        ) : !catchItem.isValidated ? (
                          <div className={styles.teams__catch_status}>
                            ⏳ En attente de validation
                          </div>
                        ) : (
                          <div className={styles.teams__catch_status_validated}>
                            ✅ Validée
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Prises refusées */}
              {rejectedCatches.length > 0 && (
                <div className={styles.teams__rejected_catches_section}>
                  <h3 className={styles.teams__rejected_catches_title}>
                    ❌ Prises refusées ({rejectedCatches.length})
                  </h3>
                  <div className={styles.teams__catches_grid}>
                    {rejectedCatches.map((catchItem) => (
                      <div
                        key={catchItem.id}
                        className={`${styles.teams__catch_card} ${styles["teams__catch_card--rejected"]}`}
                      >
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

                        {catchItem.rejectionReason && (
                          <div className={styles.teams__catch_status_rejected}>
                            <strong>Motif de rejet :</strong>
                            <p>{catchItem.rejectionReason}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
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
  );
}

function getInitials(name) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}
