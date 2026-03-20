import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MatchService, MatchFilters } from '../services/match.service';
import { useFetch } from '../hooks/useFetch';
export * from './AllVenuesScreen';
export * from './AllPlayersScreen';
export * from './PlayerProfileScreen';
export * from './MatchLedgerScreen';
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
  const activeTab = route.name.toLowerCase(); // 'live', 'upcoming', 'recent'
  
  // Map tab name to API status
  const statusMap: Record<string, MatchFilters['status']> = {
    live: 'live',
    upcoming: 'scheduled',
    recent: 'completed'
  };

  const { data: fetchedMatches, loading, execute: fetchMatches } = useFetch(
    () => MatchService.getMatches({ status: statusMap[activeTab], limit: 20 }),
    []
  );

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchMatches();
    setRefreshing(false);
  }, [fetchMatches]);

  useEffect(() => {
    fetchMatches();
  }, [activeTab]);

  const renderMatch = ({ item }: any) => {
    const team1Name = item.teamAId?.shortName || item.teamAId?.name || item.team1Code || 'T1';
    const team2Name = item.teamBId?.shortName || item.teamBId?.name || item.team2Code || 'T2';
    const score1 = item.liveStatus?.score || item.team1Score;
    const overs1 = item.liveStatus?.overs || item.team1Overs;
    const score2 = item.liveStatus?.team2Score || item.team2Score; // Backend might need adjustment for team2 score in liveStatus
    const overs2 = item.liveStatus?.team2Overs || item.team2Overs;

    return (
      <TouchableOpacity
        style={[styles.matchCard, { backgroundColor: theme.surface }]}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('MatchDetails', { matchId: item._id || item.id })}
      >
        {item.status === 'live' && (
          <View style={[styles.liveBadge, { backgroundColor: isDark ? theme.surface : '#FF3B30' }]}>
            <View style={[styles.liveDot, { backgroundColor: isDark ? '#FF3B30' : 'white' }]} />
            <ThemedText variant="caption" color={isDark ? 'text' : 'white'} weight="bold">LIVE</ThemedText>
          </View>
        )}

        <View style={styles.matchHeader}>
          <ThemedText variant="caption" color="textSecondary">
            {item.seriesId?.name || item.series?.name || item.series || 'Series'} • {item.matchFormat || item.format}
          </ThemedText>
          <ThemedText variant="caption" color="textSecondary">{item.venueId?.name || item.venue?.name || item.venue}</ThemedText>
        </View>

        <View style={styles.teamsContainer}>
          <View style={styles.teamRow}>
            <View style={styles.teamInfo}>
              <ThemedText variant="subtitle" weight="bold">{team1Name}</ThemedText>
              <ThemedText variant="caption" color="textSecondary">{item.teamAId?.name || item.team1}</ThemedText>
            </View>
            <View style={styles.scoreRow}>
              {score1 && (
                <View style={styles.scoreInfo}>
                  <ThemedText variant="subtitle" weight="bold">{score1}</ThemedText>
                  {overs1 && <ThemedText variant="caption" color="textSecondary">({overs1})</ThemedText>}
                </View>
              )}
              {item.oddsBlue !== undefined && item.oddsRed !== undefined && (
                <View style={styles.oddsContainer}>
                  <View style={[styles.oddsBadgeRed, { backgroundColor: isDark ? theme.border : '#FF3B30' }]}>
                    <ThemedText variant="caption" color={isDark ? 'text' : 'white'} weight="bold">{item.oddsRed}</ThemedText>
                  </View>
                  <View style={[styles.oddsBadgeBlue, { backgroundColor: isDark ? theme.primary : '#1877f2' }]}>
                    <ThemedText variant="caption" color="white" weight="bold">{item.oddsBlue}</ThemedText>
                  </View>
                </View>
              )}
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={styles.teamRow}>
            <View style={styles.teamInfo}>
              <ThemedText variant="subtitle" weight="bold">{team2Name}</ThemedText>
              <ThemedText variant="caption" color="textSecondary">{item.teamBId?.name || item.team2}</ThemedText>
            </View>
            {score2 && (
              <View style={styles.scoreInfo}>
                <ThemedText variant="subtitle" weight="bold">{score2}</ThemedText>
                {overs2 && <ThemedText variant="caption" color="textSecondary">({overs2})</ThemedText>}
              </View>
            )}
          </View>
        </View>

        {(item.toss?.tossText || item.result?.resultText || item.info) && (
          <View style={[styles.infoBar, { backgroundColor: item.status === 'live' ? theme.primary + '15' : '#34C759' + '15' }]}>
            <ThemedText variant="caption" color={item.status === 'live' ? 'primary' : undefined} weight="semibold" style={item.status !== 'live' && { color: '#34C759' }}>
              {item.status === 'live' ? (item.toss?.tossText || item.info) : (item.result?.resultText || item.info)}
            </ThemedText>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        data={fetchedMatches || []}
        renderItem={renderMatch}
        keyExtractor={item => item._id || item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
        ListEmptyComponent={
            !loading ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 50 }}>
                    <ThemedText color="textSecondary">No {activeTab} matches found</ThemedText>
                </View>
            ) : null
        }
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