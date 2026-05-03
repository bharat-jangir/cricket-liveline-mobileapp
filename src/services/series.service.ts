import { axiosInstance } from './apiClient';

export interface SeriesFilters {
  status?: string;
  type?: string;
  page?: number;
  limit?: number;
  search?: string;
}

export const SeriesService = {
  getSeries: async (filters: any) => {
    try {
      // Use axios params to handle query string generation automatically
      const params: any = { ...filters };
      
      // Map 'type' to 'seriesType' if present (legacy support)
      if (params.type && params.type !== 'all' && params.type !== 'active') {
        // Ensure first letter is capitalized for seriesType enum
        const type = params.type.charAt(0).toUpperCase() + params.type.slice(1).toLowerCase();
        params.seriesType = type === 'Leagues' ? 'League' : type;
        delete params.type;
      }
      
      // If seriesType is already present, ensure it's correctly capitalized
      if (params.seriesType && params.seriesType !== 'all') {
        const sType = params.seriesType.charAt(0).toUpperCase() + params.seriesType.slice(1).toLowerCase();
        params.seriesType = sType === 'Leagues' ? 'League' : sType;
      }

      // Ensure status is capitalized (e.g. 'running' -> 'Running')
      if (params.status) {
        params.status = params.status.charAt(0).toUpperCase() + params.status.slice(1).toLowerCase();
      }

      // Remove 'all' if it was passed
      if (params.seriesType === 'all' || params.type === 'all') {
        delete params.seriesType;
        delete params.type;
      }

      console.log(`[SeriesService.getSeries] Fetching with params:`, params);

      const response = await axiosInstance.get('/app/series', { params });
      
      // Return the full data object which includes { result, pagination }
      // This is necessary for infinite scroll implementation
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

  getSeriesTeams: async (seriesId: string) => {
    try {
      const response = await axiosInstance.get(`/app/series/${seriesId}/teams`);
      return response.data?.data?.result ?? response.data?.data ?? response.data;
    } catch (error) {
      console.error(`Error fetching teams for series ${seriesId}:`, error);
      throw error;
    }
  },

  getSeriesVenues: async (seriesId: string) => {
    try {
      const response = await axiosInstance.get(`/app/series/${seriesId}/venues`);
      return response.data?.data?.result ?? response.data?.data ?? response.data;
    } catch (error) {
      console.error(`Error fetching venues for series ${seriesId}:`, error);
      throw error;
    }
  },

  getSeriesSquad: async (seriesId: string, teamId: string, format?: string) => {
    try {
      const url = `/app/series/${seriesId}/teams/${teamId}/squad${format ? `?format=${format}` : ''}`;
      const response = await axiosInstance.get(url);
      return response.data?.data?.result ?? response.data?.data ?? response.data;
    } catch (error) {
      console.error(`Error fetching squad for series ${seriesId}, team ${teamId}:`, error);
      throw error;
    }
  },

  getSeriesLeaders: async (seriesId: string) => {
    try {
      const response = await axiosInstance.get(`/app/series/${seriesId}/leaders`);
      return response.data?.data?.result ?? response.data?.data ?? response.data;
    } catch (error) {
      console.error(`Error fetching leaders for series ${seriesId}:`, error);
      throw error;
    }
  }
};
