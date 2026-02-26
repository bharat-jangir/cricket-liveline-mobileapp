import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface AppState {
  language: string;
  isDark: boolean;
  isOnboardingComplete: boolean;
}

const initialState: AppState = {
  language: 'English',
  isDark: false,
  isOnboardingComplete: false,
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setLanguage: (state, action: PayloadAction<string>) => {
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
  },
});

export const { setLanguage, toggleTheme, setTheme, completeOnboarding } = appSlice.actions;
export default appSlice.reducer;