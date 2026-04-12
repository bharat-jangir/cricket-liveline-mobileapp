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
      console.log('[MatchService.getMatchDetails] Raw response.data:', JSON.stringify(response.data).substring(0, 800));
      const result = response.data?.data?.result ?? response.data?.result ?? response.data?.data ?? response.data;
      console.log('[MatchService.getMatchDetails] Extracted result keys:', result ? Object.keys(result) : 'null');
      return result;
    } catch (error) {
      console.error(`Error fetching match details for ${matchId}:`, error);
      throw error;
    }
  },

  getLiveStatus: async (matchId: string) => {
    try {
      const response = await axiosInstance.get(`/app/matches/${matchId}/live-status`);
      console.log('[MatchService.getLiveStatus] Raw response.data:', JSON.stringify(response.data).substring(0, 800));
      const result = response.data?.data?.result ?? response.data?.result ?? response.data?.data ?? response.data;
      console.log('[MatchService.getLiveStatus] Extracted result keys:', result ? Object.keys(result) : 'null');
      return result;
    } catch (error) {
      console.error(`Error fetching live status for ${matchId}:`, error);
      throw error;
    }
  },
  
  getScorecard: async (matchId: string, inningNumber: number = 1) => {
    try {
      const response = await axiosInstance.get(`/app/matches/${matchId}/scorecard/${inningNumber}`);
      const result = response.data?.data?.result ?? response.data?.result ?? response.data;
      
      console.log(`[MatchService.getScorecard] Inning ${inningNumber} response:`);
      if (result && result.batting) {
        console.log(`  Batting: ${result.batting.map((p: any) => `${p.playerName || p.playerId?.name} (v:${p.isVisible})`).join(', ')}`);
      }
      if (result && result.bowling) {
        console.log(`  Bowling: ${result.bowling.map((p: any) => `${p.playerName || p.playerId?.name} (v:${p.isVisible})`).join(', ')}`);
      }
      
      return result;
    } catch (error) {
      console.error(`Error fetching scorecard for match ${matchId}, inning ${inningNumber}:`, error);
      throw error;
    }
  },

  getRecentOvers: async (matchId: string, inningNumber?: number) => {
    try {
      const params = inningNumber ? `?inningNumber=${inningNumber}` : '';
      const response = await axiosInstance.get(`/app/matches/${matchId}/recent-overs${params}`);
      return response.data?.data?.result ?? response.data?.result ?? response.data;
    } catch (error) {
      console.error(`Error fetching recent overs for match ${matchId}:`, error);
      return null;
    }
  },

  getPartnerships: async (matchId: string, inningNumber?: number) => {
    try {
      const params = inningNumber ? `?inningNumber=${inningNumber}` : '';
      const response = await axiosInstance.get(`/app/matches/${matchId}/partnerships${params}`);
      return response.data?.data?.result ?? response.data?.result ?? response.data;
    } catch (error) {
      console.error(`Error fetching partnerships for match ${matchId}:`, error);
      return [];
    }
  },

  getSquads: async (matchId: string) => {
    try {
      const response = await axiosInstance.get(`/app/matches/${matchId}/squads`);
      const raw = response.data;
      console.log('[MatchService.getSquads] status:', raw?.statusCode, 'keys:', raw ? Object.keys(raw) : 'null');
      // successWithSingle wraps in { statusCode, data: { result: [...] } }
      const result = raw?.data?.result ?? raw?.result ?? raw?.data ?? raw;
      const arr = Array.isArray(result) ? result : [];
      console.log('[MatchService.getSquads] squads count:', arr.length, arr.map((s: any) => s.teamId?.name));
      return arr;
    } catch (error) {
      console.error(`Error fetching squads for match ${matchId}:`, error);
      return [];
    }
  },

  getPointsTable: async (seriesId: string) => {
    try {
      const response = await axiosInstance.get(`/points-tables?seriesId=${seriesId}`);
      // successWithPagination wraps in { statusCode, data: { result: [...] } }
      const result = response.data?.data?.result ?? response.data?.result ?? response.data?.data ?? response.data;
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error(`Error fetching points table for series ${seriesId}:`, error);
      return [];
    }
  },

  getSessions: async (matchId: string) => {
    try {
      const response = await axiosInstance.get(`/app/matches/${matchId}/sessions`);
      return response.data?.data?.result ?? response.data?.result ?? response.data;
    } catch (error) {
      console.error(`Error fetching sessions for match ${matchId}:`, error);
      return [];
    }
  },

  getCommentary: async (matchId: string) => {
    try {
      const response = await axiosInstance.get(`/app/matches/${matchId}/commentary`);
      const data = response.data?.data?.result ?? response.data?.result ?? response.data?.data ?? response.data;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error(`Error fetching commentary for match ${matchId}:`, error);
      return [];
    }
  },
};
