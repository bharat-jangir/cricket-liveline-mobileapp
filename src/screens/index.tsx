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
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeContext';
import { Text as ThemedText } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { spacing, fontSize, scale } from '@/theme';
import { useLiveMatches } from '../hooks/useLiveMatches';
import LogoSVG from '../../assets/cp-nobg-logo.svg';

import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { MatchCard } from '@/components/MatchCard';
import { MatchCardSkeleton } from '@/components/MatchCardSkeleton';

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

  // Live socket updates for the listing screen
  const { liveUpdates } = useLiveMatches();

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchMatches();
    setRefreshing(false);
  }, [fetchMatches]);

  const mapApiToMatch = (item: any) => {
    const matchId = item._id || item.id;
    // Overlay socket live update for LIVE tab
    const socketData = activeTab === 'live' ? liveUpdates[matchId] : null;

    const team1Name = socketData?.teamA?.name || item.team1?.name || item.team1?.code || item.teamAId?.shortName || (typeof item.team1 === 'string' ? item.team1 : 'T1');
    const team2Name = socketData?.teamB?.name || item.team2?.name || item.team2?.code || item.teamBId?.shortName || (typeof item.team2 === 'string' ? item.team2 : 'T2');

    return {
      id: matchId,
      series: item.seriesId?.name || item.series?.name || item.series || 'Series',
      format: item.matchFormat || item.format || 'T20',
      team1: {
        name: team1Name,
        code: socketData?.teamA?.code || item.team1?.code || item.teamAId?.shortName || 'T1',
        score: socketData?.teamA?.score || item.team1?.score || item.liveStatus?.score || item.team1Score,
        overs: socketData?.teamA?.overs || item.team1?.overs || item.liveStatus?.overs || item.team1Overs,
      },
      team2: {
        name: team2Name,
        code: socketData?.teamB?.code || item.team2?.code || item.teamBId?.shortName || 'T2',
        score: socketData?.teamB?.score || item.team2?.score || item.liveStatus?.team2Score || item.team2Score,
        overs: socketData?.teamB?.overs || item.team2?.overs || item.liveStatus?.team2Overs || item.team2Overs,
      },
      status: item.status === 'live' ? 'Live' : (item.status === 'scheduled' ? 'Scheduled' : 'Completed'),
      venue: item.venueId?.name || item.venue?.name || item.venue || 'Venue',
      time: item.startTime ? new Date(item.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
      runRate: socketData?.runRate || item.liveStatus?.runRate,
      result: typeof item.result === 'string' ? item.result : (item.result?.resultText || item.toss?.tossText)
    };
  };

  const renderMatch = ({ item }: any) => {
    const mappedMatch = mapApiToMatch(item);
    return (
      <View style={{ marginBottom: spacing.md }}>
        <MatchCard
          match={mappedMatch}
          onPress={() => navigation.navigate('MatchDetails', {
            matchId: mappedMatch.id,
            team1Name: mappedMatch.team1.name,
            team2Name: mappedMatch.team2.name
          })}
        />
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, padding: spacing.md }]}>
        {[1, 2, 3, 4].map(i => <MatchCardSkeleton key={i} />)}
      </View>
    );
  }

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
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 50 }}>
            <ThemedText color="textSecondary">No {activeTab} matches found</ThemedText>
          </View>
        }
      />
    </View>
  );
};

export const MatchesScreen: React.FC = () => {
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={isDark ? [theme.surface, theme.background] : [theme.primary, theme.primaryDark]}
        style={styles.mainHeader}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.logoContainer}>
              <LogoSVG width={scale(40)} height={scale(40)} style={styles.logo} />
            </View>
            <View>
              <ThemedText style={styles.appTitle}>Cricket Pulse</ThemedText>
              <ThemedText style={styles.appSubtitle}>Live Cricket Scores</ThemedText>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => navigation.navigate('GlobalSearch')}
            >
              <Ionicons name="search" size={20} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => navigation.navigate('ProfileMenu')}
            >
              <Ionicons name="menu" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
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
  mainHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg + 10,
    paddingBottom: spacing.sm,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(235, 226, 226, 0.08)",
  },
  logo: {
    width: 32,
    height: 32,
  },
  appTitle: {
    fontSize: fontSize.xl,
    fontWeight: "bold",
    color: "white",
  },
  appSubtitle: {
    fontSize: fontSize.xs,
    color: "rgba(255, 255, 255, 0.8)",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  headerButton: {
    padding: spacing.sm,
    borderRadius: 20,
    position: "relative",
  },
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