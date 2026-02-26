import React from 'react';
import { TouchableOpacity, Text, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { fontSize, spacing, borderRadius, elevation } from '@/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  style,
  textStyle,
}) => {
  const { theme } = useTheme();

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      ...elevation.sm,
    };

    switch (size) {
      case 'small':
        baseStyle.paddingHorizontal = spacing.md;
        baseStyle.paddingVertical = spacing.sm;
        baseStyle.minHeight = 36;
        break;
      case 'large':
        baseStyle.paddingHorizontal = spacing.xl;
        baseStyle.paddingVertical = spacing.lg;
        baseStyle.minHeight = 56;
        break;
      default:
        baseStyle.paddingHorizontal = spacing.lg;
        baseStyle.paddingVertical = spacing.md;
        baseStyle.minHeight = 48;
    }

    switch (variant) {
      case 'secondary':
        baseStyle.backgroundColor = theme.secondary;
        break;
      case 'outline':
        baseStyle.backgroundColor = 'transparent';
        baseStyle.borderWidth = 1;
        baseStyle.borderColor = theme.primary;
        break;
      case 'ghost':
        baseStyle.backgroundColor = 'transparent';
        baseStyle.elevation = 0;
        baseStyle.shadowOpacity = 0;
        break;
      default:
        baseStyle.backgroundColor = theme.primary;
    }

    if (disabled) {
      baseStyle.backgroundColor = theme.textLight;
      baseStyle.elevation = 0;
      baseStyle.shadowOpacity = 0;
    }

    return baseStyle;
  };

  const getTextStyle = (): TextStyle => {
    const baseTextStyle: TextStyle = {
      fontWeight: '600',
    };

    switch (size) {
      case 'small':
        baseTextStyle.fontSize = fontSize.sm;
        break;
      case 'large':
        baseTextStyle.fontSize = fontSize.xl;
        break;
      default:
        baseTextStyle.fontSize = fontSize.md;
    }

    switch (variant) {
      case 'outline':
      case 'ghost':
        baseTextStyle.color = theme.primary;
        break;
      default:
        baseTextStyle.color = '#ffffff';
    }

    if (disabled) {
      baseTextStyle.color = theme.background;
    }

    return baseTextStyle;
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Text style={[getTextStyle(), textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
};