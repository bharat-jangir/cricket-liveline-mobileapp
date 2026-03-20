import axios, { InternalAxiosRequestConfig, AxiosError } from 'axios';

// Pointing directly to main-app HTTP (port 5000 after env override) - firewall is already open for this port.
// Use local IP for testing on physical devices or 10.0.2.2 for Android Emulator
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.51:5000';

export const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add auth tokens here if needed
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);
