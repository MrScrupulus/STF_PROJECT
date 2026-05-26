"use client";
import { useState, useEffect } from "react";
import { competitionsService } from "../../../../../services/competitions";
import { useRouter, useParams } from "next/navigation";
import ProtectedRoute from "../../../../../components/auth/ProtectedRoute";
import PerimeterManager from "../../../../../components/admin/PerimeterManager";
import { COMPETITION_HELP } from "../../../../../constants/competitionHelpTexts";
import styles from "../../../../../styles/pages/dashboard/competition-create.module.scss";

const HelpIcon = ({ text }) => (
  <span className={styles["competition-create__help_icon"]} title={text} role="img" aria-label="Aide">?</span>
);

export default function EditCompetition() {
  const router = useRouter();
  const params = useParams();
  const competitionId = params.id;
  
  const [formData, setFormData] = useState({
    name: "",
    startDate: "",
    endDate: "",
    teamSize: "",
    type: "street",
    maxParticipants: "",
    hasNoLimit: false,
    description: "",
    reglement: "",
    maxFishCounted: "",
    newSpeciesBonusEnabled: false,
    newSpeciesBonusPoints: "",
    quotaBonusEnabled: false,
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [reglementImageUrls, setReglementImageUrls] = useState([]);
  const [reglementImageUploading, setReglementImageUploading] = useState(false);

  useEffect(() => {
    const fetchCompetition = async () => {
      try {
        setIsLoadingData(true);
        const competition = await competitionsService.getOne(competitionId);
        
        // Gérer le format de réponse (avec ou sans success)
        const compData = competition.success !== undefined 
          ? (competition.success ? competition : null)
          : competition;
        
        if (!compData) {
          setError("Compétition non trouvée");
          return;
        }

        // Extraire YYYY-MM-DDTHH:mm directement de la chaîne (évite les décalages timezone)
        const formatDateForInput = (dateString) => {
          if (!dateString) return "";
          const s = String(dateString).trim();
          const isoMatch = s.match(/(\d{4})-(\d{2})-(\d{2})T(\d{1,2}):(\d{2})/);
          if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}T${isoMatch[4].padStart(2, "0")}:${isoMatch[5]}`;
          const spaceMatch = s.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{1,2}):(\d{2})/);
          if (spaceMatch) return `${spaceMatch[1]}-${spaceMatch[2]}-${spaceMatch[3]}T${spaceMatch[4].padStart(2, "0")}:${spaceMatch[5]}`;
          return "";
        };

        setFormData({
          name: compData.name || "",
          startDate: formatDateForInput(compData.startDate),
          endDate: formatDateForInput(compData.endDate),
          teamSize: compData.teamSize?.toString() || "",
          type: compData.type || "street",
          maxParticipants: compData.maxParticipants?.toString() || "",
          hasNoLimit: compData.hasNoLimit || false,
          description: compData.description || "",
          reglement: compData.reglement || "",
          isRankingPublic: compData.isRankingPublic || false,
          maxFishCounted: compData.hasOwnProperty("maxFishCounted") && compData.maxFishCounted != null
            ? String(compData.maxFishCounted)
            : "",
          newSpeciesBonusEnabled: compData.newSpeciesBonusEnabled || false,
          newSpeciesBonusPoints: compData.hasOwnProperty("newSpeciesBonusPoints") && compData.newSpeciesBonusPoints != null
            ? String(compData.newSpeciesBonusPoints)
            : "",
          quotaBonusEnabled: compData.quotaBonusEnabled || false,
        });
        setReglementImageUrls(Array.isArray(compData.reglementImageUrls) ? compData.reglementImageUrls : (compData.reglementImageUrl ? [compData.reglementImageUrl] : []));
      } catch (error) {
        console.error("Error fetching competition:", error);
        setError("Erreur lors du chargement de la compétition");
      } finally {
        setIsLoadingData(false);
      }
    };

    if (competitionId) {
      fetchCompetition();
    }
  }, [competitionId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Normaliser les dates pour le backend : YYYY-MM-DDTHH:mm:00
      const toBackendDate = (val) => {
        if (!val) return val;
        const s = String(val).trim();
        // Déjà au format avec secondes ?
        if (/^\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}/.test(s)) return s.includes("T") ? s : s.replace(" ", "T");
        const m = s.match(/(\d{4})-(\d{2})-(\d{2})[T\s](\d{1,2}):(\d{2})/);
        return m ? `${m[1]}-${m[2]}-${m[3]}T${m[4].padStart(2, "0")}:${m[5]}:00` : val;
      };

      const v = String(formData.maxFishCounted || "").trim();
      const maxFishCounted = !v || v === "0" ? null : (parseInt(v, 10) >= 1 ? parseInt(v, 10) : null);

      const newSpeciesBonusPointsVal = formData.newSpeciesBonusEnabled && formData.newSpeciesBonusPoints
        ? parseInt(String(formData.newSpeciesBonusPoints).trim(), 10) : null;

      const dataToSend = {
        ...formData,
        startDate: toBackendDate(formData.startDate),
        endDate: toBackendDate(formData.endDate),
        teamSize: parseInt(formData.teamSize),
        maxParticipants: formData.hasNoLimit ? null : parseInt(formData.maxParticipants),
        maxFishCounted,
        reglement: formData.reglement?.trim() || null,
        newSpeciesBonusEnabled: formData.newSpeciesBonusEnabled,
        newSpeciesBonusPoints: newSpeciesBonusPointsVal,
        quotaBonusEnabled: formData.quotaBonusEnabled,
      };

      await competitionsService.update(competitionId, dataToSend);
      router.push("/dashboard");
      router.refresh(); // Forcer le rechargement des données
    } catch (error) {
      setError(error.message || "Une erreur est survenue lors de la mise à jour");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingData) {
    return (
      <ProtectedRoute requiredRole="ROLE_ADMIN">
        <div className={styles["competition-create__container"]}>
          <div>Chargement...</div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="ROLE_ADMIN">
      <div className={styles["competition-create__container"]}>
        <h1 className={styles["competition-create__title"]}>
          Modifier la compétition
        </h1>

        {error && <div className={styles.error}>{error}</div>}

        <form
          onSubmit={handleSubmit}
          className={styles["competition-create__form"]}
        >
          <div className={styles["competition-create__group"]}>
            <label className={styles["competition-create__label"]}>Titre</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className={styles["competition-create__input"]}
              required
            />
          </div>

          <div className={styles["competition-create__grid"]}>
            <div className={styles["competition-create__group"]}>
              <label className={styles["competition-create__label"]}>
                Date de début
              </label>
              <input
                type="datetime-local"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                className={styles["competition-create__input"]}
                required
              />
            </div>

            <div className={styles["competition-create__group"]}>
              <label className={styles["competition-create__label"]}>
                Date de fin
              </label>
              <input
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
                className={styles["competition-create__input"]}
                required
              />
            </div>
          </div>

          <div className={styles["competition-create__group"]}>
            <label className={styles["competition-create__label"]}>
              Taille des équipes
            </label>
            <input
              type="number"
              value={formData.teamSize}
              onChange={(e) =>
                setFormData({ ...formData, teamSize: e.target.value })
              }
              className={styles["competition-create__input"]}
              required
              min="1"
            />
          </div>

          <div className={styles["competition-create__group"]}>
            <label className={`${styles["competition-create__label"]} ${styles["competition-create__label_with_help"]}`}>
              Type
              <HelpIcon text={COMPETITION_HELP.type} />
            </label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value })
              }
              className={styles["competition-create__select"]}
            >
              <option value="street">Street</option>
              <option value="boat">Boat</option>
              <option value="float">Float</option>
            </select>
          </div>

          <div className={styles["competition-create__group"]}>
            <div className={styles["competition-create__checkbox-wrapper"]}>
              <input
                type="checkbox"
                checked={formData.hasNoLimit}
                onChange={(e) =>
                  setFormData({ ...formData, hasNoLimit: e.target.checked })
                }
                id="hasNoLimit"
              />
              <label
                htmlFor="hasNoLimit"
                className={`${styles["competition-create__label"]} ${styles["competition-create__label_with_help"]}`}
              >
                Pas de limite de participants
                <HelpIcon text={COMPETITION_HELP.hasNoLimit} />
              </label>
            </div>
          </div>

          {!formData.hasNoLimit && (
            <div className={styles["competition-create__group"]}>
              <label className={`${styles["competition-create__label"]} ${styles["competition-create__label_with_help"]}`}>
                Nombre maximum de participants
                <HelpIcon text={COMPETITION_HELP.maxParticipants} />
              </label>
              <input
                type="number"
                value={formData.maxParticipants}
                onChange={(e) =>
                  setFormData({ ...formData, maxParticipants: e.target.value })
                }
                className={styles["competition-create__input"]}
                min="1"
              />
            </div>
          )}

          <div className={styles["competition-create__group"]}>
            <label className={`${styles["competition-create__label"]} ${styles["competition-create__label_with_help"]}`}>
              Poissons comptabilisés pour le score
              <HelpIcon text={COMPETITION_HELP.maxFishCounted} />
            </label>
            <input
              type="number"
              min="0"
              value={formData.maxFishCounted}
              onChange={(e) =>
                setFormData({ ...formData, maxFishCounted: e.target.value.replace(/[^0-9]/g, "") })
              }
              className={styles["competition-create__input"]}
              placeholder="Ex: 5, 10, 20 (vide ou 0 = toutes les prises)"
            />
            <p className={styles["competition-create__help_text"]}>
              Nombre des meilleures prises (par points) comptabilisées. Laisser vide ou 0 = toutes les prises validées comptent.
            </p>
          </div>

          <div className={styles["competition-create__group"]}>
            <label className={styles["competition-create__label"]}>
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className={`${styles["competition-create__input"]} ${styles["competition-create__description"]}`}
              rows="4"
              placeholder="Description détaillée de la compétition..."
            />
          </div>

          <div className={styles["competition-create__group"]}>
            <label className={`${styles["competition-create__label"]} ${styles["competition-create__label_with_help"]}`}>
              Règlement
              <HelpIcon text={COMPETITION_HELP.reglement} />
            </label>
            <textarea
              value={formData.reglement}
              onChange={(e) =>
                setFormData({ ...formData, reglement: e.target.value })
              }
              className={`${styles["competition-create__input"]} ${styles["competition-create__description"]}`}
              rows="6"
              placeholder="Règlement de la compétition (règles, modalités, barèmes...)"
            />
            <p className={styles["competition-create__help_text"]}>
              Texte du règlement visible dans l&apos;onglet Règlement.
            </p>
            <div className={styles["competition-create__group"]} style={{ marginTop: "1rem" }}>
              <label className={styles["competition-create__label"]}>Images du règlement (optionnel)</label>
              <p className={styles["competition-create__help_text"]}>
                Importer des images (jpg, png, webp) pour afficher un règlement pré-rédigé (ex. scans multi-pages).
              </p>
              {reglementImageUrls.length > 0 && (
                <div style={{ marginBottom: "0.75rem", display: "flex", flexWrap: "wrap", gap: "1rem" }}>
                  {reglementImageUrls.map((url, idx) => (
                    <div key={idx} style={{ position: "relative" }}>
                      <img
                        src={url}
                        alt={`Règlement ${idx + 1}`}
                        style={{ maxWidth: 200, maxHeight: 150, border: "1px solid #ccc", borderRadius: 4 }}
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const res = await competitionsService.deleteReglementImage(competitionId, idx);
                            setReglementImageUrls(res.reglementImageUrls || []);
                          } catch (err) {
                            setError(err.message || "Erreur suppression image");
                          }
                        }}
                        className={styles["competition-create__button"]}
                        style={{ marginTop: "0.25rem", fontSize: "0.8rem" }}
                      >
                        Supprimer
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setReglementImageUploading(true);
                  setError("");
                  try {
                    const res = await competitionsService.uploadReglementImage(competitionId, file);
                    setReglementImageUrls(res.reglementImageUrls || []);
                  } catch (err) {
                    setError(err.message || "Erreur lors de l&apos;upload");
                  } finally {
                    setReglementImageUploading(false);
                    e.target.value = "";
                  }
                }}
                disabled={reglementImageUploading}
              />
              {reglementImageUploading && <span style={{ marginLeft: 8 }}>Upload en cours...</span>}
            </div>
          </div>

          <div className={styles["competition-create__group"]}>
            <div className={styles["competition-create__checkbox-wrapper"]}>
              <input
                type="checkbox"
                checked={formData.isRankingPublic}
                onChange={(e) =>
                  setFormData({ ...formData, isRankingPublic: e.target.checked })
                }
                id="isRankingPublic"
              />
              <label
                htmlFor="isRankingPublic"
                className={`${styles["competition-create__label"]} ${styles["competition-create__label_with_help"]}`}
              >
                Rendre le classement public (visible par tous les utilisateurs)
                <HelpIcon text={COMPETITION_HELP.isRankingPublic} />
              </label>
            </div>
            <p className={styles["competition-create__help_text"]}>
              Si coché, le classement sera visible par tous les utilisateurs une fois la compétition terminée.
              Sinon, seul l&apos;administrateur pourra voir le classement complet.
            </p>
          </div>

          <div className={styles["competition-create__group"]}>
            <div className={styles["competition-create__checkbox-wrapper"]}>
              <input
                type="checkbox"
                checked={formData.newSpeciesBonusEnabled}
                onChange={(e) =>
                  setFormData({ ...formData, newSpeciesBonusEnabled: e.target.checked })
                }
                id="newSpeciesBonusEnabled"
              />
              <label htmlFor="newSpeciesBonusEnabled" className={`${styles["competition-create__label"]} ${styles["competition-create__label_with_help"]}`}>
                Bonus par nouvelle espèce
                <HelpIcon text={COMPETITION_HELP.newSpeciesBonus} />
              </label>
            </div>
            {formData.newSpeciesBonusEnabled && (
              <div className={styles["competition-create__group"]} style={{ marginLeft: "1.5rem", marginTop: "0.5rem" }}>
                <label className={`${styles["competition-create__label"]} ${styles["competition-create__label_with_help"]}`}>
                  Valeur du bonus (pts)
                  <HelpIcon text={COMPETITION_HELP.newSpeciesBonusPoints} />
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.newSpeciesBonusPoints}
                  onChange={(e) =>
                    setFormData({ ...formData, newSpeciesBonusPoints: e.target.value.replace(/[^0-9]/g, "") })
                  }
                  className={styles["competition-create__input"]}
                  placeholder="Ex: 50"
                  style={{ maxWidth: "120px" }}
                />
              </div>
            )}
          </div>

          <div className={styles["competition-create__group"]}>
            <div className={styles["competition-create__checkbox-wrapper"]}>
              <input
                type="checkbox"
                checked={formData.quotaBonusEnabled}
                onChange={(e) =>
                  setFormData({ ...formData, quotaBonusEnabled: e.target.checked })
                }
                id="quotaBonusEnabled"
              />
              <label htmlFor="quotaBonusEnabled" className={`${styles["competition-create__label"]} ${styles["competition-create__label_with_help"]}`}>
                Bonus quota atteint
                <HelpIcon text={COMPETITION_HELP.quotaBonus} />
              </label>
            </div>
            {formData.quotaBonusEnabled ? (
              <p className={styles["competition-create__help_text"]} style={{ marginLeft: "1.5rem", marginTop: "0.5rem" }}>
                Les montants de bonus se configurent espèce par espèce (avec le quota correspondant). Utilisez l’application mobile pour modifier la liste des espèces si besoin.
              </p>
            ) : null}
          </div>

          <div className={styles["competition-create__actions"]}>
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className={`${styles["competition-create__button"]} ${styles["competition-create__button--cancel"]}`}
              disabled={isLoading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className={`${styles["competition-create__button"]} ${styles["competition-create__button--submit"]}`}
              disabled={isLoading}
            >
              {isLoading ? "Mise à jour..." : "Enregistrer les modifications"}
            </button>
          </div>
        </form>

        {/* Gestion des périmètres */}
        <PerimeterManager competitionId={parseInt(competitionId)} isEditMode={true} />
      </div>
    </ProtectedRoute>
  );
}
