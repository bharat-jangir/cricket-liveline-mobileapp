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
    [activeTab]
  );

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchMatches();
    setRefreshing(false);
  }, [fetchMatches]);

  const renderMatch = ({ item }: any) => {
    const team1Name = item.team1?.name || item.team1?.code || item.teamAId?.shortName || (typeof item.team1 === 'string' ? item.team1 : 'T1');
    const team2Name = item.team2?.name || item.team2?.code || item.teamBId?.shortName || (typeof item.team2 === 'string' ? item.team2 : 'T2');

    const score1 = item.team1?.score || item.liveStatus?.score || item.team1Score;
    const overs1 = item.team1?.overs || item.liveStatus?.overs || item.team1Overs;
    const score2 = item.team2?.score || item.liveStatus?.team2Score || item.team2Score;
    const overs2 = item.team2?.overs || item.liveStatus?.team2Overs || item.team2Overs;

    const currentBattingTeamId = item.liveStatus?.battingTeam || item.battingTeam;
    const currentBattingTeamStr = currentBattingTeamId ? String(currentBattingTeamId).toLowerCase() : '';
    const isTeam1Batting = currentBattingTeamId && (
      currentBattingTeamStr === String(item.team1?.code).toLowerCase() ||
      currentBattingTeamStr === String(item.team1?._id).toLowerCase() ||
      currentBattingTeamStr === String(item.teamAId?._id).toLowerCase()
    );
    const isTeam2Batting = currentBattingTeamId && (
      currentBattingTeamStr === String(item.team2?.code).toLowerCase() ||
      currentBattingTeamStr === String(item.team2?._id).toLowerCase() ||
      currentBattingTeamStr === String(item.teamBId?._id).toLowerCase()
    );

    const isLive = item.status && String(item.status).toLowerCase() === 'live';
    const displayStatus = item.status || 'Match';
    const resultText = typeof item.result === 'string' ? item.result : (item.result?.resultText || item.toss?.tossText || item.info);

    return (
      <TouchableOpacity
        style={[styles.matchCard, { backgroundColor: theme.surface }]}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('MatchDetails', { 
          matchId: item._id || item.id, 
          team1Name: team1Name, 
          team2Name: team2Name 
        })}
      >
        <View style={[styles.matchHeader, { borderBottomWidth: 1, borderBottomColor: theme.border, paddingBottom: spacing.sm, marginBottom: spacing.sm }]}>
          <ThemedText variant="caption" color="textSecondary" weight="semibold">
            {item.seriesId?.name || item.series?.name || item.series || 'Series'} • {item.matchFormat || item.format}
          </ThemedText>
          <ThemedText variant="caption" color="textSecondary">{item.venueId?.name || item.venue?.name || item.venue}</ThemedText>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {/* Left Section: Teams & Scores */}
          <View style={{ flex: 3, paddingRight: spacing.sm, justifyContent: 'center' }}>
            <View style={{ marginBottom: spacing.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {isTeam1Batting && <View style={[styles.battingIndicator, { backgroundColor: theme.primary }]} />}
                <ThemedText variant="subtitle" weight="bold">{team1Name}</ThemedText>
              </View>
              {score1 ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', marginTop: 2 }}>
                  <ThemedText variant="body" weight="bold" color="text">{score1}</ThemedText>
                  {overs1 ? <ThemedText variant="caption" color="textSecondary" style={{ marginLeft: 4 }}>({overs1})</ThemedText> : null}
                </View>
              ) : (
                <ThemedText variant="caption" color="textSecondary" style={{ marginTop: 2 }}>Yet to bat</ThemedText>
              )}
            </View>

            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {isTeam2Batting && <View style={[styles.battingIndicator, { backgroundColor: theme.primary }]} />}
                <ThemedText variant="subtitle" weight="bold">{team2Name}</ThemedText>
              </View>
              {score2 ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', marginTop: 2 }}>
                  <ThemedText variant="body" weight="bold" color="text">{score2}</ThemedText>
                  {overs2 ? <ThemedText variant="caption" color="textSecondary" style={{ marginLeft: 4 }}>({overs2})</ThemedText> : null}
                </View>
              ) : (
                <ThemedText variant="caption" color="textSecondary" style={{ marginTop: 2 }}>Yet to bat</ThemedText>
              )}
            </View>
          </View>

          {/* Right Section: Status & Result */}
          <View style={{ flex: 2, alignItems: 'flex-end', justifyContent: 'center', borderLeftWidth: 1, borderLeftColor: theme.border, paddingLeft: spacing.sm }}>
            {isLive ? (
              <View style={[styles.liveBadgeInline, { backgroundColor: isDark ? theme.surface : '#FF3B3015' }]}>
                <View style={[styles.liveDot, { backgroundColor: '#FF3B30' }]} />
                <ThemedText variant="caption" style={{ color: '#FF3B30' }} weight="bold">LIVE</ThemedText>
              </View>
            ) : (
              <View style={[styles.statusBadge, { backgroundColor: theme.border }]}>
                <ThemedText variant="caption" color="text" weight="bold" style={{ textTransform: 'uppercase' }}>{displayStatus}</ThemedText>
              </View>
            )}

            <ThemedText
              variant="caption"
              color={isLive ? 'primary' : 'textSecondary'}
              weight={isLive ? 'bold' : 'normal'}
              style={{ textAlign: 'right', marginTop: spacing.md }}
              numberOfLines={4}
            >
              {resultText || (isLive ? 'Match in progress' : 'Match ended')}
            </ThemedText>
          </View>
        </View>
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
  liveBadgeInline: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 4, gap: 4, alignSelf: 'flex-end' },
  statusBadge: { paddingHorizontal: 6, paddingVertical: 4, borderRadius: 4, alignSelf: 'flex-end' },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  matchHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  battingIndicator: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  scrollView: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.md },
  profileCard: { padding: spacing.xl, alignItems: 'center', gap: spacing.sm },
  subtitle: { marginTop: spacing.xs },
  settingCard: { padding: spacing.md },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm },
});