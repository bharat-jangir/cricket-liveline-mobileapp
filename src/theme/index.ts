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
  primary: '#1877f2', // Facebook blue
  primaryLight: '#42a5f5',
  primaryDark: '#1565c0',
  secondary: '#00bcd4',
  background: '#f8f9fa', // Light gray background
  surface: '#ffffff',
  card: '#ffffff',
  text: '#1c1e21', // Dark text
  textSecondary: '#65676b', // Medium gray
  textLight: '#8a8d91', // Light gray
  border: '#dadde1', // Light border
  borderLight: '#e4e6ea',
  success: '#42b883',
  warning: '#ff9800',
  error: '#f44336',
  info: '#2196f3',
  shadow: 'rgba(0, 0, 0, 0.08)',
  overlay: 'rgba(0, 0, 0, 0.4)',
  accent: '#00d4aa', // Teal accent
};

export const darkTheme = {
  primary: '#1877f2',
  primaryLight: '#42a5f5',
  primaryDark: '#1565c0',
  secondary: '#00bcd4',
  background: '#18191a', // Dark background
  surface: '#242526', // Card background
  card: '#242526',
  text: '#e4e6ea', // Light text
  textSecondary: '#b0b3b8', // Medium gray
  textLight: '#8a8d91', // Darker gray
  border: '#3a3b3c', // Dark border
  borderLight: '#2f3031',
  success: '#42b883',
  warning: '#ff9800',
  error: '#f44336',
  info: '#2196f3',
  shadow: 'rgba(0, 0, 0, 0.3)',
  overlay: 'rgba(0, 0, 0, 0.7)',
  accent: '#00d4aa',
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