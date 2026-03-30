"use client";
import { useState, useEffect } from "react";
import { competitionsService } from "../../../../services/competitions";
import { speciesService } from "../../../../services/speciesService";
import { useRouter } from "next/navigation";
import ProtectedRoute from "../../../../components/auth/ProtectedRoute";
import ScheduledPausesForm from "../../../../components/admin/ScheduledPausesForm";
import PerimeterManager from "../../../../components/admin/PerimeterManager";
import { COMPETITION_HELP } from "../../../../constants/competitionHelpTexts";
import styles from "../../../../styles/pages/dashboard/competition-create.module.scss";

const HelpIcon = ({ text }) => (
  <span className={styles["competition-create__help_icon"]} title={text} role="img" aria-label="Aide">?</span>
);

export default function CreateCompetition() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    startDate: "",
    endDate: "",
    teamSize: "",
    type: "street",
    maxParticipants: "",
    hasNoLimit: false,
    description: "",
    isRankingPublic: false,
    isBonusEnabled: false,
    newSpeciesBonusEnabled: false,
    newSpeciesBonusPoints: "",
    quotaBonusEnabled: false,
    quotaBonusPoints: "",
    reglement: "",
    maxFishCounted: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [scheduledPauses, setScheduledPauses] = useState([]);
  const [availableSpecies, setAvailableSpecies] = useState([]);
  const [competitionSpecies, setCompetitionSpecies] = useState([]);
  const [loadingSpecies, setLoadingSpecies] = useState(false);

  useEffect(() => {
    const fetchSpecies = async () => {
      setLoadingSpecies(true);
      try {
        const response = await speciesService.getAll();
        setAvailableSpecies(response || []);
      } catch (error) {
        console.error("Error fetching species:", error);
        setError("Erreur lors du chargement des espèces");
      } finally {
        setLoadingSpecies(false);
      }
    };
    fetchSpecies();
  }, []);

  const handleAddSpecies = () => {
    if (availableSpecies.length === 0) return;
    const firstSpecies = availableSpecies[0];
    setCompetitionSpecies([
      ...competitionSpecies,
      {
        speciesId: firstSpecies.id,
        coefficient: firstSpecies.coefficient || 1.0,
        basePoints: formData.isBonusEnabled ? (firstSpecies.basePoints || 50) : null,
        quota: "",
      },
    ]);
  };

  const handleRemoveSpecies = (index) => {
    setCompetitionSpecies(competitionSpecies.filter((_, i) => i !== index));
  };

  const handleSpeciesChange = (index, field, value) => {
    const updated = [...competitionSpecies];
    updated[index] = { ...updated[index], [field]: value };
    setCompetitionSpecies(updated);
  };

  // Fonction pour normaliser les nombres (accepter "," et ".")
  const normalizeNumber = (value) => {
    if (typeof value === 'string') {
      return value.replace(',', '.');
    }
    return value;
  };

  // Fonction pour parser les nombres avec virgule ou point (décimales autorisées)
  const parseNumber = (value) => {
    if (!value || value === '') return null;
    const normalized = normalizeNumber(String(value));
    // Permettre les nombres décimaux (ex: 1.5, 0.5, etc.)
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? null : parsed;
  };

  // Fonction pour formater l'affichage des nombres (garder les décimales si présentes)
  const formatNumber = (value) => {
    if (value === null || value === undefined || value === '') return '';
    return String(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      console.log("Sending data:", formData);
      const v = String(formData.maxFishCounted || "").trim();
      const maxFishCounted = !v || v === "0" ? null : (parseInt(v, 10) >= 1 ? parseInt(v, 10) : 5);

      const newSpeciesBonusPointsVal = formData.newSpeciesBonusEnabled && formData.newSpeciesBonusPoints
        ? parseInt(String(formData.newSpeciesBonusPoints).trim(), 10) : null;
      const quotaBonusPointsVal = formData.quotaBonusEnabled && formData.quotaBonusPoints
        ? parseInt(String(formData.quotaBonusPoints).trim(), 10) : null;

      const competitionData = {
        ...formData,
        maxFishCounted,
        isBonusEnabled: formData.newSpeciesBonusEnabled,
        newSpeciesBonusEnabled: formData.newSpeciesBonusEnabled,
        newSpeciesBonusPoints: newSpeciesBonusPointsVal,
        quotaBonusEnabled: formData.quotaBonusEnabled,
        quotaBonusPoints: quotaBonusPointsVal,
        reglement: formData.reglement?.trim() || null,
        scheduledPauses: scheduledPauses.length > 0 ? scheduledPauses : undefined,
        species: competitionSpecies.length > 0 ? competitionSpecies.map(cs => ({
          ...cs,
          quota: cs.quota && String(cs.quota).trim() ? parseInt(String(cs.quota).trim(), 10) : null,
        })) : undefined,
      };
      await competitionsService.create(competitionData);
      router.push("/dashboard");
    } catch (error) {
      setError(error.message || "Une erreur est survenue lors de la création");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute requiredRole="ROLE_ADMIN">
      <div className={styles["competition-create__container"]}>
        <h1 className={styles["competition-create__title"]}>
          Créer une compétition
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
              Poissons comptabilisés pour le score
              <HelpIcon text={COMPETITION_HELP.maxFishCounted} />
            </label>
            <input
              type="number"
              value={formData.maxFishCounted}
              onChange={(e) =>
                setFormData({ ...formData, maxFishCounted: e.target.value.replace(/[^0-9]/g, "") })
              }
              className={styles["competition-create__input"]}
              min="0"
              placeholder="Ex: 5, 10, 20 (vide ou 0 = toutes les prises)"
            />
            <p className={styles["competition-create__help_text"]}>
              Nombre des meilleures prises (par points) comptabilisées. Laisser vide ou 0 pour compter toutes les prises validées.
            </p>
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
              Texte du règlement visible dans l&apos;onglet Règlement. Vous pourrez importer des images depuis la page de modification.
            </p>
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
              Sinon, seul l'administrateur pourra voir le classement complet.
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
                  Valeur du bonus (pts par espèce supplémentaire)
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
            <p className={styles["competition-create__help_text"]}>
              Points bonus pour chaque espèce différente pêchée (au-delà de la première).
            </p>
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
            {formData.quotaBonusEnabled && (
              <div className={styles["competition-create__group"]} style={{ marginLeft: "1.5rem", marginTop: "0.5rem" }}>
                <label className={`${styles["competition-create__label"]} ${styles["competition-create__label_with_help"]}`}>
                  Valeur du bonus (pts par quota rempli)
                  <HelpIcon text={COMPETITION_HELP.quotaBonusPoints} />
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.quotaBonusPoints}
                  onChange={(e) =>
                    setFormData({ ...formData, quotaBonusPoints: e.target.value.replace(/[^0-9]/g, "") })
                  }
                  className={styles["competition-create__input"]}
                  placeholder="Ex: 500"
                  style={{ maxWidth: "120px" }}
                />
              </div>
            )}
            <p className={styles["competition-create__help_text"]}>
              Points bonus quand le quota d&apos;une espèce est atteint (définir les quotas par espèce ci-dessous).
            </p>
          </div>

          {/* Gestion des espèces */}
          <div className={styles["competition-create__group"]}>
            <div className={styles["competition-create__species_header"]}>
              <label className={styles["competition-create__label"]}>
                Espèces de la compétition
              </label>
              <button
                type="button"
                onClick={handleAddSpecies}
                className={styles["competition-create__add_species_btn"]}
                disabled={loadingSpecies || availableSpecies.length === 0}
              >
                + Ajouter une espèce
              </button>
            </div>
            <p className={styles["competition-create__help_text"]}>
              Définissez les espèces disponibles pour cette compétition avec leurs coefficients et éventuellement un quota.
            </p>

            {competitionSpecies.length > 0 && (
              <div className={styles["competition-create__species_list"]}>
                {competitionSpecies.map((compSpecies, index) => {
                  const species = availableSpecies.find((s) => s.id === compSpecies.speciesId);
                  return (
                    <div key={index} className={styles["competition-create__species_item"]}>
                      <div className={styles["competition-create__species_select"]}>
                        <label>Espèce</label>
                        <select
                          value={compSpecies.speciesId}
                          onChange={(e) =>
                            handleSpeciesChange(index, "speciesId", parseInt(e.target.value))
                          }
                          className={styles["competition-create__input"]}
                        >
                          {availableSpecies.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className={styles["competition-create__species_coefficient"]}>
                        <label className={styles["competition-create__label_with_help"]}>
                          Coefficient <HelpIcon text={COMPETITION_HELP.speciesCoefficient} />
                        </label>
                        <input
                          type="text"
                          inputMode="decimal"
                          min="0"
                          step="0.1"
                          value={typeof compSpecies.coefficient === 'string' 
                            ? compSpecies.coefficient 
                            : formatNumber(compSpecies.coefficient)}
                          onChange={(e) => {
                            const inputValue = e.target.value;
                            // Permettre la saisie de nombres décimaux (ex: "1.5", "0.5", "1.", etc.)
                            // Accepter les formats: nombre, nombre., nombre, nombre, nombre.nombre
                            const normalized = normalizeNumber(inputValue);
                            
                            // Pattern pour accepter: nombre entier, nombre décimal, ou nombre en cours de saisie (ex: "1.")
                            const decimalPattern = /^-?\d*\.?\d*$/;
                            
                            if (inputValue === '' || inputValue === '.' || inputValue === ',') {
                              // Permettre la saisie de "." ou "," seul
                              handleSpeciesChange(index, "coefficient", inputValue);
                            } else if (decimalPattern.test(normalized)) {
                              // Si c'est un format valide, garder la valeur telle quelle pendant la saisie
                              // Cela permet de taper "1." puis "5" pour faire "1.5"
                              handleSpeciesChange(index, "coefficient", inputValue);
                            }
                            // Sinon, ignorer la saisie (caractère invalide)
                          }}
                          onBlur={(e) => {
                            const value = parseNumber(e.target.value);
                            if (value === null || value < 0 || isNaN(value)) {
                              handleSpeciesChange(index, "coefficient", 1.0);
                            } else {
                              // S'assurer que la valeur finale est bien un nombre
                              handleSpeciesChange(index, "coefficient", value);
                            }
                          }}
                          className={styles["competition-create__input"]}
                          required
                          placeholder="1.0"
                        />
                      </div>

                      <div className={styles["competition-create__species_quota"]}>
                        <label className={styles["competition-create__label_with_help"]}>
                          Quota (opt.) <HelpIcon text={COMPETITION_HELP.speciesQuota} />
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={compSpecies.quota ?? ""}
                          onChange={(e) =>
                            handleSpeciesChange(index, "quota", e.target.value.replace(/[^0-9]/g, ""))
                          }
                          className={styles["competition-create__input"]}
                          placeholder="Illimité"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveSpecies(index)}
                        className={styles["competition-create__remove_species_btn"]}
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <ScheduledPausesForm
            pauses={scheduledPauses}
            onChange={setScheduledPauses}
          />

          {/* Note: Les périmètres seront gérés après la création de la compétition */}
          <div className={styles["competition-create__info"]}>
            <p>
              💡 <strong>Note :</strong> Les périmètres de pêche pourront être définis après la
              création de la compétition depuis la page de modification.
            </p>
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
              {isLoading ? "Création..." : "Créer la compétition"}
            </button>
          </div>
        </form>
      </div>
    </ProtectedRoute>
  );
}
