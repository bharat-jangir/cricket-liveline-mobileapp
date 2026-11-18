/**
 * Centralised Socket URL for the mobile app (see src/config.ts).
 * The gateway proxies /socket.io to the socket service, so this is normally the API origin.
 */
import { SOCKET_URL } from '../config';

export { SOCKET_URL };

if (__DEV__) {
  console.log('[socketClient] SOCKET_URL =', SOCKET_URL);
}
