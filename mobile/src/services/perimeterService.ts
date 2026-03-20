import apiClient from './api';

export interface Perimeter {
  id: number;
  name?: string;
  coordinates: number[][]; // [[lat, lng], [lat, lng], ...]
  isActive?: boolean;
}

export const perimeterService = {
  getAll: async (competitionId: number): Promise<{ perimeters: Perimeter[] }> => {
    const response = await apiClient.get(
      `/api/admin/competitions/${competitionId}/perimeters`
    );
    return response.data;
  },

  create: async (
    competitionId: number,
    data: { coordinates: number[][]; name?: string; isActive?: boolean }
  ): Promise<any> => {
    const response = await apiClient.post(
      `/api/admin/competitions/${competitionId}/perimeters`,
      data
    );
    return response.data;
  },

  update: async (
    competitionId: number,
    perimeterId: number,
    data: { coordinates?: number[][]; name?: string; isActive?: boolean }
  ): Promise<any> => {
    const response = await apiClient.put(
      `/api/admin/competitions/${competitionId}/perimeters/${perimeterId}`,
      data
    );
    return response.data;
  },

  delete: async (
    competitionId: number,
    perimeterId: number
  ): Promise<void> => {
    await apiClient.delete(
      `/api/admin/competitions/${competitionId}/perimeters/${perimeterId}`
    );
  },
};
