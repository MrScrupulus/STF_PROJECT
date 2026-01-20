"use client";
import { useState, useEffect } from "react";
import { competitionsService } from "../../../../services/competitions";
import { speciesService } from "../../../../services/speciesService";
import { useRouter } from "next/navigation";
import ProtectedRoute from "../../../../components/auth/ProtectedRoute";
import ScheduledPausesForm from "../../../../components/admin/ScheduledPausesForm";
import PerimeterManager from "../../../../components/admin/PerimeterManager";
import styles from "../../../../styles/pages/dashboard/competition-create.module.scss";

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
      },
    ]);
  };

  const handleRemoveSpecies = (index) => {
    setCompetitionSpecies(competitionSpecies.filter((_, i) => i !== index));
  };

  const handleSpeciesChange = (index, field, value) => {
    const updated = [...competitionSpecies];
    updated[index] = { ...updated[index], [field]: value };
    // Si le bonus est activé globalement et qu'on change une espèce, mettre à jour basePoints si nécessaire
    if (field === 'speciesId' && formData.isBonusEnabled && !updated[index].basePoints) {
      const species = availableSpecies.find((s) => s.id === value);
      updated[index].basePoints = species?.basePoints || 50;
    }
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
      const competitionData = {
        ...formData,
        scheduledPauses: scheduledPauses.length > 0 ? scheduledPauses : undefined,
        species: competitionSpecies.length > 0 ? competitionSpecies : undefined,
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
            <label className={styles["competition-create__label"]}>Type</label>
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
                className={styles["competition-create__label"]}
              >
                Pas de limite de participants
              </label>
            </div>
          </div>

          {!formData.hasNoLimit && (
            <div className={styles["competition-create__group"]}>
              <label className={styles["competition-create__label"]}>
                Nombre maximum de participants
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
                className={styles["competition-create__label"]}
              >
                Rendre le classement public (visible par tous les utilisateurs)
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
                checked={formData.isBonusEnabled}
                onChange={(e) => {
                  const isEnabled = e.target.checked;
                  setFormData({ ...formData, isBonusEnabled: isEnabled });
                  // Si on active le bonus, ajouter basePoints aux espèces existantes
                  if (isEnabled) {
                    setCompetitionSpecies(competitionSpecies.map(cs => ({
                      ...cs,
                      basePoints: cs.basePoints || 50
                    })));
                  } else {
                    // Si on désactive, retirer basePoints
                    setCompetitionSpecies(competitionSpecies.map(cs => ({
                      ...cs,
                      basePoints: null
                    })));
                  }
                }}
                id="isBonusEnabled"
              />
              <label
                htmlFor="isBonusEnabled"
                className={styles["competition-create__label"]}
              >
                Activer la règle du bonus (points supplémentaires selon le nombre d'espèces différentes)
              </label>
            </div>
            <p className={styles["competition-create__help_text"]}>
              Si activé, les équipes gagneront des points bonus selon le nombre d'espèces différentes pêchées.
              Vous pourrez définir les points bonus pour chaque espèce ci-dessous.
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
              Définissez les espèces disponibles pour cette compétition avec leurs coefficients.
              {formData.isBonusEnabled && " Vous pouvez également définir les points bonus pour chaque espèce si le bonus est activé."}
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
                        <label>Coefficient</label>
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

                      {formData.isBonusEnabled && (
                        <div className={styles["competition-create__species_base_points"]}>
                          <label>Points bonus</label>
                          <input
                            type="text"
                            inputMode="numeric"
                            min="0"
                            value={compSpecies.basePoints ?? ""}
                            onChange={(e) => {
                              const value = parseNumber(e.target.value);
                              handleSpeciesChange(
                                index,
                                "basePoints",
                                value !== null ? Math.floor(value) : null
                              );
                            }}
                            onBlur={(e) => {
                              const value = parseNumber(e.target.value);
                              if (value === null || value < 0) {
                                handleSpeciesChange(index, "basePoints", 50);
                              }
                            }}
                            className={styles["competition-create__input"]}
                            placeholder="50"
                          />
                        </div>
                      )}

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
