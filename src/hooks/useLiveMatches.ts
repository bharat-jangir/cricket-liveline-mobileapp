/**
 * useLiveMatches.ts
 * 
 * Global listing hook — connects to the /live namespace and joins the
 * 'live-matches' room. Receives 'listing_update' events and merges them
 * into a Record<matchId, ListingUpdate> that the HomeScreen can overlay
 * on top of REST-loaded match cards.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../services/socketClient';

export interface TeamLiveScore {
  teamId: string;
  name: string;
  code: string;
  score: string;   // "145/3"
  overs: string;   // "18.4"
}

export interface ListingUpdate {
  matchId: string;
  teamA: TeamLiveScore;
  teamB: TeamLiveScore;
  status: string;
  currentInning: number;
  runRate: number;
  requiredRunRate?: number;
  lastBallLabel: string;
  timestamp: string;
}

export type LiveMatchMap = Record<string, ListingUpdate>;

interface UseLiveMatchesReturn {
  liveUpdates: LiveMatchMap;
  isConnected: boolean;
  lastUpdatedAt: Date | null;
}

export function useLiveMatches(): UseLiveMatchesReturn {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [liveUpdates, setLiveUpdates] = useState<LiveMatchMap>({});
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  const connectSocket = useCallback(() => {
    if (socketRef.current?.connected) return;

    const socket = io(`${SOCKET_URL}/live`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 10,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[useLiveMatches] Connected:', socket.id);
      setIsConnected(true);
      socket.emit('join_live_listing');
    });

    socket.on('disconnect', (reason) => {
      console.log('[useLiveMatches] Disconnected:', reason);
      setIsConnected(false);
    });

    socket.on('listing_joined', (data) => {
      console.log('[useLiveMatches] Joined listing room:', data);
    });

    socket.on('listing_update', (data: ListingUpdate) => {
      console.log('[useLiveMatches] listing_update RECEIVED:', JSON.stringify(data, null, 2));
      setLiveUpdates((prev) => ({
        ...prev,
        [data.matchId]: data,
      }));
      setLastUpdatedAt(new Date());
    });

    socket.on('connect_error', (err) => {
      console.warn('[useLiveMatches] Connection error:', err.message);
    });
  }, []);

  useEffect(() => {
    connectSocket();

    return () => {
      const socket = socketRef.current;
      if (socket) {
        socket.emit('leave_live_listing');
        socket.disconnect();
        socketRef.current = null;
      }
    };
  }, [connectSocket]);

  return { liveUpdates, isConnected, lastUpdatedAt };
}
