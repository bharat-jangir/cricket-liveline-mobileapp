/**
 * useLiveMatch.ts
 * 
 * Per-match room hook — joins `match:{matchId}` and receives all
 * live events for a specific match: ball updates, scorecard deltas,
 * and commentary additions.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useAppSelector } from '../store/hooks';
import { io, Socket } from 'socket.io-client';
import { AppState } from 'react-native';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
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
  onOc?: boolean;
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
  speech?: boolean;
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
  _id?: string;
  type?: string;
  isLegal?: boolean;
  matchId: string;
  inningId: string;
  onOc?: boolean;
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
  const appLanguage = useAppSelector(state => state.app.language);
  const isMuted = useAppSelector(state => state.app.isMuted);
  const liveStatus = useAppSelector(state => state.match.liveStatus);
  const languageRef = useRef(appLanguage);
  const isMutedRef = useRef(isMuted);
  const liveStatusRef = useRef(liveStatus);
  const ballSoundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    languageRef.current = appLanguage;
  }, [appLanguage]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    liveStatusRef.current = liveStatus;
  }, [liveStatus]);

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

  // TTS Speech helper
  const speakEvent = useCallback((textToSpeak: string) => {
    try {
      if (isMutedRef.current) {
        console.log('[useLiveMatch] Speech suppressed: isMuted is true');
        return;
      }

      const state = AppState.currentState;
      if (state !== 'active') {
        console.log('[useLiveMatch] Speech suppressed: App is in background');
        return;
      }

      // Stop any existing speech to ensure 0-1ms perceived latency for the new event
      Speech.stop();

      console.log(`[useLiveMatch] Speaking: "${textToSpeak}"`);
      // Use expo-speech, no object recreation needed, very low latency
      Speech.speak(textToSpeak, {
        language: languageRef.current,
        pitch: 1.0,
        rate: languageRef.current === 'ta' ? 1.0 : 1.1,
      });
    } catch (error) {
      console.warn('[useLiveMatch] Error speaking event:', error);
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

      // Trigger TTS for ball events
      const curBall = data.currentBall;
      console.log(`[useLiveMatch] currentBall: "${curBall}"`);
      const lang = languageRef.current;

      // Over Commentary logic removed from here and moved to powerplay_update
      // where the backend sends the onOC flag.

      if (data.speech && curBall) {
        const lowerBall = curBall.toLowerCase();
        let textToSpeak = '';

        const isNewOver = lowerBall === 'b' || lowerBall === 'ball';
        const oversVal = Number(data.overs || 0);
        const overNum = Math.floor(oversVal) + 1;
        const ballsCompleted = Math.round((oversVal - Math.floor(oversVal)) * 10);
        // If it's a new ball, the ball being bowled is ballsCompleted + 1
        const ballNum = Math.min(ballsCompleted + 1, 6);

        const hiOrdinals = ['pehli', 'doosri', 'teesri', 'chauthi', 'paanchvi', 'chhati'];
        const taOrdinals = ['mudhal', 'irandavathu', 'moondravathu', 'naangavathu', 'aindhavathu', 'aaraavathu'];
        const enOrdinals = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth'];

        const getOrdinal = (num: number, langCode: string) => {
            const idx = Math.max(0, num - 1);
            if (langCode === 'hi') return hiOrdinals[idx] || hiOrdinals[0];
            if (langCode === 'ta') return taOrdinals[idx] || taOrdinals[0];
            return enOrdinals[idx] || enOrdinals[0];
        };
        
        if (isNewOver) {
          if (lang === 'hi') textToSpeak = `${overNum}ve over ki ${getOrdinal(ballNum, 'hi')} ball`;
          else if (lang === 'ta') textToSpeak = `${overNum} vadhu over in ${getOrdinal(ballNum, 'ta')} pandhu`;
          else textToSpeak = `${getOrdinal(ballNum, 'en')} ball of the ${overNum}th over`;
        } else if (lowerBall === '4') {
          textToSpeak = lang === 'hi' ? 'chauka aaya chauka' : lang === 'ta' ? 'four, nangu rangal' : 'four runs';
        } else if (lowerBall === '6') {
          textToSpeak = lang === 'hi' ? 'chhakka aaya chhakka' : lang === 'ta' ? 'six, aaru rangal' : 'six runs';
        } else if (lowerBall === 'w') {
          textToSpeak = lang === 'hi' ? 'wicket aaya wicket' : lang === 'ta' ? 'wicket, out' : 'wicket falls';
        } else if (lowerBall === 'wd') {
          textToSpeak = lang === 'hi' ? 'wide ball' : lang === 'ta' ? 'wide pandhu' : 'wide ball';
        } else if (lowerBall === 'nb') {
          textToSpeak = 'no ball';
        } else if (lowerBall === 'lb') {
          textToSpeak = 'leg bye';
        } else if (lowerBall === '1' || lowerBall === '2' || lowerBall === '3' || lowerBall === '5') {
          textToSpeak = lang === 'en' ? `${lowerBall} run${lowerBall !== '1' ? 's' : ''}` : `${lowerBall} run`;
        } else if (lowerBall === '0') {
          textToSpeak = lang === 'hi' ? 'dot ball zero run' : lang === 'ta' ? 'dot ball, zero run' : 'dot ball, no run';
        } else {
          textToSpeak = lowerBall;
        }

        if (textToSpeak) {
          console.log(`[useLiveMatch] Triggering TTS: ${textToSpeak}`);
          speakEvent(textToSpeak);
        }
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

      if (data.onOC || (data as any).onOc) {
        const lang = languageRef.current;
        const runs = liveStatusRef.current?.inning?.totalRuns ?? 0;
        const wks = liveStatusRef.current?.inning?.wickets ?? 0;
        
        let ocText = '';
        if (lang === 'hi') ocText = `${runs} run, ${wks} wicket par`;
        else if (lang === 'ta') ocText = `${runs} run, ${wks} wicketku`;
        else ocText = `${runs} for ${wks} wicket${Number(wks) !== 1 ? 's' : ''}`;
        
        console.log(`[useLiveMatch] Triggering Over Summary TTS: ${ocText}`);
        speakEvent(ocText);
      }
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
      // Map ballType to type to match the REST API format
      const mappedData = {
        ...data,
        type: data.type || (data as any).ballType || 'ball',
        _id: data._id || `temp-${Date.now()}`
      };
      
      console.log('[useLiveMatch] commentary_added RECEIVED:', JSON.stringify(mappedData, null, 2));
      setCommentary((prev) => [mappedData, ...prev].slice(0, 200));
      setLatestCommentary(mappedData);
      dispatch(updateCommentaryFromSocket(mappedData));
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
