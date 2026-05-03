import React, { useEffect } from 'react';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { NavigatorScreenParams } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { fontSize, scale } from '@/theme';

// Import screens - Restored after accidental deletion
import { SplashScreen } from '@/screens/SplashScreen';
import { OnboardingScreen } from '@/screens/OnboardingScreen';
import { LoginScreen } from '@/screens/LoginScreen';
import { HomeScreen } from '@/screens/HomeScreen';
import { ProfileMenuScreen } from '@/screens/ProfileMenuScreen';
import { GlobalSearchScreen } from '@/screens/GlobalSearchScreen';
import { SeriesScreen } from '@/screens/SeriesScreen';
import { SeriesDetailScreen } from '@/screens/SeriesDetailScreen';
import { ShortsScreen } from '@/screens/ShortsScreen';
import { FixturesScreen } from '@/screens/FixturesScreen';
import { MatchesScreen, NewsScreen, ProfileScreen } from '@/screens/index';
import { RankingsScreen } from '@/screens/RankingsScreen';
import { AllNewsScreen } from '@/screens/AllNewsScreen';
import { NewsDetailScreen } from '@/screens/NewsDetailScreen';
import { VenueDetailScreen } from '@/screens/VenueDetailScreen';
import { AllVenuesScreen } from '@/screens/AllVenuesScreen';
import { AllPlayersScreen } from '@/screens/AllPlayersScreen';
import { PlayerProfileScreen } from '@/screens/PlayerProfileScreen';
import { MatchDetailScreen } from '@/screens/MatchDetailScreen';
import { MatchLedgerScreen } from '@/screens/MatchLedgerScreen';
import LogoSVG from '../../assets/cp-nobg-logo.svg';

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Login: undefined;
  Main: NavigatorScreenParams<MainTabParamList>;
  ProfileMenu: undefined;
  GlobalSearch: undefined;
  Rankings: undefined;
  AllNews: undefined;
  NewsDetail: { newsId: string };
  SeriesDetail: { seriesId: string };
  MatchDetails: { matchId: string; team1Name?: string; team2Name?: string };
  PlayerProfile: { playerId: string };
  VenueDetail: { venueId: string };
  AllVenues: undefined;
  AllPlayers: undefined;
  MatchLedger: { matchId?: string; autoOpenAddEntry?: boolean } | undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Series: undefined;
  Matches: undefined;
  Shorts: undefined;
  Fixtures: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const MainTabNavigator = () => {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Matches') {
            return (
              <LogoSVG width={size} height={size} color={color} />
            );
          }

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Series':
              iconName = focused ? 'trophy' : 'trophy-outline';
              break;
            case 'Shorts':
              iconName = focused ? 'play-circle' : 'play-circle-outline';
              break;
            case 'Fixtures':
              iconName = focused ? 'calendar' : 'calendar-outline';
              break;
            default:
              iconName = 'home-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textLight,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: fontSize.xs,
          fontWeight: '600',
        },
        tabBarAllowFontScaling: false,
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Series" component={SeriesScreen} />
      <Tab.Screen name="Matches" component={MatchesScreen} />
      <Tab.Screen name="Shorts" component={ShortsScreen} />
      <Tab.Screen name="Fixtures" component={FixturesScreen} />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const { theme, isOnboardingCompleted, isSettingsLoaded } = useTheme();

  // Prevent flashing the wrong screen while settings are loading from AsyncStorage
  if (!isSettingsLoaded) {
    return null;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.surface,
        },
        headerTintColor: theme.text,
        headerTitleStyle: {
          fontSize: fontSize.lg,
          fontWeight: '600',
        },
        gestureEnabled: false,
        gestureDirection: 'horizontal',
        cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
      }}
    >
      {!isOnboardingCompleted ? (
        <Stack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{ headerShown: false }}
        />
      ) : (
        <>
          <Stack.Screen
            name="Splash"
            component={SplashScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ProfileMenu"
            component={ProfileMenuScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="GlobalSearch"
            component={GlobalSearchScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Rankings"
            component={RankingsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AllNews"
            component={AllNewsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="NewsDetail"
            component={NewsDetailScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="SeriesDetail"
            component={SeriesDetailScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="VenueDetail"
            component={VenueDetailScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AllVenues"
            component={AllVenuesScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AllPlayers"
            component={AllPlayersScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="MatchDetails"
            component={MatchDetailScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="MatchLedger"
            component={MatchLedgerScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="PlayerProfile"
            component={PlayerProfileScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Main"
            component={MainTabNavigator}
            options={{ headerShown: false }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

export { AppNavigator };