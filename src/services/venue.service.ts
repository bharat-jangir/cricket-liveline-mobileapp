import { axiosInstance } from './apiClient';

export const VenueService = {
  getVenues: async (params: any = {}) => {
    try {
      const response = await axiosInstance.get('/app/venues', { params });
      // Return the full data object which includes { result, pagination }
      return response.data?.data ?? response.data;
    } catch (error) {
      console.error('Error fetching venues:', error);
      throw error;
    }
  },

  getVenueDetails: async (id: string) => {
    try {
      const response = await axiosInstance.get(`/app/venues/${id}`);
      return response.data?.data?.result ?? response.data?.data ?? response.data;
    } catch (error) {
      console.error(`Error fetching venue details for ${id}:`, error);
      throw error;
    }
  },

  getVenueStats: async (id: string) => {
    try {
      const response = await axiosInstance.get(`/app/venues/${id}/stats`);
      return response.data?.data?.result ?? response.data?.data ?? response.data;
    } catch (error) {
      console.error(`Error fetching venue stats for ${id}:`, error);
      // Return null or handle error as needed
      return null;
    }
  }
};
