import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions for scaling
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

// Responsive scaling functions
export const scale = (size: number): number => {
  const scaleWidth = SCREEN_WIDTH / BASE_WIDTH;
  const scaleHeight = SCREEN_HEIGHT / BASE_HEIGHT;
  const scale = Math.min(scaleWidth, scaleHeight);
  return Math.ceil(PixelRatio.roundToNearestPixel(size * scale));
};

export const verticalScale = (size: number): number => {
  return Math.ceil(PixelRatio.roundToNearestPixel((size * SCREEN_HEIGHT) / BASE_HEIGHT));
};

export const moderateScale = (size: number, factor: number = 0.5): number => {
  return Math.ceil(PixelRatio.roundToNearestPixel(size + (scale(size) - size) * factor));
};

// Font scaling
export const fontScale = (size: number): number => {
  return moderateScale(size, 0.3);
};

// Spacing system
export const spacing = {
  xs: scale(4),
  sm: scale(8),
  md: scale(16),
  lg: scale(24),
  xl: scale(32),
  xxl: scale(48),
};

// Font sizes
export const fontSize = {
  xs: fontScale(10),
  sm: fontScale(12),
  md: fontScale(14),
  lg: fontScale(16),
  xl: fontScale(18),
  xxl: fontScale(20),
  xxxl: fontScale(24),
  title: fontScale(28),
  heading: fontScale(32),
};

// Colors - Premium App Theme
export const lightTheme = {
  primary: '#1877f2', // Sky 600
  primaryLight: '#1877f2', // Sky 400
  primaryDark: '#0369a1', // Sky 700
  secondary: '#0ea5e9',
  background: '#f8fafc', // Slate 50
  surface: '#ffffff',
  card: '#ffffff',
  text: '#0f172a', // Slate 900
  textSecondary: '#475569', // Slate 600
  textLight: '#94a3b8', // Slate 400
  border: '#e2e8f0', // Slate 200
  borderLight: '#f1f5f9', // Slate 100
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  shadow: 'rgba(0, 0, 0, 0.05)',
  overlay: 'rgba(15, 23, 42, 0.4)',
  accent: '#06b6d4',
  // Semantic tokens
  headerBackground: '#0284c7',
  glassBackground: 'rgba(255, 255, 255, 0.8)',
  activeTab: '#0284c7',
  inactiveTab: '#64748b',
  cardBorder: '#e2e8f0',
  divider: '#f1f5f9',
};

export const darkTheme = {
  primary: '#38bdf8', // Sky 400
  primaryLight: '#7dd3fc',
  primaryDark: '#0284c7',
  secondary: '#0ea5e9',
  background: '#020617', // Midnight/Slate 950
  surface: '#0f172a', // Slate 900
  card: '#1e293b', // Slate 800
  text: '#f8fafc', // Slate 50
  textSecondary: '#94a3b8', // Slate 400
  textLight: '#64748b', // Slate 500
  border: '#2d333b', // Custom dark border
  borderLight: '#1e293b',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  shadow: 'rgba(0, 0, 0, 0.4)',
  overlay: 'rgba(0, 0, 0, 0.6)',
  accent: '#06b6d4',
  // Semantic tokens
  headerBackground: '#0f172a',
  glassBackground: 'rgba(15, 23, 42, 0.8)',
  activeTab: '#38bdf8',
  inactiveTab: '#94a3b8',
  cardBorder: '#334155',
  divider: '#1e293b',
};

export type Theme = typeof lightTheme;

// Border radius
export const borderRadius = {
  sm: scale(4),
  md: scale(8),
  lg: scale(12),
  xl: scale(16),
  full: 9999,
};

// Elevation/Shadow - Premium shadows
export const elevation = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
};