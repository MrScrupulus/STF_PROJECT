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

  getUsers: async (): Promise<any[]> => {
    const response = await apiClient.get('/api/admin/users');
    return response.data?.users || response.data || [];
  },

  getTeams: async (): Promise<any[]> => {
    const response = await apiClient.get('/api/admin/teams');
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
};
