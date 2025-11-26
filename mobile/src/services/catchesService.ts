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
  teamId: number;
  length: number;
  photoUrl?: string;
}

export const catchesService = {
  getAll: async (): Promise<FishCatch[]> => {
    const response = await apiClient.get(API_ENDPOINTS.catches.list);
    return response.data;
  },

  getOne: async (id: number): Promise<FishCatch> => {
    const response = await apiClient.get(API_ENDPOINTS.catches.detail(id));
    return response.data;
  },

  create: async (data: CreateCatchData): Promise<FishCatch> => {
    const response = await apiClient.post(API_ENDPOINTS.catches.list, data);
    return response.data;
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

