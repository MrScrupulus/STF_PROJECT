import { api } from "./api";

export const scheduledPauseService = {
  /**
   * Récupère toutes les pauses programmées d'une compétition
   */
  getByCompetition: async (competitionId) => {
    try {
      const response = await api.get(
        `/api/admin/competitions/${competitionId}/scheduled-pauses`
      );
      return response;
    } catch (error) {
      console.error("Error fetching scheduled pauses:", error);
      throw error;
    }
  },

  /**
   * Crée une nouvelle pause programmée
   */
  create: async (competitionId, pauseData) => {
    try {
      const response = await api.post(
        `/api/admin/competitions/${competitionId}/scheduled-pauses`,
        pauseData
      );
      return response;
    } catch (error) {
      console.error("Error creating scheduled pause:", error);
      throw error;
    }
  },

  /**
   * Met à jour une pause programmée
   */
  update: async (competitionId, pauseId, pauseData) => {
    try {
      const response = await api.put(
        `/api/admin/competitions/${competitionId}/scheduled-pauses/${pauseId}`,
        pauseData
      );
      return response;
    } catch (error) {
      console.error("Error updating scheduled pause:", error);
      throw error;
    }
  },

  /**
   * Supprime une pause programmée
   */
  delete: async (competitionId, pauseId) => {
    try {
      const response = await api.delete(
        `/api/admin/competitions/${competitionId}/scheduled-pauses/${pauseId}`
      );
      return response;
    } catch (error) {
      console.error("Error deleting scheduled pause:", error);
      throw error;
    }
  },
};
