"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { competitionsService } from "../../../services/competitions";
import { adminService } from "../../../services/adminService";
import ProtectedRoute from "../../../components/auth/ProtectedRoute";
import styles from "../../../styles/pages/catch/add.module.scss";
import classNames from "classnames";
import layoutStyles from "../../../styles/components/layout/layout.module.scss";
import { toast } from "react-hot-toast";

function OfficialAddCatchForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef(null);
  const competitionIdParam = searchParams.get("competitionId");

  const [competition, setCompetition] = useState(null);
  const [teams, setTeams] = useState([]);
  const [species, setSpecies] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [formData, setFormData] = useState({
    teamId: "",
    speciesId: "",
    size: "",
    comment: "",
    photo: null,
    caughtById: "",
  });

  useEffect(() => {
    const load = async () => {
      if (!competitionIdParam) {
        setLoading(false);
        return;
      }
      try {
        const response = await competitionsService.getOne(parseInt(competitionIdParam, 10));
        const comp = response?.competition || response;
        if (!comp?.id) {
          toast.error("Compétition introuvable");
          setLoading(false);
          return;
        }
        if (!comp.canJudge && !comp.canManage) {
          toast.error("Vous n’êtes pas commissaire sur cette compétition");
          setLoading(false);
          return;
        }
        setCompetition(comp);
        setTeams(comp.teams || []);
        setSpecies(comp.species || []);
      } catch (error) {
        toast.error(error.message || "Impossible de charger la compétition");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [competitionIdParam]);

  const handleTeamChange = (teamId) => {
    setFormData((prev) => ({ ...prev, teamId, caughtById: "" }));
    const team = teams.find((item) => String(item.id) === String(teamId));
    setMembers(team?.members || []);
  };

  const convertImageToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!competition?.id) {
      toast.error("Compétition manquante");
      return;
    }
    if (!formData.teamId || !formData.speciesId || !formData.size || !formData.caughtById) {
      toast.error("Équipe, membre, espèce et taille sont requis");
      return;
    }
    setIsSubmitting(true);
    try {
      let photoUrl = null;
      if (formData.photo) {
        photoUrl = await convertImageToBase64(formData.photo);
      }
      const response = await adminService.createCatch({
        competitionId: competition.id,
        teamId: parseInt(formData.teamId, 10),
        speciesId: parseInt(formData.speciesId, 10),
        size: parseFloat(String(formData.size).replace(",", ".")),
        comment: formData.comment || null,
        photoUrl,
        caughtById: parseInt(formData.caughtById, 10),
      });
      if (response.success) {
        toast.success("Prise ajoutée et validée. Elle indique votre nom (commissaire ou créateur).");
        router.push(`/teams/${formData.teamId}`);
      }
    } catch (error) {
      toast.error(error.message || "Erreur lors de l’enregistrement");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className={classNames(layoutStyles.main, styles.loading)}>Chargement...</div>;
  }

  if (!competitionIdParam || !competition) {
    return (
      <div className={classNames(layoutStyles.main, styles.catch_add__container)}>
        <h1 className={styles.catch_add__title}>Ajouter une prise officielle</h1>
        <p>Ouvrez cette page depuis une compétition où vous êtes commissaire ou créateur.</p>
      </div>
    );
  }

  return (
    <div className={classNames(layoutStyles.main, styles.catch_add__container)}>
      <h1 className={styles.catch_add__title}>Ajouter une prise officielle</h1>
      <p className={styles.catch_add__help_text}>
        La prise sera validée immédiatement et affichera « Ajoutée par [votre prénom nom] (commissaire
        ou créateur) ».
      </p>
      <form onSubmit={handleSubmit} className={styles.catch_add__form}>
        <div className={styles.catch_add__form_group}>
          <label className={styles.catch_add__label}>Compétition</label>
          <input className={styles.catch_add__select} value={competition.name} disabled />
        </div>
        <div className={styles.catch_add__form_group}>
          <label className={styles.catch_add__label}>Équipe *</label>
          <select
            className={styles.catch_add__select}
            value={formData.teamId}
            onChange={(e) => handleTeamChange(e.target.value)}
            required
            disabled={isSubmitting}
          >
            <option value="">-- Sélectionner une équipe --</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>
        {members.length > 0 && (
          <div className={styles.catch_add__form_group}>
            <label className={styles.catch_add__label}>Membre *</label>
            <select
              className={styles.catch_add__select}
              value={formData.caughtById}
              onChange={(e) => setFormData({ ...formData, caughtById: e.target.value })}
              required
              disabled={isSubmitting}
            >
              <option value="">-- Sélectionner un membre --</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.firstname} {member.lastname}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className={styles.catch_add__form_group}>
          <label className={styles.catch_add__label}>Espèce *</label>
          <select
            className={styles.catch_add__select}
            value={formData.speciesId}
            onChange={(e) => setFormData({ ...formData, speciesId: e.target.value })}
            required
            disabled={isSubmitting}
          >
            <option value="">-- Sélectionner une espèce --</option>
            {species.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.catch_add__form_group}>
          <label className={styles.catch_add__label}>Taille (cm) *</label>
          <input
            className={styles.catch_add__select}
            type="text"
            inputMode="decimal"
            value={formData.size}
            onChange={(e) => setFormData({ ...formData, size: e.target.value })}
            required
            disabled={isSubmitting}
          />
        </div>
        <div className={styles.catch_add__form_group}>
          <label className={styles.catch_add__label}>Commentaire</label>
          <textarea
            className={styles.catch_add__select}
            value={formData.comment}
            onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
            disabled={isSubmitting}
          />
        </div>
        <div className={styles.catch_add__form_group}>
          <label className={styles.catch_add__label}>Photo</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setFormData({ ...formData, photo: file });
              setPhotoPreview(URL.createObjectURL(file));
            }}
            disabled={isSubmitting}
          />
          {photoPreview ? (
            <img src={photoPreview} alt="Aperçu" className={styles.catch_add__preview_image} />
          ) : null}
        </div>
        <div className={styles.catch_add__form_actions}>
          <button type="button" className={styles.catch_add__cancel_btn} onClick={() => router.back()}>
            Annuler
          </button>
          <button type="submit" className={styles.catch_add__submit_btn} disabled={isSubmitting}>
            {isSubmitting ? "Enregistrement..." : "Enregistrer la prise"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function OfficialAddCatchPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div className={classNames(layoutStyles.main, styles.loading)}>Chargement...</div>}>
        <OfficialAddCatchForm />
      </Suspense>
    </ProtectedRoute>
  );
}
