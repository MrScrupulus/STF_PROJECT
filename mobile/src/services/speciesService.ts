import apiClient from './api';
import { API_ENDPOINTS } from '../config/api';

export interface Species {
  id: number;
  name: string;
  coefficient: number;
  isBonus?: boolean;
}

export const speciesService = {
  getAll: async (): Promise<Species[]> => {
    const response = await apiClient.get(API_ENDPOINTS.species.list);
    // Le backend retourne { success: true, data: [...] }
    const data = response.data?.data || response.data || [];
    return Array.isArray(data) ? data : [];
  },

  getOne: async (id: number): Promise<Species> => {
    const response = await apiClient.get(API_ENDPOINTS.species.detail(id));
    return response.data;
  },

  /** Création par un utilisateur connecté (référentiel global, dédup côté serveur). */
  create: async (data: {
    name: string;
    coefficient: number;
    isBonus?: boolean;
    basePoints?: number;
  }): Promise<{
    message?: string;
    reused?: boolean;
    species: { id: number; name: string; coefficient: number; basePoints?: number };
  }> => {
    const response = await apiClient.post(API_ENDPOINTS.species.list, data);
    return response.data;
  },
};
