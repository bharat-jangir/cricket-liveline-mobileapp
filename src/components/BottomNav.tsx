import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { spacing, fontSize, borderRadius } from '../theme';

interface BottomNavProps {
  activeScreen?: string;
  onScreenChange?: (screen: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ 
  activeScreen = 'home', 
  onScreenChange 
}) => {
  const { theme } = useTheme();

  const navItems = [
    { id: 'home', icon: 'pulse', label: 'Home' },
    { id: 'matches', icon: 'trophy', label: 'Matches' },
    { id: 'series', icon: 'calendar', label: 'Series' },
    { id: 'news', icon: 'newspaper', label: 'News' },
    { id: 'profile', icon: 'person', label: 'Profile' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
      <View style={styles.navContent}>
        {navItems.map((item) => {
          const isActive = activeScreen === item.id;
          
          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => onScreenChange?.(item.id)}
              style={[
                styles.navItem,
                isActive && styles.activeNavItem
              ]}
            >
              {isActive && (
                <LinearGradient
                  colors={['#0B1F3F', '#1A3A5C']}
                  style={StyleSheet.absoluteFill}
                />
              )}
              <Ionicons
                name={item.icon as any}
                size={20}
                color={isActive ? '#A3E635' : theme.textSecondary}
                style={styles.navIcon}
              />
              <Text
                style={[
                  styles.navLabel,
                  { color: isActive ? 'white' : theme.textSecondary }
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  navContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    maxWidth: 428, // Mobile max width
    alignSelf: 'center',
    width: '100%',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  activeNavItem: {
    // Gradient applied via LinearGradient component
  },
  navIcon: {
    marginBottom: 4,
  },
  navLabel: {
    fontSize: fontSize.xs,
    fontWeight: '500',
  },
});