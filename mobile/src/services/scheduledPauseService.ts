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
};
