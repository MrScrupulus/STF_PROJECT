"use client";

import { useState } from "react";
import styles from "../../styles/components/admin/ScheduledPausesForm.module.scss";

export default function ScheduledPausesForm({ pauses, onChange }) {
  const [localPauses, setLocalPauses] = useState(pauses || []);

  const handleAddPause = () => {
    const newPause = {
      startDate: "",
      endDate: "",
      reason: "",
    };
    const updatedPauses = [...localPauses, newPause];
    setLocalPauses(updatedPauses);
    onChange(updatedPauses);
  };

  const handleRemovePause = (index) => {
    const updatedPauses = localPauses.filter((_, i) => i !== index);
    setLocalPauses(updatedPauses);
    onChange(updatedPauses);
  };

  const handleUpdatePause = (index, field, value) => {
    const updatedPauses = [...localPauses];
    updatedPauses[index] = {
      ...updatedPauses[index],
      [field]: value,
    };
    setLocalPauses(updatedPauses);
    onChange(updatedPauses);
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  return (
    <div className={styles.scheduled_pauses_form}>
      <div className={styles.header}>
        <label className={styles.label}>Pauses programmées (optionnel)</label>
        <button
          type="button"
          className={styles.add_button}
          onClick={handleAddPause}
        >
          ➕ Ajouter une pause
        </button>
      </div>

      {localPauses.length === 0 ? (
        <div className={styles.empty}>
          Aucune pause programmée. Cliquez sur "Ajouter une pause" pour en créer une.
        </div>
      ) : (
        <div className={styles.pauses_list}>
          {localPauses.map((pause, index) => (
            <div key={index} className={styles.pause_item}>
              <div className={styles.pause_header}>
                <h4>Pause #{index + 1}</h4>
                <button
                  type="button"
                  className={styles.remove_button}
                  onClick={() => handleRemovePause(index)}
                >
                  🗑️ Supprimer
                </button>
              </div>
              <div className={styles.pause_fields}>
                <div className={styles.field_group}>
                  <label>Date et heure de début *</label>
                  <input
                    type="datetime-local"
                    value={pause.startDate}
                    onChange={(e) =>
                      handleUpdatePause(index, "startDate", e.target.value)
                    }
                    required
                  />
                </div>
                <div className={styles.field_group}>
                  <label>Date et heure de fin *</label>
                  <input
                    type="datetime-local"
                    value={pause.endDate}
                    onChange={(e) =>
                      handleUpdatePause(index, "endDate", e.target.value)
                    }
                    required
                  />
                </div>
                <div className={styles.field_group_full}>
                  <label>Raison (optionnel)</label>
                  <input
                    type="text"
                    value={pause.reason || ""}
                    onChange={(e) =>
                      handleUpdatePause(index, "reason", e.target.value)
                    }
                    placeholder="Ex: Pause déjeuner, pause technique..."
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
