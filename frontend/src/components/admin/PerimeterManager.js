"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { perimeterService } from "../../services/perimeterService";
import { toast } from "react-hot-toast";
import PerimeterMap from "./PerimeterMap";
import styles from "../../styles/components/admin/PerimeterManager.module.scss";

export default function PerimeterManager({ competitionId, isEditMode = false }) {
  const queryClient = useQueryClient();
  const [showMap, setShowMap] = useState(false);
  const [currentPolygon, setCurrentPolygon] = useState(null);
  const [perimeterName, setPerimeterName] = useState("");

  // Charger les périmètres existants si on est en mode édition
  const { data: perimetersData, isLoading, refetch } = useQuery({
    queryKey: ["perimeters", competitionId],
    queryFn: () => perimeterService.getAll(competitionId),
    enabled: isEditMode && !!competitionId,
  });

  const perimeters = perimetersData?.perimeters || [];

  const createMutation = useMutation({
    mutationFn: (data) => perimeterService.create(competitionId, data),
    onSuccess: async () => {
      // Attendre que les queries soient invalidées et rechargées
      await queryClient.invalidateQueries({ queryKey: ["perimeters", competitionId] });
      await queryClient.invalidateQueries({ queryKey: ["competition", competitionId] });
      // Recharger les données
      await refetch();
      toast.success("Périmètre créé avec succès !");
      setCurrentPolygon(null);
      setPerimeterName("");
      setShowMap(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Erreur lors de la création du périmètre");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => perimeterService.update(competitionId, id, data),
    onSuccess: async () => {
      // Attendre que les queries soient invalidées et rechargées
      await queryClient.invalidateQueries({ queryKey: ["perimeters", competitionId] });
      await queryClient.invalidateQueries({ queryKey: ["competition", competitionId] });
      // Recharger les données
      await queryClient.refetchQueries({ queryKey: ["perimeters", competitionId] });
      toast.success("Périmètre mis à jour avec succès !");
      setCurrentPolygon(null);
      setPerimeterName("");
      setShowMap(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Erreur lors de la mise à jour du périmètre");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (perimeterId) => perimeterService.delete(competitionId, perimeterId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["perimeters", competitionId] });
      queryClient.invalidateQueries({ queryKey: ["competition", competitionId] });
      toast.success("Périmètre supprimé avec succès !");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Erreur lors de la suppression du périmètre");
    },
  });

  const handlePolygonComplete = (coordinates, perimeterId = null) => {
    if (!coordinates) {
      // Suppression
      if (perimeterId) {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer ce périmètre ?")) {
          deleteMutation.mutate(perimeterId);
        }
      }
      return;
    }

    // S'assurer que les coordonnées sont valides
    if (!Array.isArray(coordinates) || coordinates.length < 3) {
      toast.error("Le polygone doit avoir au moins 3 points");
      return;
    }

    setCurrentPolygon({ coordinates, perimeterId });
  };

  const handleSavePolygon = () => {
    if (!currentPolygon || !currentPolygon.coordinates || currentPolygon.coordinates.length < 3) {
      toast.error("Un périmètre doit avoir au moins 3 points");
      return;
    }

    const data = {
      coordinates: currentPolygon.coordinates,
      name: perimeterName || null,
      isActive: true,
    };

    if (currentPolygon.perimeterId) {
      // Mise à jour
      updateMutation.mutate({ id: currentPolygon.perimeterId, data });
    } else {
      // Création
      createMutation.mutate(data);
    }
  };

  const handleCancel = () => {
    setCurrentPolygon(null);
    setPerimeterName("");
    setShowMap(false);
  };

  if (isLoading) {
    return <div className={styles.loading}>Chargement des périmètres...</div>;
  }

  return (
    <div className={styles.perimeter_manager}>
      <h3 className={styles.title}>📍 Périmètres de pêche</h3>
      <p className={styles.description}>
        Définissez les zones autorisées pour cette compétition. Les prises devront être effectuées
        dans ces périmètres pour être validées.
      </p>

      {perimeters.length > 0 ? (
        <div className={styles.perimeters_list}>
          <h4>Périmètres définis ({perimeters.length}) :</h4>
          {perimeters.map((perimeter) => (
            <div key={perimeter.id} className={styles.perimeter_item}>
              <div className={styles.perimeter_info}>
                <strong>{perimeter.name || `Périmètre #${perimeter.id}`}</strong>
                <span className={styles.point_count}>
                  {perimeter.coordinates?.length || 0} points
                </span>
              </div>
              <div className={styles.perimeter_actions}>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentPolygon({
                      coordinates: perimeter.coordinates,
                      perimeterId: perimeter.id,
                    });
                    setPerimeterName(perimeter.name || "");
                    setShowMap(true);
                  }}
                  className={styles.edit_button}
                >
                  ✏️ Modifier
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce périmètre ?")) {
                      deleteMutation.mutate(perimeter.id);
                    }
                  }}
                  className={styles.delete_button}
                  disabled={deleteMutation.isPending}
                >
                  🗑️ Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.no_perimeters}>
          <p>Aucun périmètre défini pour cette compétition.</p>
        </div>
      )}

      {!showMap && !currentPolygon && (
        <button
          type="button"
          onClick={() => {
            setShowMap(true);
            setCurrentPolygon(null);
          }}
          className={styles.add_button}
        >
          ➕ Ajouter un périmètre
        </button>
      )}

      {showMap && (
        <div className={styles.map_section}>
          <div className={styles.map_header}>
            <h4>
              {currentPolygon?.perimeterId
                ? "Modifier le périmètre"
                : "Créer un nouveau périmètre"}
            </h4>
            <div className={styles.name_input}>
              <label htmlFor="perimeterName">Nom du périmètre (optionnel) :</label>
              <input
                type="text"
                id="perimeterName"
                value={perimeterName}
                onChange={(e) => setPerimeterName(e.target.value)}
                placeholder="Ex: Zone principale"
              />
            </div>
          </div>

          <PerimeterMap
            onPolygonComplete={handlePolygonComplete}
            existingPerimeters={currentPolygon?.perimeterId ? perimeters.filter(p => p.id !== currentPolygon.perimeterId) : perimeters}
            center={[50.6901, 3.1664]} // Roubaix par défaut
            zoom={13}
          />

          <div className={styles.map_actions}>
            <button
              type="button"
              onClick={handleCancel}
              className={styles.cancel_button}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSavePolygon}
              className={styles.save_button}
              disabled={
                createMutation.isPending || 
                updateMutation.isPending || 
                !currentPolygon || 
                !currentPolygon.coordinates || 
                currentPolygon.coordinates.length < 3
              }
              title={
                !currentPolygon 
                  ? "Dessinez d'abord un périmètre sur la carte" 
                  : !currentPolygon.coordinates || currentPolygon.coordinates.length < 3
                  ? "Le périmètre doit avoir au moins 3 points"
                  : ""
              }
            >
              {createMutation.isPending || updateMutation.isPending
                ? "Enregistrement..."
                : currentPolygon?.perimeterId
                ? "Modifier"
                : "Créer"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
