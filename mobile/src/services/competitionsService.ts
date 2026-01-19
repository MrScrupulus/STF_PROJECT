import apiClient from './api';
import { API_ENDPOINTS } from '../config/api';

export interface ScheduledPause {
  id: number;
  startDate: string;
  endDate: string;
  reason?: string;
}

export interface Competition {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  teams?: Team[];
  scheduledPauses?: ScheduledPause[];
  isRankingPublic?: boolean;
  isPaused?: boolean;
  description?: string;
}

export interface Team {
  id: number;
  name: string;
  totalScore: number;
}

export const competitionsService = {
  getAll: async (): Promise<Competition[]> => {
    const response = await apiClient.get(API_ENDPOINTS.competitions.list);
    return response.data.competitions || response.data;
  },

  getOne: async (id: number): Promise<Competition> => {
    const response = await apiClient.get(API_ENDPOINTS.competitions.detail(id));
    return response.data;
  },

  create: async (data: Partial<Competition>): Promise<Competition> => {
    const response = await apiClient.post(API_ENDPOINTS.competitions.list, data);
    return response.data;
  },

  update: async (id: number, data: Partial<Competition>): Promise<Competition> => {
    const response = await apiClient.put(API_ENDPOINTS.competitions.detail(id), data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.competitions.detail(id));
  },

  start: async (id: number): Promise<Competition> => {
    const response = await apiClient.put(API_ENDPOINTS.competitions.start(id), {});
    return response.data;
  },

  end: async (id: number): Promise<Competition> => {
    const response = await apiClient.put(API_ENDPOINTS.competitions.end(id), {});
    return response.data;
  },

  getPublicStats: async (id: number): Promise<any> => {
    const response = await apiClient.get(`/api/admin/competitions/${id}/stats`);
    return response.data;
  },
};

