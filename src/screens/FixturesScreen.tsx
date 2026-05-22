import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  ScrollView,
  Animated,
  Modal,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import { Text as ThemedText } from '../components/ui/Text';
import { Card } from '../components/ui/Card';
import { spacing, borderRadius } from '../theme';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { MatchService } from '../services/match.service';
import { MatchCard } from '../components/MatchCard';
import { MatchCardSkeleton } from '../components/MatchCardSkeleton';



const getLocalYMD = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

type MatchFormat = 'All' | 'T20' | 'ODI' | 'Test';

interface Match {
  _id: string;
  matchDate: string;
  series: any;
  format: MatchFormat;
  teamA: any;
  teamB: any;
  venue: any;
  title: string;
  matchTime: string;
}

interface MatchSection {
  title: string;
  date: string;
  data: Match[];
}

const generateMatches = (startDate: Date, count: number, direction: 'past' | 'future'): Match[] => {
  const matches: Match[] = [];
  const formats: MatchFormat[] = ['ODI', 'T20', 'Test'];
  const series = ['ICC World Cup', 'IPL 2024', 'Border-Gavaskar Trophy', 'The Ashes', 'T20 World Cup'];
  const teams = [
    { name: 'India', code: 'IND' },
    { name: 'Australia', code: 'AUS' },
    { name: 'England', code: 'ENG' },
    { name: 'Pakistan', code: 'PAK' },
    { name: 'South Africa', code: 'SA' },
    { name: 'New Zealand', code: 'NZ' },
  ];
  const venues = ['Wankhede Stadium', 'MCG', 'Lords', 'Eden Gardens', 'SCG'];

  for (let i = 0; i < count; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + (direction === 'future' ? i : -i));
    const matchesPerDay = Math.floor(Math.random() * 2) + 2;

    for (let j = 0; j < matchesPerDay; j++) {
      const team1 = teams[Math.floor(Math.random() * teams.length)];
      let team2 = teams[Math.floor(Math.random() * teams.length)];
      while (team2.code === team1.code) {
        team2 = teams[Math.floor(Math.random() * teams.length)];
      }

      matches.push({
        _id: `${direction}-${date.getTime()}-${j}`,
        matchDate: date.toISOString(), // Standard
        date: getLocalYMD(date), // keep for legacy matching below
        series: { name: series[Math.floor(Math.random() * series.length)] },
        format: formats[Math.floor(Math.random() * formats.length)],
        teamA: { name: team1.name, shortName: team1.code, code: team1.code },
        teamB: { name: team2.name, shortName: team2.code, code: team2.code },
        venue: { name: venues[Math.floor(Math.random() * venues.length)] },
        time: `${Math.floor(Math.random() * 12) + 1}:${['00', '30'][Math.floor(Math.random() * 2)]} ${['AM', 'PM'][Math.floor(Math.random() * 2)]}`,
        title: "",
        matchTime: new Date(date.setHours(10, 0, 0, 0)).toISOString(),
      } as any);
    }
  }
  return matches;
};

export const FixturesScreen: React.FC = () => {
  const { theme, isDark } = useTheme();
  const sectionListRef = useRef<SectionList>(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  const [rawMatches, setRawMatches] = useState<any[]>([]);
  const [selectedFormat, setSelectedFormat] = useState<MatchFormat>('All');
  const [showTodayBtn, setShowTodayBtn] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentVisibleSection, setCurrentVisibleSection] = useState<string>('');
  
  // Custom states for 2-way date-cursor based pagination
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMoreFuture, setLoadingMoreFuture] = useState(false);
  const [loadingMorePast, setLoadingMorePast] = useState(false);
  const [hasMorePast, setHasMorePast] = useState(true);
  const [hasMoreFuture, setHasMoreFuture] = useState(true);
  const [earliestCursor, setEarliestCursor] = useState<string>('');
  const [latestCursor, setLatestCursor] = useState<string>('');

  const insets = useSafeAreaInsets();
  const todayStr = useMemo(() => getLocalYMD(new Date()), []);

  const formatDateHeader = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.round((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';

    const currentYear = today.getFullYear();
    const matchYear = date.getFullYear();

    if (currentYear === matchYear) {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
  };

  const mapFormatForApi = (fmt: MatchFormat): string | undefined => {
    if (fmt === 'All') return undefined;
    return fmt.toLowerCase();
  };

  const fetchTimeline = async (anchorDate: Date, isInitial = false, isRefresh = false) => {
    try {
      if (isInitial) {
        setLoading(true);
      } else if (isRefresh) {
        setRefreshing(true);
      }

      const anchorIso = anchorDate.toISOString();
      const apiFormat = mapFormatForApi(selectedFormat);

      // Perform parallel requests for future (upcoming) and past (recent results) matches
      const [futureRes, pastRes] = await Promise.all([
        MatchService.getMatches({
          cursor: anchorIso,
          direction: 'future',
          limit: 15,
          matchFormat: apiFormat,
        }),
        MatchService.getMatches({
          cursor: anchorIso,
          direction: 'past',
          limit: 15,
          matchFormat: apiFormat,
        }),
      ]);

      // pastRes is returned reverse-chronological (newest past first, i.e., yesterday, then day before).
      // We reverse it to chronological ascending so the final unified timeline list flows perfectly.
      const reversedPast = [...pastRes].reverse();
      const combined = [...reversedPast, ...futureRes];

      setRawMatches(combined);

      // Setup pagination boundary cursors and availability flags
      if (reversedPast.length > 0) {
        setEarliestCursor(reversedPast[0].time || reversedPast[0].matchTime || reversedPast[0].matchDate);
        setHasMorePast(pastRes.length >= 15);
      } else {
        setEarliestCursor(anchorIso);
        setHasMorePast(false);
      }

      if (futureRes.length > 0) {
        setLatestCursor(futureRes[futureRes.length - 1].time || futureRes[futureRes.length - 1].matchTime || futureRes[futureRes.length - 1].matchDate);
        setHasMoreFuture(futureRes.length >= 15);
      } else {
        setLatestCursor(anchorIso);
        setHasMoreFuture(false);
      }
    } catch (error) {
      console.error('[FixturesScreen] Error loading matches timeline:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadMoreFuture = async () => {
    if (loadingMoreFuture || !hasMoreFuture || !latestCursor) return;

    try {
      setLoadingMoreFuture(true);
      const apiFormat = mapFormatForApi(selectedFormat);
      
      const futureRes = await MatchService.getMatches({
        cursor: latestCursor,
        direction: 'future',
        limit: 15,
        matchFormat: apiFormat,
      });

      if (futureRes.length > 0) {
        setRawMatches((prev) => [...prev, ...futureRes]);
        setLatestCursor(futureRes[futureRes.length - 1].time || futureRes[futureRes.length - 1].matchTime || futureRes[futureRes.length - 1].matchDate);
        setHasMoreFuture(futureRes.length >= 15);
      } else {
        setHasMoreFuture(false);
      }
    } catch (error) {
      console.error('[FixturesScreen] Error loading future matches:', error);
    } finally {
      setLoadingMoreFuture(false);
    }
  };

  const loadMorePast = async () => {
    if (loadingMorePast || !hasMorePast || !earliestCursor) return;

    try {
      setLoadingMorePast(true);
      const apiFormat = mapFormatForApi(selectedFormat);

      const pastRes = await MatchService.getMatches({
        cursor: earliestCursor,
        direction: 'past',
        limit: 15,
        matchFormat: apiFormat,
      });

      if (pastRes.length > 0) {
        const reversedPast = [...pastRes].reverse();
        setRawMatches((prev) => [...reversedPast, ...prev]);
        setEarliestCursor(reversedPast[0].time || reversedPast[0].matchTime || reversedPast[0].matchDate);
        setHasMorePast(pastRes.length >= 15);
      } else {
        setHasMorePast(false);
      }
    } catch (error) {
      console.error('[FixturesScreen] Error loading past matches:', error);
    } finally {
      setLoadingMorePast(false);
    }
  };

  useEffect(() => {
    setRawMatches([]);
    setEarliestCursor('');
    setLatestCursor('');
    setHasMorePast(true);
    setHasMoreFuture(true);
    fetchTimeline(new Date(), true);
  }, [selectedFormat]);

  const onRefresh = React.useCallback(() => {
    fetchTimeline(new Date(), false, true);
  }, [selectedFormat]);

  const sections = useMemo<MatchSection[]>(() => {
    const dataSource = rawMatches;
    
    const grouped = dataSource.reduce((acc: Record<string, any[]>, m: any) => {
      const dateKey = m.time ? getLocalYMD(new Date(m.time)) : m.date; 
      acc[dateKey] = [...(acc[dateKey] || []), m];
      return acc;
    }, {} as Record<string, any[]>);

    return Object.keys(grouped).sort().map(date => ({
      title: formatDateHeader(date),
      date,
      data: grouped[date],
    }));
  }, [rawMatches]);

  const jumpToDate = (date: Date) => {
    const dateStr = getLocalYMD(date);
    const targetTitle = formatDateHeader(dateStr);

    const index = sections.findIndex(s => s.title === targetTitle || s.date === dateStr);

    if (index >= 0) {
      setTimeout(() => {
        sectionListRef.current?.scrollToLocation({
          sectionIndex: index,
          itemIndex: 0,
          animated: true,
          viewOffset: 0,
        });
      }, 100);
    }
    setShowCalendar(false);
  };

  const jumpToToday = () => jumpToDate(new Date());

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false }
  );

  const handleViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const visibleSection = viewableItems[0]?.section?.title;
      if (visibleSection) {
        setCurrentVisibleSection(visibleSection);
        setShowTodayBtn(visibleSection !== 'Today');
      }
    }
  }).current;

  const renderCalendar = () => {
    const today = new Date();
    const currentMonth = selectedDate.getMonth();
    const currentYear = selectedDate.getFullYear();
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.calendarDay} />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dateStr = getLocalYMD(date);
      const hasMatches = rawMatches.some((m: any) => {
          const mDate = m.time ? getLocalYMD(new Date(m.time)) : m.date;
          return mDate === dateStr;
      });
      const isToday = dateStr === todayStr;

      days.push(
        <TouchableOpacity
          key={day}
          style={[styles.calendarDay, isToday && { backgroundColor: theme.primary }]}
          onPress={() => hasMatches && jumpToDate(date)}
          disabled={!hasMatches}
        >
          <ThemedText
            variant="small"
            color={isToday ? 'white' : hasMatches ? 'text' : 'textLight'}
            weight={isToday ? 'bold' : undefined}
          >
            {day}
          </ThemedText>
          {hasMatches && !isToday && <View style={[styles.matchDot, { backgroundColor: isDark ? theme.text : theme.primary }]} />}
        </TouchableOpacity>
      );
    }

    return days;
  };

  const navigation = useNavigation<any>();

  const mapApiToMatch = (item: any) => {
    return {
      id: item.id || item._id,
      series: item.series || 'Series',
      format: (item.format || 'T20').toUpperCase(),
      team1: {
        name: item.team1?.name || 'Team 1',
        code: item.team1?.code || 'T1',
        score: item.team1?.score,
        overs: item.team1?.overs,
      },
      team2: {
        name: item.team2?.name || 'Team 2',
        code: item.team2?.code || 'T2',
        score: item.team2?.score,
        overs: item.team2?.overs,
      },
      status: item.status || 'Scheduled',
      venue: item.venue || 'Venue',
      time: item.time ? new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
      result: item.result,
    };
  };

  const renderMatch = ({ item }: { item: any }) => {
    const mapped = mapApiToMatch(item);
    return (
      <View style={{ marginBottom: spacing.md, marginHorizontal: spacing.md }}>
        <MatchCard 
          match={mapped}
          onPress={() => navigation.navigate('MatchDetails', { 
              matchId: mapped.id,
              team1Name: mapped.team1.name,
              team2Name: mapped.team2.name
          })}
        />
      </View>
    );
  };

  const renderListHeader = () => {
    if (!hasMorePast) return null;
    return (
      <View style={styles.headerLoaderContainer}>
        {loadingMorePast ? (
          <ActivityIndicator size="small" color={theme.primary} />
        ) : (
          <TouchableOpacity
            style={[styles.loadOlderBtn, { borderColor: theme.primary + '50' }]}
            onPress={loadMorePast}
            activeOpacity={0.7}
          >
            <Ionicons name="time-outline" size={14} color={theme.primary} />
            <ThemedText variant="small" weight="bold" style={{ color: theme.primary, marginLeft: 4 }}>
              LOAD OLDER MATCHES
            </ThemedText>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient colors={isDark ? [theme.surface, theme.background] : [theme.primary, theme.primaryDark]} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <ThemedText variant="title" color="white" weight="bold" style={styles.headerTitle}>Fixtures</ThemedText>

          <View style={styles.filterContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              {(['All', 'T20', 'ODI', 'Test'] as MatchFormat[]).map((fmt) => (
                <TouchableOpacity
                  key={fmt}
                  onPress={() => setSelectedFormat(fmt)}
                  style={[styles.filterTab, selectedFormat === fmt && { backgroundColor: theme.surface }]}
                >
                  <ThemedText variant="small" weight="bold" style={{ color: selectedFormat === fmt ? theme.primary : 'white' }}>
                    {fmt}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.calendarBtn} onPress={() => setShowCalendar(true)}>
              <Ionicons name="calendar-outline" size={22} color="white" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {loading && rawMatches.length === 0 ? (
        <ScrollView style={{ padding: spacing.md }}>
          {[1, 2, 3, 4].map(i => (
            <View key={i} style={{ marginBottom: spacing.md }}>
              <MatchCardSkeleton />
            </View>
          ))}
        </ScrollView>
      ) : (
        <SectionList
          ref={sectionListRef}
          sections={sections}
          renderItem={renderMatch}
          onScroll={handleScroll}
          onViewableItemsChanged={handleViewableItemsChanged}
          viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
          stickySectionHeadersEnabled={true}
          onEndReached={loadMoreFuture}
          onEndReachedThreshold={0.5}
          ListHeaderComponent={renderListHeader}
          ListFooterComponent={() => (
            loadingMoreFuture ? (
              <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={theme.primary} />
              </View>
            ) : null
          )}
          onScrollToIndexFailed={(info: any) => {
            setTimeout(() => {
              sectionListRef.current?.scrollToLocation({
                sectionIndex: info.highestMeasuredFrameIndex,
                itemIndex: 0,
                animated: false,
              });
              setTimeout(() => {
                sectionListRef.current?.scrollToLocation({
                  sectionIndex: info.index,
                  itemIndex: 0,
                  animated: true,
                  viewOffset: 0,
                });
              }, 100);
            }, 100);
          }}
          renderSectionHeader={({ section: { title } }) => (
            <View style={[styles.sectionHeader, { backgroundColor: theme.background, borderBottomColor: theme.borderLight }]}>
              <ThemedText variant="small" weight="bold" style={{ color: theme.primary }}>
                {title}
              </ThemedText>
            </View>
          )}
          keyExtractor={(item) => item.id || item._id}
          contentContainerStyle={{ paddingBottom: 120 }}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          ListEmptyComponent={!loading && !refreshing ? <View style={styles.empty}><ThemedText>No matches for this format</ThemedText></View> : null}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.primary}
              colors={[theme.primary]}
            />
          }
        />
      )}
      {showTodayBtn && (
        <Animated.View style={styles.floatingContainer}>
          <TouchableOpacity
            style={[styles.todayFab, { backgroundColor: theme.primary }]}
            onPress={jumpToToday}
            activeOpacity={0.7}
          >
            <Ionicons name="today" size={18} color="white" />
            <ThemedText variant="small" weight="bold" color="white" style={{ marginLeft: 4 }}>TODAY</ThemedText>
          </TouchableOpacity>
        </Animated.View>
      )}

      <Modal visible={showCalendar} transparent animationType="slide" onRequestClose={() => setShowCalendar(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBg} onPress={() => setShowCalendar(false)} />
          <View style={[styles.calendarModal, { backgroundColor: theme.surface }]}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={() => setSelectedDate(new Date(selectedDate.setMonth(selectedDate.getMonth() - 1)))}>
                <Ionicons name="chevron-back" size={24} color={theme.text} />
              </TouchableOpacity>
              <ThemedText variant="body" weight="bold">
                {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </ThemedText>
              <TouchableOpacity onPress={() => setSelectedDate(new Date(selectedDate.setMonth(selectedDate.getMonth() + 1)))}>
                <Ionicons name="chevron-forward" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.calendarGrid}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <View key={i} style={styles.calendarDay}>
                  <ThemedText variant="small" weight="bold" color="textSecondary">{d}</ThemedText>
                </View>
              ))}
              {renderCalendar()}
            </View>
            <TouchableOpacity
              style={[styles.todayBtn, { backgroundColor: theme.primary }]}
              onPress={() => { setSelectedDate(new Date()); jumpToToday(); }}
            >
              <ThemedText color="white" weight="bold">Go to Today</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerLoaderContainer: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  loadOlderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  header: { paddingBottom: 15 },

  headerTitle: { textAlign: 'center', marginTop: 10 },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    paddingLeft: spacing.md,
  },
  filterScroll: { flex: 1 },
  filterTab: {
    paddingHorizontal: 22,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginRight: 10,
  },
  calendarBtn: {
    paddingHorizontal: 15,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255,255,255,0.3)',
  },
  sectionHeader: {
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
  },
  matchCard: {
    marginHorizontal: spacing.md,
    marginVertical: 6,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  teamsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  empty: { flex: 1, alignItems: 'center', marginTop: 50 },
  floatingContainer: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    alignItems: 'center',
  },
  todayFab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBg: {
    flex: 1,
  },
  calendarModal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.lg,
    maxHeight: '70%',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  matchDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
  todayBtn: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
});
