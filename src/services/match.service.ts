import { axiosInstance } from './apiClient';

export interface MatchFilters {
  status?: 'scheduled' | 'live' | 'completed' | 'abandoned';
  page?: number;
  limit?: number;
}

export const MatchService = {
  getMatches: async (filters: MatchFilters) => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());

      const response = await axiosInstance.get(`/app/matches?${params.toString()}`);
      // app matches response: { statusCode, status, data: { result: [...] } }
      return response.data?.data?.result ?? response.data?.data ?? response.data;
    } catch (error) {
      console.error('Error fetching matches:', error);
      throw error;
    }
  },

  getMatchDetails: async (matchId: string) => {
    try {
      const response = await axiosInstance.get(`/app/matches/${matchId}`);
      return response.data?.data?.result ?? response.data?.result ?? response.data;
    } catch (error) {
      console.error(`Error fetching match details for ${matchId}:`, error);
      throw error;
    }
  },

  getLiveStatus: async (matchId: string) => {
    try {
      const response = await axiosInstance.get(`/matches/${matchId}/live-status`);
      return response.data?.data?.result ?? response.data?.result ?? response.data;
    } catch (error) {
      console.error(`Error fetching live status for ${matchId}:`, error);
      throw error;
    }
  },
  
  getScorecard: async (matchId: string, inningNumber: number = 1) => {
    try {
      const response = await axiosInstance.get(`/matches/${matchId}/scorecard/${inningNumber}`);
      return response.data?.data?.result ?? response.data?.result ?? response.data;
    } catch (error) {
      console.error(`Error fetching scorecard for match ${matchId}, inning ${inningNumber}:`, error);
      throw error;
    }
  }
};
