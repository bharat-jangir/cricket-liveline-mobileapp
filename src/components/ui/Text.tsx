import React from 'react';
import { Text as RNText, TextStyle, TextProps as RNTextProps } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { fontSize, MAX_FONT_SCALE } from '@/theme';

interface TextProps extends RNTextProps {
  children: React.ReactNode;
  variant?: 'heading' | 'title' | 'subtitle' | 'body' | 'caption' | 'small';
  color?: 'primary' | 'primaryDark' | 'primaryLight' | 'secondary' | 'text' | 'textSecondary' | 'textLight' | 'white' | 'error' | 'success';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  align?: 'left' | 'center' | 'right';
  style?: TextStyle | TextStyle[] | any;
}

export const Text: React.FC<TextProps> = ({
  children,
  variant = 'body',
  color = 'text',
  weight = 'normal',
  align = 'left',
  style,
  ...rest
}) => {
  const { theme } = useTheme();

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      textAlign: align,
    };

    // Font size based on variant
    switch (variant) {
      case 'heading':
        baseStyle.fontSize = fontSize.heading;
        break;
      case 'title':
        baseStyle.fontSize = fontSize.title;
        break;
      case 'subtitle':
        baseStyle.fontSize = fontSize.lg || 18;
        break;
      case 'caption':
        baseStyle.fontSize = fontSize.sm;
        break;
      case 'small':
        baseStyle.fontSize = fontSize.xs;
        break;
      default:
        baseStyle.fontSize = fontSize.md;
    }

    // Font weight
    switch (weight) {
      case 'medium':
        baseStyle.fontWeight = '500';
        break;
      case 'semibold':
        baseStyle.fontWeight = '600';
        break;
      case 'bold':
        baseStyle.fontWeight = '700';
        break;
      default:
        baseStyle.fontWeight = '400';
    }

    // Color
    switch (color) {
      case 'primary':
        baseStyle.color = theme.primary;
        break;
      case 'primaryDark':
        baseStyle.color = (theme as any).primaryDark || theme.primary;
        break;
      case 'primaryLight':
        baseStyle.color = (theme as any).primaryLight || theme.primary;
        break;
      case 'secondary':
        baseStyle.color = theme.secondary;
        break;
      case 'textSecondary':
        baseStyle.color = theme.textSecondary;
        break;
      case 'textLight':
        baseStyle.color = theme.textLight;
        break;
      case 'white':
        baseStyle.color = '#ffffff';
        break;
      case 'error':
        baseStyle.color = theme.error;
        break;
      case 'success':
        baseStyle.color = theme.success;
        break;
      default:
        baseStyle.color = theme.text;
    }

    return baseStyle;
  };

  return (
    <RNText 
      style={[getTextStyle(), style]} 
      // Respect the user's OS font size, but cap it so fixed-height UI (cards, chips, headers) never breaks
      maxFontSizeMultiplier={MAX_FONT_SCALE}
      {...rest}
    >
      {children}
    </RNText>
  );
};