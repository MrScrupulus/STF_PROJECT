"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { competitionsService } from "../../../services/competitions";
import { speciesService } from "../../../services/speciesService";
import { catchesService } from "../../../services/catches";
import { teamService } from "../../../services/teamService";
import { authService } from "../../../services/authService";
import ProtectedRoute from "../../../components/auth/ProtectedRoute";
import styles from "../../../styles/pages/catch/add.module.scss";
import classNames from "classnames";
import layoutStyles from "../../../styles/components/layout/layout.module.scss";
import { toast } from "react-hot-toast";

export default function AddCatchPage() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [competitions, setCompetitions] = useState([]);
  const [species, setSpecies] = useState([]);
  const [selectedCompetition, setSelectedCompetition] = useState(null);
  const [myTeams, setMyTeams] = useState([]);
  const [formData, setFormData] = useState({
    competitionId: "",
    speciesId: "",
    size: "",
    comment: "",
    photo: null,
    caughtById: "",
  });
  const [teamMembers, setTeamMembers] = useState([]);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingCompetitions, setLoadingCompetitions] = useState(true);
  const [loadingSpecies, setLoadingSpecies] = useState(true);
  const [noCompetitionMessage, setNoCompetitionMessage] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Charger l'utilisateur connecté
        const userResponse = await authService.getCurrentUser();
        if (userResponse.success && userResponse.user) {
          setCurrentUser(userResponse.user);
        }

        // Charger les équipes de l'utilisateur en premier
        const myTeamsResponse = await teamService.getMyTeams();
        const teams = myTeamsResponse.teams || [];
        setMyTeams(teams);

        // Charger les compétitions en cours
        const ongoingCompetitions = await competitionsService.getOngoing();
        setCompetitions(ongoingCompetitions);

        // Trouver l'équipe inscrite à une compétition en cours
        const registeredTeam = teams.find(
          (team) => team.competition && ongoingCompetitions.some(
            (comp) => comp.id === team.competition.id
          )
        );

        if (registeredTeam && registeredTeam.competition) {
          // Sélectionner automatiquement la compétition
          const competition = ongoingCompetitions.find(
            (c) => c.id === registeredTeam.competition.id
          );
          if (competition) {
            setSelectedCompetition(competition);
            setFormData((prev) => ({
              ...prev,
              competitionId: competition.id.toString(),
            }));
            // Charger les membres de l'équipe
            if (registeredTeam.members && registeredTeam.members.length > 0) {
              setTeamMembers(registeredTeam.members);
              // Sélectionner automatiquement le membre connecté par défaut, sinon le premier membre
              const currentUserId = userResponse.success && userResponse.user ? userResponse.user.id : null;
              const defaultMember = registeredTeam.members.find(m => m.id === currentUserId) 
                || registeredTeam.members[0];
              if (defaultMember) {
                setFormData((prev) => ({
                  ...prev,
                  competitionId: competition.id.toString(),
                  caughtById: defaultMember.id.toString(),
                }));
              }
            }
          }
        } else {
          setNoCompetitionMessage(
            "Vous n'êtes inscrit à aucune compétition en cours. Veuillez vous inscrire à une compétition avant d'ajouter une prise."
          );
        }

        // Charger les espèces
        const speciesData = await speciesService.getAll();
        setSpecies(speciesData);
      } catch (error) {
        toast.error("Erreur lors du chargement des données");
      } finally {
        setLoadingCompetitions(false);
        setLoadingSpecies(false);
      }
    };

    fetchData();
  }, []);

  const handleCompetitionChange = async (competitionId) => {
    if (!competitionId) {
      setSelectedCompetition(null);
      setFormData({ ...formData, competitionId: "", caughtById: "" });
      setTeamMembers([]);
      return;
    }

    const competition = competitions.find((c) => c.id === parseInt(competitionId));
    setSelectedCompetition(competition);
    setFormData({ ...formData, competitionId });

    // Vérifier que l'utilisateur a une équipe inscrite à cette compétition
    try {
      const myTeams = await teamService.getMyTeams();
      const team = myTeams.teams?.find(
        (t) => t.competition && t.competition.id === parseInt(competitionId)
      );

      if (!team) {
        toast.error("Vous n'êtes pas inscrit à cette compétition");
        setFormData({ ...formData, competitionId: "", caughtById: "" });
        setSelectedCompetition(null);
        setTeamMembers([]);
      } else {
        // Charger les membres de l'équipe
        if (team.members && team.members.length > 0) {
          setTeamMembers(team.members);
          // Sélectionner automatiquement le membre connecté par défaut, sinon le premier membre
          const currentUserId = currentUser ? currentUser.id : null;
          const defaultMember = team.members.find(m => m.id === currentUserId) 
            || team.members[0];
          if (defaultMember) {
            setFormData((prev) => ({
              ...prev,
              caughtById: defaultMember.id.toString(),
            }));
          }
        }
      }
    } catch (error) {
      console.error("Error checking team:", error);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Vérifier que c'est une image
      if (!file.type.startsWith("image/")) {
        toast.error("Veuillez sélectionner une image");
        return;
      }

      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("L'image est trop grande (max 5MB)");
        return;
      }

      setFormData({ ...formData, photo: file });

      // Créer une preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTakePhoto = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const convertImageToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validation
      if (!formData.competitionId) {
        toast.error("Veuillez sélectionner une compétition");
        setIsLoading(false);
        return;
      }

      if (!formData.speciesId) {
        toast.error("Veuillez sélectionner une espèce");
        setIsLoading(false);
        return;
      }

      if (!formData.size || parseFloat(formData.size) <= 0) {
        toast.error("Veuillez entrer une taille valide");
        setIsLoading(false);
        return;
      }

      if (!formData.caughtById) {
        toast.error("Veuillez sélectionner un membre de l'équipe");
        setIsLoading(false);
        return;
      }

      // Convertir la photo en base64 si elle existe
      let photoBase64 = null;
      if (formData.photo) {
        photoBase64 = await convertImageToBase64(formData.photo);
      }

      // Créer la prise
      const catchData = {
        speciesId: parseInt(formData.speciesId),
        size: parseFloat(formData.size),
        comment: formData.comment || null,
        photoUrl: photoBase64,
        caughtById: formData.caughtById ? parseInt(formData.caughtById) : null,
      };

      const response = await catchesService.create(formData.competitionId, catchData);

      if (response.success) {
        toast.success("Prise enregistrée avec succès !");
        // Réinitialiser le formulaire
        setFormData({
          competitionId: selectedCompetition ? selectedCompetition.id.toString() : "",
          speciesId: "",
          size: "",
          comment: "",
          photo: null,
          caughtById: teamMembers.length > 0 ? teamMembers[0].id.toString() : "",
        });
        setPhotoPreview(null);
        setSelectedCompetition(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    } catch (error) {
      toast.error(error.message || "Erreur lors de l'enregistrement de la prise");
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingCompetitions || loadingSpecies) {
    return (
      <div className={classNames(layoutStyles.main, styles.loading)}>
        Chargement...
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className={classNames(layoutStyles.main, styles.catch_add__container)}>
        <h1 className={styles.catch_add__title}>Ajouter une prise</h1>

        <form onSubmit={handleSubmit} className={styles.catch_add__form}>
          {noCompetitionMessage ? (
            <div className={styles.catch_add__form_group}>
              <div className={styles.catch_add__warning_message}>
                <p>{noCompetitionMessage}</p>
                <button
                  type="button"
                  onClick={() => router.push("/competitions")}
                  className={styles.catch_add__link_button}
                >
                  Voir les compétitions
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.catch_add__form_group}>
              <label htmlFor="competition" className={styles.catch_add__label}>
                Compétition en cours *
              </label>
              <select
                id="competition"
                value={formData.competitionId}
                onChange={(e) => handleCompetitionChange(e.target.value)}
                className={styles.catch_add__select}
                required
                disabled={isLoading || !!selectedCompetition}
              >
                <option value="">-- Sélectionner une compétition --</option>
                {competitions.map((competition) => (
                  <option key={competition.id} value={competition.id}>
                    {competition.name} ({new Date(competition.startDate).toLocaleDateString()} -{" "}
                    {new Date(competition.endDate).toLocaleDateString()})
                  </option>
                ))}
              </select>
              {selectedCompetition && (
                <p className={styles.catch_add__help_text}>
                  ✓ Compétition sélectionnée automatiquement : {selectedCompetition.name}
                </p>
              )}
              {competitions.length === 0 && (
                <p className={styles.catch_add__help_text}>
                  Aucune compétition en cours pour le moment.
                </p>
              )}
            </div>
          )}

          {selectedCompetition && (
            <>
              {teamMembers.length > 0 && (
                <div className={styles.catch_add__form_group}>
                  <label htmlFor="caughtBy" className={styles.catch_add__label}>
                    Membre de l'équipe qui a fait la prise *
                  </label>
                  <select
                    id="caughtBy"
                    value={formData.caughtById}
                    onChange={(e) =>
                      setFormData({ ...formData, caughtById: e.target.value })
                    }
                    className={styles.catch_add__select}
                    required
                    disabled={isLoading}
                  >
                    <option value="">-- Sélectionner un membre --</option>
                    {teamMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.firstname || member.firstName} {member.lastname || member.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className={styles.catch_add__form_group}>
                <label htmlFor="species" className={styles.catch_add__label}>
                  Espèce *
                </label>
                <select
                  id="species"
                  value={formData.speciesId}
                  onChange={(e) =>
                    setFormData({ ...formData, speciesId: e.target.value })
                  }
                  className={styles.catch_add__select}
                  required
                  disabled={isLoading}
                >
                  <option value="">-- Sélectionner une espèce --</option>
                  {species.map((specie) => (
                    <option key={specie.id} value={specie.id}>
                      {specie.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.catch_add__form_group}>
                <label htmlFor="size" className={styles.catch_add__label}>
                  Taille (cm) *
                </label>
                <input
                  type="number"
                  id="size"
                  step="0.1"
                  min="0"
                  value={formData.size}
                  onChange={(e) =>
                    setFormData({ ...formData, size: e.target.value })
                  }
                  className={styles.catch_add__input}
                  required
                  disabled={isLoading}
                  placeholder="Ex: 45.5"
                />
              </div>

              <div className={styles.catch_add__form_group}>
                <label htmlFor="comment" className={styles.catch_add__label}>
                  Commentaire (optionnel)
                </label>
                <textarea
                  id="comment"
                  value={formData.comment}
                  onChange={(e) =>
                    setFormData({ ...formData, comment: e.target.value })
                  }
                  className={styles.catch_add__textarea}
                  rows="4"
                  disabled={isLoading}
                  placeholder="Ajoutez un commentaire sur cette prise..."
                />
              </div>

              <div className={styles.catch_add__form_group}>
                <label className={styles.catch_add__label}>Photo du poisson (optionnel pour les tests)</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoChange}
                  className={styles.catch_add__file_input}
                  disabled={isLoading}
                  style={{ display: "none" }}
                />
                <div className={styles.catch_add__photo_section}>
                  {photoPreview ? (
                    <div className={styles.catch_add__photo_preview}>
                      <img
                        src={photoPreview}
                        alt="Aperçu de la prise"
                        className={styles.catch_add__preview_image}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoPreview(null);
                          setFormData({ ...formData, photo: null });
                          if (fileInputRef.current) {
                            fileInputRef.current.value = "";
                          }
                        }}
                        className={styles.catch_add__remove_photo}
                        disabled={isLoading}
                      >
                        Supprimer la photo
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleTakePhoto}
                      className={styles.catch_add__take_photo_btn}
                      disabled={isLoading}
                    >
                      📷 Prendre une photo
                    </button>
                  )}
                </div>
                <p className={styles.catch_add__help_text}>
                  La photo est optionnelle pour les tests. En production, elle doit être prise directement avec l'appareil photo.
                </p>
              </div>

              <div className={styles.catch_add__form_actions}>
                <button
                  type="button"
                  onClick={() => router.back()}
                  className={styles.catch_add__cancel_btn}
                  disabled={isLoading}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className={styles.catch_add__submit_btn}
                  disabled={isLoading}
                >
                  {isLoading ? "Enregistrement..." : "Enregistrer la prise"}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </ProtectedRoute>
  );
}

