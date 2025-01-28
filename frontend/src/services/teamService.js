import { api } from "./api";

export const teamService = {
  getAll: async () => {
    try {
      const response = await api.get("/teams");
      return response;
    } catch (error) {
      console.error("Error getting teams:", error);
      throw error;
    }
  },
  getById: (competitionId, id) =>
    api.get(`/competitions/${competitionId}/teams/${id}`),
  create: async (data) => {
    try {
      console.log("Creating team with data:", data); // Pour le débogage
      const response = await api.post("/teams", data);
      return response;
    } catch (error) {
      console.error("Error creating team:", error);
      throw error;
    }
  },
  update: (competitionId, id, data) =>
    api.put(`/competitions/${competitionId}/teams/${id}`, data),
  delete: async (teamId) => {
    try {
      const response = await api.delete(`/teams/${teamId}`);
      return response;
    } catch (error) {
      console.error("Error deleting team:", error);
      throw error;
    }
  },
  getMyTeams: async () => {
    try {
      const response = await api.get("/teams/my-teams");
      return response.teams;
    } catch (error) {
      console.error("Error fetching teams:", error);
      throw error;
    }
  },
  acceptInvitation: async (invitationToken) => {
    try {
      const response = await api.post(
        `/teams/accept-invitation/${invitationToken}`
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
        `/competitions/${competitionId}/teams/register`,
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
      const response = await api.post(`/teams/${teamId}/invite`, { email });
      return response;
    } catch (error) {
      console.error("Error inviting member:", error);
      throw error;
    }
  },
  removeMember: async (teamId, userId) => {
    try {
      const response = await api.delete(`/teams/${teamId}/members/${userId}`);
      return response;
    } catch (error) {
      console.error("Error removing member:", error);
      throw error;
    }
  },
  leaveTeam: async (teamId) => {
    try {
      const response = await api.post(`/teams/${teamId}/leave`);
      return response;
    } catch (error) {
      console.error("Error leaving team:", error);
      throw error;
    }
  },
};
