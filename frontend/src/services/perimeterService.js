import { api } from "./api";

export const perimeterService = {
  /**
   * Récupère tous les périmètres d'une compétition
   */
  getAll: async (competitionId) => {
    try {
      const response = await api.get(
        `/api/admin/competitions/${competitionId}/perimeters`
      );
      // api.get retourne déjà les données directement, pas response.data
      return response || { success: true, perimeters: [] };
    } catch (error) {
      // Si la compétition n'a pas encore de périmètres, retourner un tableau vide
      if (error.response?.status === 404) {
        return { success: true, perimeters: [] };
      }
      // Pour les autres erreurs, retourner quand même un format valide
      console.error("Erreur lors de la récupération des périmètres:", error);
      return { success: false, perimeters: [] };
    }
  },

  /**
   * Crée un nouveau périmètre
   */
  create: async (competitionId, data) => {
    const response = await api.post(
      `/api/admin/competitions/${competitionId}/perimeters`,
      data
    );
    // api.post retourne déjà les données directement, pas response.data
    return response;
  },

  /**
   * Met à jour un périmètre
   */
  update: async (competitionId, perimeterId, data) => {
    const response = await api.put(
      `/api/admin/competitions/${competitionId}/perimeters/${perimeterId}`,
      data
    );
    // api.put retourne déjà les données directement, pas response.data
    return response;
  },

  /**
   * Supprime un périmètre
   */
  delete: async (competitionId, perimeterId) => {
    const response = await api.delete(
      `/api/admin/competitions/${competitionId}/perimeters/${perimeterId}`
    );
    // api.delete retourne déjà les données directement, pas response.data
    return response;
  },
};
