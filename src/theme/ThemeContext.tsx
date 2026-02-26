import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme, darkTheme, Theme } from './index';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
  language: string;
  setLanguage: (language: string) => void;
  isOnboardingCompleted: boolean;
  completeOnboarding: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [isDark, setIsDark] = useState(false);
  const [language, setLanguageState] = useState('English');
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState(false);

  useEffect(() => {
    loadSettings();
    
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      if (colorScheme) {
        setIsDark(colorScheme === 'dark');
      }
    });

    return () => subscription?.remove();
  }, []);

  const loadSettings = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      const savedLanguage = await AsyncStorage.getItem('language');
      const savedOnboarding = await AsyncStorage.getItem('isOnboardingCompleted');
      
      if (savedTheme !== null) {
        setIsDark(savedTheme === 'dark');
      } else {
        const systemTheme = Appearance.getColorScheme();
        setIsDark(systemTheme === 'dark');
      }
      
      if (savedLanguage !== null) {
        setLanguageState(savedLanguage);
      }
      
      if (savedOnboarding !== null) {
        setIsOnboardingCompleted(savedOnboarding === 'true');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveTheme = async (theme: string) => {
    try {
      await AsyncStorage.setItem('theme', theme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const saveLanguage = async (lang: string) => {
    try {
      await AsyncStorage.setItem('language', lang);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    saveTheme(newTheme ? 'dark' : 'light');
  };

  const setTheme = (dark: boolean) => {
    setIsDark(dark);
    saveTheme(dark ? 'dark' : 'light');
  };

  const setLanguage = (lang: string) => {
    setLanguageState(lang);
    saveLanguage(lang);
  };

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem('isOnboardingCompleted', 'true');
      setIsOnboardingCompleted(true);
    } catch (error) {
      console.error('Error saving onboarding completion:', error);
    }
  };

  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      isDark, 
      toggleTheme, 
      setTheme, 
      language, 
      setLanguage, 
      isOnboardingCompleted, 
      completeOnboarding 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};