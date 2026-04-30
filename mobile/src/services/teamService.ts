import apiClient from './api';
import { API_ENDPOINTS } from '../config/api';

export interface TeamMember {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
}

export interface Team {
  id: number;
  name: string;
  members: TeamMember[];
  competition?: {
    id: number;
    name: string;
    teamSize?: number;
    startDate?: string;
    endDate?: string;
  };
  totalScore?: number;
  bonus?: number;
  registrationNumber?: number;
  catches?: any[];
  isActive?: boolean;
  isPersonalJournal?: boolean;
}

export const teamService = {
  getMyTeams: async (): Promise<{ teams: Team[] }> => {
    const response = await apiClient.get(API_ENDPOINTS.teams.myTeams);
    return response.data;
  },

  getOne: async (id: number): Promise<{ success: boolean; team: Team }> => {
    const response = await apiClient.get(API_ENDPOINTS.teams.detail(id));
    return response.data;
  },

  create: async (data: { name: string; participant2Email?: string }): Promise<any> => {
    const response = await apiClient.post(API_ENDPOINTS.teams.list, data);
    return response.data;
  },

  inviteMember: async (teamId: number, email: string): Promise<any> => {
    const response = await apiClient.post(`/api/teams/${teamId}/invite`, { email });
    return response.data;
  },

  leaveTeam: async (teamId: number): Promise<any> => {
    const response = await apiClient.post(`/api/teams/${teamId}/leave`);
    return response.data;
  },

  reactivate: async (teamId: number): Promise<any> => {
    const response = await apiClient.post(`/api/teams/${teamId}/reactivate`);
    return response.data;
  },

  getMyHistory: async (page: number = 1, limit: number = 10): Promise<any> => {
    const response = await apiClient.get(`/api/teams/my-history?page=${page}&limit=${limit}`);
    return response.data;
  },

  registerToCompetition: async (teamId: number, competitionId: number): Promise<any> => {
    const response = await apiClient.post(`/api/competitions/${competitionId}/teams/register`, {
      teamId: teamId,
    });
    return response.data;
  },

  // Invitations
  getMyInvitations: async (): Promise<any> => {
    const response = await apiClient.get(API_ENDPOINTS.teams.invitations.my);
    return response.data;
  },

  acceptInvitation: async (invitationId: number): Promise<any> => {
    const response = await apiClient.post(API_ENDPOINTS.teams.invitations.accept(invitationId));
    return response.data;
  },

  rejectInvitation: async (invitationId: number): Promise<any> => {
    const response = await apiClient.post(API_ENDPOINTS.teams.invitations.reject(invitationId));
    return response.data;
  },

  getTeamInvitations: async (teamId: number): Promise<any> => {
    const response = await apiClient.get(API_ENDPOINTS.teams.invitations.team(teamId));
    return response.data;
  },

  update: async (teamId: number, data: { name?: string; memberIds?: number[] }): Promise<any> => {
    const response = await apiClient.put(API_ENDPOINTS.teams.detail(teamId), data);
    return response.data;
  },
};
