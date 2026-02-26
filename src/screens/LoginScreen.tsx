import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { useTheme } from '@/theme/ThemeContext';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { spacing } from '@/theme';

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { theme } = useTheme();

  const handleLogin = () => {
    navigation.replace('Main', { screen: 'Home' });
  };

  const handleSkip = () => {
    navigation.replace('Main', { screen: 'Home' });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <Text variant="heading" weight="bold" align="center" style={styles.title}>
          Sign In
        </Text>

        <Card style={styles.loginCard}>
          <Text variant="title" weight="semibold" align="center" style={styles.subtitle}>
            Get Personalized Experience
          </Text>
          <Text color="textSecondary" align="center" style={styles.description}>
            Sign in to save your favorite teams, get personalized news, and more
          </Text>

          <Button
            title="Sign In with Google"
            onPress={handleLogin}
            style={styles.loginButton}
          />

          <Button
            title="Sign In with Apple"
            onPress={handleLogin}
            variant="secondary"
            style={styles.loginButton}
          />
        </Card>
      </View>

      <View style={styles.bottomContainer}>
        <Button
          title="Skip for now"
          onPress={handleSkip}
          variant="ghost"
          style={styles.skipButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  title: {
    marginBottom: spacing.xl,
  },
  loginCard: {
    alignItems: 'center',
  },
  subtitle: {
    marginBottom: spacing.sm,
  },
  description: {
    marginBottom: spacing.xl,
  },
  loginButton: {
    width: '100%',
    marginBottom: spacing.md,
  },
  bottomContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  skipButton: {
    width: '100%',
  },
});