import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { MatchService } from '../services/match.service';

interface MatchState {
  details: any | null;
  liveStatus: any | null;
  commentary: any[];
  scorecard: { [inning: number]: any };
  pointsTable: any[];
  squads: any[];
  sessions: any[];
  partnerships: any[];
  recentOvers: any | null;
  analytics: any | null;
  loading: {
    details: boolean;
    liveStatus: boolean;
    commentary: boolean;
    scorecard: boolean;
    squads: boolean;
    sessions: boolean;
    pointsTable: boolean;
    analytics: boolean;
    partnerships: boolean;
    recentOvers: boolean;
  };
  refreshing: {
    details: boolean;
    liveStatus: boolean;
    commentary: boolean;
    scorecard: boolean;
    pointsTable: boolean;
    partnerships: boolean;
    recentOvers: boolean;
    analytics: boolean;
  };
  error: string | null;
}

const initialState: MatchState = {
  details: null,
  liveStatus: null,
  commentary: [],
  scorecard: {},
  pointsTable: [],
  squads: [],
  sessions: [],
  partnerships: [],
  recentOvers: null,
  analytics: null,
  loading: {
    details: false,
    liveStatus: false,
    commentary: false,
    scorecard: false,
    squads: false,
    sessions: false,
    pointsTable: false,
    analytics: false,
    partnerships: false,
    recentOvers: false,
  },
  refreshing: {
    details: false,
    liveStatus: false,
    commentary: false,
    scorecard: false,
    pointsTable: false,
    partnerships: false,
    recentOvers: false,
    analytics: false,
  },
  error: null,
};

// Async Thunks
export const fetchMatchDetails = createAsyncThunk(
  'match/fetchDetails',
  async (matchId: string) => {
    return await MatchService.getMatchDetails(matchId);
  }
);

export const fetchLiveStatus = createAsyncThunk(
  'match/fetchLiveStatus',
  async (matchId: string) => {
    return await MatchService.getLiveStatus(matchId);
  }
);

export const fetchCommentary = createAsyncThunk(
  'match/fetchCommentary',
  async (matchId: string) => {
    return await MatchService.getCommentary(matchId);
  }
);

export const fetchScorecard = createAsyncThunk(
  'match/fetchScorecard',
  async ({ matchId, inning }: { matchId: string; inning: number }) => {
    const data = await MatchService.getScorecard(matchId, inning);
    return { inning, data };
  }
);

export const fetchSquads = createAsyncThunk(
    'match/fetchSquads',
    async (matchId: string) => {
      return await MatchService.getSquads(matchId);
    }
);

export const fetchSessions = createAsyncThunk(
    'match/fetchSessions',
    async (matchId: string) => {
      return await MatchService.getSessions(matchId);
    }
);

export const fetchPointsTable = createAsyncThunk(
    'match/fetchPointsTable',
    async (seriesId: string) => {
      return await MatchService.getPointsTable(seriesId);
    }
);

export const fetchPartnerships = createAsyncThunk(
    'match/fetchPartnerships',
    async ({ matchId, inning }: { matchId: string; inning: number }) => {
      return await MatchService.getPartnerships(matchId, inning);
    }
);

export const fetchRecentOvers = createAsyncThunk(
    'match/fetchRecentOvers',
    async ({ matchId, inning }: { matchId: string; inning: number }) => {
      return await MatchService.getRecentOvers(matchId, inning);
    }
);

export const fetchMatchAnalytics = createAsyncThunk(
    'match/fetchAnalytics',
    async (matchId: string) => {
      return await MatchService.getMatchAnalytics(matchId);
    }
);

const matchSlice = createSlice({
  name: 'match',
  initialState,
  reducers: {
    resetMatchState: () => initialState,
    setRefreshing: (state, action: PayloadAction<{ key: keyof MatchState['refreshing']; value: boolean }>) => {
      state.refreshing[action.payload.key] = action.payload.value;
    },
    // Prepare for socket updates
    updateLiveStatusFromSocket: (state, action: PayloadAction<any>) => {
      const payload = action.payload;
      if (!state.liveStatus) {
        state.liveStatus = payload;
        return;
      }

      // Helper for ID extraction (Hex only)
      const extractId = (id: any): string | null => {
        if (!id) return null;
        if (typeof id === 'string') {
          // Robust regex to find hex ID even in stringified objects
          const match = id.match(/[0-9a-fA-F]{24}/);
          return match ? match[0] : id;
        }
        return id._id ? id._id.toString() : id.toString();
      };

      // 1. Root Level Updates (Flat fields)
      if (payload.score !== undefined) state.liveStatus.score = payload.score;
      if (payload.overs !== undefined) state.liveStatus.overs = payload.overs;
      if (payload.runRate !== undefined) state.liveStatus.runRate = payload.runRate;
      if (payload.currentInning !== undefined) state.liveStatus.currentInning = payload.currentInning;
      if (payload.currentBall !== undefined) state.liveStatus.currentBall = payload.currentBall;
      if (payload.powerPlay !== undefined) state.liveStatus.powerPlay = payload.powerPlay;
      
      // 2. Recent Balls Update (Socket now sends full last 3 overs strip)
      if (payload.recentBalls !== undefined) {
        state.liveStatus.recentBalls = payload.recentBalls;
      }
      
      // 3. Active Player Stats (Full Objects for Live Tab)
      if (payload.striker) {
        state.liveStatus.striker = {
          ...(state.liveStatus.striker || {}),
          ...payload.striker,
          playerName: payload.striker.name || payload.striker.playerName,
          playerId: extractId(payload.striker.playerId)
        };
        state.liveStatus.currentStrikerId = state.liveStatus.striker.playerId;
      }
      if (payload.nonStriker) {
        state.liveStatus.nonStriker = {
          ...(state.liveStatus.nonStriker || {}),
          ...payload.nonStriker,
          playerName: payload.nonStriker.name || payload.nonStriker.playerName,
          playerId: extractId(payload.nonStriker.playerId)
        };
        state.liveStatus.currentNonStrikerId = state.liveStatus.nonStriker.playerId;
      }
      if (payload.bowler) {
        state.liveStatus.bowler = {
          ...(state.liveStatus.bowler || {}),
          ...payload.bowler,
          playerName: payload.bowler.name || payload.bowler.playerName,
          playerId: extractId(payload.bowler.playerId)
        };
        state.liveStatus.currentBowlerId = state.liveStatus.bowler.playerId;
      }

      // 4. Surgical Inning Merge
      if (payload.inning) {
        state.liveStatus.inning = {
          ...(state.liveStatus.inning || {}),
          ...payload.inning
        };
        // Re-calculate root fields if backend sent partial nesting
        if (payload.inning.totalRuns !== undefined) {
          state.liveStatus.score = `${payload.inning.totalRuns}/${payload.inning.wickets || payload.inning.totalWickets || 0}`;
        }
        if (payload.inning.overs !== undefined) {
          state.liveStatus.overs = payload.inning.overs.toString();
        }
      }

      // 4. Surgical Team Merge (PRESERVE NAME/LOGO/CODE)
      if (payload.teamA) {
        state.liveStatus.teamA = {
          ...(state.liveStatus.teamA || {}),
          ...payload.teamA
        };
      }
      if (payload.teamB) {
        state.liveStatus.teamB = {
          ...(state.liveStatus.teamB || {}),
          ...payload.teamB
        };
      }
    },
    updateInningFromSocket: (state, action: PayloadAction<any>) => {
      const { inningNumber, battingTeamId, bowlingTeamId } = action.payload;
      if (!state.liveStatus) return;
      
      state.liveStatus.currentInning = inningNumber;
      if (battingTeamId) state.liveStatus.battingTeamId = battingTeamId;
      if (bowlingTeamId) state.liveStatus.bowlingTeamId = bowlingTeamId;
      
      // Optionally clear recent balls or other state on new inning
    },
    updateOddsFromSocket: (state, action: PayloadAction<any>) => {
      if (!state.liveStatus) return;
      const p = action.payload;
      
      // Surgical merge for odds
      const fields = ['oddsTeam', 'oddsBlue', 'oddsRed', 'session', 'sessionBlue', 'sessionRed', 'lambi', 'lambiBlue', 'lambiRed'];
      fields.forEach(f => {
        if (p[f] !== undefined) state.liveStatus[f] = p[f];
      });
    },
    updatePowerplayFromSocket: (state, action: PayloadAction<any>) => {
      if (!state.liveStatus) return;
      if (action.payload.onOC !== undefined) state.liveStatus.onOC = action.payload.onOC;
      if (action.payload.powerPlay !== undefined) state.liveStatus.powerPlay = action.payload.powerPlay;
      if (action.payload.powerplayOvers !== undefined) state.liveStatus.powerplayOvers = action.payload.powerplayOvers;
    },
    updateCommentaryFromSocket: (state, action: PayloadAction<any>) => {
      state.commentary = [action.payload, ...state.commentary].slice(0, 100);
    },
    updateScorecardFromSocket: (state, action: PayloadAction<any>) => {
      const payload = action.payload;
      if (payload && payload.inningNumber) {
        const current = state.scorecard[payload.inningNumber] || { batting: [], bowling: [], inning: {} };
        
        // Surgical merge for Batting
        const existingBatting = Array.isArray(current.batting) ? [...current.batting] : [];
        (payload.batting || []).forEach((newB: any) => {
           const newId = (newB.playerId?._id || newB.playerId)?.toString();
           const idx = existingBatting.findIndex((ex: any) => 
               (ex.playerId?._id || ex.playerId)?.toString() === newId
           );
           
           if (idx !== -1) {
             existingBatting[idx] = { ...existingBatting[idx], ...newB, playerName: newB.name || existingBatting[idx].playerName };
           } else {
             existingBatting.push({ ...newB, playerName: newB.name });
           }
        });

        // Surgical merge for Bowling
        const existingBowling = Array.isArray(current.bowling) ? [...current.bowling] : [];
        (payload.bowling || []).forEach((newB: any) => {
           const newId = (newB.playerId?._id || newB.playerId)?.toString();
           const idx = existingBowling.findIndex((ex: any) => 
               (ex.playerId?._id || ex.playerId)?.toString() === newId
           );
           
           if (idx !== -1) {
             existingBowling[idx] = { ...existingBowling[idx], ...newB, playerName: newB.name || existingBowling[idx].playerName };
           } else {
             existingBowling.push({ ...newB, playerName: newB.name });
           }
        });

        state.scorecard[payload.inningNumber] = {
            ...current,
            batting: existingBatting,
            bowling: existingBowling,
            inning: {
                ...current.inning,
                extras: payload.extras?.total !== undefined ? payload.extras.total : current.inning?.extras || 0,
                totalRuns: payload.totalRuns !== undefined ? payload.totalRuns : current.inning?.totalRuns,
                totalWickets: payload.wickets !== undefined ? payload.wickets : current.inning?.totalWickets,
                runRate: payload.runRate || current.inning?.runRate,
            }
        };
      }
    },
  },
  extraReducers: (builder) => {
    // Match Details
    builder.addCase(fetchMatchDetails.pending, (state) => {
      state.loading.details = true;
    });
    builder.addCase(fetchMatchDetails.fulfilled, (state, action) => {
      state.loading.details = false;
      state.details = action.payload;
      state.refreshing.details = false;
    });
    builder.addCase(fetchMatchDetails.rejected, (state, action) => {
      state.loading.details = false;
      state.error = action.error.message || 'Failed to fetch match details';
      state.refreshing.details = false;
    });

    // Live Status
    builder.addCase(fetchLiveStatus.pending, (state) => {
      state.loading.liveStatus = true;
    });
    builder.addCase(fetchLiveStatus.fulfilled, (state, action) => {
      state.loading.liveStatus = false;
      state.liveStatus = action.payload;
      state.refreshing.liveStatus = false;
    });
    builder.addCase(fetchLiveStatus.rejected, (state) => {
      state.loading.liveStatus = false;
      state.refreshing.liveStatus = false;
    });

    // Commentary
    builder.addCase(fetchCommentary.pending, (state) => {
      state.loading.commentary = true;
    });
    builder.addCase(fetchCommentary.fulfilled, (state, action) => {
      state.loading.commentary = false;
      state.commentary = action.payload;
      state.refreshing.commentary = false;
    });
    builder.addCase(fetchCommentary.rejected, (state) => {
      state.loading.commentary = false;
      state.refreshing.commentary = false;
    });

    // Scorecard
    builder.addCase(fetchScorecard.pending, (state) => {
      state.loading.scorecard = true;
    });
    builder.addCase(fetchScorecard.fulfilled, (state, action) => {
      state.loading.scorecard = false;
      state.scorecard[action.payload.inning] = action.payload.data;
      state.refreshing.scorecard = false;
    });
    builder.addCase(fetchScorecard.rejected, (state) => {
      state.loading.scorecard = false;
      state.refreshing.scorecard = false;
    });

    // Points Table
    builder.addCase(fetchPointsTable.pending, (state) => {
      state.loading.pointsTable = true;
    });
    builder.addCase(fetchPointsTable.fulfilled, (state, action) => {
      state.loading.pointsTable = false;
      state.pointsTable = action.payload;
      state.refreshing.pointsTable = false;
    });
    builder.addCase(fetchPointsTable.rejected, (state) => {
      state.loading.pointsTable = false;
      state.refreshing.pointsTable = false;
    });

    // Squads
    builder.addCase(fetchSquads.fulfilled, (state, action) => {
        state.loading.squads = false;
        state.squads = action.payload;
    });

    // Sessions
    builder.addCase(fetchSessions.fulfilled, (state, action) => {
        state.loading.sessions = false;
        state.sessions = action.payload;
    });

    // Partnerships
    builder.addCase(fetchPartnerships.pending, (state) => {
        state.loading.partnerships = true;
    });
    builder.addCase(fetchPartnerships.fulfilled, (state, action) => {
        state.loading.partnerships = false;
        state.partnerships = action.payload;
        state.refreshing.partnerships = false;
    });
    builder.addCase(fetchPartnerships.rejected, (state) => {
        state.loading.partnerships = false;
        state.refreshing.partnerships = false;
    });

    // Recent Overs
    builder.addCase(fetchRecentOvers.pending, (state) => {
        state.loading.recentOvers = true;
    });
    builder.addCase(fetchRecentOvers.fulfilled, (state, action) => {
        state.loading.recentOvers = false;
        state.recentOvers = action.payload;
        state.refreshing.recentOvers = false;
    });
    builder.addCase(fetchRecentOvers.rejected, (state) => {
        state.loading.recentOvers = false;
        state.refreshing.recentOvers = false;
    });

    // Analytics
    builder.addCase(fetchMatchAnalytics.pending, (state) => {
        state.loading.analytics = true;
    });
    builder.addCase(fetchMatchAnalytics.fulfilled, (state, action) => {
        state.loading.analytics = false;
        state.analytics = action.payload;
        state.refreshing.analytics = false;
    });
    builder.addCase(fetchMatchAnalytics.rejected, (state) => {
        state.loading.analytics = false;
        state.refreshing.analytics = false;
    });
  },
});

export const { 
    resetMatchState, 
    setRefreshing, 
    updateLiveStatusFromSocket, 
    updateInningFromSocket,
    updateOddsFromSocket,
    updatePowerplayFromSocket,
    updateCommentaryFromSocket,
    updateScorecardFromSocket
} = matchSlice.actions;

export default matchSlice.reducer;
