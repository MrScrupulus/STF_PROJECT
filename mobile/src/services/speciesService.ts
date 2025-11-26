import apiClient from './api';
import { API_ENDPOINTS } from '../config/api';

export interface Species {
  id: number;
  name: string;
  coefficient?: number;
  basePoints?: number;
}

export const speciesService = {
  getAll: async (): Promise<Species[]> => {
    const response = await apiClient.get(API_ENDPOINTS.species.list);
    return response.data;
  },

  getOne: async (id: number): Promise<Species> => {
    const response = await apiClient.get(API_ENDPOINTS.species.detail(id));
    return response.data;
  },
};

