import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface AppState {
  language: 'en' | 'hi' | 'ta';
  isDark: boolean;
  isOnboardingComplete: boolean;
  isMuted: boolean;
}

const initialState: AppState = {
  language: 'en',
  isDark: false,
  isOnboardingComplete: false,
  isMuted: false,
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setLanguage: (state, action: PayloadAction<'en' | 'hi' | 'ta'>) => {
      state.language = action.payload;
    },
    toggleTheme: (state) => {
      state.isDark = !state.isDark;
    },
    setTheme: (state, action: PayloadAction<boolean>) => {
      state.isDark = action.payload;
    },
    completeOnboarding: (state) => {
      state.isOnboardingComplete = true;
    },
    toggleMute: (state) => {
      state.isMuted = !state.isMuted;
    },
  },
});

export const { setLanguage, toggleTheme, setTheme, completeOnboarding, toggleMute } = appSlice.actions;
export default appSlice.reducer;