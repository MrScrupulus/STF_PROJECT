"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { scheduledPauseService } from "../../services/scheduledPauseService";
import styles from "../../styles/components/admin/ScheduledPausesManager.module.scss";

export default function ScheduledPausesManager({ competitionId }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPause, setEditingPause] = useState(null);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["scheduledPauses", competitionId],
    queryFn: () => scheduledPauseService.getByCompetition(competitionId),
  });

  const createMutation = useMutation({
    mutationFn: (pauseData) => scheduledPauseService.create(competitionId, pauseData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduledPauses", competitionId] });
      setIsModalOpen(false);
      setEditingPause(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ pauseId, pauseData }) =>
      scheduledPauseService.update(competitionId, pauseId, pauseData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduledPauses", competitionId] });
      setIsModalOpen(false);
      setEditingPause(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (pauseId) => scheduledPauseService.delete(competitionId, pauseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduledPauses", competitionId] });
    },
  });

  const pauses = data?.pauses || [];

  const handleCreate = () => {
    setEditingPause(null);
    setIsModalOpen(true);
  };

  const handleEdit = (pause) => {
    setEditingPause(pause);
    setIsModalOpen(true);
  };

  const handleDelete = (pauseId) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette pause programmée ?")) {
      deleteMutation.mutate(pauseId);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16); // Format YYYY-MM-DDTHH:mm pour input datetime-local
  };

  const formatDisplayDateTime = (dateString) => {
    if (!dateString) return "";
    // Le backend envoie maintenant les dates déjà converties en Europe/Paris au format 'Y-m-d H:i:s'
    // On ne doit pas ajouter "Z" car cela indiquerait UTC et ajouterait une heure supplémentaire
    // On parse directement la date en remplaçant l'espace par 'T' pour le format ISO
    // Le navigateur interprétera cela comme heure locale (Europe/Paris)
    const dateStr = dateString.replace(' ', 'T');
    const date = new Date(dateStr);
    // Afficher directement sans spécifier timeZone car la date est déjà en heure locale
    return date.toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      // Ne pas spécifier timeZone car la date est déjà en heure locale (Europe/Paris)
    });
  };

  return (
    <div className={styles.scheduled_pauses_manager}>
      <div className={styles.header}>
        <h3>Pauses programmées</h3>
        <button className={styles.add_button} onClick={handleCreate}>
          ➕ Ajouter une pause programmée
        </button>
      </div>

      {isLoading ? (
        <div className={styles.loading}>Chargement...</div>
      ) : error ? (
        <div className={styles.error}>Erreur lors du chargement</div>
      ) : pauses.length === 0 ? (
        <div className={styles.empty}>
          Aucune pause programmée. Cliquez sur "Ajouter" pour en créer une.
        </div>
      ) : (
        <div className={styles.pauses_list}>
          {pauses.map((pause) => (
            <div key={pause.id} className={styles.pause_item}>
              <div className={styles.pause_info}>
                <div className={styles.pause_dates}>
                  <strong>Du :</strong> {formatDisplayDateTime(pause.startDate)}
                  <br />
                  <strong>Au :</strong> {formatDisplayDateTime(pause.endDate)}
                </div>
                {pause.reason && (
                  <div className={styles.pause_reason}>
                    <strong>Raison :</strong> {pause.reason}
                  </div>
                )}
                <div className={styles.pause_status}>
                  {pause.isActive ? (
                    <span className={styles.active}>✓ Active</span>
                  ) : (
                    <span className={styles.inactive}>✗ Inactive</span>
                  )}
                </div>
              </div>
              <div className={styles.pause_actions}>
                <button
                  className={styles.edit_button}
                  onClick={() => handleEdit(pause)}
                >
                  ✏️ Modifier
                </button>
                <button
                  className={styles.delete_button}
                  onClick={() => handleDelete(pause.id)}
                  disabled={deleteMutation.isPending}
                >
                  🗑️ Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <PauseModal
          pause={editingPause}
          onClose={() => {
            setIsModalOpen(false);
            setEditingPause(null);
          }}
          onSubmit={(pauseData) => {
            if (editingPause) {
              updateMutation.mutate({ pauseId: editingPause.id, pauseData });
            } else {
              createMutation.mutate(pauseData);
            }
          }}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  );
}

function PauseModal({ pause, onClose, onSubmit, isSubmitting }) {
  const [formData, setFormData] = useState({
    startDate: pause ? formatDateTime(pause.startDate) : "",
    endDate: pause ? formatDateTime(pause.endDate) : "",
    reason: pause?.reason || "",
  });

  const formatDateTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString + "Z");
    // Convertir en format local pour input datetime-local
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className={styles.modal_overlay} onClick={onClose}>
      <div className={styles.modal_content} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modal_header}>
          <h3>{pause ? "Modifier la pause programmée" : "Nouvelle pause programmée"}</h3>
          <button className={styles.close_button} onClick={onClose}>
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className={styles.modal_form}>
          <div className={styles.form_group}>
            <label htmlFor="startDate">Date et heure de début *</label>
            <input
              type="datetime-local"
              id="startDate"
              value={formData.startDate}
              onChange={(e) =>
                setFormData({ ...formData, startDate: e.target.value })
              }
              required
            />
          </div>
          <div className={styles.form_group}>
            <label htmlFor="endDate">Date et heure de fin *</label>
            <input
              type="datetime-local"
              id="endDate"
              value={formData.endDate}
              onChange={(e) =>
                setFormData({ ...formData, endDate: e.target.value })
              }
              required
            />
          </div>
          <div className={styles.form_group}>
            <label htmlFor="reason">Raison (optionnel)</label>
            <textarea
              id="reason"
              value={formData.reason}
              onChange={(e) =>
                setFormData({ ...formData, reason: e.target.value })
              }
              rows={3}
              placeholder="Ex: Pause déjeuner, pause technique..."
            />
          </div>
          <div className={styles.form_actions}>
            <button
              type="button"
              className={styles.cancel_button}
              onClick={onClose}
              disabled={isSubmitting}
            >
              Annuler
            </button>
            <button
              type="submit"
              className={styles.submit_button}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Enregistrement..." : pause ? "Modifier" : "Créer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
