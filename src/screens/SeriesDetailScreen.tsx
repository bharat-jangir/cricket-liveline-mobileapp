import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, FlatList, Image, useWindowDimensions, SafeAreaView, Modal, Pressable } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { spacing, borderRadius } from '../theme';
import { Text as ThemedText } from '../components/ui/Text';
import { Card } from '../components/ui/Card';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

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

const MOCK_STATS = [
  { id: '1', title: 'Most Runs', player: 'Virat Kohli', value: '765', team: 'IND', flag: '🇮🇳', image: 'https://i.pravatar.cc/100?img=12' },
  { id: '2', title: 'Most Wickets', player: 'Mohammad Shami', value: '24', team: 'IND', flag: '🇮🇳', image: 'https://i.pravatar.cc/100?img=16' },
  { id: '3', title: 'Highest Score', player: 'Glenn Maxwell', value: '201*', team: 'AUS', flag: '🇦🇺', image: 'https://i.pravatar.cc/100?img=19' },
  { id: '4', title: 'Best Figures', player: 'Mohammad Shami', value: '7/57', team: 'IND', flag: '🇮🇳', image: 'https://i.pravatar.cc/100?img=16' },
  { id: '5', title: 'Most Sixes', player: 'Rohit Sharma', value: '31', team: 'IND', flag: '🇮🇳', image: 'https://i.pravatar.cc/100?img=11' },
];

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
  const { theme, isDark } = useTheme();

  return (
    <ScrollView style={styles.tabContent} contentContainerStyle={styles.tabContentPadding}>

      {/* Top Performers Section */}
      <View style={[styles.row, styles.mb, { alignItems: 'center' }]}>
        <ThemedText variant="subtitle" weight="bold" style={{ flex: 1 }}>Top Performers</ThemedText>
        <TouchableOpacity><ThemedText color="primary" weight="bold">View All</ThemedText></TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mb}>
        {/* Most Runs */}
        <Card style={[styles.statHighlightCard, { backgroundColor: theme.primary + '11', borderColor: theme.primary + '33', borderWidth: 1 }]}>
          <ThemedText variant="small" color="textSecondary" weight="bold">Most Runs</ThemedText>
          <View style={[styles.row, { alignItems: 'center', marginVertical: spacing.xs }]}>
            <Image source={{ uri: 'https://i.pravatar.cc/100?img=12' }} style={styles.avatarSmall} />
            <View style={{ marginLeft: spacing.xs }}>
              <ThemedText weight="bold">V. Kohli</ThemedText>
              <ThemedText variant="small" color="textSecondary">IND</ThemedText>
            </View>
          </View>
          <ThemedText variant="title" color="primary" weight="bold">765</ThemedText>
        </Card>

        {/* Most Wickets */}
        <Card style={[styles.statHighlightCard, { backgroundColor: theme.secondary + '11', borderColor: theme.secondary + '33', borderWidth: 1 }]}>
          <ThemedText variant="small" color="textSecondary" weight="bold">Most Wickets</ThemedText>
          <View style={[styles.row, { alignItems: 'center', marginVertical: spacing.xs }]}>
            <Image source={{ uri: 'https://i.pravatar.cc/100?img=13' }} style={styles.avatarSmall} />
            <View style={{ marginLeft: spacing.xs }}>
              <ThemedText weight="bold">M. Shami</ThemedText>
              <ThemedText variant="small" color="textSecondary">IND</ThemedText>
            </View>
          </View>
          <ThemedText variant="title" style={{ color: theme.secondary }} weight="bold">24</ThemedText>
        </Card>

        {/* Best Figures */}
        <Card style={[styles.statHighlightCard, { backgroundColor: theme.primary + '11', borderColor: theme.primary + '33', borderWidth: 1 }]}>
          <ThemedText variant="small" color="textSecondary" weight="bold">Best Figures</ThemedText>
          <View style={[styles.row, { alignItems: 'center', marginVertical: spacing.xs }]}>
            <Image source={{ uri: 'https://i.pravatar.cc/100?img=13' }} style={styles.avatarSmall} />
            <View style={{ marginLeft: spacing.xs }}>
              <ThemedText weight="bold">M. Shami</ThemedText>
              <ThemedText variant="small" color="textSecondary">IND</ThemedText>
            </View>
          </View>
          <ThemedText variant="title" color="primary" weight="bold">7/57</ThemedText>
        </Card>

        {/* Highest Score */}
        <Card style={[styles.statHighlightCard, { backgroundColor: theme.secondary + '11', borderColor: theme.secondary + '33', borderWidth: 1 }]}>
          <ThemedText variant="small" color="textSecondary" weight="bold">Highest Score</ThemedText>
          <View style={[styles.row, { alignItems: 'center', marginVertical: spacing.xs }]}>
            <Image source={{ uri: 'https://i.pravatar.cc/100?img=14' }} style={styles.avatarSmall} />
            <View style={{ marginLeft: spacing.xs }}>
              <ThemedText weight="bold">G. Maxwell</ThemedText>
              <ThemedText variant="small" color="textSecondary">AUS</ThemedText>
            </View>
          </View>
          <ThemedText variant="title" style={{ color: theme.secondary }} weight="bold">201*</ThemedText>
        </Card>

        {/* Most Sixes */}
        <Card style={[styles.statHighlightCard, { backgroundColor: theme.primary + '11', borderColor: theme.primary + '33', borderWidth: 1 }]}>
          <ThemedText variant="small" color="textSecondary" weight="bold">Most Sixes</ThemedText>
          <View style={[styles.row, { alignItems: 'center', marginVertical: spacing.xs }]}>
            <Image source={{ uri: 'https://i.pravatar.cc/100?img=11' }} style={styles.avatarSmall} />
            <View style={{ marginLeft: spacing.xs }}>
              <ThemedText weight="bold">R. Sharma</ThemedText>
              <ThemedText variant="small" color="textSecondary">IND</ThemedText>
            </View>
          </View>
          <ThemedText variant="title" color="primary" weight="bold">31</ThemedText>
        </Card>
      </ScrollView>

      {/* Playoff Bracket Section */}
      <ThemedText variant="subtitle" weight="bold" style={styles.mb}>Playoff Bracket</ThemedText>

      <View style={styles.bracketContainer}>
        {/* Semi Finals Column */}
        <View style={styles.bracketColumn}>
          <ThemedText variant="small" weight="bold" color="textSecondary" style={styles.mbSm}>Semi-Finals</ThemedText>

          <Card padding="xs" style={styles.bracketCard}>
            <View style={[styles.row, { justifyContent: 'space-between' }]}>
              <ThemedText weight="bold">IND 🇮🇳</ThemedText>
              <ThemedText weight="bold">397/4</ThemedText>
            </View>
            <View style={[styles.separator, { backgroundColor: theme.borderLight }]} />
            <View style={[styles.row, { justifyContent: 'space-between' }]}>
              <ThemedText>NZ 🇳🇿</ThemedText>
              <ThemedText>327</ThemedText>
            </View>
          </Card>

          <View style={styles.bracketSpacing} />

          <Card padding="xs" style={styles.bracketCard}>
            <View style={[styles.row, { justifyContent: 'space-between' }]}>
              <ThemedText>SA 🇿🇦</ThemedText>
              <ThemedText>212</ThemedText>
            </View>
            <View style={[styles.separator, { backgroundColor: theme.borderLight }]} />
            <View style={[styles.row, { justifyContent: 'space-between' }]}>
              <ThemedText weight="bold">AUS 🇦🇺</ThemedText>
              <ThemedText weight="bold">215/7</ThemedText>
            </View>
          </Card>
        </View>

        {/* Connectors */}
        <View style={styles.connectorColumn}>
          <View style={[styles.connectorLineTop, { borderColor: theme.border }]} />
          <View style={[styles.connectorLineHorizontal, { backgroundColor: theme.border }]} />
          <View style={[styles.connectorLineBottom, { borderColor: theme.border }]} />
        </View>

        {/* Final Column */}
        <View style={styles.bracketColumn}>
          <ThemedText variant="small" weight="bold" color="textSecondary" style={styles.mbSm}>Final</ThemedText>
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <Card padding="sm" style={[styles.bracketCard, { borderColor: theme.primary, borderWidth: 2 }]}>
              <View style={[styles.row, { justifyContent: 'space-between' }]}>
                <ThemedText>IND 🇮🇳</ThemedText>
                <ThemedText>240</ThemedText>
              </View>
              <View style={[styles.separator, { backgroundColor: theme.borderLight }]} />
              <View style={[styles.row, { justifyContent: 'space-between' }]}>
                <ThemedText weight="bold">AUS 🇦🇺</ThemedText>
                <ThemedText weight="bold" color="primary">241/4</ThemedText>
              </View>
            </Card>
          </View>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const FixturesTab = () => {
  const { theme, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const isTablet = width > 768;

  return (
    <FlatList
      data={MOCK_FIXTURES}
      keyExtractor={item => item.id}
      contentContainerStyle={[styles.tabContentPadding, isTablet && styles.gridContainer]}
      numColumns={isTablet ? 2 : 1}
      key={isTablet ? 'tablet' : 'phone'}
      renderItem={({ item }) => (
        <Card style={[isTablet ? [styles.gridItem2Cols, styles.mb] : styles.mb]}>
          <View style={[styles.row, { justifyContent: 'space-between', marginBottom: spacing.sm }]}>
            <ThemedText variant="small" color="textSecondary">{item.date} • {item.venue}</ThemedText>
            <View style={[styles.badge, { backgroundColor: item.status === 'Completed' ? theme.success + '20' : theme.warning + '20' }]}>
              <ThemedText variant="small" weight="bold" style={{ color: item.status === 'Completed' ? theme.success : theme.warning }}>{item.status}</ThemedText>
            </View>
          </View>
          <View style={[styles.row, { alignItems: 'center', marginVertical: spacing.sm }]}>
            <ThemedText weight="bold" style={{ flex: 1, textAlign: 'right' }}>{item.team1}</ThemedText>
            <ThemedText color="textSecondary" style={{ marginHorizontal: spacing.md }}>VS</ThemedText>
            <ThemedText weight="bold" style={{ flex: 1 }}>{item.team2}</ThemedText>
          </View>
          {item.result ? (
            <ThemedText variant="small" color="primary" weight="bold" style={{ textAlign: 'center', marginTop: spacing.xs }}>{item.result}</ThemedText>
          ) : null}
        </Card>
      )}
    />
  );
};

const TeamsTab = () => {
  const { theme, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const isTablet = width > 768;

  const [selectedTeam, setSelectedTeam] = React.useState<typeof MOCK_TEAMS[0] | null>(null);
  const [roleFilter, setRoleFilter] = React.useState<'All' | 'Bat' | 'Bowl' | 'AR'>('All');

  const roleCounts = React.useMemo(() => {
    if (!selectedTeam || !selectedTeam.players) return { All: 0, Bat: 0, Bowl: 0, AR: 0 };

    return selectedTeam.players.reduce((acc, player) => {
      acc.All += 1;
      if (player.role === 'Bat') acc.Bat += 1;
      if (player.role === 'Bowl') acc.Bowl += 1;
      if (player.role === 'AR') acc.AR += 1;
      return acc;
    }, { All: 0, Bat: 0, Bowl: 0, AR: 0 });
  }, [selectedTeam]);

  const filteredPlayers = React.useMemo(() => {
    if (!selectedTeam) return [];
    if (roleFilter === 'All') return selectedTeam.players || [];
    return (selectedTeam.players || []).filter(p => p.role === roleFilter);
  }, [selectedTeam, roleFilter]);

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={MOCK_TEAMS}
        keyExtractor={item => item.id}
        numColumns={isTablet ? 2 : 1}
        key={`teams-${isTablet ? 2 : 1}`}
        contentContainerStyle={styles.tabContentPadding}
        renderItem={({ item }) => (
          <TouchableOpacity activeOpacity={0.8} onPress={() => { setSelectedTeam(item); setRoleFilter('All'); }}>
            <Card style={[styles.row, { alignItems: 'center', padding: spacing.md, marginBottom: spacing.md, ...(isTablet ? styles.gridItem2Cols : {}) }]}>
              <View style={[styles.iconContainer, { backgroundColor: theme.surface }]}>
                <ThemedText style={{ fontSize: 32 }}>{item.flag}</ThemedText>
              </View>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <ThemedText variant="subtitle" weight="bold">{item.name}</ThemedText>
                <ThemedText variant="caption" color="textSecondary">{item.players?.length || 0} Players</ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.textLight} />
            </Card>
          </TouchableOpacity>
        )}
        columnWrapperStyle={isTablet && styles.rowGap}
      />

      {/* Bottom Sheet Modal */}
      <Modal visible={!!selectedTeam} transparent animationType="slide" onRequestClose={() => setSelectedTeam(null)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBg} onPress={() => setSelectedTeam(null)} />
          <View style={[styles.bottomSheet, { backgroundColor: theme.background }]}>

            {/* Sheet Header */}
            <View style={[styles.row, { justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }]}>
              <View style={[styles.row, { alignItems: 'center' }]}>
                <ThemedText style={{ fontSize: 24, marginRight: spacing.sm }}>{selectedTeam?.flag}</ThemedText>
                <ThemedText variant="title" weight="bold">{selectedTeam?.name} Squad</ThemedText>
              </View>
              <TouchableOpacity onPress={() => setSelectedTeam(null)} style={{ padding: spacing.xs }}>
                <Ionicons name="close-circle" size={28} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Role Filters */}
            <View style={[styles.row, { marginBottom: spacing.md }]}>
              {['All', 'Bat', 'Bowl', 'AR'].map((role) => (
                <TouchableOpacity
                  key={role}
                  onPress={() => setRoleFilter(role as any)}
                  style={[
                    styles.roleFilterTab,
                    { backgroundColor: role === roleFilter ? theme.primary : theme.surface }
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

            {/* Players Grid */}
            <FlatList
              data={filteredPlayers}
              keyExtractor={item => item.id}
              numColumns={2}
              columnWrapperStyle={styles.rowGap}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: spacing.xxl }}
              ListEmptyComponent={<ThemedText color="textSecondary" style={{ textAlign: 'center', marginTop: spacing.md }}>No players found.</ThemedText>}
              renderItem={({ item }) => (
                <Card style={[styles.row, { flex: 1, marginBottom: spacing.sm, padding: spacing.sm, alignItems: 'center', height: 60 }]}>
                  <Image source={{ uri: item.image }} style={[{ width: 36, height: 36, borderRadius: 18, marginRight: spacing.sm }]} />
                  <View style={{ flex: 1 }}>
                    <ThemedText variant="small" weight="bold" numberOfLines={1}>{item.name}</ThemedText>
                    <ThemedText variant="caption" color="textSecondary">{item.role}</ThemedText>
                  </View>
                </Card>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const StatsTab = () => {
  const { theme, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const isTablet = width > 768;

  return (
    <FlatList
      data={MOCK_STATS}
      keyExtractor={item => item.id}
      numColumns={isTablet ? 2 : 1}
      key={`stats-${isTablet ? 2 : 1}`}
      contentContainerStyle={styles.tabContentPadding}
      renderItem={({ item, index }) => (
        <Card style={[
          isTablet ? styles.gridItem2Cols : styles.mb,
          styles.row,
          { alignItems: 'center', justifyContent: 'space-between', marginBottom: isTablet ? 0 : spacing.md, padding: spacing.md }
        ]}>
          <View style={[styles.row, { flex: 1, alignItems: 'center' }]}>
            <View style={{ position: 'relative' }}>
              <Image source={{ uri: item.image }} style={styles.avatarMedium} />
              <View style={[styles.badge, { position: 'absolute', bottom: -5, right: -10, backgroundColor: theme.surface, paddingHorizontal: 4, paddingVertical: 1, borderWidth: 1, borderColor: theme.borderLight }]}>
                <ThemedText style={{ fontSize: 10 }}>#{index + 1}</ThemedText>
              </View>
            </View>

            <View style={{ flex: 1, marginLeft: spacing.lg }}>
              <ThemedText variant="small" color="textSecondary" weight="bold" style={{ textTransform: 'uppercase', marginBottom: 2 }}>{item.title}</ThemedText>
              <ThemedText variant="subtitle" weight="bold">{item.player}</ThemedText>
              <View style={[styles.row, { alignItems: 'center', marginTop: 2 }]}>
                <ThemedText style={{ fontSize: 14, marginRight: 4 }}>{item.flag}</ThemedText>
                <ThemedText variant="caption" color="textLight">{item.team}</ThemedText>
              </View>
            </View>
          </View>

          <ThemedText style={{ fontSize: 24, fontWeight: '800', color: theme.primary }}>{item.value}</ThemedText>
        </Card>
      )}
      columnWrapperStyle={isTablet && styles.rowGap}
      ItemSeparatorComponent={() => isTablet ? <View style={{ height: spacing.md }} /> : null}
    />
  );
};

const VenuesTab = () => {
  const navigation = useNavigation<any>();
  const { theme, isDark } = useTheme();

  return (
    <FlatList
      data={MOCK_VENUES}
      keyExtractor={item => item.id}
      numColumns={1}
      key={`venues-1`}
      contentContainerStyle={styles.tabContentPadding}
      renderItem={({ item }) => (
        <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate('VenueDetail', { venueId: item.id })}>
          <Card style={[{ padding: 0, flex: 1, marginBottom: spacing.md, flexDirection: 'row', overflow: 'hidden', height: 100 }]}>
            <Image source={{ uri: item.image }} style={{ width: 120, height: '100%' }} />
            <View style={{ flex: 1, padding: spacing.md, justifyContent: 'center' }}>
              <ThemedText variant="subtitle" weight="bold" numberOfLines={1}>{item.name}</ThemedText>
              <View style={[styles.row, { marginTop: spacing.xs, alignItems: 'center' }]}>
                <ThemedText variant="caption" color="textSecondary" style={{ marginRight: spacing.md }}><Ionicons name="location" size={12} /> {item.city}</ThemedText>
                <ThemedText variant="caption" color="textSecondary"><Ionicons name="people" size={12} /> {item.capacity}</ThemedText>
              </View>
            </View>
            <View style={{ padding: spacing.md, justifyContent: 'center' }}>
              <Ionicons name="chevron-forward" size={20} color={theme.textLight} />
            </View>
          </Card>
        </TouchableOpacity>
      )}
    />
  );
};

const NewsTab = () => {
  const { theme, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const navigation = useNavigation<any>();
  const isTablet = width > 768;

  return (
    <FlatList
      data={MOCK_NEWS}
      keyExtractor={item => item.id}
      numColumns={isTablet ? 2 : 1}
      key={`news-${isTablet ? 2 : 1}`}
      contentContainerStyle={styles.tabContentPadding}
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

  return (
    <FlatList
      data={MOCK_VIDEOS}
      keyExtractor={item => item.id}
      numColumns={isTablet ? 3 : 2}
      key={`videos-${isTablet ? 3 : 2}`}
      contentContainerStyle={styles.tabContentPadding}
      columnWrapperStyle={styles.rowGap}
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
  const { theme, isDark } = useTheme();
  const [selectedGroup, setSelectedGroup] = React.useState(POINTS_GROUPS[0]);

  return (
    <ScrollView style={styles.tabContent} contentContainerStyle={styles.tabContentPadding}>
      {/* Group Selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
        {POINTS_GROUPS.map((group) => (
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

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {/* Table Header */}
        <View style={[styles.row, styles.tableHeader, { backgroundColor: theme.surface }]}>
          <ThemedText variant="small" weight="bold" color="textSecondary" style={{ flex: 3 }}>Team</ThemedText>
          <ThemedText variant="small" weight="bold" color="textSecondary" style={styles.tableCol}>M</ThemedText>
          <ThemedText variant="small" weight="bold" color="textSecondary" style={styles.tableCol}>W</ThemedText>
          <ThemedText variant="small" weight="bold" color="textSecondary" style={styles.tableCol}>L</ThemedText>
          <ThemedText variant="small" weight="bold" color="textSecondary" style={styles.tableCol}>NR</ThemedText>
          <ThemedText variant="small" weight="bold" color="textSecondary" style={[styles.tableCol, { flex: 1.5 }]}>NRR</ThemedText>
          <ThemedText variant="small" weight="bold" color="textSecondary" style={[styles.tableCol, { flex: 1.5 }]}>cupR</ThemedText>
          <ThemedText variant="small" weight="bold" color="textSecondary" style={styles.tableCol}>Pts</ThemedText>
        </View>

        {/* Table Rows */}
        {MOCK_POINTS_TABLE.map((team, index) => {
          const isTop4 = index < 4;
          return (
            <View key={team.id} style={[
              styles.row,
              styles.tableRow,
              { borderBottomColor: theme.borderLight },
              isTop4 && { backgroundColor: theme.primary + '0A' }
            ]}>
              <View style={[styles.row, { flex: 3, alignItems: 'center' }]}>
                {isTop4 && <View style={[styles.qualifierIndicator, { backgroundColor: theme.primary }]} />}
                <View style={{ width: 14, alignItems: 'center', marginRight: spacing.xs, marginLeft: isTop4 ? spacing.xs : spacing.sm }}>
                  <ThemedText variant="caption" weight="bold" style={{ color: isTop4 ? theme.success : theme.error }}>
                    {isTop4 ? 'Q' : 'E'}
                  </ThemedText>
                </View>
                <ThemedText style={{ fontSize: 16, marginRight: spacing.xs }}>{team.flag}</ThemedText>
                <ThemedText weight="bold" numberOfLines={1}>{team.id}</ThemedText>
              </View>
              <ThemedText style={styles.tableCol}>{team.m}</ThemedText>
              <ThemedText style={styles.tableCol}>{team.w}</ThemedText>
              <ThemedText style={styles.tableCol}>{team.l}</ThemedText>
              <ThemedText style={styles.tableCol}>{team.nr}</ThemedText>
              <ThemedText variant="small" style={[styles.tableCol, { flex: 1.5 }]}>{team.nrr}</ThemedText>
              <ThemedText weight="bold" color="secondary" style={[styles.tableCol, { flex: 1.5 }]}>{team.cupRPts}</ThemedText>
              <ThemedText weight="bold" color="primary" style={styles.tableCol}>{team.pts}</ThemedText>
            </View>
          );
        })}
      </Card>

      <View style={{ marginTop: spacing.md, flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: theme.primary, marginRight: spacing.sm }} />
        <ThemedText variant="caption" color="textSecondary">Top 4 teams qualify for Playoffs</ThemedText>
      </View>
    </ScrollView>
  );
};


// --- Main Navigator ---

export const SeriesDetailScreen: React.FC = () => {
  const { theme, isDark } = useTheme();
  const navigation = useNavigation();

  // Conditional flag for Points Table
  const showPointsTable = true;

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
              <ThemedText style={styles.emoji}>🏆</ThemedText>
            </View>
            <View style={styles.headerInfo}>
              <ThemedText variant="title" color="white" weight="bold">ICC World Cup 2024</ThemedText>
              <ThemedText variant="caption" color="white" style={{ opacity: 0.8 }}>Oct 5 - Nov 19 • 48 Matches</ThemedText>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <TopTab.Navigator
        screenOptions={{
          tabBarActiveTintColor: theme.primary,
          tabBarInactiveTintColor: theme.textSecondary,
          tabBarIndicatorStyle: { backgroundColor: theme.primary, height: 3 },
          tabBarStyle: { backgroundColor: theme.surface, elevation: 2 },
          tabBarLabelStyle: { fontWeight: 'bold', textTransform: 'capitalize' },
          tabBarAllowFontScaling: false,
          tabBarScrollEnabled: true,
          lazy: true,
        }}
      >
        <TopTab.Screen name="Overview" component={OverviewTab} />
        {showPointsTable && <TopTab.Screen name="Points Table" component={PointsTab} />}
        <TopTab.Screen name="Fixtures" component={FixturesTab} />
        <TopTab.Screen name="Teams" component={TeamsTab} />
        <TopTab.Screen name="Stats" component={StatsTab} />
        <TopTab.Screen name="Venues" component={VenuesTab} />
        <TopTab.Screen name="News" component={NewsTab} />
        <TopTab.Screen name="Videos" component={VideosTab} />
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
  tableHeader: { paddingVertical: spacing.sm, paddingHorizontal: spacing.sm, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.1)' },
  tableRow: { paddingVertical: spacing.sm, paddingHorizontal: spacing.sm, borderBottomWidth: 1, alignItems: 'center' },
  tableCol: { flex: 1, textAlign: 'center' },
  qualifierIndicator: { width: 4, height: 24, borderTopRightRadius: 4, borderBottomRightRadius: 4, position: 'absolute', left: 0 },
});
