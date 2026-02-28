import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
export * from './AllVenuesScreen';
export * from './AllPlayersScreen';
export * from './PlayerProfileScreen';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme/ThemeContext';
import { Text as ThemedText } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { spacing } from '@/theme';

import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

const Tab = createMaterialTopTabNavigator();

const MatchList = ({ route }: any) => {
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<any>();
  const activeTab = route.name.toLowerCase();

  const matches = [
    { id: '1', series: 'ICC World Cup 2024', format: 'ODI', team1: 'India', team1Code: 'IND', team1Score: '287/4', team1Overs: '45.2', team2: 'Australia', team2Code: 'AUS', team2Score: '180/6', team2Overs: '32.1', status: 'live', venue: 'Wankhede Stadium', info: 'IND need 108 runs', odds1: '80', odds2: '90' },
    { id: '2', series: 'IPL 2024', format: 'T20', team1: 'Mumbai Indians', team1Code: 'MI', team1Score: '185/6', team1Overs: '20.0', team2: 'Chennai Super Kings', team2Code: 'CSK', team2Score: '178/8', team2Overs: '20.0', status: 'live', venue: 'Wankhede Stadium', info: 'MI won by 7 runs', odds1: '75', odds2: '85' },
    { id: '3', series: 'Border-Gavaskar Trophy', format: 'Test', team1: 'India', team1Code: 'IND', team2: 'Australia', team2Code: 'AUS', status: 'upcoming', venue: 'MCG, Melbourne', time: 'Today, 9:30 AM', odds1: '92', odds2: '88' },
    { id: '4', series: 'England vs New Zealand', format: 'T20I', team1: 'England', team1Code: 'ENG', team2: 'New Zealand', team2Code: 'NZ', status: 'upcoming', venue: 'Lord\'s, London', time: 'Tomorrow, 3:00 PM', odds1: '70', odds2: '95' },
    { id: '5', series: 'Pakistan vs South Africa', format: 'ODI', team1: 'Pakistan', team1Code: 'PAK', team1Score: '245/8', team1Overs: '50.0', team2: 'South Africa', team2Code: 'SA', team2Score: '248/5', team2Overs: '47.3', status: 'recent', venue: 'National Stadium', info: 'SA won by 5 wickets' },
  ];

  const filteredMatches = matches.filter(m => m.status === activeTab);

  const renderMatch = ({ item }: any) => (
    <TouchableOpacity
      style={[styles.matchCard, { backgroundColor: theme.surface }]}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('MatchDetails', { matchId: item.id })}
    >
      {item.status === 'live' && (
        <View style={[styles.liveBadge, { backgroundColor: isDark ? theme.surface : '#FF3B30' }]}>
          <View style={[styles.liveDot, { backgroundColor: isDark ? '#FF3B30' : 'white' }]} />
          <ThemedText variant="caption" color={isDark ? 'text' : 'white'} weight="bold">LIVE</ThemedText>
        </View>
      )}

      <View style={styles.matchHeader}>
        <ThemedText variant="caption" color="textSecondary">{item.series} • {item.format}</ThemedText>
        <ThemedText variant="caption" color="textSecondary">{item.venue}</ThemedText>
      </View>

      <View style={styles.teamsContainer}>
        <View style={styles.teamRow}>
          <View style={styles.teamInfo}>
            <ThemedText variant="subtitle" weight="bold">{item.team1Code}</ThemedText>
            <ThemedText variant="caption" color="textSecondary">{item.team1}</ThemedText>
          </View>
          <View style={styles.scoreRow}>
            {item.team1Score && (
              <View style={styles.scoreInfo}>
                <ThemedText variant="subtitle" weight="bold">{item.team1Score}</ThemedText>
                <ThemedText variant="caption" color="textSecondary">({item.team1Overs})</ThemedText>
              </View>
            )}
            {item.odds1 && item.odds2 && (
              <View style={styles.oddsContainer}>
                <View style={[styles.oddsBadgeRed, { backgroundColor: isDark ? theme.border : '#FF3B30' }]}>
                  <ThemedText variant="caption" color={isDark ? 'text' : 'white'} weight="bold">{item.odds1}</ThemedText>
                </View>
                <View style={[styles.oddsBadgeBlue, { backgroundColor: isDark ? theme.primary : '#1877f2' }]}>
                  <ThemedText variant="caption" color="white" weight="bold">{item.odds2}</ThemedText>
                </View>
              </View>
            )}
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <View style={styles.teamRow}>
          <View style={styles.teamInfo}>
            <ThemedText variant="subtitle" weight="bold">{item.team2Code}</ThemedText>
            <ThemedText variant="caption" color="textSecondary">{item.team2}</ThemedText>
          </View>
          {item.team2Score && (
            <View style={styles.scoreInfo}>
              <ThemedText variant="subtitle" weight="bold">{item.team2Score}</ThemedText>
              <ThemedText variant="caption" color="textSecondary">({item.team2Overs})</ThemedText>
            </View>
          )}
        </View>
      </View>

      {item.info && (
        <View style={[styles.infoBar, { backgroundColor: item.status === 'live' ? theme.primary + '15' : '#34C759' + '15' }]}>
          <ThemedText variant="caption" color={item.status === 'live' ? 'primary' : undefined} weight="semibold" style={item.status !== 'live' && { color: '#34C759' }}>
            {item.info}
          </ThemedText>
        </View>
      )}
      {item.time && (
        <View style={[styles.infoBar, { backgroundColor: theme.primary + '15' }]}>
          <ThemedText variant="caption" color="primary" weight="semibold">{item.time}</ThemedText>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        data={filteredMatches}
        renderItem={renderMatch}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export const MatchesScreen: React.FC = () => {
  const { theme, isDark } = useTheme();

  return (
    <View style={styles.container}>
      <LinearGradient colors={isDark ? [theme.surface, theme.background] : [theme.primary, theme.primaryDark]} style={styles.header}>
        <ThemedText variant="title" color="white" weight="bold">Matches</ThemedText>
      </LinearGradient>
      <Tab.Navigator
        screenOptions={{
          tabBarStyle: { backgroundColor: theme.surface },
          tabBarIndicatorStyle: { backgroundColor: theme.primary, height: 3 },
          tabBarLabelStyle: { fontWeight: 'bold', textTransform: 'capitalize' },
          tabBarAllowFontScaling: false,
          tabBarActiveTintColor: theme.primary,
          tabBarInactiveTintColor: theme.textSecondary,
        }}
      >
        <Tab.Screen name="Live" component={MatchList} />
        <Tab.Screen name="Upcoming" component={MatchList} />
        <Tab.Screen name="Recent" component={MatchList} />
      </Tab.Navigator>
    </View>
  );
};

export const NewsScreen: React.FC = () => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <ThemedText variant="heading" weight="bold">
            News
          </ThemedText>
        </View>

        <View style={styles.content}>
          <Card>
            <ThemedText align="center" color="textSecondary">
              Latest cricket news will appear here
            </ThemedText>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
};

export const RankingsScreen: React.FC = () => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <ThemedText variant="heading" weight="bold">
            Rankings
          </ThemedText>
        </View>

        <View style={styles.content}>
          <Card>
            <ThemedText align="center" color="textSecondary">
              Team and player rankings will appear here
            </ThemedText>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
};

export const ProfileScreen: React.FC = () => {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <ThemedText variant="heading" weight="bold">
            Profile
          </ThemedText>
        </View>

        <View style={styles.content}>
          <Card style={styles.profileCard}>
            <ThemedText variant="title" weight="semibold" align="center">
              Welcome User
            </ThemedText>
            <ThemedText color="textSecondary" align="center" style={styles.subtitle}>
              Manage your preferences
            </ThemedText>
          </Card>

          <Card style={styles.settingCard}>
            <View style={styles.settingRow}>
              <ThemedText weight="medium">Dark Mode</ThemedText>
              <TouchableOpacity onPress={toggleTheme}>
                <ThemedText color="primary">
                  {isDark ? 'ON' : 'OFF'}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, alignItems: 'center' },
  tabContainer: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  tab: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
  listContent: { padding: spacing.md },
  matchCard: { borderRadius: 12, padding: spacing.md, marginBottom: spacing.md, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4 },
  liveBadge: { position: 'absolute', top: spacing.sm, right: spacing.sm, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FF3B30', paddingHorizontal: spacing.xs, paddingVertical: 4, borderRadius: 8, gap: 4 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'white' },
  matchHeader: { marginBottom: spacing.sm },
  teamsContainer: { gap: spacing.sm },
  teamRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  teamInfo: { flex: 1 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  scoreInfo: { alignItems: 'flex-end' },
  oddsContainer: { flexDirection: 'row', gap: 4 },
  oddsBadgeRed: { backgroundColor: '#FF3B30', paddingHorizontal: spacing.xs, paddingVertical: 4, borderRadius: 6, minWidth: 32, alignItems: 'center' },
  oddsBadgeBlue: { backgroundColor: '#1877f2', paddingHorizontal: spacing.xs, paddingVertical: 4, borderRadius: 6, minWidth: 32, alignItems: 'center' },
  divider: { height: 1, marginVertical: spacing.xs },
  infoBar: { marginTop: spacing.sm, padding: spacing.xs, borderRadius: 6, alignItems: 'center' },
  scrollView: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.md },
  profileCard: { padding: spacing.xl, alignItems: 'center', gap: spacing.sm },
  subtitle: { marginTop: spacing.xs },
  settingCard: { padding: spacing.md },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm },
});