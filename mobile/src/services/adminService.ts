import * as FileSystem from 'expo-file-system/legacy';
import * as SecureStore from 'expo-secure-store';
import * as Sharing from 'expo-sharing';
import apiClient from './api';
import { API_BASE_URL } from '../config/api';
import { uriToJpegDataUrl } from '../utils/imageUpload';

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
    const image = await uriToJpegDataUrl(uri);
    const response = await apiClient.post(
      `/api/admin/competitions/${competitionId}/reglement-image`,
      { image },
      { timeout: 60000 }
    );
    return response.data;
  },

  deleteReglementImage: async (competitionId: number, index: number): Promise<any> => {
    const response = await apiClient.delete(`/api/admin/competitions/${competitionId}/reglement-image/${index}`);
    return response.data;
  },

  uploadCoverImage: async (competitionId: number, uri: string, _type: string = 'image/jpeg'): Promise<any> => {
    const image = await uriToJpegDataUrl(uri);
    const response = await apiClient.post(
      `/api/admin/competitions/${competitionId}/cover-image`,
      { image },
      { timeout: 60000 }
    );
    return response.data;
  },

  deleteCoverImage: async (competitionId: number): Promise<any> => {
    const response = await apiClient.delete(`/api/admin/competitions/${competitionId}/cover-image`);
    return response.data;
  },

  deleteCompetition: async (competitionId: number): Promise<any> => {
    const response = await apiClient.delete(`/api/admin/competitions/${competitionId}`);
    return response.data;
  },

  downloadCompetitionPdf: async (competitionId: number, competitionName: string): Promise<void> => {
    const token = await SecureStore.getItemAsync('jwtToken');
    if (!token) {
      throw new Error('Session expirée. Veuillez vous reconnecter.');
    }
    const safeName = (competitionName || 'competition').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `classement_${safeName}_${new Date().toISOString().split('T')[0]}.pdf`;
    const destDir = FileSystem.cacheDirectory || FileSystem.documentDirectory;
    if (!destDir) {
      throw new Error('Stockage local indisponible.');
    }
    const dest = `${destDir}${filename}`;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/pdf',
    };
    if (API_BASE_URL.includes('ngrok')) {
      headers['ngrok-skip-browser-warning'] = '1';
    }
    const result = await FileSystem.downloadAsync(
      `${API_BASE_URL}/api/admin/competitions/${competitionId}/pdf`,
      dest,
      { headers }
    );
    if (result.status !== 200) {
      throw new Error('Impossible de générer le PDF du classement.');
    }
    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      throw new Error('Le partage de fichiers n’est pas disponible sur cet appareil.');
    }
    await Sharing.shareAsync(result.uri, {
      mimeType: 'application/pdf',
      UTI: 'com.adobe.pdf',
      dialogTitle: filename,
    });
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
