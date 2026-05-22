import { axiosInstance } from './apiClient';

export interface MatchFilters {
  status?: 'scheduled' | 'live' | 'completed' | 'abandoned';
  page?: number;
  limit?: number;
  cursor?: string;
  direction?: 'past' | 'future';
  matchFormat?: string;
}

export const MatchService = {
  getMatches: async (filters: MatchFilters) => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.cursor) params.append('cursor', filters.cursor);
      if (filters.direction) params.append('direction', filters.direction);
      if (filters.matchFormat) params.append('matchFormat', filters.matchFormat);



      const response = await axiosInstance.get(`/app/matches?${params.toString()}`);
      const result = response.data?.data?.result ?? response.data?.result ?? response.data?.data ?? response.data;
      return Array.isArray(result) ? result : [];
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
      const result = response.data?.data?.result ?? response.data?.result ?? response.data;
      return Array.isArray(result) ? result : [];
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
      const result = response.data?.data?.result ?? response.data?.result ?? response.data;
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error(`Error fetching sessions for match ${matchId}:`, error);
      return [];
    }
  },

  getCommentary: async (matchId: string, params: { page?: number, limit?: number, type?: string, inningId?: string } = {}) => {
    try {
      const query = new URLSearchParams();
      if (params.page) query.append('page', params.page.toString());
      if (params.limit) query.append('limit', params.limit.toString());
      if (params.type) query.append('type', params.type);
      if (params.inningId) query.append('inningId', params.inningId);

      const response = await axiosInstance.get(`/app/matches/${matchId}/commentary?${query.toString()}`);
      const data = response.data?.data?.result ?? response.data?.result ?? response.data?.data ?? response.data;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error(`Error fetching commentary for match ${matchId}:`, error);
      return [];
    }
  },

  getMatchAnalytics: async (matchId: string) => {
    try {
      const response = await axiosInstance.get(`/app/matches/${matchId}/analytics`);
      const result = response.data?.data?.result ?? response.data?.result ?? response.data?.data ?? response.data;
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error(`Error fetching analytics for match ${matchId}:`, error);
      return [];
    }
  },

  getSeries: async (params: { search?: string; status?: string; page?: number; limit?: number } = {}) => {
    try {
      const query = new URLSearchParams();
      if (params.search) query.append('search', params.search);
      if (params.status) query.append('status', params.status);
      if (params.page) query.append('page', params.page.toString());
      if (params.limit) query.append('limit', params.limit.toString());

      const response = await axiosInstance.get(`/app/series?${query.toString()}`);
      // Return the full data object which includes { result, pagination }
      return response.data?.data ?? response.data;
    } catch (error) {
      console.error('Error fetching series:', error);
      throw error;
    }
  },

  getSeriesDetails: async (seriesId: string) => {
    try {
      const response = await axiosInstance.get(`/app/series/${seriesId}`);
      return response.data?.data?.result ?? response.data?.data ?? response.data;
    } catch (error) {
      console.error(`Error fetching series details for ${seriesId}:`, error);
      throw error;
    }
  },

  getSeriesMatches: async (seriesId: string) => {
    try {
      // The backend uses matches.findAll with seriesId filter
      const response = await axiosInstance.get(`/app/matches?seriesId=${seriesId}`);
      return response.data?.data?.result ?? response.data?.data ?? response.data;
    } catch (error) {
      console.error(`Error fetching matches for series ${seriesId}:`, error);
      throw error;
    }
  },
};
