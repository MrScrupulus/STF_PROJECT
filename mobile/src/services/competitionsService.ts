import apiClient from './api';
import { API_ENDPOINTS } from '../config/api';

export interface ScheduledPause {
  id: number;
  startDate: string;
  endDate: string;
  reason?: string;
}

export interface Perimeter {
  id: number;
  name?: string;
  coordinates: number[][]; // [[lat, lng], [lat, lng], ...]
}

export interface Competition {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  teams?: Team[];
  scheduledPauses?: ScheduledPause[];
  perimeters?: Perimeter[];
  isRankingPublic?: boolean;
  isPaused?: boolean;
  description?: string;
  isRegistered?: boolean;
}

export interface Team {
  id: number;
  name: string;
  totalScore: number;
}

export const competitionsService = {
  getAll: async (): Promise<Competition[]> => {
    const response = await apiClient.get(API_ENDPOINTS.competitions.list);
    // Le backend retourne { success: true, competitions: [...], pagination: {...} }
    if (response.data && response.data.competitions) {
      return response.data.competitions;
    }
    // Fallback si la structure est différente
    return response.data || [];
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
    const response = await apiClient.get(API_ENDPOINTS.competitions.statsPublic(id));
    return response.data;
  },

  /** Statistiques individuelles officielles (prises validées, caughtBy = utilisateur connecté). */
  getMyStats: async (id: number): Promise<any> => {
    const response = await apiClient.get(API_ENDPOINTS.competitions.myStats(id));
    return response.data;
  },

  /** Statistiques d'équipe (votre équipe sur cette compétition, prises validées). */
  getMyTeamStats: async (id: number): Promise<any> => {
    const response = await apiClient.get(API_ENDPOINTS.competitions.myTeamStats(id));
    return response.data;
  },

  /** Statistiques globales personnelles (toutes compétitions, prises validées). */
  getMyGlobalStats: async (): Promise<any> => {
    const response = await apiClient.get(API_ENDPOINTS.me.stats);
    return response.data;
  },
  getAdminStats: async (id: number): Promise<any> => {
    const response = await apiClient.get(API_ENDPOINTS.competitions.stats(id));
    return response.data;
  },

  unregisterFromCompetition: async (competitionId: number): Promise<any> => {
    const response = await apiClient.post(API_ENDPOINTS.competitions.unregisterTeam(competitionId));
    return response.data;
  },
};

