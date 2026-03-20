import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

// Use same IP as API_URL but on port 5003 (Socket Service)
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.51:5000/api';
const SOCKET_URL = API_URL.replace(':5000/api', ':5003').replace(':5000', ':5003');

export function useLiveMatch(matchId: string) {
  const socketRef = useRef<Socket | null>(null);
  
  // Expose the last received payloads so components can just react to state changes
  const [matchStatus, setMatchStatus] = useState<any>(null);
  const [ballData, setBallData] = useState<any>(null);
  const [scorecardUpdate, setScorecardUpdate] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!matchId) return;

    console.log(`[Socket] Connecting to /live namespace for match ${matchId}`);
    
    socketRef.current = io(`${SOCKET_URL}/live`, {
      transports: ['websocket', 'polling'], // fallback
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('[Socket] Connected!', socket.id);
      setIsConnected(true);
      socket.emit('join_match', { matchId });
    });

    socket.on('disconnect', () => {
      console.log('[Socket] Disconnected');
      setIsConnected(false);
    });

    // Handle generic match updates (runs, wickets, overs, matchStatus)
    socket.on('match_update', (data) => {
      console.log('[Socket] match_update received:', data);
      setMatchStatus((prev: any) => ({ ...prev, ...data }));
    });

    // Handle ball-by-ball commentary updates
    socket.on('ball_update', (data) => {
      console.log('[Socket] ball_update received:', data);
      setBallData(data);
    });

    // Handle detailed scorecard updates
    socket.on('scorecard_update', (data) => {
      console.log('[Socket] scorecard_update received:', data);
      setScorecardUpdate(data);
    });

    return () => {
      if (socket.connected) {
        socket.emit('leave_match', { matchId });
        socket.disconnect();
      }
    };
  }, [matchId]);

  return {
    socket: socketRef.current,
    isConnected,
    matchStatus,
    ballData,
    scorecardUpdate
  };
}
