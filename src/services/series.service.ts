import { axiosInstance } from './apiClient';

export interface SeriesFilters {
  status?: string;
  type?: string;
  page?: number;
  limit?: number;
  search?: string;
}

export const SeriesService = {
  getSeries: async (filters: SeriesFilters) => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.type && filters.type !== 'all') params.append('type', filters.type);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.search) params.append('search', filters.search);

      const response = await axiosInstance.get(`/series?${params.toString()}`);
      return response.data?.data?.result ?? response.data?.data ?? response.data;
    } catch (error) {
      console.error('Error fetching series:', error);
      throw error;
    }
  },

  getSeriesDetails: async (seriesId: string) => {
    try {
      const response = await axiosInstance.get(`/series/${seriesId}`);
      return response.data?.data?.result ?? response.data?.result ?? response.data;
    } catch (error) {
      console.error(`Error fetching series details for ${seriesId}:`, error);
      throw error;
    }
  }
};
