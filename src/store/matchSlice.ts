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
      state.liveStatus = { ...state.liveStatus, ...action.payload };
    },
    updateCommentaryFromSocket: (state, action: PayloadAction<any>) => {
      state.commentary = [action.payload, ...state.commentary].slice(0, 100);
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
    updateCommentaryFromSocket 
} = matchSlice.actions;

export default matchSlice.reducer;
