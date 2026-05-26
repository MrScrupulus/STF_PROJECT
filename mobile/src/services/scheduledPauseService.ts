import apiClient from './api';

export interface ScheduledPause {
  id: number;
  startDate: string;
  endDate: string;
  reason?: string;
  isActive: boolean;
  createdAt: string;
}

export interface ScheduledPauseResponse {
  success: boolean;
  pauses: ScheduledPause[];
}

export const scheduledPauseService = {
  /**
   * Récupère toutes les pauses programmées d'une compétition
   */
  getByCompetition: async (competitionId: number): Promise<ScheduledPauseResponse> => {
    try {
      const response = await apiClient.get(
        `/api/admin/competitions/${competitionId}/scheduled-pauses`
      );
      return response.data;
    } catch (error: any) {
      console.error('Error fetching scheduled pauses:', error);
      throw error;
    }
  },

  create: async (
    competitionId: number,
    body: { startDate: string; endDate: string; reason?: string | null }
  ): Promise<{ success: boolean; message?: string; pause?: ScheduledPause }> => {
    const response = await apiClient.post(
      `/api/admin/competitions/${competitionId}/scheduled-pauses`,
      body
    );
    return response.data;
  },

  update: async (
    competitionId: number,
    pauseId: number,
    body: { startDate?: string; endDate?: string; reason?: string | null; isActive?: boolean }
  ): Promise<{ success: boolean; message?: string; pause?: ScheduledPause }> => {
    const response = await apiClient.put(
      `/api/admin/competitions/${competitionId}/scheduled-pauses/${pauseId}`,
      body
    );
    return response.data;
  },

  delete: async (competitionId: number, pauseId: number): Promise<{ success: boolean; message?: string }> => {
    const response = await apiClient.delete(
      `/api/admin/competitions/${competitionId}/scheduled-pauses/${pauseId}`
    );
    return response.data;
  },
};
