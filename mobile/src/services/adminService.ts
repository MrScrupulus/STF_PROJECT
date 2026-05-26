import apiClient from './api';
import { API_ENDPOINTS } from '../config/api';

export interface PendingCatch {
  id: number;
  species: {
    id: number;
    name: string;
    coefficient: number;
  };
  size: number;
  points: number;
  photoUrl?: string;
  comment?: string;
  createdAt: string; // Format: 'Y-m-d H:i:s' depuis le backend
  catchTime?: string; // Alias pour compatibilité
  team: {
    id: number;
    name: string;
    registrationNumber?: string;
  };
  caughtBy?: {
    id: number;
    firstname: string;
    lastname: string;
  };
  isValidated: boolean;
  rejectionReason?: string;
}

export const adminService = {
  getPendingCatches: async (page: number = 1, limit: number = 10): Promise<any> => {
    const response = await apiClient.get(`/api/admin/catches/pending?page=${page}&limit=${limit}`);
    return response.data;
  },

  validateCatch: async (catchId: number): Promise<any> => {
    const response = await apiClient.post(`/api/admin/catches/${catchId}/validate`);
    return response.data;
  },

  rejectCatch: async (catchId: number, reason: string): Promise<any> => {
    const response = await apiClient.post(`/api/admin/catches/${catchId}/reject`, { reason });
    return response.data;
  },

  deleteTeamPenalty: async (teamId: number, penaltyId: number): Promise<any> => {
    const response = await apiClient.delete(`/admin/teams/${teamId}/penalties/${penaltyId}`);
    return response.data;
  },

  createTeamPenalty: async (
    teamId: number,
    payload: { points: number; reason?: string; fishCatchId?: number }
  ): Promise<any> => {
    const response = await apiClient.post(`/admin/teams/${teamId}/penalties`, payload);
    return response.data;
  },

  getTeamPenalties: async (teamId: number): Promise<any> => {
    const response = await apiClient.get(`/admin/teams/${teamId}/penalties`);
    return response.data;
  },

  /** Prises valides pour rattacher une pénalité (admin, hors journal perso). */
  getTeamPenaltyEligibleCatches: async (teamId: number): Promise<any> => {
    const response = await apiClient.get(`/admin/teams/${teamId}/penalty-eligible-catches`);
    return response.data;
  },

  /** Met à jour la taille (cm) ; recalcule points et scores côté serveur */
  updateCatchSize: async (catchId: number, size: number): Promise<any> => {
    const response = await apiClient.patch(`/api/admin/catches/${catchId}`, { size });
    return response.data;
  },

  getUsers: async (): Promise<any[]> => {
    const response = await apiClient.get('/api/admin/users');
    return response.data?.users || response.data || [];
  },

  getTeams: async (): Promise<any[]> => {
    const response = await apiClient.get('/admin/teams');
    return response.data?.teams || response.data || [];
  },

  getCompetitions: async (): Promise<any[]> => {
    const response = await apiClient.get('/api/admin/competitions');
    return response.data?.competitions || response.data || [];
  },

  getCatchById: async (catchId: number): Promise<PendingCatch | null> => {
    try {
      // Récupérer toutes les prises en attente et trouver celle avec l'ID correspondant
      const response = await apiClient.get('/api/admin/catches/pending');
      const catches = response.data?.catches || response.data || [];
      const found = catches.find((c: PendingCatch) => c.id === catchId);
      // Retourner null au lieu de undefined pour éviter l'erreur React Query
      return found || null;
    } catch (error) {
      console.error('Error fetching catch by ID:', error);
      return null;
    }
  },

  createCatch: async (data: {
    competitionId: number;
    teamId: number;
    speciesId: number;
    size: number;
    photoUrl?: string;
    comment?: string;
    caughtById?: number;
  }): Promise<any> => {
    const response = await apiClient.post('/api/admin/catches/create', data);
    return response.data;
  },

  togglePause: async (competitionId: number, isPaused: boolean): Promise<any> => {
    const response = await apiClient.post(`/api/admin/competitions/${competitionId}/pause`, {
      isPaused,
    });
    return response.data;
  },

  updateCompetition: async (competitionId: number, data: any): Promise<any> => {
    const response = await apiClient.put(`/api/competitions/${competitionId}`, data);
    return response.data;
  },

  createCompetition: async (data: any): Promise<any> => {
    const response = await apiClient.post('/api/admin/competitions', data);
    return response.data;
  },

  uploadReglementImage: async (competitionId: number, uri: string, type: string = 'image/jpeg'): Promise<any> => {
    const formData = new FormData();
    const ext = type.includes('png') ? 'png' : type.includes('webp') ? 'webp' : 'jpg';
    formData.append('image', {
      uri,
      name: `reglement.${ext}`,
      type: type || 'image/jpeg',
    } as any);
    const response = await apiClient.post(`/api/admin/competitions/${competitionId}/reglement-image`, formData);
    return response.data;
  },

  deleteReglementImage: async (competitionId: number, index: number): Promise<any> => {
    const response = await apiClient.delete(`/api/admin/competitions/${competitionId}/reglement-image/${index}`);
    return response.data;
  },

  /** Création admin ; si une espèce du même nom existe (casse / espaces), le backend renvoie reused + l’existant. */
  createSpecies: async (data: {
    name: string;
    coefficient: number;
    isBonus?: boolean;
    basePoints?: number;
  }): Promise<{ message?: string; reused?: boolean; species: { id: number; name: string; coefficient: number; basePoints?: number } }> => {
    const response = await apiClient.post('/api/admin/species', data);
    return response.data;
  },
};
