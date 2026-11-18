import { apiClient } from './apiClient';

export interface PlayerProfile {
  _id: string;
  id: string;
  name: string;
  country: string;
  role: string;
  image?: string;
  birthPlace?: string;
  age?: number;
  battingStyle?: string;
  bowlingStyle?: string;
  teams: string[];
}

export interface PlayerStats {
  matches: string;
  runs?: string;
  wickets?: string;
  average: string;
  strikeRate?: string;
  economy?: string;
  highScore?: string;
  bestBowling?: string;
  hundreds?: string;
  fifties?: string;
  fiveWickets?: string;
}

export const PlayerService = {
  getPlayers: async (params: { search?: string; role?: string; page?: number; limit?: number }) => {
    const response = await apiClient.get('/app/players', { params });
    const data = response.data?.data ?? response.data;
    return { result: (data?.result ?? []) as any[], pagination: data?.pagination as { page: number; totalPages: number } | undefined };
  },

  getPlayerDetails: async (playerId: string): Promise<PlayerProfile | null> => {
    try {
      const response = await apiClient.get(`/app/players/${playerId}`);
      const data = response.data;

      if (data && (data.status === false || data.success === false)) {
        console.warn(`[PlayerService] API returned error: ${data.message}`);
        return null;
      }

      const result = data?.data?.result ?? data?.result ?? data?.data ?? data;
      return result;
    } catch (error) {
      console.error(`[PlayerService] Error fetching player details:`, error);
      return null;
    }
  },

  getPlayerStats: async (playerId: string, format: string): Promise<PlayerStats | null> => {
    try {
      const response = await apiClient.get(`/app/players/${playerId}/stats`, {
        params: { format }
      });
      const data = response.data;

      if (data && (data.status === false || data.success === false)) {
        return null;
      }

      return data?.data?.result ?? data?.result ?? data?.data ?? data;
    } catch (error) {
      console.error(`[PlayerService] Error fetching player stats:`, error);
      return null;
    }
  }
};
