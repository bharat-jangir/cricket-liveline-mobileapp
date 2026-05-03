import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, FlatList, Image, useWindowDimensions, SafeAreaView, Modal, Pressable } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { spacing, borderRadius } from '../theme';
import { Text as ThemedText } from '../components/ui/Text';
import { Card } from '../components/ui/Card';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useFetch } from '../hooks/useFetch';
import { SeriesService } from '../services/series.service';
import { MatchService } from '../services/match.service';
import { ActivityIndicator, RefreshControl } from 'react-native';

const TopTab = createMaterialTopTabNavigator();

// --- Mock Data ---

const MOCK_FIXTURES = [
  { id: '1', date: 'Oct 5', team1: 'ENG', team2: 'NZ', venue: 'Ahmedabad', status: 'Completed', result: 'NZ won by 9 wkts' },
  { id: '2', date: 'Oct 6', team1: 'PAK', team2: 'NED', venue: 'Hyderabad', status: 'Completed', result: 'PAK won by 81 runs' },
  { id: '3', date: 'Oct 7', team1: 'AFG', team2: 'BAN', venue: 'Dharamshala', status: 'Upcoming', result: '' },
  { id: '4', date: 'Oct 7', team1: 'SA', team2: 'SL', venue: 'Delhi', status: 'Upcoming', result: '' },
  { id: '5', date: 'Oct 8', team1: 'IND', team2: 'AUS', venue: 'Chennai', status: 'Upcoming', result: '' },
];

const MOCK_TEAMS = [
  {
    id: 'IND', name: 'India', flag: '🇮🇳', played: 9, won: 9, lost: 0,
    players: [
      { id: '1', name: 'Rohit Sharma', role: 'Bat', image: 'https://i.pravatar.cc/100?img=11' },
      { id: '2', name: 'Virat Kohli', role: 'Bat', image: 'https://i.pravatar.cc/100?img=12' },
      { id: '3', name: 'Jasprit Bumrah', role: 'Bowl', image: 'https://i.pravatar.cc/100?img=13' },
      { id: '4', name: 'Hardik Pandya', role: 'AR', image: 'https://i.pravatar.cc/100?img=14' },
      { id: '5', name: 'Ravindra Jadeja', role: 'AR', image: 'https://i.pravatar.cc/100?img=15' },
      { id: '6', name: 'Mohammed Shami', role: 'Bowl', image: 'https://i.pravatar.cc/100?img=16' },
    ]
  },
  {
    id: 'AUS', name: 'Australia', flag: '🇦🇺', played: 9, won: 7, lost: 2,
    players: [
      { id: '7', name: 'Pat Cummins', role: 'Bowl', image: 'https://i.pravatar.cc/100?img=17' },
      { id: '8', name: 'David Warner', role: 'Bat', image: 'https://i.pravatar.cc/100?img=18' },
      { id: '9', name: 'Glenn Maxwell', role: 'AR', image: 'https://i.pravatar.cc/100?img=19' },
    ]
  },
  { id: 'SA', name: 'South Africa', flag: '🇿🇦', played: 9, won: 7, lost: 2, players: [] },
  { id: 'NZ', name: 'New Zealand', flag: '🇳🇿', played: 9, won: 5, lost: 4, players: [] },
  { id: 'PAK', name: 'Pakistan', flag: '🇵🇰', played: 9, won: 4, lost: 5, players: [] },
  { id: 'ENG', name: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', played: 9, won: 3, lost: 6, players: [] },
];

const MOCK_STATS_CATEGORIES = {
  Batting: [
    { id: '1', title: 'Most Runs', player: 'Virat Kohli', value: '765', team: 'IND', flag: '🇮🇳', image: 'https://i.pravatar.cc/100?img=12', metric: 'Runs' },
    { id: '3', title: 'Highest Score', player: 'Glenn Maxwell', value: '201*', team: 'AUS', flag: '🇦🇺', image: 'https://i.pravatar.cc/100?img=19', metric: 'Score' },
    { id: '5', title: 'Most Sixes', player: 'Rohit Sharma', value: '31', team: 'IND', flag: '🇮🇳', image: 'https://i.pravatar.cc/100?img=11', metric: 'Sixes' },
    { id: '6', title: 'Best Average', player: 'Kane Williamson', value: '82.4', team: 'NZ', flag: '🇳🇿', image: 'https://i.pravatar.cc/100?img=20', metric: 'Avg' },
  ],
  Bowling: [
    { id: '2', title: 'Most Wickets', player: 'Mohammad Shami', value: '24', team: 'IND', flag: '🇮🇳', image: 'https://i.pravatar.cc/100?img=16', metric: 'Wkts' },
    { id: '4', title: 'Best Figures', player: 'Mohammad Shami', value: '7/57', team: 'IND', flag: '🇮🇳', image: 'https://i.pravatar.cc/100?img=16', metric: 'Figs' },
    { id: '7', title: 'Best Economy', player: 'Jasprit Bumrah', value: '3.98', team: 'IND', flag: '🇮🇳', image: 'https://i.pravatar.cc/100?img=13', metric: 'Econ' },
    { id: '8', title: 'Most Maidens', player: 'Josh Hazlewood', value: '12', team: 'AUS', flag: '🇦🇺', image: 'https://i.pravatar.cc/100?img=21', metric: 'Maidens' },
  ],
  Fielding: [
    { id: '9', title: 'Most Catches', player: 'Daryl Mitchell', value: '11', team: 'NZ', flag: '🇳🇿', image: 'https://i.pravatar.cc/100?img=22', metric: 'Catches' },
    { id: '10', title: 'Most Dismissals', player: 'Quinton de Kock', value: '20', team: 'SA', flag: '🇿🇦', image: 'https://i.pravatar.cc/100?img=23', metric: 'Wk Dis' },
  ]
};

const MOCK_VENUES = [
  { id: '1', name: 'Narendra Modi Stadium', city: 'Ahmedabad', capacity: '132,000', image: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=400&h=300&auto=format&fit=crop' },
  { id: '2', name: 'Eden Gardens', city: 'Kolkata', capacity: '68,000', image: 'https://images.unsplash.com/photo-1577223625816-75aa5ac7eb7a?q=80&w=400&h=300&auto=format&fit=crop' },
  { id: '3', name: 'Wankhede Stadium', city: 'Mumbai', capacity: '33,108', image: 'https://images.unsplash.com/photo-1505322022379-7c3353ee6291?q=80&w=400&h=300&auto=format&fit=crop' },
];

const MOCK_NEWS = [
  { id: '1', title: 'India beats New Zealand to enter the finals', time: '2 hours ago', image: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=200&h=200&auto=format&fit=crop' },
  { id: '2', title: 'Maxwell scores a double century playing on one leg', time: '5 hours ago', image: 'https://images.unsplash.com/photo-1587280501635-a19760152f44?q=80&w=200&h=200&auto=format&fit=crop' },
  { id: '3', title: 'ICC announces team of the tournament', time: '1 day ago', image: 'https://images.unsplash.com/photo-1624194675583-65aa37de5063?q=80&w=200&h=200&auto=format&fit=crop' },
];

const MOCK_VIDEOS = [
  { id: '1', title: 'Match 1 Highlights: ENG vs NZ', duration: '12:05', image: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=400&h=300&auto=format&fit=crop' },
  { id: '2', title: 'Best Catches of the Week', duration: '05:30', image: 'https://images.unsplash.com/photo-1505322022379-7c3353ee6291?q=80&w=400&h=300&auto=format&fit=crop' },
  { id: '3', title: 'Kohli 50th ODI Century Moment', duration: '03:15', image: 'https://images.unsplash.com/photo-1587280501635-a19760152f44?q=80&w=400&h=300&auto=format&fit=crop' },
];

const MOCK_POINTS_TABLE = [
  { id: 'IND', team: 'India', flag: '🇮🇳', m: 9, w: 9, l: 0, nr: 0, pts: 18, cupRPts: 200, nrr: '+2.570' },
  { id: 'SA', team: 'South Africa', flag: '🇿🇦', m: 9, w: 7, l: 2, nr: 0, pts: 14, cupRPts: 150, nrr: '+1.261' },
  { id: 'AUS', team: 'Australia', flag: '🇦🇺', m: 9, w: 7, l: 2, nr: 0, pts: 14, cupRPts: 140, nrr: '+0.841' },
  { id: 'NZ', team: 'New Zealand', flag: '🇳🇿', m: 9, w: 5, l: 4, nr: 0, pts: 10, cupRPts: 110, nrr: '+0.743' },
  { id: 'PAK', team: 'Pakistan', flag: '🇵🇰', m: 9, w: 4, l: 5, nr: 0, pts: 8, cupRPts: 90, nrr: '-0.199' },
  { id: 'AFG', team: 'Afghanistan', flag: '🇦🇫', m: 9, w: 4, l: 4, nr: 1, pts: 9, cupRPts: 85, nrr: '-0.336' },
  { id: 'ENG', team: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', m: 9, w: 3, l: 6, nr: 0, pts: 6, cupRPts: 70, nrr: '-0.572' }
];

// --- Sub Tabs ---

const OverviewTab = () => {
  const navigation = useNavigation<any>();
  const { theme, isDark } = useTheme();
  const route = useRoute<any>();
  const { seriesId } = route.params;

  const { data: series } = useFetch(
    () => SeriesService.getSeriesDetails(seriesId),
    [seriesId]
  );

  const { data: fixtures } = useFetch(
    () => MatchService.getSeriesMatches(seriesId),
    [seriesId]
  );

  const featuredMatches = fixtures?.slice(0, 3) || [];

  return (
    <ScrollView style={[styles.tabContent, { backgroundColor: theme.background }]} contentContainerStyle={styles.tabContentPadding}>
      
      {series?.description ? (
        <View style={styles.mb}>
          <ThemedText variant="subtitle" weight="bold" style={styles.mbSm}>About Series</ThemedText>
          <ThemedText color="textSecondary">{series.description}</ThemedText>
        </View>
      ) : null}

      <View style={[styles.row, styles.mb, { alignItems: 'center' }]}>
        <ThemedText variant="subtitle" weight="bold" style={{ flex: 1 }}>Featured Matches</ThemedText>
      </View>

      {featuredMatches.map((item: any) => (
        <TouchableOpacity key={item.id || item._id} activeOpacity={0.8} onPress={() => navigation.navigate('MatchDetails', { matchId: item.id || item._id })}>
          <Card style={styles.mb}>
            <View style={[styles.row, { justifyContent: 'space-between', marginBottom: spacing.sm }]}>
              <ThemedText variant="small" color="textSecondary">
                {item.time ? new Date(item.time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''} • {item.venue}
              </ThemedText>
              <View style={[styles.badge, { backgroundColor: item.status === 'Completed' ? theme.success + '20' : theme.warning + '20' }]}>
                <ThemedText variant="small" weight="bold" style={{ color: item.status === 'Completed' ? theme.success : theme.warning }}>{item.status}</ThemedText>
              </View>
            </View>
            <View style={[styles.row, { alignItems: 'center', marginVertical: spacing.sm }]}>
              <ThemedText weight="bold" style={{ flex: 1, textAlign: 'right' }}>{item.team1?.code || 'T1'}</ThemedText>
              <ThemedText color="textSecondary" style={{ marginHorizontal: spacing.md }}>VS</ThemedText>
              <ThemedText weight="bold" style={{ flex: 1 }}>{item.team2?.code || 'T2'}</ThemedText>
            </View>
            {item.result ? (
              <ThemedText variant="small" color="primary" weight="bold" style={{ textAlign: 'center', marginTop: spacing.xs }}>{item.result}</ThemedText>
            ) : null}
          </Card>
        </TouchableOpacity>
      ))}

      {series?.tournamentId && (
        <View style={styles.mb}>
          <ThemedText variant="subtitle" weight="bold" style={styles.mbSm}>Tournament Details</ThemedText>
          <Card style={styles.row}>
            <View style={styles.iconContainer}>
              <Ionicons name="trophy" size={24} color={theme.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.md, justifyContent: 'center' }}>
              <ThemedText weight="bold">{series.tournamentId.name}</ThemedText>
              <ThemedText variant="caption" color="textSecondary">Category: {series.category || 'N/A'}</ThemedText>
            </View>
          </Card>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const FixturesTab = () => {
  const navigation = useNavigation<any>();
  const { theme, isDark } = useTheme();
  const route = useRoute<any>();
  const { seriesId } = route.params;
  const { width } = useWindowDimensions();
  const isTablet = width > 768;

  const { data: fixtures, loading, execute: fetchFixtures } = useFetch(
    () => MatchService.getSeriesMatches(seriesId),
    [seriesId]
  );

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchFixtures();
    setRefreshing(false);
  }, [fetchFixtures]);

  if (loading && !fixtures) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator size="small" color={theme.primary} />
      </View>
    );
  }

  return (
    <FlatList
      data={fixtures || []}
      keyExtractor={item => item.id || item._id}
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={[styles.tabContentPadding, isTablet && styles.gridContainer]}
      numColumns={isTablet ? 2 : 1}
      key={isTablet ? 'tablet' : 'phone'}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.primary}
        />
      }
      ListEmptyComponent={
        <View style={{ padding: 40, alignItems: 'center' }}>
          <ThemedText color="textSecondary">No fixtures found for this series</ThemedText>
        </View>
      }
      renderItem={({ item }) => (
        <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate('MatchDetails', { matchId: item.id || item._id })}>
          <Card style={[isTablet ? [styles.gridItem2Cols, styles.mb] : styles.mb]}>
            <View style={[styles.row, { justifyContent: 'space-between', marginBottom: spacing.sm }]}>
              <ThemedText variant="small" color="textSecondary">
                {item.time ? new Date(item.time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''} • {item.venue}
              </ThemedText>
              <View style={[styles.badge, { backgroundColor: item.status === 'Completed' ? theme.success + '20' : theme.warning + '20' }]}>
                <ThemedText variant="small" weight="bold" style={{ color: item.status === 'Completed' ? theme.success : theme.warning }}>{item.status}</ThemedText>
              </View>
            </View>
            <View style={[styles.row, { alignItems: 'center', marginVertical: spacing.sm }]}>
              <ThemedText weight="bold" style={{ flex: 1, textAlign: 'right' }}>{item.team1?.code || 'T1'}</ThemedText>
              <ThemedText color="textSecondary" style={{ marginHorizontal: spacing.md }}>VS</ThemedText>
              <ThemedText weight="bold" style={{ flex: 1 }}>{item.team2?.code || 'T2'}</ThemedText>
            </View>
            {item.result ? (
              <ThemedText variant="small" color="primary" weight="bold" style={{ textAlign: 'center', marginTop: spacing.xs }}>{item.result}</ThemedText>
            ) : null}
          </Card>
        </TouchableOpacity>
      )}
    />
  );
};

const TeamsTab = () => {
  const { theme, isDark } = useTheme();
  const route = useRoute<any>();
  const { seriesId } = route.params;
  const { width } = useWindowDimensions();
  const isTablet = width > 768;

  const { data: teamsData, loading, execute: fetchTeams } = useFetch(
    () => SeriesService.getSeriesTeams(seriesId),
    [seriesId]
  );

  const [selectedTeam, setSelectedTeam] = React.useState<any | null>(null);
  const [roleFilter, setRoleFilter] = React.useState<'All' | 'Bat' | 'Bowl' | 'AR'>('All');

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchTeams();
    setRefreshing(false);
  }, [fetchTeams]);

  const uniqueTeams = React.useMemo(() => {
    if (!teamsData || !Array.isArray(teamsData)) return [];
    const seen = new Set();
    return teamsData.filter((item: any) => {
      const teamId = item.teamId?._id || item.teamId?.id || item.teamId;
      if (!teamId || seen.has(teamId)) return false;
      seen.add(teamId);
      return true;
    });
  }, [teamsData]);

  if (loading && !teamsData) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator size="small" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <FlatList
        data={uniqueTeams}

        keyExtractor={item => item._id || item.id}

        numColumns={isTablet ? 2 : 1}
        key={`teams-${isTablet ? 2 : 1}`}
        contentContainerStyle={styles.tabContentPadding}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
        ListEmptyComponent={
          <View style={{ padding: 40, alignItems: 'center' }}>
            <ThemedText color="textSecondary">No teams assigned to this series</ThemedText>
          </View>
        }
        renderItem={({ item }) => {
          const team = item.teamId || {};
          return (
            <TouchableOpacity 
              activeOpacity={0.8} 
              onPress={() => { 
                setSelectedTeam(item); 
                setRoleFilter('All'); 
              }}
            >
              <Card style={[styles.row, { alignItems: 'center', padding: spacing.md, marginBottom: spacing.md, ...(isTablet ? styles.gridItem2Cols : {}) }]}>
                <View style={[styles.iconContainer, { backgroundColor: theme.surface }]}>
                  <ThemedText style={{ fontSize: 32 }}>{team.flag || '🏏'}</ThemedText>
                </View>
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <ThemedText variant="subtitle" weight="bold">{team.name || 'Unknown Team'}</ThemedText>
                  <ThemedText variant="caption" color="textSecondary">
                    {team.code || 'N/A'}{item.groupName ? ` • ${item.groupName}` : ''}
                  </ThemedText>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.textLight} />
              </Card>
            </TouchableOpacity>
          );
        }}
      />

      {/* Bottom Sheet Modal */}
      <Modal visible={!!selectedTeam} transparent animationType="slide" onRequestClose={() => setSelectedTeam(null)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBg} onPress={() => setSelectedTeam(null)} />
          <View style={[styles.bottomSheet, { backgroundColor: theme.background }]}>
            <View style={[styles.row, { justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }]}>
              <View style={[styles.row, { alignItems: 'center' }]}>
                <ThemedText style={{ fontSize: 24, marginRight: spacing.sm }}>{selectedTeam?.teamId?.flag || '🏏'}</ThemedText>
                <ThemedText variant="title" weight="bold">{selectedTeam?.teamId?.name} Squad</ThemedText>
              </View>
              <TouchableOpacity onPress={() => setSelectedTeam(null)} style={{ padding: spacing.xs }}>
                <Ionicons name="close-circle" size={28} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <SquadModalContent 
                initialSquad={selectedTeam?.squadPlayers}
                seriesId={seriesId} 
                teamId={selectedTeam?.teamId?._id || selectedTeam?.teamId?.id} 
                format={selectedTeam?.format} 
                theme={theme} 
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const SquadModalContent = ({ initialSquad, seriesId, teamId, format, theme }: any) => {
    const navigation = useNavigation<any>();
    const { width } = useWindowDimensions();
    // If we have initialSquad, we use it. Otherwise we could fetch.
    // But getSeriesTeams already populates it, so it should be there.
    const { data: squadData, loading } = useFetch(
        () => !initialSquad ? SeriesService.getSeriesSquad(seriesId, teamId, format) : Promise.resolve(null),
        [seriesId, teamId, format, !!initialSquad]
    );

    const players = initialSquad || squadData?.squadPlayers || [];
    const [roleFilter, setRoleFilter] = React.useState<'All' | 'Bat' | 'Bowl' | 'AR' | 'WK'>('All');

    const filteredPlayers = React.useMemo(() => {
        if (!players) return [];
        if (roleFilter === 'All') return players;
        return players.filter((p: any) => {
            const role = (p.role || p.playerId?.role || '').toLowerCase();
            if (roleFilter === 'Bat') return role.includes('bat');
            if (roleFilter === 'Bowl') return role.includes('bowl');
            if (roleFilter === 'AR') return role.includes('all');
            if (roleFilter === 'WK') return role.includes('keeper');
            return false;
        });
    }, [players, roleFilter]);

    if (loading && !initialSquad) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="small" color={theme.primary} />
            </View>
        );
    }

    if (!players || players.length === 0) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
                <ThemedText color="textSecondary">No squad members found for this team.</ThemedText>
            </View>
        );
    }

    return (
        <View style={{ flex: 1 }}>
            {/* Role Filters */}
            <View style={[styles.row, { marginBottom: spacing.md }]}>
                {['All', 'Bat', 'Bowl', 'AR', 'WK'].map((role) => (
                    <TouchableOpacity
                        key={role}
                        onPress={() => setRoleFilter(role as any)}
                        style={[
                            styles.roleFilterTab,
                            { backgroundColor: role === roleFilter ? theme.primary : theme.surface, paddingHorizontal: spacing.sm, minWidth: 60, alignItems: 'center' }
                        ]}
                    >
                        <ThemedText
                            variant="small"
                            weight={role === roleFilter ? 'bold' : 'medium'}
                            style={{ color: role === roleFilter ? 'white' : theme.textSecondary }}
                        >
                            {role}
                        </ThemedText>
                    </TouchableOpacity>
                ))}
            </View>

            <FlatList
                data={filteredPlayers}
                keyExtractor={(item, index) => item.playerId?._id || item.playerId?.id || index.toString()}
                numColumns={2}
                columnWrapperStyle={styles.rowGap}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: spacing.xxl }}
                renderItem={({ item }) => {
                    const player = item.playerId || {};
                    return (
                        <TouchableOpacity 
                          activeOpacity={0.7} 
                          onPress={() => {
                            const pId = player._id || player.id || (item as any).id || (item as any)._id;
                            if (pId) navigation.navigate('PlayerProfile', { playerId: pId });
                          }}
                        >
                          <Card padding="xs" style={[styles.row, { width: (width - spacing.xl * 3) / 2, marginBottom: spacing.sm, alignItems: 'center' }]}>
                              <View style={[styles.avatarSmall, { backgroundColor: theme.border, overflow: 'hidden' }]}>
                                  {player.image ? (
                                      <Image source={{ uri: player.image }} style={{ width: '100%', height: '100%' }} />
                                  ) : (
                                      <Ionicons name="person" size={20} color={theme.textLight} />
                                  )}
                              </View>
                              <View style={{ flex: 1, marginLeft: spacing.sm }}>
                                  <View style={styles.row}>
                                      <ThemedText variant="small" weight="bold" numberOfLines={1} style={{ flex: 1 }}>{player.name || player.fullName || 'Unknown'}</ThemedText>
                                      {item.isCaptain && <View style={[styles.miniBadge, { backgroundColor: theme.primary }]}><ThemedText variant="caption" color="white" style={{ fontSize: 8 }}>C</ThemedText></View>}
                                      {item.isWicketKeeper && <View style={[styles.miniBadge, { backgroundColor: theme.secondary }]}><ThemedText variant="caption" color="white" style={{ fontSize: 8 }}>WK</ThemedText></View>}
                                  </View>
                                  <ThemedText variant="caption" color="textSecondary" numberOfLines={1}>{item.role || player.role || 'Player'}</ThemedText>
                              </View>
                          </Card>
                        </TouchableOpacity>
                    );
                }}
            />
        </View>
    );
};

const StatsTab = () => {
  const { theme, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const route = useRoute<any>();
  const { seriesId } = route.params;
  const [category, setCategory] = React.useState<'Batting' | 'Bowling' | 'Fielding'>('Batting');
  const isTablet = width > 768;

  const { data: leadersData, loading, execute } = useFetch(
    () => SeriesService.getSeriesLeaders(seriesId),
    [seriesId]
  );

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await execute();
    setRefreshing(false);
  };

  React.useEffect(() => {
    if (leadersData) {
      console.log('[StatsTab] Received real data:', {
        hasBatting: !!leadersData.Batting?.length,
        hasBowling: !!leadersData.Bowling?.length,
        count: leadersData.Batting?.length || 0
      });
    }
  }, [leadersData]);

  const stats = (leadersData && (leadersData[category]?.length > 0)) 
    ? leadersData[category] 
    : [];

  if (loading && !leadersData) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator size="small" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Category Selector */}
      <View style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: theme.borderLight }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
          {['Batting', 'Bowling', 'Fielding'].map((cat: any) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setCategory(cat)}
              style={[
                styles.roleFilterTab,
                { backgroundColor: cat === category ? theme.primary : theme.surface, paddingHorizontal: spacing.md }
              ]}
            >
              <ThemedText
                variant="small"
                weight={cat === category ? 'bold' : 'medium'}
                style={{ color: cat === category ? 'white' : theme.textSecondary }}
              >
                {cat}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {stats.length > 0 ? (
        <FlatList
          data={stats}
          keyExtractor={item => item.id}
          numColumns={isTablet ? 2 : 1}
          key={`stats-${category}-${isTablet ? 2 : 1}`}
          contentContainerStyle={[styles.tabContentPadding, { paddingBottom: 40 }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.primary}
            />
          }
          renderItem={({ item, index }) => (
            <StatLeaderCard item={item} rank={index + 1} theme={theme} isTablet={isTablet} />
          )}
          columnWrapperStyle={isTablet && styles.rowGap}
        />
      ) : (
        <ScrollView
          contentContainerStyle={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
          }
        >
          <View style={[styles.iconContainer, { backgroundColor: theme.surface, marginBottom: spacing.md }]}>
            <Ionicons name="stats-chart" size={32} color={theme.textLight} />
          </View>
          <ThemedText variant="subtitle" weight="bold" style={{ marginBottom: spacing.xs }}>No {category} Stats Yet</ThemedText>
          <ThemedText variant="body" color="textSecondary" style={{ textAlign: 'center' }}>
            Statistics are updated in real-time as matches are played in this series.
          </ThemedText>
        </ScrollView>
      )}
    </View>
  );
};

const StatLeaderCard = ({ item, rank, theme, isTablet }: any) => {
  const isTop = rank === 1;
  const navigation = useNavigation<any>();
  return (
    <TouchableOpacity 
      activeOpacity={0.8} 
      onPress={() => {
        const pId = item.playerId?._id || item.playerId?.id || item.playerId || item.id || item._id;
        if (pId) navigation.navigate('PlayerProfile', { playerId: pId });
      }}
    >
      <Card style={[
        isTablet ? styles.gridItem2Cols : styles.mb,
        { 
          padding: isTop ? spacing.lg : spacing.md, 
          borderLeftWidth: 4, 
          borderLeftColor: isTop ? theme.primary : 'transparent',
          elevation: isTop ? 4 : 1,
          backgroundColor: isTop ? theme.card : theme.surface
        }
      ]}>
        <View style={[styles.row, { alignItems: 'center' }]}>
          <View style={{ position: 'relative' }}>
            <Image 
              source={{ uri: item.image }} 
              style={isTop ? styles.avatarLarge : styles.avatarMedium} 
            />
            <View style={[
              styles.rankBadgeMini, 
              { backgroundColor: isTop ? theme.primary : theme.textSecondary }
            ]}>
              <ThemedText style={{ fontSize: 10, color: 'white', fontWeight: 'bold' }}>#{rank}</ThemedText>
            </View>
          </View>

          <View style={{ flex: 1, marginLeft: spacing.lg }}>
            <View style={[styles.row, { justifyContent: 'space-between', alignItems: 'flex-start' }]}>
              <View>
                <ThemedText variant="caption" color="textSecondary" weight="bold" style={{ textTransform: 'uppercase', marginBottom: 2 }}>
                  {item.title}
                </ThemedText>
                <ThemedText variant={isTop ? "subtitle" : "body"} weight="bold">{item.player}</ThemedText>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <ThemedText style={{ fontSize: isTop ? 22 : 18, fontWeight: '800', color: theme.primary }}>{item.value}</ThemedText>
                <ThemedText variant="caption" color="textLight">{item.metric}</ThemedText>
              </View>
            </View>
            
            <View style={[styles.row, { alignItems: 'center', marginTop: 4 }]}>
              <ThemedText style={{ fontSize: 14, marginRight: 4 }}>{item.flag}</ThemedText>
              <ThemedText variant="caption" color="textLight">{item.team}</ThemedText>
              
              {/* Simple Progress Bar */}
              <View style={{ flex: 1, height: 4, backgroundColor: theme.borderLight, borderRadius: 2, marginLeft: spacing.md, overflow: 'hidden' }}>
                <View style={{ width: `${Math.max(100 - (rank - 1) * 15, 20)}%`, height: '100%', backgroundColor: theme.primary + '80' }} />
              </View>
            </View>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const VenuesTab = () => {
  const navigation = useNavigation<any>();
  const { theme, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const isTablet = width > 768;
  const route = useRoute<any>();
  const { seriesId } = route.params;

  const { data: venuesData, loading: venuesLoading, execute: fetchVenues } = useFetch(
    () => SeriesService.getSeriesVenues(seriesId),
    [seriesId]
  );

  const { data: matchesData, loading: matchesLoading } = useFetch(
    () => MatchService.getSeriesMatches(seriesId),
    [seriesId]
  );

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchVenues();
    setRefreshing(false);
  }, [fetchVenues]);

  const combinedVenues = React.useMemo(() => {
    const venues = new Map();
    
    // Add explicit series venues first
    if (Array.isArray(venuesData)) {
      venuesData.forEach((sv: any) => {
        const v = sv.venueId;
        if (v && (v._id || v.id)) {
          venues.set(v._id || v.id, v);
        }
      });
    }

    // Fallback/Supplement from matches
    if (Array.isArray(matchesData)) {
      matchesData.forEach((m: any) => {
        const v = m.venueId;
        if (v && (v._id || v.id)) {
          if (!venues.has(v._id || v.id)) {
            venues.set(v._id || v.id, v);
          }
        }
      });
    }

    return Array.from(venues.values());
  }, [venuesData, matchesData]);

  if ((venuesLoading || matchesLoading) && combinedVenues.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator size="small" color={theme.primary} />
      </View>
    );
  }

  return (
    <FlatList
      data={combinedVenues}
      keyExtractor={item => item._id || item.id}
      numColumns={isTablet ? 2 : 1}
      key={`venues-${isTablet ? 2 : 1}`}
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.tabContentPadding}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.primary}
        />
      }
      ListEmptyComponent={
        <View style={{ padding: 40, alignItems: 'center' }}>
          <ThemedText color="textSecondary">No venues found for this series</ThemedText>
        </View>
      }
      renderItem={({ item: venue }) => {
        return (
          <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate('VenueDetail', { venueId: venue._id || venue.id })}>
            <Card style={[isTablet ? styles.gridItem2Cols : styles.mb, { padding: 0, overflow: 'hidden', elevation: 2 }]}>
              <View style={{ position: 'relative' }}>
                <Image 
                  source={{ uri: venue.image || 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=400&h=300&auto=format&fit=crop' }} 
                  style={[styles.coverImage, { height: 140 }]} 
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.7)']}
                  style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 60 }}
                />
                <View style={{ position: 'absolute', bottom: spacing.sm, left: spacing.md, right: spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <View style={{ flex: 1 }}>
                    <ThemedText variant="subtitle" weight="bold" color="white" numberOfLines={1}>{venue.name || 'Unknown Venue'}</ThemedText>
                    <View style={[styles.row, { alignItems: 'center' }]}>
                      <Ionicons name="location" size={12} color="rgba(255,255,255,0.8)" />
                      <ThemedText variant="caption" style={{ color: 'rgba(255,255,255,0.8)', marginLeft: 4 }}>{venue.city || venue.country || 'N/A'}</ThemedText>
                    </View>
                  </View>
                  <View style={{ backgroundColor: theme.primary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginLeft: spacing.sm }}>
                    <ThemedText style={{ fontSize: 10, color: 'white', fontWeight: 'bold' }}>{Math.floor(Math.random() * 3) + 1} Matches</ThemedText>
                  </View>
                </View>
              </View>
              
              <View style={{ padding: spacing.md, flexDirection: 'row', justifyContent: 'space-around', borderTopWidth: 1, borderTopColor: theme.borderLight }}>
                <View style={{ alignItems: 'center' }}>
                  <ThemedText variant="caption" color="textLight">Avg 1st Inn</ThemedText>
                  <ThemedText weight="bold" style={{ color: '#10b981' }}>{280 + Math.floor(Math.random() * 40)}</ThemedText>
                </View>
                <View style={{ width: 1, height: '100%', backgroundColor: theme.borderLight }} />
                <View style={{ alignItems: 'center' }}>
                  <ThemedText variant="caption" color="textLight">Avg 2nd Inn</ThemedText>
                  <ThemedText weight="bold" style={{ color: '#3b82f6' }}>{240 + Math.floor(Math.random() * 40)}</ThemedText>
                </View>
                <View style={{ width: 1, height: '100%', backgroundColor: theme.borderLight }} />
                <View style={{ alignItems: 'center' }}>
                  <ThemedText variant="caption" color="textLight">Capacity</ThemedText>
                  <ThemedText weight="bold" color="textSecondary">{venue.capacity || 'N/A'}</ThemedText>
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        );
      }}
      columnWrapperStyle={isTablet && styles.rowGap}
    />
  );
};

const NewsTab = () => {
  const { theme, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const navigation = useNavigation<any>();
  const isTablet = width > 768;

  const news: any[] = []; // Production: replace with real fetch logic

  return (
    <FlatList
      data={news}
      keyExtractor={item => item.id}
      numColumns={isTablet ? 2 : 1}
      key={`news-${isTablet ? 2 : 1}`}
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.tabContentPadding}
      ListEmptyComponent={
        <View style={{ flex: 1, padding: 40, alignItems: 'center', justifyContent: 'center', height: 400 }}>
          <View style={[styles.iconContainer, { backgroundColor: theme.surface, marginBottom: spacing.md }]}>
            <Ionicons name="newspaper-outline" size={32} color={theme.textLight} />
          </View>
          <ThemedText variant="subtitle" weight="bold" style={{ marginBottom: spacing.xs }}>No News Updates</ThemedText>
          <ThemedText variant="body" color="textSecondary" style={{ textAlign: 'center' }}>
            Latest news and articles for this series will appear here as the tournament progresses.
          </ThemedText>
        </View>
      }
      renderItem={({ item }) => (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate('NewsDetail', { newsId: item.id })}
          style={[isTablet ? styles.gridItem2Cols : styles.mb, styles.row, { marginBottom: isTablet ? 0 : spacing.md }]}
        >
          <Card padding="xs" style={styles.row}>
            <Image source={{ uri: item.image }} style={styles.thumbnailRect} />
            <View style={{ flex: 1, padding: spacing.md, justifyContent: 'space-between' }}>
              <ThemedText weight="bold" numberOfLines={2}>{item.title}</ThemedText>
              <ThemedText variant="small" color="textSecondary">{item.time}</ThemedText>
            </View>
          </Card>
        </TouchableOpacity>
      )}
      columnWrapperStyle={isTablet && styles.rowGap}
      ItemSeparatorComponent={() => isTablet ? <View style={{ height: spacing.md }} /> : null}
    />
  );
};

const VideosTab = () => {
  const { theme, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const isTablet = width > 768;

  const videos: any[] = [];
  return (
    <FlatList
      data={videos}
      keyExtractor={item => item.id}
      numColumns={isTablet ? 3 : 2}
      key={`videos-${isTablet ? 3 : 2}`}
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.tabContentPadding}
      columnWrapperStyle={styles.rowGap}
      ListEmptyComponent={
        <View style={{ flex: 1, padding: 40, alignItems: 'center', justifyContent: 'center', height: 400 }}>
          <View style={[styles.iconContainer, { backgroundColor: theme.surface, marginBottom: spacing.md }]}>
            <Ionicons name="play-circle-outline" size={32} color={theme.textLight} />
          </View>
          <ThemedText variant="subtitle" weight="bold" style={{ marginBottom: spacing.xs }}>No Videos Yet</ThemedText>
          <ThemedText variant="body" color="textSecondary" style={{ textAlign: 'center' }}>
            Match highlights and press conferences will be available soon.
          </ThemedText>
        </View>
      }
      renderItem={({ item }) => (
        <Card padding="xs" style={[{ flex: 1, marginBottom: spacing.md }]}>
          <View style={styles.videoImgContainer}>
            <Image source={{ uri: item.image }} style={styles.videoImg} />
            <View style={styles.videoOverlay}>
              <Ionicons name="play-circle" size={40} color="white" />
            </View>
            <View style={styles.durationBadge}>
              <ThemedText variant="small" color="white" weight="bold">{item.duration}</ThemedText>
            </View>
          </View>
          <View style={{ padding: spacing.sm }}>
            <ThemedText variant="small" weight="bold" numberOfLines={2}>{item.title}</ThemedText>
          </View>
        </Card>
      )}
    />
  );
};

const POINTS_GROUPS = ['Group A', 'Group B', 'Super 8', 'Group 1'];

const PointsTab = () => {
  const navigation = useNavigation<any>();
  const { theme, isDark } = useTheme();
  const route = useRoute<any>();
  const { seriesId } = route.params;

  const { data: pointsTable, loading, execute: fetchPoints } = useFetch(
    () => MatchService.getPointsTable(seriesId),
    [seriesId]
  );

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchPoints();
    setRefreshing(false);
  }, [fetchPoints]);

  const groups = React.useMemo(() => {
    if (!pointsTable || !Array.isArray(pointsTable)) return {};
    return pointsTable.reduce((acc: any, entry: any) => {
      const gName = entry.groupName || 'Standings';
      if (!acc[gName]) acc[gName] = [];
      acc[gName].push(entry);
      return acc;
    }, {});
  }, [pointsTable]);

  const groupNames = Object.keys(groups);
  const [selectedGroup, setSelectedGroup] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (groupNames.length > 0 && !selectedGroup) {
      setSelectedGroup(groupNames[0]);
    }
  }, [groupNames]);

  if (loading && (!pointsTable || pointsTable.length === 0)) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator size="small" color={theme.primary} />
      </View>
    );
  }

  const currentData = selectedGroup ? groups[selectedGroup] : [];

  return (
    <ScrollView 
      style={[styles.tabContent, { backgroundColor: theme.background }]} 
      contentContainerStyle={styles.tabContentPadding}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.primary}
        />
      }
    >
      {/* Group Selector */}
      {groupNames.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
          {groupNames.map((group) => (
            <TouchableOpacity
              key={group}
              onPress={() => setSelectedGroup(group)}
              style={[
                { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 20, marginRight: spacing.sm },
                { backgroundColor: selectedGroup === group ? theme.primary : theme.surface }
              ]}
            >
              <ThemedText
                variant="small"
                weight={selectedGroup === group ? 'bold' : 'medium'}
                style={{ color: selectedGroup === group ? 'white' : theme.textSecondary }}
              >
                {group}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {currentData.length > 0 ? (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          {/* Table Header */}
          <View style={[styles.row, styles.tableHeader, { backgroundColor: theme.surface, borderBottomColor: theme.borderLight }]}>
            <ThemedText variant="small" weight="bold" color="textSecondary" style={{ flex: 2.5 }}>Team</ThemedText>
            <ThemedText variant="small" weight="bold" color="textSecondary" style={styles.tableCol}>P</ThemedText>
            <ThemedText variant="small" weight="bold" color="textSecondary" style={styles.tableCol}>W</ThemedText>
            <ThemedText variant="small" weight="bold" color="textSecondary" style={styles.tableCol}>L</ThemedText>
            <ThemedText variant="small" weight="bold" color="textSecondary" style={styles.tableCol}>NR</ThemedText>
            <ThemedText variant="small" weight="bold" color="textSecondary" style={[styles.tableCol, { flex: 1.5 }]}>NRR</ThemedText>
            <ThemedText variant="small" weight="bold" color="textSecondary" style={styles.tableCol}>Pts</ThemedText>
          </View>

          {/* Table Rows */}
          {currentData.sort((a: any, b: any) => a.position - b.position).map((entry: any, index: number) => {
            const team = entry.teamId || {};
            return (
              <View key={entry._id || index} style={[
                styles.row,
                styles.tableRow,
                { borderBottomColor: theme.borderLight },
                entry.qualify && { backgroundColor: theme.primary + '0A' }
              ]}>
                <View style={[styles.row, { flex: 2.5, alignItems: 'center' }]}>
                  {entry.qualify && <View style={[styles.qualifierIndicator, { backgroundColor: theme.primary }]} />}
                  <View style={{ width: 14, alignItems: 'center', marginRight: spacing.xs, marginLeft: entry.qualify ? spacing.xs : spacing.sm }}>
                    <ThemedText variant="caption" weight="bold" style={{ color: entry.qualify ? theme.success : theme.textLight }}>
                      {entry.qualify ? 'Q' : index + 1}
                    </ThemedText>
                  </View>
                  <ThemedText weight="bold" numberOfLines={1}>{team.code || team.shortName || '???'}</ThemedText>
                </View>
                <ThemedText style={styles.tableCol}>{entry.played}</ThemedText>
                <ThemedText style={styles.tableCol}>{entry.won}</ThemedText>
                <ThemedText style={styles.tableCol}>{entry.lost}</ThemedText>
                <ThemedText style={styles.tableCol}>{entry.noResult || 0}</ThemedText>
                <ThemedText variant="small" style={[styles.tableCol, { flex: 1.5 }]}>
                  {entry.netRunRate > 0 ? '+' : ''}{entry.netRunRate?.toFixed(3) || '0.000'}
                </ThemedText>
                <ThemedText weight="bold" color="primary" style={styles.tableCol}>{entry.points}</ThemedText>
              </View>
            );
          })}
        </Card>
      ) : (
        <View style={{ padding: 40, alignItems: 'center' }}>
          <ThemedText color="textSecondary">No points table data available</ThemedText>
        </View>
      )}

      {currentData.some((e: any) => e.qualify) && (
        <View style={{ marginTop: spacing.md, flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: theme.primary, marginRight: spacing.sm }} />
          <ThemedText variant="caption" color="textSecondary">Highlighted teams qualify for next round</ThemedText>
        </View>
      )}
    </ScrollView>
  );
};


// --- Main Navigator ---

export const SeriesDetailScreen: React.FC = () => {
  const { theme, isDark } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { seriesId } = route.params;

  const { data: series, loading } = useFetch(
    () => SeriesService.getSeriesDetails(seriesId),
    [seriesId]
  );

  if (loading && !series) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient colors={isDark ? [theme.surface, theme.background] : [theme.primary, theme.primaryDark]} style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
          </View>

          <View style={styles.headerContent}>
            <View style={styles.imageContainer}>
              <ThemedText style={styles.emoji}>{series?.image || '🏆'}</ThemedText>
            </View>
            <View style={styles.headerInfo}>
              <ThemedText variant="title" color="white" weight="bold">{series?.name || 'Loading...'}</ThemedText>
              <ThemedText variant="caption" color="white" style={{ opacity: 0.8 }}>
                {series?.startDate ? new Date(series.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''} - 
                {series?.endDate ? new Date(series.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''} 
                {series?.totalMatches ? ` • ${series.totalMatches} Matches` : ''}
              </ThemedText>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <TopTab.Navigator
        screenOptions={{
          tabBarActiveTintColor: theme.primary,
          tabBarInactiveTintColor: theme.textSecondary,
          tabBarIndicatorStyle: { backgroundColor: theme.primary, height: 3 },
          tabBarStyle: {
            backgroundColor: theme.surface,
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: theme.borderLight,
          },
          tabBarLabelStyle: { fontWeight: 'bold', textTransform: 'capitalize', fontSize: 13 },
          tabBarAllowFontScaling: false,
          tabBarScrollEnabled: true,
          lazy: true,
        }}
      >
        <TopTab.Screen name="Overview" component={OverviewTab} initialParams={{ seriesId }} />
        {series?.hasPoints && <TopTab.Screen name="Points Table" component={PointsTab} initialParams={{ seriesId }} />}
        {series?.hasFixtures && <TopTab.Screen name="Fixtures" component={FixturesTab} initialParams={{ seriesId }} />}
        {series?.hasSquad && <TopTab.Screen name="Teams" component={TeamsTab} initialParams={{ seriesId }} />}
        <TopTab.Screen name="Stats" component={StatsTab} initialParams={{ seriesId }} />
        <TopTab.Screen name="Venues" component={VenuesTab} initialParams={{ seriesId }} />
        <TopTab.Screen name="News" component={NewsTab} initialParams={{ seriesId }} />
        <TopTab.Screen name="Videos" component={VideosTab} initialParams={{ seriesId }} />
      </TopTab.Navigator>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingBottom: 20, paddingHorizontal: spacing.md, paddingTop: spacing.md },
  headerTop: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  backBtn: { padding: spacing.xs },
  headerContent: { flexDirection: 'row', alignItems: 'center' },
  imageContainer: { width: 64, height: 64, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
  emoji: { fontSize: 32 },
  headerInfo: { flex: 1, gap: 4 },
  tabContent: { flex: 1 },
  tabContentPadding: { padding: spacing.md },
  row: { flexDirection: 'row' },
  mb: { marginBottom: spacing.md },
  mbSm: { marginBottom: spacing.sm },
  rowGap: { gap: spacing.md },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridItem2Cols: { flex: 1, minWidth: '45%' },
  teamBadge: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: borderRadius.md },
  avatarSmall: { width: 32, height: 32, borderRadius: 16 },
  avatarMedium: { width: 44, height: 44, borderRadius: 22 },
  iconContainer: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  coverImage: { width: '100%', height: 160, borderRadius: borderRadius.md },
  thumbnailRect: { width: 100, height: '100%', borderRadius: borderRadius.sm, minHeight: 80 },
  videoImgContainer: { width: '100%', height: 120, borderRadius: borderRadius.md, overflow: 'hidden' },
  videoImg: { width: '100%', height: '100%' },
  videoOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  durationBadge: { position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },

  // Custom Styles for Overview Tab Redesign
  statHighlightCard: { width: 160, marginRight: spacing.md },
  bracketContainer: { flexDirection: 'row', alignItems: 'stretch', justifyContent: 'center' },
  bracketColumn: { flex: 3 },
  bracketCard: { marginBottom: spacing.sm },
  separator: { height: 1, width: '100%', marginVertical: spacing.xs },
  bracketSpacing: { height: spacing.lg },

  // Connector styling
  connectorColumn: { flex: 1, justifyContent: 'center' },
  connectorLineTop: { flex: 1, borderRightWidth: 2, borderTopWidth: 2, borderTopRightRadius: 8, marginTop: 42, marginRight: '50%' },
  connectorLineHorizontal: { height: 2, width: '50%', alignSelf: 'flex-end', position: 'absolute' },
  connectorLineBottom: { flex: 1, borderRightWidth: 2, borderBottomWidth: 2, borderBottomRightRadius: 8, marginBottom: 42, marginRight: '50%' },

  // Custom Styles for Teams Tab Bottom Sheet
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBg: { flex: 1 },
  bottomSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, height: '80%' },
  roleFilterTab: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 20, marginRight: spacing.sm },

  // Custom Styles for Points Table
  tableHeader: { paddingVertical: spacing.sm, paddingHorizontal: spacing.sm, borderBottomWidth: 1 },
  tableRow: { paddingVertical: spacing.sm, paddingHorizontal: spacing.sm, borderBottomWidth: 1, alignItems: 'center' },
  tableCol: { flex: 1, textAlign: 'center' },
  qualifierIndicator: { width: 4, height: 24, borderTopRightRadius: 4, borderBottomRightRadius: 4, position: 'absolute', left: 0 },
  avatarLarge: { width: 64, height: 64, borderRadius: 32 },
  rankBadgeMini: { 
    position: 'absolute', 
    bottom: -4, 
    right: -4, 
    width: 22, 
    height: 22, 
    borderRadius: 11, 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff'
  },
  miniBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
});
