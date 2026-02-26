import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useTheme } from '../theme/ThemeContext';
import { Text as ThemedText } from '../components/ui/Text';
import { spacing, fontSize, scale, elevation } from '../theme';

type SplashScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Splash'>;

const AnimatedLetter: React.FC<{ letter: string; delay: number }> = ({ letter, delay }) => {
  const letterAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(letterAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, letterAnim]);

  return (
    <View style={styles.letterContainer}>
      <Animated.Text
        style={[
          styles.letter,
          {
            opacity: letterAnim,
          },
        ]}
      >
        {letter}
      </Animated.Text>
    </View>
  );
};

export const SplashScreen: React.FC = () => {
  const navigation = useNavigation<SplashScreenNavigationProp>();
  const { theme, isOnboardingCompleted } = useTheme();
  const logoAnim = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const ballX = useRef(new Animated.Value(0)).current;
  const ballY = useRef(new Animated.Value(0)).current;
  const ballOpacity = useRef(new Animated.Value(0)).current;

  const appName = 'Cricket Pulse';
  const letters = appName.split('');

  useEffect(() => {
    // Logo animation
    Animated.parallel([
      Animated.timing(logoAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Ball animation after letters appear
    const ballTimer = setTimeout(() => {
      Animated.timing(ballOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        // Projectile motion from C to e
        Animated.parallel([
          Animated.timing(ballX, {
            toValue: scale(250),
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(ballY, {
              toValue: -scale(40),
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(ballY, {
              toValue: 0,
              duration: 600,
              useNativeDriver: true,
            }),
          ]),
        ]).start();
      });
    }, 3000);

    const timer = setTimeout(() => {
      if (isOnboardingCompleted) {
        navigation.replace('Main', { screen: 'Home' });
      } else {
        navigation.replace('Onboarding');
      }
    }, 5000);

    return () => {
      clearTimeout(timer);
      clearTimeout(ballTimer);
    };
  }, [navigation, isOnboardingCompleted, logoAnim, logoScale, ballX, ballY, ballOpacity]);

  return (
    <LinearGradient
      colors={[theme.primary, theme.primaryLight, '#ffffff']}
      locations={[0, 0.7, 1]}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Logo Container */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoAnim,
              transform: [{ scale: logoScale }]
            }
          ]}
        >
          <View style={[styles.logoBackground, elevation.xl]}>
            <Image
              source={require('../../assets/no-bg-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        </Animated.View>

        {/* Animated App Title */}
        <View style={styles.titleContainer}>
          <View style={styles.lettersRow}>
            {letters.map((letter, index) => (
              <AnimatedLetter
                key={index}
                letter={letter}
                delay={1500 + (index * 150)}
              />
            ))}

            {/* Cricket Ball */}
            <Animated.View
              style={[
                styles.cricketBall,
                {
                  opacity: ballOpacity,
                  transform: [
                    { translateX: ballX },
                    { translateY: ballY },
                  ],
                },
              ]}
            />
          </View>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    zIndex: 1,
  },
  logoContainer: {
    marginBottom: spacing.xxl,
  },
  logoBackground: {
    width: scale(120),
    height: scale(120),
    borderRadius: scale(60),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  logo: {
    width: scale(80),
    height: scale(80),
  },
  titleContainer: {
    alignItems: 'center',
  },
  lettersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  letterContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    fontSize: fontSize.heading + scale(8),
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
    letterSpacing: 1,
    elevation: 8,
  },
  cricketBall: {
    position: 'absolute',
    width: scale(12),
    height: scale(12),
    borderRadius: scale(6),
    backgroundColor: '#dc2626',
    left: scale(10),
    top: scale(5),
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },

});