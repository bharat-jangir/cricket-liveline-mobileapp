import axios, { InternalAxiosRequestConfig, AxiosError } from 'axios';
import { API_URL, REQUEST_TIMEOUT_MS } from '../config';

export const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: { Accept: 'application/json' },
});

export const apiClient = axiosInstance;

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (__DEV__) console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, config.params || '');
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

/** One quiet retry for transient network failures on idempotent GETs (flaky mobile connections). */
axiosInstance.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const cfg: any = error.config;
    const transient = !error.response || error.response.status >= 502;
    if (cfg && cfg.method === 'get' && transient && !cfg.__retried) {
      cfg.__retried = true;
      await new Promise((r) => setTimeout(r, 600));
      return axiosInstance(cfg);
    }
    return Promise.reject(error);
  },
);
