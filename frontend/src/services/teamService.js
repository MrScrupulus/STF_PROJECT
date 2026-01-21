import { api } from "./api";

export const teamService = {
  getAll: async () => {
    try {
      const response = await api.get("/api/teams");
      // La réponse peut être directement un objet avec teams ou directement un tableau
      if (response.success && response.teams) {
        return response;
      }
      // Si c'est directement un tableau ou un objet avec une propriété teams
      return response;
    } catch (error) {
      console.error("Error getting teams:", error);
      throw error;
    }
  },
  getById: async (competitionId, id) => {
    try {
      const response = await api.get(`/api/teams/${id}`);
      return response;
    } catch (error) {
      console.error("Error getting team:", error);
      throw error;
    }
  },
  create: async (data) => {
    try {
      console.log("Creating team with data:", data); // Pour le débogage
      const response = await api.post("/api/teams", data);
      return response;
    } catch (error) {
      console.error("Error creating team:", error);
      throw error;
    }
  },
  update: (competitionId, id, data) =>
    api.put(`/api/competitions/${competitionId}/teams/${id}`, data),
  delete: async (teamId) => {
    try {
      const response = await api.delete(`/api/teams/${teamId}`);
      return response;
    } catch (error) {
      console.error("Error deleting team:", error);
      throw error;
    }
  },
  getMyTeams: async () => {
    try {
      const response = await api.get("/api/teams/my-teams");
      return response;
    } catch (error) {
      console.error("Error fetching teams:", error);
      throw error;
    }
  },
  acceptInvitation: async (invitationToken) => {
    try {
      const response = await api.post(
        `/api/teams/accept-invitation/${invitationToken}`
      );
      return response;
    } catch (error) {
      console.error("Error accepting invitation:", error);
      throw error;
    }
  },
  registerToCompetition: async (teamId, competitionId) => {
    try {
      const response = await api.post(
        `/api/competitions/${competitionId}/teams/register`,
        {
          teamId: teamId,
        }
      );
      return response;
    } catch (error) {
      console.error("Error registering team to competition:", error);
      throw error;
    }
  },
  inviteMember: async (teamId, email) => {
    try {
      const response = await api.post(`/api/teams/${teamId}/invite`, { email });
      return response;
    } catch (error) {
      console.error("Error inviting member:", error);
      throw error;
    }
  },
  removeMember: async (teamId, userId) => {
    try {
      const response = await api.delete(`/api/teams/${teamId}/members/${userId}`);
      return response;
    } catch (error) {
      console.error("Error removing member:", error);
      throw error;
    }
  },
  leaveTeam: async (teamId) => {
    try {
      const response = await api.post(`/api/teams/${teamId}/leave`);
      return response;
    } catch (error) {
      console.error("Error leaving team:", error);
      throw error;
    }
  },
  getMyHistory: async (page = 1, limit = 10) => {
    try {
      const response = await api.get(`/api/teams/my-history?page=${page}&limit=${limit}`);
      return response;
    } catch (error) {
      console.error("Error fetching history:", error);
      throw error;
    }
  },
  reactivate: async (teamId, memberIds = null) => {
    try {
      const data = memberIds ? { memberIds } : {};
      const response = await api.post(`/api/teams/${teamId}/reactivate`, data);
      return response;
    } catch (error) {
      console.error("Error reactivating team:", error);
      throw error;
    }
  },
};
