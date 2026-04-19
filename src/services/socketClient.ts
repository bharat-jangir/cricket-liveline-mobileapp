/**
 * socketClient.ts
 * Centralised Socket URL resolution for the mobile app.
 *
 * Priority order:
 *  1. EXPO_PUBLIC_SOCKET_URL  → use directly
 *  2. EXPO_PUBLIC_API_URL  → strip '/api' suffix (gateway handles WebSocket proxying on port 5000)
 *  3. Fallback → http://localhost:5000
 */

const deriveSocketUrl = (): string => {
  // 1. Explicit socket URL — highest priority
  const explicit = process.env.EXPO_PUBLIC_SOCKET_URL;
  if (explicit) return explicit;

  // 2. Derive from API URL
  // If undefined, use the same default ngrok URL as apiClient.ts
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://1cd0-43-249-53-242.ngrok-free.app/api';
  
  // Strip /api suffix and return the root
  return apiUrl.replace(/\/api\/?$/, '');
};

export const SOCKET_URL = deriveSocketUrl();

// Log the resolved URL in dev mode
if (__DEV__) {
  console.log('[socketClient] SOCKET_URL =', SOCKET_URL);
}
