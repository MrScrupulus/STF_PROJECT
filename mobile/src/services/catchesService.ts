import apiClient from './api';
import { API_ENDPOINTS } from '../config/api';

export interface Species {
  id: number;
  name: string;
  coefficient?: number;
  basePoints?: number;
}

export interface FishCatch {
  id: number;
  species: Species;
  length: number;
  points: number;
  photoUrl?: string;
  team: {
    id: number;
    name: string;
  };
  catchTime: string;
  isValidated: boolean;
}

export interface CreateCatchData {
  speciesId: number;
  size: number;
  photoUrl?: string;
  comment?: string;
  caughtById?: number;
  latitude?: number;
  longitude?: number;
}

export const catchesService = {
  getAll: async (): Promise<FishCatch[]> => {
    const response = await apiClient.get(API_ENDPOINTS.catches.list);
    // Le backend retourne { success: true, catches: [...], pagination: {...} }
    if (response.data && response.data.catches) {
      return response.data.catches;
    }
    // Fallback si la structure est différente (ancien format ou erreur)
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return [];
  },

  getOne: async (id: number): Promise<FishCatch> => {
    const response = await apiClient.get(API_ENDPOINTS.catches.detail(id));
    return response.data;
  },

  create: async (competitionId: number, data: CreateCatchData): Promise<FishCatch> => {
    try {
      const response = await apiClient.post(`/api/competitions/${competitionId}/catches`, data);
      return response.data.catch || response.data;
    } catch (error: any) {
      console.error('Erreur dans catchesService.create:', error);
      // Propager l'erreur avec plus de détails
      if (error.response?.data) {
        const errorWithData = new Error(error.response.data.message || 'Erreur lors de la création de la prise');
        (errorWithData as any).response = error.response;
        throw errorWithData;
      }
      throw error;
    }
  },

  update: async (id: number, data: Partial<FishCatch>): Promise<FishCatch> => {
    const response = await apiClient.put(API_ENDPOINTS.catches.detail(id), data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.catches.detail(id));
  },

  validate: async (id: number): Promise<FishCatch> => {
    const response = await apiClient.patch(API_ENDPOINTS.catches.validate(id), {});
    return response.data;
  },
};

