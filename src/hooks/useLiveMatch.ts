/**
 * useLiveMatch.ts
 * 
 * Per-match room hook — joins `match:{matchId}` and receives all
 * live events for a specific match: ball updates, scorecard deltas,
 * and commentary additions.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { io, Socket } from 'socket.io-client';
import { AppState } from 'react-native';
import { Audio } from 'expo-av';
import { SOCKET_URL } from '../services/socketClient';
import { 
  updateLiveStatusFromSocket, 
  updateInningFromSocket, 
  updateOddsFromSocket, 
  updatePowerplayFromSocket,
  updateCommentaryFromSocket,
  updateScorecardFromSocket,
  updateSessionsFromSocket
} from '../store/matchSlice';

// ─── Payload types ────────────────────────────────────────────────────────────

export interface TeamLiveScore {
  teamId: string;
  name: string;
  code: string;
  score: string;
  overs: string;
}

export interface InningLive {
  number: number;
  totalRuns: number;
  totalBalls: number;
  wickets: number;
  overs: number;
  runRate: number;
  extras: number;
}

export interface PlayerLive {
  playerId: string;
  name: string;
  runs: number;
  balls: number;
  fours?: number;
  sixes?: number;
  strikeRate: number;
}

export interface BowlerLive {
  playerId: string;
  name: string;
  overs: number;
  runs: number;
  wickets: number;
  economy: number;
}

export interface LastBallInfo {
  runs: number;
  extras: number;
  isWicket: boolean;
  ballType: string;
  ballLabel: string;
}

export interface InningChange {
  matchId: string;
  inningNumber: number;
  battingTeamId: string;
  bowlingTeamId: string;
  timestamp: string;
}

export interface OddsSessionUpdate {
  matchId: string;
  oddsTeam?: string;
  oddsBlue?: string;
  oddsRed?: string;
  session?: string;
  sessionBlue?: string;
  sessionRed?: string;
  lambi?: string;
  lambiBlue?: string;
  lambiRed?: string;
  timestamp: string;
}

export interface PowerplayUpdate {
  matchId: string;
  powerplayOvers?: string;
  powerPlay?: boolean;
  onOC?: boolean;
  noScorecards?: boolean;
  noCommentry?: boolean;
  timestamp: string;
}

export interface MatchUpdate {
  matchId: string;
  type: 'BALL' | 'WICKET' | 'OVER_END' | 'MATCH_RESET';
  timestamp: string;
  
  // Generalized root-level fields
  score?: string;
  overs?: string | number;
  runRate?: number;
  currentBall?: string;
  currentInning?: number;
  currentStrikerId?: string;
  currentNonStrikerId?: string;
  currentBowlerId?: string;

  inning: InningLive;
  striker?: PlayerLive;
  nonStriker?: { playerId: string; name: string; runs: number; balls: number; };
  bowler?: BowlerLive;
  lastBall?: LastBallInfo;
  teamA: TeamLiveScore;
  teamB: TeamLiveScore;
  target?: number;
  requiredRunRate?: number;
  requiredRuns?: number;
  remainingBalls?: number;
  powerPlay?: boolean;
}

export interface BatterDelta {
  playerId: string;
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  strikeRate: number;
  isOut: boolean;
  dismissalText?: string;
  isOnStrike: boolean;
}

export interface BowlerDelta {
  playerId: string;
  name: string;
  overs: number;
  runs: number;
  wickets: number;
  economy: number;
  isCurrent: boolean;
}

export interface ScorecardDelta {
  matchId: string;
  inningNumber: number;
  batting: BatterDelta[];
  bowling: BowlerDelta[];
  extras: { wides: number; noBalls: number; byes: number; legByes: number; penalties: number; total: number; };
  totalRuns: number;
  wickets: number;
  timestamp: string;
}

export interface CommentaryItem {
  matchId: string;
  inningNumber: number;
  overNumber: number;
  ballLabel: string;
  ballType: string;
  commentary: string;
  runs: number;
  extras: number;
  isWicket: boolean;
  batsmanName: string;
  batsmanId?: string;
  bowlerName: string;
  bowlerId?: string;
  highlightData?: any;
  timestamp: string;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface UseLiveMatchReturn {
  isConnected: boolean;
  /** Latest full match state update (ball / wicket / over-end / reset) */
  matchUpdate: MatchUpdate | null;
  /** Specialized updates */
  inningChange: InningChange | null;
  oddsUpdate: OddsSessionUpdate | null;
  powerplayUpdate: PowerplayUpdate | null;
  /** Latest detailed scorecard delta — use to update scorecard tab in place */
  scorecardDelta: ScorecardDelta | null;
  /** The most recently received commentary item */
  latestCommentary: CommentaryItem | null;
  /** Commentary items accumulated newest-first (capped at 200) */
  commentary: CommentaryItem[];
  /** Add a new commentary item programmatically (e.g. from REST on first load) */
  prependCommentary: (items: CommentaryItem[]) => void;
  /** Manually disconnect */
  disconnect: () => void;
}

export function useLiveMatch(matchId: string | null): UseLiveMatchReturn {
  const socketRef = useRef<Socket | null>(null);
  const dispatch = useDispatch();
  const ballSoundRef = useRef<Audio.Sound | null>(null);

  // Initialize audio mode
  useEffect(() => {
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          allowsRecordingIOS: false,
          staysActiveInBackground: false,
          interruptionModeIOS: 1, // InterruptionModeIOS.DoNotMix
          shouldDuckAndroid: true,
          interruptionModeAndroid: 1, // InterruptionModeAndroid.DoNotMix
          playThroughEarpieceAndroid: false
        });
        console.log('[useLiveMatch] Audio mode initialized');
      } catch (e) {
        console.warn('[useLiveMatch] Audio mode error:', e);
      }
    };
    setupAudio();
  }, []);

  // Play ball sound helper
  const playBallSound = useCallback(async () => {
    try {
      const state = AppState.currentState;
      console.log(`[useLiveMatch] Attempting to play sound. AppState: ${state}`);
      
      if (state !== 'active') {
        console.log('[useLiveMatch] Audio suppressed: App is in background');
        return;
      }
      
      // Create and play
      console.log('[useLiveMatch] Loading sound object...');
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/ball-event-audios/Ball start ball.wav'),
        { shouldPlay: true }
      );
      
      console.log('[useLiveMatch] Sound loaded and playing');
      
      // Auto-unload after playback finishes to free memory
      sound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.didJustFinish) {
          console.log('[useLiveMatch] Sound finished, unloading...');
          sound.unloadAsync();
        }
      });
    } catch (error) {
      console.warn('[useLiveMatch] Error playing sound:', error);
    }
  }, []);

  const [isConnected, setIsConnected] = useState(false);
  const [matchUpdate, setMatchUpdate] = useState<MatchUpdate | null>(null);
  const [inningChange, setInningChange] = useState<InningChange | null>(null);
  const [oddsUpdate, setOddsUpdate] = useState<OddsSessionUpdate | null>(null);
  const [powerplayUpdate, setPowerplayUpdate] = useState<PowerplayUpdate | null>(null);
  const [scorecardDelta, setScorecardDelta] = useState<ScorecardDelta | null>(null);
  const [commentary, setCommentary] = useState<CommentaryItem[]>([]);
  const [latestCommentary, setLatestCommentary] = useState<CommentaryItem | null>(null);

  const prependCommentary = useCallback((items: CommentaryItem[]) => {
    setCommentary((prev) => [...items, ...prev].slice(0, 200));
  }, []);

  const disconnect = useCallback(() => {
    const socket = socketRef.current;
    if (socket) {
      if (matchId) socket.emit('leave_match', { matchId });
      socket.disconnect();
      socketRef.current = null;
    }
  }, [matchId]);

  useEffect(() => {
    if (!matchId) return;

    console.log(`[useLiveMatch] Connecting for match ${matchId}`);

    const socket = io(`${SOCKET_URL}/live`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 10,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[useLiveMatch] Connected:', socket.id);
      setIsConnected(true);
      socket.emit('join_match', { matchId });
    });

    socket.on('disconnect', (reason) => {
      console.log('[useLiveMatch] Disconnected:', reason);
      setIsConnected(false);
    });

    socket.on('match_joined', (data) => {
      console.log('[useLiveMatch] SUCCESSFULLY Joined match room:', data);
    });

    // Unified Match Update Handler
    const handleMatchUpdate = (data: MatchUpdate, isLegacy = false) => {
      console.log(`[useLiveMatch] Match Update RECEIVED (${isLegacy ? 'legacy' : 'scoreUpdate'}):`, data.timestamp);
      
      // Update local state and Redux
      setMatchUpdate(data);
      dispatch(updateLiveStatusFromSocket(data));

      // Trigger audio on 'b' or 'B' events
      const curBall = data.currentBall;
      console.log(`[useLiveMatch] currentBall: "${curBall}"`);
      if (curBall === 'b' || curBall === 'B' || curBall === 'ball' || curBall === 'Ball') {
        console.log('[useLiveMatch] Triggering PLAY for ball event');
        playBallSound();
      }
    };

    socket.on('scoreUpdate', (data: MatchUpdate) => handleMatchUpdate(data));
    socket.on('match_update', (data: MatchUpdate) => handleMatchUpdate(data, true));

    // Specialized Updates
    socket.on('inning_change', (data: InningChange) => {
      console.log('[useLiveMatch] inning_change RECEIVED:', data);
      setInningChange(data);
      dispatch(updateInningFromSocket(data));
    });

    socket.on('session_odds_update', (data: OddsSessionUpdate) => {
      console.log('[useLiveMatch] session_odds_update RECEIVED');
      setOddsUpdate(data);
      dispatch(updateOddsFromSocket(data));
    });

    socket.on('sessions_table_update', (data: any) => {
      console.log('[useLiveMatch] sessions_table_update RECEIVED');
      dispatch(updateSessionsFromSocket(data));
    });

    socket.on('powerplay_update', (data: PowerplayUpdate) => {
      console.log('[useLiveMatch] powerplay_update RECEIVED');
      setPowerplayUpdate(data);
      dispatch(updatePowerplayFromSocket(data));
    });

    // Note: match_reset is now unified into scoreUpdate for better consistency
    // as suggested by the user. The backend sends currentBall='confirming' for undos.

    // Rich scorecard — update scorecard tab without REST
    socket.on('scorecard_delta', (data: ScorecardDelta) => {
      console.log('[useLiveMatch] scorecard_delta RECEIVED:', JSON.stringify(data, null, 2));
      setScorecardDelta(data);
      dispatch(updateScorecardFromSocket(data));
    });

    // Single ball commentary entry — prepend to list
    socket.on('commentary_added', (data: CommentaryItem) => {
      console.log('[useLiveMatch] commentary_added RECEIVED:', JSON.stringify(data, null, 2));
      setCommentary((prev) => [data, ...prev].slice(0, 200));
      setLatestCommentary(data);
      dispatch(updateCommentaryFromSocket(data));
    });

    socket.on('connect_error', (err) => {
      console.warn('[useLiveMatch] Connection error (make sure ngrok is active):', err.message);
    });

    socket.on('reconnect_attempt', (attempt) => {
      console.log('[useLiveMatch] Reconnecting... attempt:', attempt);
    });

    return () => {
      socket.emit('leave_match', { matchId });
      socket.disconnect();
    };
  }, [matchId]);

  return {
    isConnected,
    matchUpdate,
    inningChange,
    oddsUpdate,
    powerplayUpdate,
    scorecardDelta,
    commentary,
    latestCommentary,
    prependCommentary,
    disconnect,
  };
}
