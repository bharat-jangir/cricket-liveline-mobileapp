import { Platform } from 'react-native';

/**
 * Central runtime configuration. Set these in `.env` (Expo reads EXPO_PUBLIC_* at build time).
 *
 *   EXPO_PUBLIC_API_URL     gateway base incl. /api, e.g. https://api.example.com/api
 *   EXPO_PUBLIC_SOCKET_URL  optional websocket origin (defaults to API_URL without /api)
 */
const devDefault = Platform.OS === 'android' ? 'http://10.0.2.2:5000/api' : 'http://localhost:5000/api';

const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();

if (!fromEnv && !__DEV__) {
  // A release build without an API URL can never work; fail loudly instead of silently
  // talking to a developer tunnel.
  throw new Error('EXPO_PUBLIC_API_URL is not set. Configure it before building a release.');
}

export const API_URL = (fromEnv || devDefault).replace(/\/$/, '');
export const SOCKET_URL = (process.env.EXPO_PUBLIC_SOCKET_URL?.trim() || API_URL.replace(/\/api$/, '')).replace(/\/$/, '');
export const REQUEST_TIMEOUT_MS = 15000;
