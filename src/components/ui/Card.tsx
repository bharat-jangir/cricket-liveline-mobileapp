import React from 'react';
import { View, ViewStyle, StyleProp } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { spacing, borderRadius, elevation } from '@/theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: keyof typeof spacing;
  elevation?: 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  padding = 'md',
  elevation: elevationLevel = 'sm',
}) => {
  const { theme } = useTheme();

  const cardStyle: ViewStyle = {
    backgroundColor: theme.card,
    borderRadius: borderRadius.lg,
    padding: spacing[padding],
    ...elevation[elevationLevel],
  };

  return <View style={[cardStyle, style]}>{children}</View>;
};