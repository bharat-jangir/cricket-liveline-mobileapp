import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    Image,
    Modal,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    Animated,
    Text as RNText,
    FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { createMaterialTopTabNavigator, MaterialTopTabBar } from '@react-navigation/material-top-tabs';
import BottomSheet, { BottomSheetScrollView, BottomSheetBackdrop, BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { useTheme } from '../theme/ThemeContext';
import { spacing, fontSize, borderRadius, elevation } from '../theme';
import { Text as ThemedText } from '../components/ui/Text';
import { Card } from '../components/ui/Card';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useLiveMatch } from '../hooks/useLiveMatch';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
    fetchMatchDetails,
    fetchLiveStatus,
    fetchCommentary,
    fetchScorecard,
    fetchSquads,
    fetchSessions,
    fetchPointsTable,
    fetchPartnerships,
    fetchRecentOvers,
    resetMatchState,
    setRefreshing,
    updateLiveStatusFromSocket,
    updateCommentaryFromSocket
} from '../store/matchSlice';
import { MatchService } from '../services/match.service';
import { MatchDetailSkeleton } from '../components/MatchDetailSkeleton';
import { RefreshControl } from 'react-native';

type MatchDetailNavigationProp = StackNavigationProp<RootStackParamList, 'MatchDetails'>;

const Tab = createMaterialTopTabNavigator();
const { width, height } = Dimensions.get('window');

// --- Mock Data ---
const SQUAD_DATA = {
    WP: [
        { name: 'Tony de Zorzi', role: 'Batter' },
        { name: 'D Bedingham', role: 'Batter' },
        { name: 'Kyle Verreynne', role: 'WK-Batter' },
        { name: 'George Linde', role: 'All-rounder' },
        { name: 'Mihali Mpongwana', role: 'All-rounder' },
        { name: 'Beuran Hendricks', role: 'Bowler' },
        { name: 'Wayne Parnell', role: 'Bowler' },
        { name: 'M Nabe', role: 'Bowler' },
        { name: 'Valantine Kitime', role: 'Batter' },
        { name: 'Daniel Smith', role: 'Batter' },
        { name: 'Onke Nyaku', role: 'All-rounder' },
    ],
    LIO: [
        { name: 'Reeza Hendricks', role: 'Batter' },
        { name: 'Ryan Rickelton', role: 'WK-Batter' },
        { name: 'Temba Bavuma', role: 'Batter' },
        { name: 'Rassie van der Dus', role: 'Batter' },
        { name: 'Wiaan Mulder', role: 'All-rounder' },
        { name: 'Bjorn Fortuin', role: 'Bowler' },
        { name: 'Lizaad Williams', role: 'Bowler' },
        { name: 'Kagiso Rabada', role: 'Bowler' },
        { name: 'L Sipamla', role: 'Bowler' },
        { name: 'Evan Jones', role: 'All-rounder' },
        { name: 'Mitchell Van Buuren', role: 'Batter' },
    ]
};

// Role icon helper
const getRoleIcon = (role: string) => {
    if (!role) return '🏏';
    const r = role.toLowerCase();
    if (r.includes('wicket')) return '🧤';
    if (r.includes('all')) return '⭐';
    if (r.includes('bowl')) return '🎯';
    return '🏏';
};

// Robust squad-to-team matcher
const resolveSquad = (squads: any[], teamObj: any, fallbackIndex: 0 | 1) => {
    if (!squads.length) return null;
    // Try _id match first
    const byId = squads.find(
        (s: any) => s.teamId?._id?.toString() === teamObj?._id?.toString()
    );
    if (byId) return byId;
    // Fallback: positional (admin usually saves teamA first, then teamB)
    return squads[fallbackIndex] ?? null;
};

const TeamSquadButton = ({
    squad, team, teamIndex, onPress, isDark, theme,
}: {
    squad: any; team: any; teamIndex: 0 | 1;
    onPress: (i: 0 | 1) => void;
    isDark: boolean; theme: any;
}) => {
    const pxi: any[] = squad?.playingXI || [];
    const bench: any[] = squad?.bench || [];
    const hasPxi = pxi.length > 0;
    const hasBench = bench.length > 0;

    let subtitle = 'Squad not announced';
    if (hasPxi) subtitle = `Playing XI announced · ${bench.length > 0 ? bench.length + ' on bench' : ''}`.trim().replace(/· $/, '');
    else if (hasBench) subtitle = `${bench.length} players in squad`;

    return (
        <TouchableOpacity
            style={[styles.teamSelectorRow, { backgroundColor: isDark ? theme.surface : theme.borderLight }]}
            onPress={() => onPress(teamIndex)}
        >
            <View style={styles.teamLogoBadgeSmall}>
                {team?.logo
                    ? <Image source={{ uri: team.logo }} style={{ width: 20, height: 20 }} />
                    : <Ionicons name="shirt-outline" size={16} color={theme.textSecondary} />}
            </View>
            <View style={{ flex: 1 }}>
                <ThemedText weight="bold">{team?.name || 'Team'}</ThemedText>
                <ThemedText variant="caption" color={hasPxi || hasBench ? 'primary' : 'textSecondary'}>
                    {subtitle}
                </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
        </TouchableOpacity>
    );
};

const InfoTab = ({ matchId, onTeamPress }: {
    matchId: string;
    onTeamPress: (teamIndex: 0 | 1) => void;
}) => {
    const { theme, isDark } = useTheme();
    const navigation = useNavigation<MatchDetailNavigationProp>();
    const dispatch = useAppDispatch();
    const {
        details: match,
        squads,
        refreshing
    } = useAppSelector(state => state.match);

    const onRefresh = useCallback(() => {
        dispatch(setRefreshing({ key: 'details', value: true }));
        dispatch(fetchMatchDetails(matchId));
        dispatch(fetchSquads(matchId));
    }, [dispatch, matchId]);

    const teamASquad = resolveSquad(squads, match?.teamAId, 0);
    const teamBSquad = resolveSquad(squads, match?.teamBId, 1);

    return (
        <ScrollView
            style={[styles.tabContent, { backgroundColor: theme.background }]}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing.details}
                    onRefresh={onRefresh}
                    colors={[theme.primary]}
                    tintColor={theme.primary}
                />
            }
        >
            {/* Series */}
            <Card style={[styles.tabCard, { borderColor: theme.border }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
                    <ThemedText variant="subtitle" weight="bold">Series</ThemedText>
                    {match?.seriesId && (
                        <TouchableOpacity onPress={() => navigation.navigate('SeriesDetail', { seriesId: match.seriesId._id })}>
                            <ThemedText color="primary" weight="bold" variant="small">View Series {'>'}</ThemedText>
                        </TouchableOpacity>
                    )}
                </View>
                <ThemedText weight="medium">{match?.seriesId?.name || match?.series?.name || 'Series Info Unavailable'}</ThemedText>
            </Card>

            {/* Match Info */}
            <Card style={[styles.tabCard, { borderColor: theme.border }]}>
                <ThemedText variant="subtitle" weight="bold" style={[styles.cardTitle, { borderBottomColor: theme.border }]}>Match Info</ThemedText>
                <View style={[styles.infoRow, { borderBottomColor: theme.border + '50' }]}>
                    <ThemedText color="textSecondary" style={styles.infoLabel}>Match</ThemedText>
                    <ThemedText weight="medium" style={styles.infoValue}>
                        {(match?.teamAId?.shortName || 'T1')} vs {(match?.teamBId?.shortName || 'T2')}{match?.matchNumber ? `, ${match.matchNumber}` : ''}
                    </ThemedText>
                </View>
                <View style={[styles.infoRow, { borderBottomColor: theme.border + '50' }]}>
                    <ThemedText color="textSecondary" style={styles.infoLabel}>Date & Time</ThemedText>
                    <ThemedText weight="medium" style={styles.infoValue}>
                        {match?.matchDate ? new Date(match.matchDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'}{match?.matchTime ? ', ' + new Date(match.matchTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </ThemedText>
                </View>
                <View style={[styles.infoRow, { borderBottomColor: theme.border + '50' }]}>
                    <ThemedText color="textSecondary" style={styles.infoLabel}>Venue</ThemedText>
                    <TouchableOpacity onPress={() => match?.venueId && navigation.navigate('VenueDetail', { venueId: match.venueId._id })}>
                        <ThemedText color="primary" weight="medium" style={styles.infoValue}>{match?.venueId?.name || match?.venue?.name || 'TBD'}</ThemedText>
                    </TouchableOpacity>
                </View>
                <View style={styles.infoRow}>
                    <ThemedText color="textSecondary" style={styles.infoLabel}>Toss</ThemedText>
                    <ThemedText weight="medium" style={styles.infoValue}>{match?.toss?.tossText || 'Toss not yet updated'}</ThemedText>
                </View>
            </Card>

            {/* Squad — tap to open modal */}
            <Card style={[styles.tabCard, { borderColor: theme.border }]}>
                <ThemedText variant="subtitle" weight="bold" style={[styles.cardTitle, { borderBottomColor: theme.border }]}>Squads</ThemedText>
                <View style={{ gap: spacing.sm }}>
                    <TeamSquadButton squad={teamASquad} team={match?.teamAId} teamIndex={0} onPress={onTeamPress} isDark={isDark} theme={theme} />
                    <TeamSquadButton squad={teamBSquad} team={match?.teamBId} teamIndex={1} onPress={onTeamPress} isDark={isDark} theme={theme} />
                </View>
            </Card>

            {/* Head to Head */}
            <Card style={[styles.tabCard, { borderColor: theme.border }]}>
                <ThemedText variant="subtitle" weight="bold" style={[styles.cardTitle, { borderBottomColor: theme.border }]}>Head to Head</ThemedText>
                {match?.headToHead ? (
                    <View style={styles.h2hContainer}>
                        <View style={styles.h2hStatRow}>
                            <View style={styles.h2hTeamInfo}>
                                <ThemedText weight="bold">{match?.teamAId?.shortName || 'T1'}</ThemedText>
                                <ThemedText color="primary" variant="title" weight="bold">{match.headToHead.team1Wins || 0}</ThemedText>
                            </View>
                            <View style={styles.h2hDivider}>
                                <ThemedText variant="small" color="textSecondary">TOT: {(match.headToHead.team1Wins || 0) + (match.headToHead.team2Wins || 0)}</ThemedText>
                                <View style={styles.h2hProgressContainer}>
                                    <View style={[styles.h2hProgressBar, { width: `${((match.headToHead.team1Wins || 0) / Math.max(1, (match.headToHead.team1Wins || 0) + (match.headToHead.team2Wins || 0))) * 100}%`, backgroundColor: theme.primary }]} />
                                </View>
                            </View>
                            <View style={[styles.h2hTeamInfo, { alignItems: 'flex-end' }]}>
                                <ThemedText weight="bold">{match?.teamBId?.shortName || 'T2'}</ThemedText>
                                <ThemedText color="textSecondary" variant="title" weight="bold">{match.headToHead.team2Wins || 0}</ThemedText>
                            </View>
                        </View>
                    </View>
                ) : (
                    <ThemedText color="textSecondary" style={{ textAlign: 'center', paddingVertical: spacing.md }}>H2H record not yet available.</ThemedText>
                )}
            </Card>

            <View style={{ height: 20 }} />
        </ScrollView>
    );
};


const ParsedCommentaryText = ({ text, style, color = 'text' }: { text: string, style?: any, color?: any }) => {
    if (!text) return null;

    // 1. Convert block tags like <p> and <div> to newlines and sanitize common entities
    const sanitizedText = text
        .replace(/<p\s*\/?>/gi, '')
        .replace(/<\/p>/gi, '\n')
        .replace(/<div\s*\/?>/gi, '')
        .replace(/<\/div>/gi, '\n')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/&nbsp;/g, ' ')
        .trim();

    // 2. Split by common rich text tags
    const segments = sanitizedText.split(/(<[\/]?b>|<[\/]?strong>|<[\/]?i>|<[\/]?em>)/gi);

    let currentBold = false;
    let currentItalic = false;

    return (
        <ThemedText style={style} color={color}>
            {segments.map((segment, index) => {
                if (!segment) return null;
                const tag = segment.toLowerCase();

                if (tag === '<b>' || tag === '<strong>') {
                    currentBold = true;
                    return null;
                }
                if (tag === '</b>' || tag === '</strong>') {
                    currentBold = false;
                    return null;
                }
                if (tag === '<i>' || tag === '<em>') {
                    currentItalic = true;
                    return null;
                }
                if (tag === '</i>' || tag === '</em>') {
                    currentItalic = false;
                    return null;
                }

                // Hide ANY other HTML tags that we don't explicitly support
                if (segment.startsWith('<') && segment.endsWith('>')) return null;

                // Important: Use native RNText here so it correctly inherits styles from the parent ThemedText
                return (
                    <RNText
                        key={index}
                        style={{
                            fontWeight: currentBold ? 'bold' : 'normal',
                            fontStyle: currentItalic ? 'italic' : 'normal'
                        }}
                    >
                        {segment}
                    </RNText>
                );
            })}
        </ThemedText>
    );
};

const CommentaryTab = ({ matchId }: { matchId: string }) => {
    const { theme, isDark } = useTheme();
    const dispatch = useAppDispatch();
    const { commentary: reduxCommentary, refreshing, liveStatus, details: match } = useAppSelector(state => state.match);

    const [activeFilter, setActiveFilter] = useState('All');
    const [selectedOver, setSelectedOver] = useState<any>(null);
    const overBottomSheetRef = useRef<BottomSheet>(null);

    const filters = ['All', 'Highlights', 'Overs', 'W', '6s', '4s', '1st Inn', '2nd Inn', 'Milestones', 'Maiden'];

    const snapPoints = useMemo(() => ['65%', '95%'], []);

    const renderBackdrop = useCallback(
        (props: BottomSheetBackdropProps) => (
            <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
        ),
        []
    );

    const handleOverPress = useCallback((item: any) => {
        setSelectedOver(item);
        overBottomSheetRef.current?.expand();
    }, []);

    const onRefresh = useCallback(() => {
        dispatch(setRefreshing({ key: 'commentary', value: true }));
        dispatch(fetchCommentary(matchId));
    }, [dispatch, matchId]);

    // Process commentary to add labels and sort
    const processedCommentary = useMemo(() => {
        const baseList = Array.isArray(reduxCommentary) ? reduxCommentary : [];

        if (baseList.length === 0) {
            // Fallback to liveStatus.recentBalls if REST is empty
            const fallback = liveStatus?.recentBalls || [];
            if (fallback.length === 0) return [];
            return [...fallback].reverse(); // Assuming recentBalls are newest-last in backend
        }

        const combined = [...baseList].map((item, idx) => ({
            ...item,
            _id: item._id || item.ballId || `temp-${idx}`
        }));

        // 1. Sort by timestamp ascending for sequential index calculation
        const sorted = combined.sort((a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        const overCounters: Record<string, number> = {};

        const withLabels = sorted.map(item => {
            const type = item.type || 'ball';
            const isDelivery = ['ball', 'wicket', 'milestone'].includes(type);

            if (!isDelivery) return item;

            const overNumber = item.overNumber || 1;
            const inningId = item.inningId || 'default';
            const overKey = `${inningId}-${overNumber}`;

            if (overCounters[overKey] === undefined) overCounters[overKey] = 0;

            if (item.isLegal) {
                overCounters[overKey]++;
            }

            const ballIndex = overCounters[overKey];
            return {
                ...item,
                calculatedIndex: `${overNumber - 1}.${ballIndex}`,
                calculatedResult: item.ballLabel || (type === 'wicket' ? 'W' : '')
            };
        });

        // 2. Reverse for display (latest first)
        return withLabels.reverse();
    }, [reduxCommentary, liveStatus]);

    const filteredCommentary = useMemo(() => {
        if (activeFilter === 'All') return processedCommentary;

        const inn1Id = match?.liveStatus?.innings?.[0]?._id;
        const inn2Id = match?.liveStatus?.innings?.[1]?._id;

        return processedCommentary.filter((item: any) => {
            const isBall = ['ball', 'wicket', 'milestone'].includes(item.type);

            switch (activeFilter) {
                case 'Highlights':
                    return item.isWicket || item.runs >= 4 || item.type === 'milestone' || item.type === 'over_end';
                case 'W':
                    return item.isWicket || item.type === 'wicket';
                case '6s':
                    return item.runs === 6;
                case '4s':
                    return item.runs === 4;
                case 'Milestones':
                    return item.type === 'milestone';
                case 'Maiden':
                    return item.type === 'over_end' && item.isMaiden;
                case '1st Inn':
                    const inn1Id = match?.liveStatus?.innings?.[0]?._id || match?.innings?.[0]?._id;
                    return item.inningId === inn1Id || item.inningNumber === 1;
                case '2nd Inn':
                    const inn2Id = match?.liveStatus?.innings?.[1]?._id || match?.innings?.[1]?._id;
                    return item.inningId === inn2Id || item.inningNumber === 2;
                case 'Overs':
                    return item.type === 'over_end';
                default:
                    return true;
            }
        });
    }, [processedCommentary, activeFilter, match]);

    const getBallBg = (ball: any) => {
        const label = (ball.calculatedResult || ball.ballLabel || '').toLowerCase();
        const isW = label.includes('w') || ball.isWicket || ball.type === 'wicket';
        const is6 = label === '6';
        const is4 = label === '4';
        const isExtra = label.includes('wd') || label.includes('nb');
        
        if (isW) return '#dc2626'; // Red 600
        if (is6) return '#16a34a'; // Green 600
        if (is4) return '#f97316'; // Orange 500
        if (isExtra) return '#8b5cf6'; // Violet 500
        return isDark ? 'rgba(255,255,255,0.1)' : '#f1f5f9';
    };

    const renderWicketCard = (item: any) => {
        const data = item.highlightData;
        if (!data) return null;

        const initial = data.wicketBatsmanName?.charAt(0) || '?';
        const sr = data.wicketBatsmanSR || (data.wicketBatsmanBalls > 0 ? ((data.wicketBatsmanRuns / data.wicketBatsmanBalls) * 100).toFixed(2) : '0.00');

        return (
            <View key={item._id} style={styles.wicketCardContainer}>
                <View style={[styles.wicketCardRed, { backgroundColor: '#991b1b' }]}>
                    {/* Top Row: Info & OUT Tag */}
                    <View style={styles.wicketTopRow}>
                        <View style={styles.wicketAvatarContainer}>
                            <View style={styles.wicketAvatarCircle}>
                                <ThemedText weight="bold" style={styles.wicketAvatarText}>{initial}</ThemedText>
                            </View>
                        </View>

                        <View style={styles.wicketMainInfo}>
                            <ThemedText weight="bold" style={styles.wicketPlayerName}>
                                {data.wicketBatsmanName}
                            </ThemedText>
                            <ThemedText style={styles.wicketDismissal}>
                                {item.commentary}
                            </ThemedText>
                        </View>

                        <View style={styles.outTag}>
                            <ThemedText weight="bold" style={styles.outTagText}>OUT</ThemedText>
                        </View>
                    </View>

                    {/* Stats Row */}
                    <View style={styles.wicketStatsRow}>
                        <View style={styles.wicketStatItem}>
                            <ThemedText style={styles.wicketStatLabel}>RUNS</ThemedText>
                            <ThemedText weight="bold" style={styles.wicketStatValue}>{data.wicketBatsmanRuns}</ThemedText>
                        </View>
                        <View style={styles.wicketStatItem}>
                            <ThemedText style={styles.wicketStatLabel}>BALLS</ThemedText>
                            <ThemedText weight="bold" style={styles.wicketStatValue}>{data.wicketBatsmanBalls}</ThemedText>
                        </View>
                        <View style={styles.wicketStatItem}>
                            <ThemedText style={styles.wicketStatLabel}>4s</ThemedText>
                            <ThemedText weight="bold" style={styles.wicketStatValue}>{data.wicketBatsmanFours}</ThemedText>
                        </View>
                        <View style={styles.wicketStatItem}>
                            <ThemedText style={styles.wicketStatLabel}>6s</ThemedText>
                            <ThemedText weight="bold" style={styles.wicketStatValue}>{data.wicketBatsmanSixes}</ThemedText>
                        </View>
                        <View style={styles.wicketStatItem}>
                            <ThemedText style={styles.wicketStatLabel}>SR</ThemedText>
                            <ThemedText weight="bold" style={styles.wicketStatValue}>{sr.toFixed(2)}</ThemedText>
                        </View>
                    </View>
                </View>

                {/* Optional Short text footer like in screenshot */}
                {item.shortText && (
                    <ThemedText variant="caption" color="textSecondary" style={{ marginTop: 8, marginLeft: spacing.md }}>
                        Short: {item.shortText}
                    </ThemedText>
                )}
            </View>
        );
    };

    const renderOverSummary = (item: any) => {
        const data = item.highlightData;
        if (!data) return null;

        const balls = (data.overSummaryBallsData || []).map((b: any) =>
            typeof b === 'string' ? b : b.ballLabel || '•'
        );

        return (
            <Card key={item._id} style={[
                styles.overSummaryCard,
                {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
                    borderColor: theme.border + '30'
                }
            ]}>
                <View style={[styles.overSummaryHeader, { borderBottomColor: theme.border }]}>
                    <ThemedText weight="bold" variant="small">
                        {`END OF OVER ${data.overSummaryNumber || ''}`}
                    </ThemedText>
                    <ThemedText weight="bold" color="primary">
                        {`${data.overSummaryRuns || 0} Runs · ${data.overSummaryWickets || 0} Wkts`}
                    </ThemedText>
                </View>

                <View style={styles.overSummaryDetails}>
                    <View style={styles.overBallsList}>
                        {balls.map((b: string, i: number) => (
                            <View key={i} style={[styles.tinyBall, { backgroundColor: theme.borderLight }]}>
                                <ThemedText style={{ fontSize: 9 }} weight="bold">{b}</ThemedText>
                            </View>
                        ))}
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <ThemedText variant="small" weight="bold">{data.matchScore || ''}</ThemedText>
                        <ThemedText variant="caption" color="textSecondary">Score after {data.matchOvers || ''} ov</ThemedText>
                    </View>
                </View>

                {data.bowler && (
                    <View style={[styles.overStatsRow, { marginTop: spacing.sm }]}>
                        <ThemedText variant="caption" color="textSecondary" style={{ flex: 1 }}>
                            {`${data.bowler.name}: ${data.bowler.overs} ov, ${data.bowler.maidens} md, ${data.bowler.runs} runs, ${data.bowler.wickets} wk`}
                        </ThemedText>
                    </View>
                )}
            </Card>
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: theme.background }}>
            {/* Filter Bar */}
            <View style={[styles.filterScrollContainer, { borderBottomColor: theme.border + '20' }]}>
                <FlatList
                    data={filters}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}
                    keyExtractor={item => item}
                    renderItem={({ item: filter }) => (
                        <TouchableOpacity
                            style={[
                                styles.filterChip,
                                { backgroundColor: isDark ? theme.surface : '#f1f5f9' },
                                activeFilter === filter && { backgroundColor: theme.primary }
                            ]}
                            onPress={() => setActiveFilter(filter)}
                        >
                            <ThemedText
                                variant="caption"
                                weight="bold"
                                color={activeFilter === filter ? 'white' : 'textSecondary'}
                            >
                                {filter}
                            </ThemedText>
                        </TouchableOpacity>
                    )}
                />
            </View>

            <ScrollView
                style={[styles.tabContent, { backgroundColor: theme.background }]}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing.commentary}
                        onRefresh={onRefresh}
                        colors={[theme.primary]}
                        tintColor={theme.primary}
                    />
                }
            >
                {(activeFilter === 'All' ? processedCommentary : filteredCommentary).length === 0 && (
                    <View style={{ padding: spacing.xl, alignItems: 'center', marginTop: 40 }}>
                        <Ionicons name="filter-outline" size={48} color={theme.textSecondary} />
                        <ThemedText color="textSecondary" style={{ marginTop: spacing.md, textAlign: 'center' }}>
                            No {activeFilter.toLowerCase()} found for this match.
                        </ThemedText>
                    </View>
                )}

                <View style={{ paddingVertical: spacing.sm }}>
                    {(activeFilter === 'All' ? processedCommentary : filteredCommentary).map((item: any) => {
                        const isWicket = item.type === 'wicket' || item.isWicket;
                        const isBoundary = item.runs === 4 || item.runs === 6;

                        if (item.type === 'over_end') {
                            if (activeFilter === 'Overs') {
                                // Specialized Overs List View
                                return (
                                    <TouchableOpacity
                                        key={`ov-${item._id}`}
                                        style={[styles.overFilterRow, { borderBottomColor: theme.border + '20' }]}
                                        onPress={() => handleOverPress(item)}
                                    >
                                        <View style={{ width: 50 }}>
                                            <ThemedText weight="bold">Ov {item.highlightData?.overSummaryNumber}</ThemedText>
                                        </View>

                                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1, marginHorizontal: 8 }}>
                                            {(item.highlightData?.overSummaryBallsData || []).map((b: any, bi: number) => {
                                                const ballObj = typeof b === 'string' ? { ballLabel: b } : b;
                                                const label = ballObj.ballLabel || '•';
                                                const bgColor = getBallBg(ballObj);
                                                const isColored = bgColor !== 'rgba(255,255,255,0.1)' && bgColor !== '#f1f5f9';

                                                return (
                                                    <View key={bi} style={[
                                                        styles.tinyBallFilter,
                                                        { backgroundColor: bgColor }
                                                    ]}>
                                                        <ThemedText style={{ fontSize: 8 }} weight="bold" color={isColored ? 'white' : 'text'}>
                                                            {label}
                                                        </ThemedText>
                                                    </View>
                                                );
                                            })}
                                        </ScrollView>

                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                            <ThemedText variant="caption" weight="bold">{item.highlightData?.overSummaryRuns} runs</ThemedText>
                                            <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
                                        </View>
                                    </TouchableOpacity>
                                );
                            }
                            return renderOverSummary(item);
                        }

                        return (
                            <React.Fragment key={item._id}>
                                {isWicket && renderWicketCard(item)}
                                <View
                                    style={[
                                        styles.commentaryItem,
                                        {
                                            borderBottomColor: theme.border + '30',
                                            backgroundColor: isWicket ? '#ef444410' : isBoundary ? theme.primary + '05' : 'transparent'
                                        }
                                    ]}
                                >
                                    <View style={styles.overColumn}>
                                        <View style={[
                                            styles.ballBadge,
                                            { backgroundColor: getBallBg(item) }
                                        ]}>
                                            <ThemedText
                                                weight="bold"
                                                style={{ fontSize: 11 }}
                                                color={isWicket || isBoundary ? 'white' : 'text'}
                                            >
                                                {item.calculatedResult || '-'}
                                            </ThemedText>
                                        </View>
                                        <ThemedText variant="caption" color="textSecondary" style={{ marginTop: 4 }}>
                                            {item.calculatedIndex || ''}
                                        </ThemedText>
                                    </View>

                                    <View style={styles.commentaryText}>
                                        {item.bowlerName ? (
                                            <ThemedText variant="small" weight="bold" color="textSecondary" style={{ marginBottom: 2 }}>
                                                {item.bowlerName}{item.batsmanName ? ` to ${item.batsmanName}` : ''}
                                            </ThemedText>
                                        ) : null}
                                        <ParsedCommentaryText
                                            text={item.commentary || 'Ball delivered'}
                                            style={{ lineHeight: 20 }}
                                        />
                                    </View>
                                </View>
                            </React.Fragment>
                        );
                    })}
                </View>
                <View style={{ height: 60 }} />
            </ScrollView>

            {/* Over Details Bottom Sheet */}
            <BottomSheet
                ref={overBottomSheetRef}
                index={-1}
                snapPoints={snapPoints}
                enablePanDownToClose
                backdropComponent={renderBackdrop}
                backgroundStyle={{ backgroundColor: theme.surface }}
                handleIndicatorStyle={{ backgroundColor: theme.textSecondary + '50' }}
            >
                <View style={[styles.modalHeader, { borderBottomColor: theme.border + '30', paddingHorizontal: spacing.md, paddingBottom: spacing.sm }]}>
                    <ThemedText variant="subtitle" weight="bold">
                        Over {selectedOver?.highlightData?.overSummaryNumber} Commentary
                    </ThemedText>
                    <TouchableOpacity onPress={() => overBottomSheetRef.current?.close()}>
                        <Ionicons name="close-circle" size={24} color={theme.textSecondary} />
                    </TouchableOpacity>
                </View>

                <BottomSheetScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
                    <View style={{ paddingVertical: spacing.sm }}>
                        {processedCommentary
                            .filter((b: any) =>
                                b.overNumber === selectedOver?.overNumber &&
                                b.inningId === selectedOver?.inningId &&
                                ['ball', 'wicket', 'milestone'].includes(b.type)
                            )
                            .map((ball: any) => (
                                <View key={ball._id} style={[styles.commentaryItem, { borderBottomColor: theme.border + '20', paddingHorizontal: spacing.md }]}>
                                    <View style={styles.overColumn}>
                                        <View style={[styles.ballBadge, { backgroundColor: getBallBg(ball) }]}>
                                            <ThemedText weight="bold" style={{ fontSize: 11 }} color={ball.isWicket || ball.runs >= 4 ? 'white' : 'text'}>
                                                {ball.calculatedResult || '-'}
                                            </ThemedText>
                                        </View>
                                        <ThemedText variant="caption" color="textSecondary" style={{ marginTop: 4 }}>
                                            {ball.calculatedIndex}
                                        </ThemedText>
                                    </View>
                                    <View style={styles.commentaryText}>
                                        <ThemedText variant="small" weight="bold" color="textSecondary" style={{ marginBottom: 2 }}>
                                            {ball.bowlerName} to {ball.batsmanName}
                                        </ThemedText>
                                        <ParsedCommentaryText text={ball.commentary || 'Ball delivered'} />
                                    </View>
                                </View>
                            ))}
                    </View>
                </BottomSheetScrollView>
            </BottomSheet>
        </View>
    );
};

const ScorecardTab = ({ matchId }: { matchId: string }) => {
    const { theme, isDark } = useTheme();
    const dispatch = useAppDispatch();
    const { scorecard: reduxScorecard, refreshing, liveStatus, details: match } = useAppSelector(state => state.match);
    const [activeInnings, setActiveInnings] = useState(1);

    const onRefresh = useCallback(() => {
        dispatch(setRefreshing({ key: 'scorecard', value: true }));
        dispatch(fetchScorecard({ matchId, inning: activeInnings }));
        dispatch(fetchPartnerships({ matchId, inning: activeInnings }));
    }, [dispatch, matchId, activeInnings]);

    useEffect(() => {
        dispatch(fetchPartnerships({ matchId, inning: activeInnings }));
    }, [dispatch, matchId, activeInnings]);

    const scorecardData = reduxScorecard[activeInnings];
    const loading = !scorecardData && !refreshing.scorecard;

    const inningsList = useMemo(() => {
        const innArray = liveStatus?.innings || match?.liveStatus?.innings || [];
        if (innArray.length === 0) {
            return [{ id: 1, label: '1st Innings', score: '0/0' }];
        }
        return innArray.map((inn: any, idx: number) => ({
            id: idx + 1,
            label: inn.battingTeamId?.shortName ? `${inn.battingTeamId.shortName} ${idx + 1}st Inn` : `Innings ${idx + 1}`,
            score: `${inn.totalRuns || 0}/${inn.totalWickets || 0}`
        }));
    }, [liveStatus, match]);

    const batting = useMemo(() => {
        const list = scorecardData?.batting || [];
        return list.filter((p: any) => p.isVisible !== false);
    }, [scorecardData]);

    const bowling = useMemo(() => {
        const list = scorecardData?.bowling || [];
        return list.filter((p: any) => p.isVisible !== false);
    }, [scorecardData]);
    const { partnerships: partnershipsData } = useAppSelector(state => state.match);
    const partnerships = useMemo(() => partnershipsData || [], [partnershipsData]);

    return (
        <ScrollView
            style={[styles.tabContent, { backgroundColor: theme.background }]}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing.scorecard}
                    onRefresh={onRefresh}
                    colors={[theme.primary]}
                    tintColor={theme.primary}
                />
            }
        >
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={[styles.inningsSelectors, { backgroundColor: isDark ? theme.surface : theme.borderLight, borderBottomWidth: 1, borderBottomColor: theme.border }]}
                contentContainerStyle={{ paddingHorizontal: spacing.sm }}
            >
                {inningsList.map((inn: any) => (
                    <TouchableOpacity
                        key={inn.id}
                        style={[
                            styles.inningsTab,
                            activeInnings === inn.id && { borderBottomColor: theme.primary, borderBottomWidth: 3 }
                        ]}
                        onPress={() => setActiveInnings(inn.id)}
                    >
                        <ThemedText weight={activeInnings === inn.id ? 'bold' : 'medium'} color={activeInnings === inn.id ? 'primary' : 'textSecondary'}>
                            {inn.label}
                        </ThemedText>
                        <ThemedText variant="caption" color="textSecondary">{inn.score}</ThemedText>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <Card style={styles.tabCard}>
                <View style={[styles.scorecardHeader, { borderBottomColor: theme.border }]}>
                    <ThemedText variant="small" weight="bold" style={styles.colName}>Batting</ThemedText>
                    <View style={styles.scoreCols}>
                        <ThemedText variant="small" weight="bold" style={styles.colStat}>R</ThemedText>
                        <ThemedText variant="small" weight="bold" style={styles.colStat}>B</ThemedText>
                        <ThemedText variant="small" weight="bold" style={styles.colStat}>4s</ThemedText>
                        <ThemedText variant="small" weight="bold" style={styles.colStat}>6s</ThemedText>
                    </View>
                </View>
                {batting.length === 0 && !loading && (
                    <ThemedText style={{ padding: spacing.md, textAlign: 'center' }} color="textSecondary">No batting records found.</ThemedText>
                )}
                {batting.map((player: any, idx: number) => (
                    <View key={player.playerId?._id || player.playerId || `bat-${idx}`} style={[styles.playerRow, { borderBottomColor: theme.border + '50' }]}>
                        <View style={styles.playerNameCol}>
                            <ThemedText weight="semibold" style={{ color: theme.primary }}>{player.playerName || player.playerId?.name || 'Unknown'}</ThemedText>
                            <ThemedText variant="caption" color="textSecondary">{player.dismissalText || 'not out'}</ThemedText>
                        </View>
                        <View style={styles.scoreCols}>
                            <ThemedText weight="bold" style={styles.colStat}>{player.runs || 0}</ThemedText>
                            <ThemedText variant="small" style={styles.colStat}>{player.balls || 0}</ThemedText>
                            <ThemedText variant="small" style={styles.colStat}>{player.fours || 0}</ThemedText>
                            <ThemedText variant="small" style={styles.colStat}>{player.sixes || 0}</ThemedText>
                        </View>
                    </View>
                ))}
            </Card>

            <Card style={styles.tabCard}>
                <View style={styles.scorecardHeader}>
                    <ThemedText variant="small" weight="bold" style={styles.colName}>Bowling</ThemedText>
                    <View style={styles.scoreCols}>
                        <ThemedText variant="small" weight="bold" style={styles.colStat}>O</ThemedText>
                        <ThemedText variant="small" weight="bold" style={styles.colStat}>M</ThemedText>
                        <ThemedText variant="small" weight="bold" style={styles.colStat}>R</ThemedText>
                        <ThemedText variant="small" weight="bold" style={styles.colStat}>W</ThemedText>
                    </View>
                </View>
                {bowling.length === 0 && !loading && (
                    <ThemedText style={{ padding: spacing.md, textAlign: 'center' }} color="textSecondary">No bowling records found.</ThemedText>
                )}
                {bowling.map((bowler: any, idx: number) => (
                    <View key={bowler.playerId?._id || bowler.playerId || `bowl-${idx}`} style={[styles.playerRow, { borderBottomColor: theme.border + '50' }]}>
                        <ThemedText weight="semibold" style={[styles.playerNameCol, { color: theme.text }]}>{bowler.playerName || bowler.playerId?.name || 'Unknown'}</ThemedText>
                        <View style={styles.scoreCols}>
                            <ThemedText variant="small" style={styles.colStat}>{bowler.overs || '0.0'}</ThemedText>
                            <ThemedText variant="small" style={styles.colStat}>{bowler.maidens || 0}</ThemedText>
                            <ThemedText variant="small" style={styles.colStat}>{bowler.runs || 0}</ThemedText>
                            <ThemedText weight="bold" style={styles.colStat}>{bowler.wickets || 0}</ThemedText>
                        </View>
                    </View>
                ))}
            </Card>

            <Card style={styles.tabCard}>
                <ThemedText variant="subtitle" weight="bold" style={styles.cardTitle}>Partnerships</ThemedText>
                {partnerships.length === 0 && !loading && (
                    <ThemedText style={{ padding: spacing.md, textAlign: 'center' }} color="textSecondary">No partnership records found.</ThemedText>
                )}
                <View style={{ paddingVertical: spacing.sm }}>
                    {partnerships.map((part: any, idx: number) => {
                        const p1Name = part.batsman1Id?.shortName || part.batsman1Name || 'Batsman 1';
                        const p2Name = part.batsman2Id?.shortName || part.batsman2Name || 'Batsman 2';
                        const p1Runs = part.batsman1Runs || 0;
                        const p2Runs = part.batsman2Runs || 0;
                        const totalRuns = part.totalRuns || part.runs || 0;
                        const totalBalls = part.totalBalls || part.balls || 0;
                        const p1Pct = totalRuns > 0 ? (p1Runs / totalRuns) * 100 : 50;

                        return (
                            <View key={idx} style={[styles.partnershipRow, { borderBottomColor: theme.border + '30' }]}>
                                <View style={styles.partnershipPlayer}>
                                    <ThemedText variant="small" weight="bold" style={{ textAlign: 'left' }}>{p1Name}<View style={{ width: 5, height: 5, backgroundColor: theme.primary, borderRadius: 5, marginLeft: 2 }}></View></ThemedText>
                                    <ThemedText variant="caption" color="textSecondary">{p1Runs} runs</ThemedText>
                                </View>

                                <View style={styles.partnershipCenter}>
                                    <ThemedText weight="bold" color="primary">{totalRuns} ({totalBalls})</ThemedText>
                                    <View style={styles.partnershipBarContainer}>
                                        <View style={[styles.partnershipBar, { width: `${p1Pct}%`, backgroundColor: theme.primary, borderTopLeftRadius: 4, borderBottomLeftRadius: 4 }]} />
                                        <View style={[styles.partnershipBar, { width: `${100 - p1Pct}%`, backgroundColor: theme.secondary + '40', borderTopRightRadius: 4, borderBottomRightRadius: 4 }]} />
                                    </View>
                                </View>

                                <View style={[styles.partnershipPlayer, { alignItems: 'flex-end' }]}>
                                    <ThemedText variant="small" weight="bold" style={{ textAlign: 'right' }}><View style={{ width: 5, height: 5, backgroundColor: theme.secondary, borderRadius: 5, marginRight: 2 }}></View>{p2Name}</ThemedText>
                                    <ThemedText variant="caption" color="textSecondary">{p2Runs} runs</ThemedText>
                                </View>
                            </View>
                        );
                    })}
                </View>
            </Card>

            <View style={{ height: 100 }} />
        </ScrollView>
    );
};

const ScoreSummaryHeader = ({ liveStatus, match }: { liveStatus: any, match: any }) => {
    const { theme, isDark } = useTheme();
    const headerBg = isDark ? theme.surface : theme.primary;

    if (!liveStatus && !match) return <View style={[styles.liveScoreSection, { backgroundColor: headerBg }]} />

    const status = match?.status || 'scheduled';
    const isScheduled = status === 'scheduled';
    const isCompleted = status === 'completed';

    const teamCode = liveStatus?.battingTeamId?.shortName || liveStatus?.battingTeamId?.name || match?.teamAId?.shortName || 'T1';
    const score = liveStatus?.score || '0-0';
    const overs = liveStatus?.overs || '0.0';
    const crr = liveStatus?.runRate || '0.00';
    const toss = liveStatus?.toss?.tossText || liveStatus?.toss || match?.toss?.tossText || (isScheduled ? 'Toss Pending' : '');

    // Format Date/Time for scheduled matches
    const formatMatchTime = (dateStr: any) => {
        if (!dateStr) return 'Time Pending';
        try {
            const date = new Date(dateStr);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
        } catch { return 'Time Pending'; }
    };

    const formatMatchDate = (dateStr: any) => {
        if (!dateStr) return '';
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString([], { day: 'numeric', month: 'short' });
        } catch { return ''; }
    };

    return (
        <View style={[styles.liveScoreSection, { backgroundColor: headerBg }]}>
            <View style={styles.mainScoreRow}>
                {/* LEFT: Logo + Team/Score */}
                <View style={styles.leftInfoBlock}>
                    <View style={[styles.teamLogoBadge, { backgroundColor: isDark ? theme.background : 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.1)' }]}>
                        {match?.teamAId?.logo || match?.teamA?.logo ? <Image source={{ uri: match?.teamAId?.logo || match?.teamA?.logo }} style={styles.scoreTeamLogo} /> : <Ionicons name="shirt-outline" size={24} color="white" />}
                    </View>

                    <View style={styles.scoreTextsBlock}>
                        <View style={styles.teamCodeRow}>
                            <ThemedText weight="bold" color="white" style={styles.teamCodeText}>{teamCode}</ThemedText>
                            {isScheduled && (
                                <View style={[styles.p1Badge, { backgroundColor: '#f59e0b' }]}>
                                    <ThemedText color="white" weight="bold" style={styles.p1BadgeText}>UPCOMING</ThemedText>
                                </View>
                            )}
                            {liveStatus?.isPowerplay && !isScheduled && (
                                <View style={styles.p1Badge}>
                                    <ThemedText color="white" weight="bold" style={styles.p1BadgeText}>P1</ThemedText>
                                </View>
                            )}
                        </View>
                        <View style={styles.scoreRow}>
                            {isScheduled ? (
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <ThemedText variant="subtitle" weight="bold" color="white">{formatMatchTime(match?.matchDate)}</ThemedText>
                                    <ThemedText color="white" style={{ opacity: 0.8, fontSize: 12 }}>{formatMatchDate(match?.matchDate)}</ThemedText>
                                </View>
                            ) : (
                                <>
                                    <ThemedText variant="title" weight="bold" color="white" style={styles.liveScoreText}>{score}</ThemedText>
                                    <ThemedText color="white" style={[styles.oversText, { opacity: 0.8 }]}>{overs}</ThemedText>
                                </>
                            )}
                        </View>
                    </View>
                </View>

                {/* CENTER: Slanted Divider */}
                <View style={styles.dividerWrapper}>
                    <View style={[styles.scoreDivider, { backgroundColor: 'rgba(255,255,255,0.3)' }]} />
                </View>

                {/* RIGHT: Status / Result */}
                <View style={styles.secondaryScore}>
                    {(() => {
                        if (isCompleted) {
                            return (
                                <ThemedText style={[styles.normalStatusText, { color: '#fde047', fontSize: 14 }]} numberOfLines={2}>
                                    {match?.result?.resultText || 'Match Finished'}
                                </ThemedText>
                            );
                        }

                        if (isScheduled) {
                            return (
                                <Ionicons name="time-outline" size={32} color="#fde047" />
                            );
                        }

                        const val = (liveStatus?.currentBall || '0').toString().trim();
                        const isBig = ['0', '1', '2', '3', '4', '5', '6', 'w', 'wkt', 'wicket', 'wd', 'wide', 'nb', 'no ball', 'lb', 'b'].includes(val.toLowerCase());

                        return (
                            <ThemedText
                                style={[isBig ? styles.bigZeroText : styles.normalStatusText, { color: '#fde047' }]}
                                numberOfLines={isBig ? 1 : 2}
                                adjustsFontSizeToFit={isBig}
                            >
                                {val}
                            </ThemedText>
                        );
                    })()}
                </View>
            </View>

            <View style={[styles.crrTossRow, { borderTopColor: 'rgba(255,255,255,0.1)' }]}>
                {isScheduled ? (
                    <ThemedText color="white" variant="small" style={{ opacity: 0.8 }}>Countdown to Toss</ThemedText>
                ) : !isCompleted ? (
                    <ThemedText color="white" variant="small" style={{ opacity: 0.8 }}>CRR: {crr}</ThemedText>
                ) : (
                    <ThemedText color="white" variant="small" style={{ opacity: 0.8 }}>Match Concluded</ThemedText>
                )}
                <ThemedText color="white" variant="small" style={{ opacity: 0.8 }} numberOfLines={1}>{toss}</ThemedText>
            </View>
        </View>
    );
};

const BET_CATEGORIES = ['Match Odds', 'Session', 'Fancy', 'Tied Match', 'Custom'];

const AnimatedBall = ({ ball, isLast, theme, isDark }: { ball: any, isLast: boolean, theme: any, isDark: boolean }) => {
    const fallAnim = useRef(new Animated.Value(isLast ? -20 : 0)).current;

    useEffect(() => {
        if (isLast) {
            Animated.spring(fallAnim, {
                toValue: 0,
                friction: 6,
                tension: 40,
                useNativeDriver: true,
            }).start();
        }
    }, [isLast]);

    const runs = Number(ball.runs || 0);
    const label = (ball.ballLabel || '').toString().toLowerCase();

    const isWicket = ball.type === 'wicket' || ball.isWicket || label.includes('w');
    const isFour = runs === 4 || label === '4';
    const isSix = runs === 6 || label === '6';

    const getBallColor = () => {
        if (isWicket) return theme.error;
        if (isFour) return '#f97316'; // Admin Orange
        if (isSix) return theme.success;
        return isDark ? theme.card : theme.borderLight;
    };

    return (
        <Animated.View style={[
            styles.overBall,
            {
                backgroundColor: getBallColor(),
                borderColor: theme.border,
                borderWidth: 1,
                width: 28, height: 28, borderRadius: 14,
                marginRight: 4,
                transform: [{ translateY: fallAnim }]
            }
        ]}>
            <ThemedText variant="small" weight="bold" color={isWicket || isFour || isSix ? 'white' : 'text'}>
                {isWicket ? 'W' : ball.ballLabel || ball.runs}
            </ThemedText>
        </Animated.View>
    );
};

const LiveTab = ({ matchId, onTeamPress }: { matchId: string; onTeamPress: (index: 0 | 1) => void }) => {
    const { theme, isDark } = useTheme();
    const navigation = useNavigation<MatchDetailNavigationProp>();
    const dispatch = useAppDispatch();

    const {
        liveStatus,
        details: match,
        squads,
        scorecard: reduxScorecard,
        sessions: sessionsData,
        partnerships: partnershipsData,
        recentOvers: recentOversData,
        refreshing
    } = useAppSelector(state => state.match);

    const recentBallsScrollRef = useRef<ScrollView>(null);

    const onRefresh = useCallback(() => {
        dispatch(setRefreshing({ key: 'liveStatus', value: true }));
        const inning = liveStatus?.currentInning || 1;

        // Refresh all relevant data for the Live tab
        dispatch(fetchLiveStatus(matchId));
        dispatch(fetchScorecard({ matchId, inning }));
        dispatch(fetchPartnerships({ matchId, inning }));
        dispatch(fetchRecentOvers({ matchId, inning }));
        dispatch(fetchSessions(matchId));
        dispatch(fetchMatchDetails(matchId));
    }, [dispatch, matchId, liveStatus?.currentInning]);

    const currentScorecard = reduxScorecard[liveStatus?.currentInning || 1];
    const partnerships = partnershipsData || [];
    const recentOvers = recentOversData || [];

    // Derived stats for players
    const striker = useMemo(() => {
        const sid = liveStatus?.currentStrikerId?._id || liveStatus?.currentStrikerId;
        return currentScorecard?.batting?.find((p: any) => (p.playerId?._id || p.playerId) === sid) || null;
    }, [currentScorecard, liveStatus?.currentStrikerId]);

    const nonStriker = useMemo(() => {
        const nsid = liveStatus?.currentNonStrikerId?._id || liveStatus?.currentNonStrikerId;
        return currentScorecard?.batting?.find((p: any) => (p.playerId?._id || p.playerId) === nsid) || null;
    }, [currentScorecard, liveStatus?.currentNonStrikerId]);

    const bowler = useMemo(() => {
        const bid = liveStatus?.currentBowlerId?._id || liveStatus?.currentBowlerId;
        return currentScorecard?.bowling?.find((p: any) => (p.playerId?._id || p.playerId) === bid) || null;
    }, [currentScorecard, liveStatus?.currentBowlerId]);

    const currentPship = useMemo(() => {
        if (!partnerships || partnerships.length === 0) return null;
        return partnerships[partnerships.length - 1];
    }, [partnerships]);

    const lastWicket = useMemo(() => {
        return liveStatus?.lastWicket || null;
    }, [liveStatus]);

    // Flattened recent balls from multiple overs
    const recentBallsList = useMemo(() => {
        if (liveStatus?.recentBalls && Array.isArray(liveStatus.recentBalls)) {
            return liveStatus.recentBalls;
        }
        // Fallback to current over if recentBalls isn't available
        if (recentOvers?.overs && recentOvers.overs.length > 0) {
            const currentOverData = recentOvers.overs[recentOvers.overs.length - 1];
            return (currentOverData.ballsData || []).map((b: any) => ({ ...b, overNumber: currentOverData.overNumber, type: 'ball' }));
        }
        return [];
    }, [liveStatus, recentOvers]);

    // Auto-scroll recent balls to the end
    useEffect(() => {
        if (recentBallsList.length > 0) {
            setTimeout(() => {
                recentBallsScrollRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [recentBallsList]);

    const lastBallIndex = useMemo(() => {
        for (let i = recentBallsList.length - 1; i >= 0; i--) {
            if (recentBallsList[i].type === 'ball') return i;
        }
        return -1;
    }, [recentBallsList]);

    const latestOverNumber = useMemo(() => {
        if (recentBallsList.length > 0) {
            // Find the last item that is a ball to get the over number
            for (let i = recentBallsList.length - 1; i >= 0; i--) {
                if (recentBallsList[i].type === 'ball') return recentBallsList[i].overNumber;
            }
            return recentBallsList[recentBallsList.length - 1].overNumber;
        }
        return liveStatus?.currentOver || 0;
    }, [recentBallsList, liveStatus]);

    // Projected score logic
    const projScores = useMemo(() => {
        const crr = Number(liveStatus?.runRate || 0);
        const oversPerInning = match?.oversPerInning || 20;

        return [
            { label: 'Current RR', rr: crr.toFixed(2), total: Math.round(crr * oversPerInning) },
            { label: 'at 7 RR', rr: '7.0', total: Math.round(7.0 * (oversPerInning - (liveStatus?.currentOver || 0)) + (liveStatus?.innings?.[(liveStatus?.currentInning || 1) - 1]?.totalRuns || 0)) },
            { label: 'at 8 RR', rr: '8.0', total: Math.round(8.0 * (oversPerInning - (liveStatus?.currentOver || 0)) + (liveStatus?.innings?.[(liveStatus?.currentInning || 1) - 1]?.totalRuns || 0)) },
        ];
    }, [liveStatus, match]);

    // Format helpers
    const formatSR = (runs: number, balls: number) => {
        if (!balls || balls === 0) return '0.00';
        return ((runs / balls) * 100).toFixed(2);
    };

    const formatEcon = (runs: number, overs: any) => {
        if (!overs || parseFloat(overs) === 0) return '0.00';
        const oversFloat = typeof overs === 'string' ? parseFloat(overs) : overs;
        return (runs / oversFloat).toFixed(2);
    };

    // Add Entry State
    const [isAddEntryVisible, setIsAddEntryVisible] = useState(false);
    const [newClientName, setNewClientName] = useState('');
    const [newAmount, setNewAmount] = useState('');
    const [newRate, setNewRate] = useState('');
    const [newCategory, setNewCategory] = useState(BET_CATEGORIES[0]);
    const [newSessionChoice, setNewSessionChoice] = useState<'Yes' | 'No'>('Yes');
    const [newType, setNewType] = useState<'plus' | 'minus' | 'pending'>('pending');
    const [isCategorySelectorVisible, setIsCategorySelectorVisible] = useState(false);

    const handleAddEntry = () => {
        if (!newClientName.trim() || !newAmount || isNaN(Number(newAmount))) {
            alert("Please enter a valid client name and amount.");
            return;
        }
        alert(`Entry saved for ${newClientName}: ₹${newAmount} against ${matchId}`);
        setIsAddEntryVisible(false);
        setNewClientName('');
        setNewAmount('');
        setNewRate('');
        setNewType('pending');
        setNewCategory(BET_CATEGORIES[0]);
        setNewSessionChoice('Yes');
    };

    if (match?.status === 'scheduled') {
        const matchDate = match?.matchDate ? new Date(match.matchDate) : null;
        return (
            <ScrollView
                style={[styles.tabContent, { backgroundColor: theme.background }]}
                contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing.liveStatus}
                        onRefresh={onRefresh}
                        colors={[theme.primary]}
                        tintColor={theme.primary}
                    />
                }
            >
                <View style={{ alignItems: 'center', gap: spacing.lg }}>
                    <View style={[styles.teamLogoBadge, { width: 80, height: 80, borderRadius: 40, backgroundColor: theme.primary + '20' }]}>
                        <Ionicons name="calendar-outline" size={40} color={theme.primary} />
                    </View>
                    <View style={{ alignItems: 'center' }}>
                        <ThemedText variant="subtitle" weight="bold">Match Not Started</ThemedText>
                        <ThemedText color="textSecondary" align="center" style={{ marginTop: spacing.xs }}>
                            Live scores, commentary, and ball-by-ball updates will be available once the match begins.
                        </ThemedText>
                    </View>

                    {matchDate && (
                        <Card style={{ paddingHorizontal: spacing.xl, paddingVertical: spacing.md, alignItems: 'center', borderColor: theme.border }}>
                            <ThemedText variant="caption" color="textSecondary" weight="bold">STARTING AT</ThemedText>
                            <ThemedText variant="title" weight="bold" color="primary" style={{ marginVertical: 4 }}>
                                {matchDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                            </ThemedText>
                            <ThemedText variant="small" weight="medium">
                                {matchDate.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })}
                            </ThemedText>
                        </Card>
                    )}

                    <View style={{ width: '100%', gap: spacing.md, marginTop: spacing.md }}>
                        <TeamSquadButton
                            squad={resolveSquad(squads, match?.teamAId, 0)}
                            team={match?.teamAId}
                            teamIndex={0}
                            onPress={onTeamPress}
                            isDark={isDark}
                            theme={theme}
                        />
                        <TeamSquadButton
                            squad={resolveSquad(squads, match?.teamBId, 1)}
                            team={match?.teamBId}
                            teamIndex={1}
                            onPress={onTeamPress}
                            isDark={isDark}
                            theme={theme}
                        />
                    </View>
                </View>
            </ScrollView>
        );
    }

    return (
        <View style={styles.tabContentContainer}>
            <ScrollView
                style={[styles.tabContent, { backgroundColor: theme.background }]}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing.liveStatus}
                        onRefresh={onRefresh}
                        colors={[theme.primary]}
                        tintColor={theme.primary}
                    />
                }
            >
                {/* Over Summary Section */}
                <View style={[styles.overSummaryRow, { backgroundColor: isDark ? theme.surface : theme.background, borderBottomColor: theme.border }]}>
                    <ScrollView
                        ref={recentBallsScrollRef}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.overScrollContent}
                    >
                        <View style={styles.overBallsRow}>
                            {recentBallsList.length > 0 ? (
                                <>
                                    <ThemedText color="textSecondary" variant="small" style={{ marginRight: 8 }}>Recent:</ThemedText>
                                    {recentBallsList.map((ball: any, bIdx: number) => {
                                        if (ball.type === 'over_start') {
                                            return (
                                                <ThemedText key={`ostart-${bIdx}`} color="textSecondary" weight="bold" variant="small" style={{ marginRight: 4 }}>
                                                    {`Ov ${ball.overNumber}:`}
                                                </ThemedText>
                                            );
                                        }
                                        if (ball.type === 'over_summary') {
                                            return (
                                                <View key={`os-${bIdx}`} style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                    <View style={[styles.overSummaryMarker, { backgroundColor: theme.primaryLight + '25', borderWidth: 1, borderColor: theme.primaryLight + '40' }]}>
                                                        <ThemedText color="primaryDark" weight="bold" variant="small">
                                                            {` = ${ball.runs} `}
                                                        </ThemedText>
                                                    </View>
                                                    <ThemedText color="textSecondary" style={{ marginHorizontal: 6, opacity: 0.5 }}>|</ThemedText>
                                                </View>
                                            );
                                        }
                                        return (
                                            <AnimatedBall
                                                key={`${bIdx}-${ball.ballId || bIdx}`}
                                                ball={ball}
                                                isLast={bIdx === lastBallIndex}
                                                theme={theme}
                                                isDark={isDark}
                                            />
                                        );
                                    })}
                                </>
                            ) : (
                                <ThemedText color="textSecondary" variant="small">Waiting for live data...</ThemedText>
                            )}
                        </View>
                    </ScrollView>
                </View>

                {/* Team Header with Quick Scores */}
                <View style={[styles.liveTeamHeader, { marginBottom: spacing.xs }]}>
                    <View style={styles.teamLabelRow}>
                        <ThemedText weight="bold" variant="subtitle">{liveStatus?.battingTeamId?.name || 'Batting Team'}</ThemedText>
                        <Ionicons name="information-circle-outline" size={14} color={theme.textSecondary} />
                    </View>
                    <View style={styles.teamScoreBadges}>
                        <View style={[styles.badgeLabel, { backgroundColor: isDark ? theme.surface : theme.borderLight }]}>
                            <ThemedText variant="small" weight="bold">{liveStatus?.battingTeamId?.shortName || '-'}</ThemedText>
                            <Ionicons name="flashlight" size={12} color={theme.primary} style={styles.batIconSmall} />
                        </View>
                    </View>
                </View>

                {/* Consolidated Market Section (Odds, Session, Lambi) */}
                <View style={{ paddingHorizontal: spacing.md, marginBottom: spacing.md }}>
                    <Card style={{ padding: spacing.xs, backgroundColor: isDark ? theme.surface : theme.borderLight, borderColor: theme.border }}>
                        {/* Match Odds Row */}
                        {(liveStatus?.oddsBlue !== undefined || liveStatus?.oddsRed !== undefined) && (
                            <View style={[styles.sessionRow, { backgroundColor: 'transparent', paddingHorizontal: spacing.xs, height: 40, marginBottom: 2, borderBottomWidth: (liveStatus?.session || liveStatus?.lambi) ? StyleSheet.hairlineWidth : 0, borderBottomColor: theme.border }]}>
                                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <Ionicons
                                        name={(liveStatus.oddsTeam === liveStatus.bowlingTeamId?.shortName) ? "baseball-outline" : "flashlight"}
                                        size={14}
                                        color={theme.primary}
                                    />
                                    <ThemedText weight="bold" variant="small" numberOfLines={1}>{liveStatus.oddsTeam || liveStatus.battingTeamId?.shortName || 'Market'}</ThemedText>
                                </View>
                                <View style={{ flexDirection: 'row', gap: 8 }}>
                                    <View style={[styles.oddsBox, styles.oddsBoxBlue, { height: 32, width: 45 }]}>
                                        <ThemedText style={[styles.oddsText, { fontSize: 12 }]}>{liveStatus.oddsBlue || '-'}</ThemedText>
                                    </View>
                                    <View style={[styles.oddsBox, styles.oddsBoxRed, { height: 32, width: 45 }]}>
                                        <ThemedText style={[styles.oddsText, { fontSize: 12 }]}>{liveStatus.oddsRed || '-'}</ThemedText>
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* Current Session Row */}
                        {(liveStatus?.session || liveStatus?.sessionBlue || liveStatus?.sessionRed) && (
                            <View style={[styles.sessionRow, { backgroundColor: 'transparent', paddingHorizontal: spacing.xs, height: 40, marginBottom: 2, borderBottomWidth: (liveStatus?.lambi || liveStatus?.lambiBlue) ? StyleSheet.hairlineWidth : 0, borderBottomColor: theme.border }]}>
                                <View style={{ flex: 1 }}>
                                    <ThemedText weight="bold" variant="small">{liveStatus.session ? `${liveStatus.session} Overs` : 'Session'}</ThemedText>
                                </View>
                                <View style={{ flexDirection: 'row', gap: 8 }}>
                                    <View style={[styles.oddsBox, styles.oddsBoxBlue, { height: 32, width: 45 }]}>
                                        <ThemedText style={[styles.oddsText, { fontSize: 12 }]}>{liveStatus.sessionBlue || '-'}</ThemedText>
                                    </View>
                                    <View style={[styles.oddsBox, styles.oddsBoxRed, { height: 32, width: 45 }]}>
                                        <ThemedText style={[styles.oddsText, { fontSize: 12 }]}>{liveStatus.sessionRed || '-'}</ThemedText>
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* Lambi Row */}
                        {(liveStatus?.lambi !== undefined || liveStatus?.lambiBlue !== undefined || liveStatus?.lambiRed !== undefined) && (
                            <View style={[styles.sessionRow, { backgroundColor: 'transparent', paddingHorizontal: spacing.xs, height: 40, borderBottomWidth: 0 }]}>
                                <View style={{ flex: 1 }}>
                                    <ThemedText weight="bold" variant="small">{liveStatus.lambi ? `${liveStatus.lambi} Overs` : 'Inning Fixed'}</ThemedText>
                                </View>
                                <View style={{ flexDirection: 'row', gap: 8 }}>
                                    <View style={[styles.oddsBox, styles.oddsBoxBlue, { height: 32, width: 45 }]}>
                                        <ThemedText style={[styles.oddsText, { fontSize: 12 }]}>{liveStatus.lambiBlue || '-'}</ThemedText>
                                    </View>
                                    <View style={[styles.oddsBox, styles.oddsBoxRed, { height: 32, width: 45 }]}>
                                        <ThemedText style={[styles.oddsText, { fontSize: 12 }]}>{liveStatus.lambiRed || '-'}</ThemedText>
                                    </View>
                                </View>
                            </View>
                        )}
                    </Card>
                </View>

                {/* Batting Stats Table */}
                <View style={styles.statsTable}>
                    <View style={[styles.tableHeader, { borderBottomColor: theme.border }]}>
                        <ThemedText variant="caption" color="textSecondary" style={styles.colBatter}>Batter</ThemedText>
                        <ThemedText variant="caption" color="textSecondary" style={styles.colStatSmall}>R (B)</ThemedText>
                        <ThemedText variant="caption" color="textSecondary" style={styles.colStatSmall}>4s</ThemedText>
                        <ThemedText variant="caption" color="textSecondary" style={styles.colStatSmall}>6s</ThemedText>
                        <ThemedText variant="caption" color="textSecondary" style={styles.colStatSmall}>SR</ThemedText>
                    </View>

                    {striker ? (
                        <View style={[styles.tableRow, { borderBottomColor: theme.border }]}>
                            <View style={[styles.colBatter, { flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
                                <ThemedText weight="bold" style={{ color: theme.primary }}>{striker.playerName || striker.playerId?.name || 'Striker'}</ThemedText>
                                <Ionicons name="flashlight" size={12} color={theme.primary} style={styles.batIconSmall} />
                            </View>
                            <ThemedText weight="medium" style={styles.colStatSmall}>{striker.runs || 0} ({striker.balls || 0})</ThemedText>
                            <ThemedText style={styles.colStatSmall}>{striker.fours || 0}</ThemedText>
                            <ThemedText style={styles.colStatSmall}>{striker.sixes || 0}</ThemedText>
                            <ThemedText style={styles.colStatSmall}>{formatSR(striker.runs, striker.balls)}</ThemedText>
                        </View>
                    ) : (
                        <ThemedText style={{ padding: spacing.sm, textAlign: 'center' }} color="textSecondary">No Striker Active</ThemedText>
                    )}

                    {nonStriker && (
                        <View style={[styles.tableRow, { borderBottomColor: theme.border }]}>
                            <ThemedText weight="bold" style={styles.colBatter} color="textSecondary">{nonStriker.playerName || nonStriker.playerId?.name || 'Non-Striker'}</ThemedText>
                            <ThemedText weight="medium" style={styles.colStatSmall}>{nonStriker.runs || 0} ({nonStriker.balls || 0})</ThemedText>
                            <ThemedText style={styles.colStatSmall}>{nonStriker.fours || 0}</ThemedText>
                            <ThemedText style={styles.colStatSmall}>{nonStriker.sixes || 0}</ThemedText>
                            <ThemedText style={styles.colStatSmall}>{formatSR(nonStriker.runs, nonStriker.balls)}</ThemedText>
                        </View>
                    )}
                </View>

                {/* Partnership Strip */}
                <View style={[styles.partnershipStrip, { backgroundColor: isDark ? theme.surface : theme.borderLight }]}>
                    <ThemedText color="textSecondary" variant="small">
                        {currentPship ? `P'ship: ${currentPship.totalRuns || currentPship.runs || 0} (${currentPship.totalBalls || currentPship.balls || 0}) >` : "Waiting for partnership data..."}
                    </ThemedText>
                    <ThemedText color="textSecondary" variant="small">
                        {lastWicket ? `Last wkt: ${lastWicket.playerName || lastWicket.name || 'Player'} ${lastWicket.runs || 0} (${lastWicket.balls || 0})` : ""}
                    </ThemedText>
                </View>

                {/* Bowling Stats Table */}
                <View style={styles.statsTable}>
                    <View style={[styles.tableHeader, { borderBottomColor: theme.border }]}>
                        <ThemedText variant="caption" color="textSecondary" style={styles.colBatter}>Bowler</ThemedText>
                        <ThemedText variant="caption" color="textSecondary" style={styles.colStatSmall}>W-R</ThemedText>
                        <ThemedText variant="caption" color="textSecondary" style={styles.colStatSmall}>Ours</ThemedText>
                        <ThemedText variant="caption" color="textSecondary" style={styles.colStatSmall}>Econ</ThemedText>
                    </View>

                    {bowler ? (
                        <View style={[styles.tableRow, { borderBottomColor: theme.border }]}>
                            <ThemedText weight="bold" style={styles.colBatter}>{bowler.playerName || bowler.playerId?.name || 'Bowler'}</ThemedText>
                            <ThemedText weight="medium" style={styles.colStatSmall}>{bowler.wickets || 0}-{bowler.runs || 0}</ThemedText>
                            <ThemedText style={styles.colStatSmall}>{bowler.overs || '0.0'}</ThemedText>
                            <ThemedText style={styles.colStatSmall}>{formatEcon(bowler.runs, bowler.overs)}</ThemedText>
                        </View>
                    ) : (
                        <ThemedText style={{ padding: spacing.sm, textAlign: 'center' }} color="textSecondary">No Bowler Active</ThemedText>
                    )}
                </View>


                {/* Projected Score Table */}
                <View style={[styles.projectedSection, { backgroundColor: isDark ? theme.surface : theme.borderLight, borderTopColor: theme.border, borderTopWidth: 1 }]}>
                    <ThemedText color="textSecondary" variant="caption" weight="bold" style={{ marginBottom: spacing.md }}>PROJECTED SCORE</ThemedText>
                    <View style={styles.projTable}>
                        <View style={styles.projRow}>
                            <ThemedText variant="caption" color="textSecondary" style={styles.projColHeader}>Run Rate</ThemedText>
                            <ThemedText variant="caption" color="textSecondary" style={styles.projColValue}>20 overs</ThemedText>
                            <ThemedText variant="caption" color="textSecondary" style={styles.projColValue}>50 overs</ThemedText>
                        </View>
                        {projScores.map((score, sIdx) => (
                            <View key={sIdx} style={[styles.projRow, sIdx === projScores.length - 1 && { borderBottomWidth: 0 }]}>
                                <ThemedText color={sIdx === 0 ? "primary" : "textSecondary"} weight="bold" style={styles.projColHeader}>{score.rr}{sIdx === 0 ? '*' : ''}</ThemedText>
                                <ThemedText weight="bold" color={sIdx === 0 ? "text" : "textSecondary"} style={styles.projColValue}>{score.total}</ThemedText>
                                <ThemedText weight="bold" color={sIdx === 0 ? "text" : "textSecondary"} style={styles.projColValue}>{Math.round(parseFloat(score.rr) * 50)}</ThemedText>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Prediction Section */}
                <View style={[styles.predictionSection, { backgroundColor: isDark ? theme.surface : theme.borderLight }]}>
                    <View style={styles.predictionHeaderRow}>
                        <ThemedText variant="subtitle" weight="bold">Who will win?</ThemedText>
                        <ThemedText variant="caption" color="textSecondary">Total Votes: 36,179</ThemedText>
                    </View>
                    <View style={styles.predictionButtonsRow}>
                        <TouchableOpacity style={[styles.predButton, { borderColor: theme.border, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#fff' }]}>
                            <ThemedText weight="bold" color="text">{match?.teamAId?.shortName || match?.innings?.[0]?.battingTeamId?.shortName || '-'}</ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.predButton, { borderColor: theme.border, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#fff' }]}>
                            <ThemedText weight="bold" color="text">{match?.teamBId?.shortName || match?.innings?.[0]?.bowlingTeamId?.shortName || '-'}</ThemedText>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Floating Quick Entry Button */}
            <TouchableOpacity
                style={[styles.fab, { backgroundColor: theme.primary }]}
                onPress={() => setIsAddEntryVisible(true)}
            >
                <Ionicons name="pencil" size={24} color="white" />
            </TouchableOpacity>

            {/* Independent Add Entry Modal */}
            <Modal visible={isAddEntryVisible} transparent animationType="fade">
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <TouchableOpacity style={styles.modalBg} onPress={() => setIsAddEntryVisible(false)} />
                    <View style={[styles.dialogCard, { backgroundColor: theme.surface }]}>
                        <ThemedText variant="subtitle" weight="bold" style={{ marginBottom: spacing.md }}>Add Entry (Live)</ThemedText>

                        <View style={{ marginBottom: spacing.md }}>
                            <ThemedText variant="small" color="textSecondary" style={{ marginBottom: 4 }}>Client Name</ThemedText>
                            <TextInput
                                style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                                placeholder="Enter client name"
                                placeholderTextColor={theme.textLight}
                                value={newClientName}
                                onChangeText={setNewClientName}
                            />
                        </View>

                        <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md }}>
                            <View style={{ flex: 1 }}>
                                <ThemedText variant="small" color="textSecondary" style={{ marginBottom: 4 }}>Amount (₹)</ThemedText>
                                <TextInput
                                    style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                                    placeholder="e.g. 5000"
                                    placeholderTextColor={theme.textLight}
                                    keyboardType="numeric"
                                    value={newAmount}
                                    onChangeText={setNewAmount}
                                />
                            </View>

                            <View style={{ flex: 1 }}>
                                <ThemedText variant="small" color="textSecondary" style={{ marginBottom: 4 }}>Rate / Odds</ThemedText>
                                <TextInput
                                    style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                                    placeholder="e.g. 1.85 or 55"
                                    placeholderTextColor={theme.textLight}
                                    keyboardType="numeric"
                                    value={newRate}
                                    onChangeText={setNewRate}
                                />
                            </View>
                        </View>

                        <View style={{ marginBottom: spacing.lg }}>
                            <ThemedText variant="small" color="textSecondary" style={{ marginBottom: 4 }}>Bet Category</ThemedText>
                            <TouchableOpacity
                                style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}
                                onPress={() => setIsCategorySelectorVisible(!isCategorySelectorVisible)}
                            >
                                <ThemedText>{newCategory}</ThemedText>
                                <Ionicons name={isCategorySelectorVisible ? "chevron-up" : "chevron-down"} size={20} color={theme.textLight} />
                            </TouchableOpacity>

                            {isCategorySelectorVisible && (
                                <View style={[styles.dropdownMenu, { backgroundColor: theme.background, borderColor: theme.border }]}>
                                    {BET_CATEGORIES.map((cat, index) => (
                                        <TouchableOpacity
                                            key={cat}
                                            style={[styles.dropdownItem, index < BET_CATEGORIES.length - 1 && { borderBottomColor: theme.border, borderBottomWidth: 1 }]}
                                            onPress={() => {
                                                setNewCategory(cat);
                                                setIsCategorySelectorVisible(false);
                                            }}
                                        >
                                            <ThemedText color={newCategory === cat ? 'primary' : 'text'}>{cat}</ThemedText>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>

                        {(newCategory === 'Session' || newCategory === 'Fancy') && (
                            <View style={{ marginBottom: spacing.lg }}>
                                <ThemedText variant="small" color="textSecondary" style={{ marginBottom: 8 }}>Session Choice</ThemedText>
                                <View style={{ flexDirection: 'row', gap: spacing.md }}>
                                    <TouchableOpacity
                                        style={[
                                            styles.typeButton,
                                            { backgroundColor: newSessionChoice === 'Yes' ? theme.primaryLight : theme.background, borderColor: newSessionChoice === 'Yes' ? theme.primary : theme.border }
                                        ]}
                                        onPress={() => setNewSessionChoice('Yes')}
                                    >
                                        <ThemedText variant="small" weight="bold" color={newSessionChoice === 'Yes' ? 'primary' : 'textSecondary'}>Yes (Lagai)</ThemedText>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[
                                            styles.typeButton,
                                            { backgroundColor: newSessionChoice === 'No' ? '#FF3B3015' : theme.background, borderColor: newSessionChoice === 'No' ? '#FF3B30' : theme.border }
                                        ]}
                                        onPress={() => setNewSessionChoice('No')}
                                    >
                                        <ThemedText variant="small" weight="bold" color={newSessionChoice === 'No' ? 'error' : 'textSecondary'}>No (Khai)</ThemedText>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl }}>
                            <TouchableOpacity
                                style={[
                                    styles.typeButton,
                                    { backgroundColor: newType === 'pending' ? theme.primaryLight : theme.background, borderColor: newType === 'pending' ? theme.primary : theme.border }
                                ]}
                                onPress={() => setNewType('pending')}
                            >
                                <ThemedText variant="small" weight="bold" color={newType === 'pending' ? 'primary' : 'textSecondary'}>Pending</ThemedText>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.typeButton,
                                    { backgroundColor: newType === 'plus' ? '#22c55e' : theme.background, borderColor: newType === 'plus' ? '#22c55e' : theme.border }
                                ]}
                                onPress={() => setNewType('plus')}
                            >
                                <ThemedText variant="small" weight="bold" color={newType === 'plus' ? 'white' : 'textSecondary'}>Plus (+)</ThemedText>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.typeButton,
                                    { backgroundColor: newType === 'minus' ? '#ef4444' : theme.background, borderColor: newType === 'minus' ? '#ef4444' : theme.border }
                                ]}
                                onPress={() => setNewType('minus')}
                            >
                                <ThemedText variant="small" weight="bold" color={newType === 'minus' ? 'white' : 'textSecondary'}>Minus (-)</ThemedText>
                            </TouchableOpacity>
                        </View>

                        <View style={{ flexDirection: 'row', gap: spacing.md, justifyContent: 'flex-end' }}>
                            <TouchableOpacity style={{ padding: spacing.sm }} onPress={() => setIsAddEntryVisible(false)}>
                                <ThemedText color="textSecondary" weight="bold">Cancel</ThemedText>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.saveButton, { backgroundColor: theme.primary }]} onPress={handleAddEntry}>
                                <ThemedText color="white" weight="bold">Save Entry</ThemedText>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
};

const FANTASY_TOP_PLAYERS = [
    { name: 'Tony de Zorzi', points: 145, team: 'WP', image: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=100' },
    { name: 'Kyle Verreynne', points: 112, team: 'WP', image: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=100' },
    { name: 'Reeza Hendricks', points: 98, team: 'LIO', image: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=100' },
    { name: 'Wiaan Mulder', points: 87, team: 'LIO', image: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=100' },
    { name: 'George Linde', points: 76, team: 'WP', image: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=100' },
];

const SERIES_STATS = {
    mostRuns: [
        { name: 'Tony de Zorzi', value: 450, team: 'WP' },
        { name: 'Reeza Hendricks', value: 380, team: 'LIO' },
    ],
    mostWickets: [
        { name: 'Kagiso Rabada', value: 12, team: 'LIO' },
        { name: 'Wayne Parnell', value: 10, team: 'WP' },
    ],
    mostSixes: [
        { name: 'Shubman Gill', value: 15, team: 'IND' },
    ],
    highestScores: [
        { name: 'David Warner', value: 163, team: 'AUS' },
    ],
};


// --- Tab Components ---

const FantasyTab = ({ onViewAll, onAnalysis }: { onViewAll: () => void, onAnalysis: (type: string) => void }) => {
    const { theme, isDark } = useTheme();
    const dispatch = useAppDispatch();
    const { refreshing } = useAppSelector(state => state.match);

    const onRefresh = useCallback(() => {
        dispatch(setRefreshing({ key: 'details', value: true }));
        setTimeout(() => {
            dispatch(setRefreshing({ key: 'details', value: false }));
        }, 1000);
    }, [dispatch]);

    return (
        <ScrollView
            style={[styles.tabContent, { backgroundColor: theme.background }]}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing.details}
                    onRefresh={onRefresh}
                    colors={[theme.primary]}
                    tintColor={theme.primary}
                />
            }
        >
            {/* Top Fantasy Points Players */}
            <View style={{ paddingVertical: spacing.md }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, marginBottom: spacing.sm }}>
                    <ThemedText variant="subtitle" weight="bold">Top Fantasy Points</ThemedText>
                    <TouchableOpacity onPress={onViewAll}>
                        <ThemedText color="primary" weight="bold" variant="small">View All</ThemedText>
                    </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.md, gap: spacing.md }}>
                    {FANTASY_TOP_PLAYERS.map((player, idx) => (
                        <Card key={idx} style={[styles.fantasyPlayerCard, { borderColor: theme.border, width: 120 }]}>
                            <View style={[styles.fantasyAvatarPlaceholder, { backgroundColor: theme.primary + '20' }]}>
                                <Ionicons name="person" size={24} color={theme.primary} />
                                <View style={[styles.fantasyPointsBadge, { backgroundColor: theme.primary }]}>
                                    <ThemedText color="white" weight="bold" style={{ fontSize: 10 }}>{player.points}</ThemedText>
                                </View>
                            </View>
                            <ThemedText weight="bold" variant="small" numberOfLines={1} style={{ textAlign: 'center', marginTop: 4 }}>{player.name}</ThemedText>
                            <ThemedText variant="caption" color="textSecondary" style={{ textAlign: 'center' }}>{player.team} • {player.points} pts</ThemedText>
                        </Card>
                    ))}
                </ScrollView>
            </View>

            {/* Expert Selection */}
            <Card style={styles.tabCard}>
                <ThemedText variant="subtitle" weight="bold" style={styles.cardTitle}>Expert Fantasy XI</ThemedText>
                <View style={styles.fantasyXiContainer}>
                    <View style={styles.xiSection}>
                        <ThemedText variant="caption" weight="bold" color="primary" style={{ width: 40 }}>WK</ThemedText>
                        <ThemedText variant="small">KL Rahul</ThemedText>
                    </View>
                    <View style={styles.xiSection}>
                        <ThemedText variant="small">Jasprit Bumrah, Mohammed Shami, Adam Zampa</ThemedText>
                    </View>
                </View>
            </Card>

            {/* Series Stats Section */}
            <View style={{ paddingHorizontal: spacing.md, marginTop: spacing.md }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
                    <ThemedText variant="subtitle" weight="bold">Player Stats in Series</ThemedText>
                    <TouchableOpacity onPress={() => onAnalysis('mostRuns')}>
                        <ThemedText color="primary" weight="bold" variant="small">Analysts {`>`}</ThemedText>
                    </TouchableOpacity>
                </View>

                <View style={{ gap: spacing.md }}>
                    {[
                        { label: 'Most Runs', data: SERIES_STATS.mostRuns[0], type: 'mostRuns' },
                        { label: 'Most Wickets', data: SERIES_STATS.mostWickets[0], type: 'mostWickets' },
                        { label: 'Most Sixes', data: SERIES_STATS.mostSixes[0], type: 'mostSixes' },
                        { label: 'Highest Scores', data: SERIES_STATS.highestScores[0], type: 'highestScores' },
                        { label: 'Best Figures', data: { name: 'Kagiso Rabada', value: '4/25', team: 'LIO' }, type: 'bestFigures' },
                        { label: 'Best Strike Rate', data: { name: 'Reeza Hendricks', value: '165.4', team: 'LIO' }, type: 'bestSR' },
                        { label: 'Best Economy', data: { name: 'George Linde', value: '3.42', team: 'WP' }, type: 'bestEco' },
                    ].map((stat, idx) => (
                        <TouchableOpacity
                            key={idx}
                            onPress={() => onAnalysis(stat.type)}
                            style={[styles.statListCard, { backgroundColor: isDark ? theme.surface : theme.borderLight, borderColor: theme.border }]}
                        >
                            <View style={{ flex: 1 }}>
                                <ThemedText color="textSecondary" variant="caption" weight="bold">{stat.label.toUpperCase()}</ThemedText>
                                <ThemedText weight="bold">{stat.data.name}</ThemedText>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <ThemedText weight="bold" color="primary" variant="subtitle">{stat.data.value}</ThemedText>
                                <ThemedText variant="caption" color="textSecondary">{stat.data.team}</ThemedText>
                            </View>
                            <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} style={{ marginLeft: 8 }} />
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={{ height: 100 }} />
        </ScrollView>
    );
};

const GraphsTab = () => {
    const { theme } = useTheme();
    const dispatch = useAppDispatch();
    const { refreshing } = useAppSelector(state => state.match);

    const onRefresh = useCallback(() => {
        dispatch(setRefreshing({ key: 'details', value: true }));
        setTimeout(() => {
            dispatch(setRefreshing({ key: 'details', value: false }));
        }, 1000);
    }, [dispatch]);

    return (
        <ScrollView
            style={[styles.tabContent, { backgroundColor: theme.background }]}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing.details}
                    onRefresh={onRefresh}
                    colors={[theme.primary]}
                    tintColor={theme.primary}
                />
            }
        >
            <Card style={styles.tabCard}>
                <ThemedText variant="subtitle" weight="bold" style={styles.cardTitle}>Run Rate Comparison</ThemedText>
                <View style={styles.graphPlaceholder}>
                    <Ionicons name="stats-chart" size={100} color={theme.primary + '30'} />
                    <ThemedText color="textSecondary">Wagon Wheel & Run Rate Graphs</ThemedText>
                </View>
            </Card>

            <Card style={styles.tabCard}>
                <ThemedText variant="subtitle" weight="bold" style={styles.cardTitle}>Manhattan Chart</ThemedText>
                <View style={styles.manhattanContainer}>
                    {[12, 8, 15, 4, 10, 6, 20, 14, 5, 9].map((val, idx) => (
                        <View key={idx} style={[styles.manhattanBar, { height: val * 4, backgroundColor: theme.primary }]} />
                    ))}
                </View>
                <ThemedText variant="caption" align="center" style={{ marginTop: 8 }}>Overs 41-50</ThemedText>
            </Card>
        </ScrollView>
    );
};

const PointsTableTab = ({ seriesId }: { seriesId: string }) => {
    const { theme, isDark } = useTheme();
    const dispatch = useAppDispatch();
    const { pointsTable, loading, refreshing } = useAppSelector(state => state.match);

    const onRefresh = useCallback(() => {
        if (!seriesId) return;
        dispatch(setRefreshing({ key: 'pointsTable', value: true }));
        dispatch(fetchPointsTable(seriesId));
    }, [dispatch, seriesId]);

    const isLoading = loading.pointsTable && pointsTable.length === 0;

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl }}>
                <ThemedText color="textSecondary">Loading standings...</ThemedText>
            </View>
        );
    }

    if (!seriesId || !pointsTable || pointsTable.length === 0) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl }}>
                <Ionicons name="stats-chart-outline" size={48} color={theme.textSecondary} />
                <ThemedText color="textSecondary" style={{ marginTop: spacing.md, textAlign: 'center' }}>
                    Points table not available for this series.
                </ThemedText>
            </View>
        );
    }

    return (
        <ScrollView
            style={[styles.tabContent, { backgroundColor: theme.background }]}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing.pointsTable}
                    onRefresh={onRefresh}
                    colors={[theme.primary]}
                    tintColor={theme.primary}
                />
            }
        >
            <Card style={styles.tabCard}>
                <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: '#22c55e', alignItems: 'center', justifyContent: 'center' }}>
                            <ThemedText color="white" style={{ fontSize: 8 }}>Q</ThemedText>
                        </View>
                        <ThemedText variant="caption" color="textSecondary">Qualified</ThemedText>
                    </View>
                </View>

                <View style={[styles.pointsTableHeader, { borderBottomColor: theme.border }]}>
                    <ThemedText variant="small" weight="bold" style={styles.colRank}>#</ThemedText>
                    <ThemedText variant="small" weight="bold" style={styles.colTeam}>TEAM</ThemedText>
                    <ThemedText variant="small" weight="bold" style={styles.colStatMini}>P</ThemedText>
                    <ThemedText variant="small" weight="bold" style={styles.colStatMini}>W</ThemedText>
                    <ThemedText variant="small" weight="bold" style={styles.colStatMini}>L</ThemedText>
                    <ThemedText variant="small" weight="bold" style={styles.colStatMini}>T/NR</ThemedText>
                    <ThemedText variant="small" weight="bold" style={styles.colNrrCompact}>NRR</ThemedText>
                    <ThemedText variant="small" weight="bold" style={styles.colStatMini}>PTS</ThemedText>
                </View>
                {pointsTable.map((item: any, idx: number) => {
                    const team = item.teamId;
                    const nrr = Number(item.netRunRate || 0).toFixed(3);
                    const nrrPrefix = Number(nrr) > 0 ? '+' : '';

                    return (
                        <View key={idx} style={[styles.pointsTableRow, { borderBottomColor: theme.border + '50' }]}>
                            <View style={styles.colRank}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                                    <ThemedText style={{ fontSize: 11, fontWeight: 'bold' }}>{item.position || idx + 1}</ThemedText>
                                    {item.qualify && (
                                        <View style={{
                                            width: 12,
                                            height: 12,
                                            borderRadius: 6,
                                            backgroundColor: '#22c55e',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <ThemedText color="white" style={{ fontSize: 7, fontWeight: 'bold' }}>Q</ThemedText>
                                        </View>
                                    )}
                                </View>
                            </View>
                            <View style={[styles.colTeam, { flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
                                <View style={[styles.teamLogoBadgeSmall, { width: 18, height: 18 }]}>
                                    {team?.logo
                                        ? <Image source={{ uri: team.logo }} style={{ width: 14, height: 14 }} />
                                        : <ThemedText weight="bold" style={{ fontSize: 8 }}>{team?.shortName?.[0] || 'T'}</ThemedText>
                                    }
                                </View>
                                <ThemedText style={{ fontSize: 11, fontWeight: 'bold' }}>{team?.shortName || team?.name || 'Team'}</ThemedText>
                            </View>
                            <ThemedText style={styles.colStatMiniText}>{item.played || 0}</ThemedText>
                            <ThemedText style={styles.colStatMiniText}>{item.won || 0}</ThemedText>
                            <ThemedText style={styles.colStatMiniText}>{item.lost || 0}</ThemedText>
                            <ThemedText style={styles.colStatMiniText}>{(item.tied || 0) + (item.noResult || 0)}</ThemedText>
                            <ThemedText style={[styles.colNrrCompactText, { color: Number(nrr) > 0 ? '#22c55e' : theme.textSecondary }]}>
                                {nrrPrefix}{nrr}
                            </ThemedText>
                            <ThemedText style={[styles.colStatMiniText, { color: theme.primary, fontWeight: 'bold' }]}>{item.points || 0}</ThemedText>
                        </View>
                    );
                })}
            </Card>
        </ScrollView>
    );
};

// --- Main Screen ---

export const MatchDetailScreen: React.FC = () => {
    const insets = useSafeAreaInsets();
    const { theme, isDark } = useTheme();
    const navigation = useNavigation<MatchDetailNavigationProp>();
    const route = useRoute<RouteProp<RootStackParamList, 'MatchDetails'>>();
    const { matchId } = route.params;

    const dispatch = useAppDispatch();
    const {
        details: match,
        liveStatus,
        commentary: reduxCommentary,
        squads,
        loading,
        refreshing,
        scorecard: reduxScorecard,
        partnerships: partnershipsData,
        recentOvers: recentOversData,
        sessions: sessionsData
    } = useAppSelector(state => state.match);

    // 1. Initial Load: Core match data (runs once per matchId)
    useEffect(() => {
        if (!matchId) return;
        dispatch(fetchMatchDetails(matchId));
        dispatch(fetchLiveStatus(matchId));
        dispatch(fetchSquads(matchId));
        dispatch(fetchSessions(matchId));
        dispatch(fetchCommentary(matchId));
        dispatch(fetchScorecard({ matchId, inning: 1 }));
        dispatch(fetchScorecard({ matchId, inning: 2 }));

        return () => {
            dispatch(resetMatchState());
        };
    }, [matchId, dispatch]);

    // 2. Secondary Load: Points table (runs when seriesId becomes available)
    useEffect(() => {
        const seriesId = match?.seriesId?._id || match?.seriesId;
        if (seriesId && typeof seriesId === 'string') {
            dispatch(fetchPointsTable(seriesId));
        }
    }, [match?.seriesId, dispatch]);

    // Live socket data
    const { matchStatus, ballData, commentary: socketCommentary, isConnected } = useLiveMatch(matchId);

    // Sync socket updates to Redux (optional for now, but good for data flow)
    useEffect(() => {
        if (matchStatus) {
            dispatch(updateLiveStatusFromSocket(matchStatus));
        }
    }, [matchStatus, dispatch]);

    useEffect(() => {
        if (ballData) {
            dispatch(updateCommentaryFromSocket(ballData));
        }
    }, [ballData, dispatch]);



    const currentInning = liveStatus?.currentInning || 1;
    const loadingMatch = loading.details;
    const loadingStatus = loading.liveStatus;

    // 3. Socket-driven Sync: Fetch fresh data on new balls
    useEffect(() => {
        if (ballData && ballData._id) { // Use a specific ID if available to ensure stability
            dispatch(fetchScorecard({ matchId, inning: currentInning }));
            dispatch(fetchPartnerships({ matchId, inning: currentInning }));
            dispatch(fetchRecentOvers({ matchId, inning: currentInning }));
            dispatch(fetchSessions(matchId));
        }
    }, [ballData?._id, currentInning, matchId, dispatch]);

    const currentScorecard = reduxScorecard[currentInning];

    const [selectedTeamIndex, setSelectedTeamIndex] = useState<0 | 1 | null>(null);
    const [sheetType, setSheetType] = useState<'squad' | 'fantasy-all' | 'analysis'>('squad');
    const [analysisTab, setAnalysisTab] = useState('mostRuns');

    const bottomSheetRef = useRef<BottomSheet>(null);
    const snapPoints = useMemo(() => {
        if (sheetType === 'fantasy-all' || sheetType === 'analysis') return ['70%', '90%'];
        return ['50%', '80%'];
    }, [sheetType]);

    const handleTeamPress = useCallback((teamIndex: 0 | 1) => {
        setSheetType('squad');
        setSelectedTeamIndex(teamIndex);
        bottomSheetRef.current?.expand();
    }, []);

    const handleFantasyViewAll = useCallback(() => {
        setSheetType('fantasy-all');
        bottomSheetRef.current?.expand();
    }, []);

    const handleAnalysisPress = useCallback((type: string) => {
        setSheetType('analysis');
        setAnalysisTab(type);
        bottomSheetRef.current?.expand();
    }, []);

    const renderBackdrop = useCallback(
        (props: BottomSheetBackdropProps) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />,
        []
    );

    const team1Name = match?.teamAId?.name || match?.teamA?.name || route.params?.team1Name || 'Team 1';
    const team2Name = match?.teamBId?.name || match?.teamB?.name || route.params?.team2Name || 'Team 2';
    const team1Code = match?.teamAId?.shortName || match?.teamAId?.code || route.params?.team1Name || 'T1';
    const team2Code = match?.teamBId?.shortName || match?.teamBId?.code || route.params?.team2Name || 'T2';

    // ─── Squad Logic ───────────────────────────────────────────────────────────

    // selectedTeamObj needed for both InfoTab and BottomSheet memo
    const selectedTeamObj = useMemo(() =>
        selectedTeamIndex === 0 ? match?.teamAId : match?.teamBId,
        [selectedTeamIndex, match]);

    // Real squad for the selected team (for BottomSheet)
    const selectedSquad = useMemo(() =>
        resolveSquad(squads, selectedTeamObj, selectedTeamIndex ?? 0),
        [squads, selectedTeamObj, selectedTeamIndex]);

    const groupPlayers = (players: any[]) => {
        const groups: { [key: string]: any[] } = {
            'Batters': [],
            'Wicket-keepers': [],
            'All-rounders': [],
            'Bowlers': []
        };
        players.forEach(player => {
            const role = (player.role || '').toLowerCase();
            if (role.includes('wicket')) groups['Wicket-keepers'].push(player);
            else if (role.includes('all')) groups['All-rounders'].push(player);
            else if (role.includes('bowl')) groups['Bowlers'].push(player);
            else groups['Batters'].push(player);
        });
        return groups;
    };

    const squadGroups = useMemo(() => ({
        playingXI: groupPlayers(selectedSquad?.playingXI || []),
        bench: groupPlayers(selectedSquad?.bench || []),
    }), [selectedSquad]);

    // ─── Memoized Tabs to prevent 'stale' route error ─────────────────────────
    const infoTab = useMemo(() => (
        <InfoTab
            matchId={matchId}
            onTeamPress={handleTeamPress}
        />
    ), [matchId, handleTeamPress]);

    const liveTab = useMemo(() => (
        <View style={{ flex: 1 }}>
            <LiveTab matchId={matchId} onTeamPress={handleTeamPress} />
        </View>
    ), [matchId, handleTeamPress]);

    const fantasyTab = useMemo(() => (
        <FantasyTab onViewAll={handleFantasyViewAll} onAnalysis={handleAnalysisPress} />
    ), [handleFantasyViewAll, handleAnalysisPress]);

    const commentaryTab = useMemo(() => (
        <CommentaryTab matchId={matchId} />
    ), [matchId]);

    const scorecardTab = useMemo(() => (
        <ScorecardTab matchId={matchId} />
    ), [matchId]);

    const pointsTab = useMemo(() => (
        <PointsTableTab seriesId={match?.seriesId?._id} />
    ), [match?.seriesId?._id]);

    // Determine initial route based on match status
    const initialRouteName = useMemo(() => {
        if (match?.status === 'live') return 'Live';
        if (match?.status === 'completed') return 'Scorecard';
        // 'scheduled' or fallback
        return 'Info';
    }, [match?.status]);

    // ─── Skeleton while match data loads ────────────────────────────────────────
    if (!match) {
        return <MatchDetailSkeleton onBack={() => navigation.goBack()} />;
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { backgroundColor: isDark ? theme.surface : theme.primary }]}>
                <SafeAreaView edges={['left', 'right']}>
                    <View style={styles.navRow}>
                        <View style={styles.navLeft}>
                            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                                <Ionicons name="arrow-back" size={24} color="white" />
                            </TouchableOpacity>
                            <View style={{ marginLeft: spacing.xs }}>
                                <ThemedText weight="bold" color="white" style={{ fontSize: 17 }} numberOfLines={1}>
                                    {team1Code} vs {team2Code}
                                </ThemedText>
                                <ThemedText variant="caption" color="white" style={{ opacity: 0.8 }} numberOfLines={1}>
                                    {match?.title ? `${match.title}${match.title.endsWith(',') ? '' : ','}` : ''} {match?.venueId?.city || 'Venue'}
                                </ThemedText>
                            </View>
                        </View>
                        <View style={styles.navRight}>
                            <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.navigate('MatchLedger', { matchId })}>
                                <Ionicons name="pin-outline" size={20} color="white" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.headerIcon}>
                                <Ionicons name="notifications-outline" size={20} color="white" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.headerIcon}>
                                <Ionicons name="ellipsis-horizontal" size={20} color="white" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </SafeAreaView>
            </View>

            {/* Tabs section with custom tabBar to include common score header */}
            <Tab.Navigator
                initialRouteName={initialRouteName}
                tabBar={(props) => (
                    <View>
                        <MaterialTopTabBar {...props} />
                        <ScoreSummaryHeader liveStatus={liveStatus} match={match} />
                    </View>
                )}
                screenOptions={{
                    tabBarScrollEnabled: true,
                    tabBarActiveTintColor: '#fff',
                    tabBarInactiveTintColor: 'rgba(255,255,255,0.6)',
                    tabBarIndicatorStyle: {
                        backgroundColor: '#fff',
                        height: 3,
                        borderRadius: 3,
                        marginBottom: 0
                    },
                    tabBarLabelStyle: {
                        fontSize: 13,
                        fontWeight: '700',
                        textTransform: 'none'
                    },
                    tabBarItemStyle: {
                        width: 'auto',
                        paddingHorizontal: 16,
                    },
                    tabBarStyle: {
                        backgroundColor: isDark ? theme.surface : theme.primary,
                        elevation: 0,
                        shadowOpacity: 0,
                    },
                    tabBarAllowFontScaling: false,
                }}
            >
                <Tab.Screen name="Info">{() => infoTab}</Tab.Screen>
                <Tab.Screen name="Fantasy">{() => fantasyTab}</Tab.Screen>
                <Tab.Screen name="Live">{() => liveTab}</Tab.Screen>
                <Tab.Screen name="Scorecard">{() => scorecardTab}</Tab.Screen>
                <Tab.Screen name="Commentary">{() => commentaryTab}</Tab.Screen>
                <Tab.Screen name="Graphs" component={GraphsTab} />
                <Tab.Screen name="Points" options={{ tabBarLabel: 'Points Table' }}>
                    {() => pointsTab}
                </Tab.Screen>
            </Tab.Navigator>

            {/* Main Bottom Sheet Distributor */}
            <BottomSheet
                ref={bottomSheetRef}
                index={-1}
                snapPoints={snapPoints}
                enablePanDownToClose
                backdropComponent={renderBackdrop}
                backgroundStyle={{ backgroundColor: isDark ? theme.surface : theme.background }}
                handleIndicatorStyle={{ backgroundColor: theme.textSecondary }}
            >
                <BottomSheetScrollView contentContainerStyle={{ padding: spacing.md }}>
                    {sheetType === 'squad' && (
                        <>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
                                <View>
                                    <ThemedText variant="subtitle" weight="bold">Team Squads</ThemedText>
                                    {selectedSquad?.playingXI?.length > 0 && (
                                        <ThemedText variant="caption" color="primary" weight="bold">PLAYING XI ANNOUNCED</ThemedText>
                                    )}
                                </View>
                                <TouchableOpacity onPress={() => bottomSheetRef.current?.close()}>
                                    <Ionicons name="close" size={24} color={theme.text} />
                                </TouchableOpacity>
                            </View>

                            {/* Team Switcher Tabs */}
                            <View style={{ flexDirection: 'row', backgroundColor: isDark ? theme.background : theme.borderLight, borderRadius: 10, padding: 4, marginBottom: spacing.lg }}>
                                <TouchableOpacity
                                    onPress={() => setSelectedTeamIndex(0)}
                                    style={{
                                        flex: 1,
                                        paddingVertical: 8,
                                        alignItems: 'center',
                                        borderRadius: 8,
                                        backgroundColor: selectedTeamIndex === 0 ? (isDark ? theme.surface : '#fff') : 'transparent',
                                        ... (selectedTeamIndex === 0 ? elevation.sm : {})
                                    }}
                                >
                                    <ThemedText weight="bold" color={selectedTeamIndex === 0 ? 'primary' : 'textSecondary'}>{team1Code}</ThemedText>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => setSelectedTeamIndex(1)}
                                    style={{
                                        flex: 1,
                                        paddingVertical: 8,
                                        alignItems: 'center',
                                        borderRadius: 8,
                                        backgroundColor: selectedTeamIndex === 1 ? (isDark ? theme.surface : '#fff') : 'transparent',
                                        ... (selectedTeamIndex === 1 ? elevation.sm : {})
                                    }}
                                >
                                    <ThemedText weight="bold" color={selectedTeamIndex === 1 ? 'primary' : 'textSecondary'}>{team2Code}</ThemedText>
                                </TouchableOpacity>
                            </View>

                            {/* Section Renderer */}
                            {(() => {
                                const hasPxi = selectedSquad?.playingXI?.length > 0;
                                const hasBench = selectedSquad?.bench?.length > 0;

                                if (!hasPxi && !hasBench) {
                                    return (
                                        <View style={{ padding: spacing.xl, alignItems: 'center' }}>
                                            <Ionicons name="shirt-outline" size={48} color={theme.textSecondary} />
                                            <ThemedText color="textSecondary" style={{ marginTop: spacing.md, textAlign: 'center' }}>
                                                No players found in squad
                                            </ThemedText>
                                        </View>
                                    );
                                }

                                const renderGroups = (groups: any, sectionTitle: string) => (
                                    <View style={{ marginBottom: spacing.xl }}>
                                        <View style={{
                                            backgroundColor: theme.primary + '15',
                                            paddingHorizontal: spacing.md,
                                            paddingVertical: 6,
                                            borderRadius: 4,
                                            marginBottom: spacing.md
                                        }}>
                                            <ThemedText color="primary" weight="bold" variant="small">{sectionTitle}</ThemedText>
                                        </View>
                                        {Object.entries(groups).map(([role, players]) => (
                                            (players as any[]).length > 0 && (
                                                <View key={role} style={{ marginBottom: spacing.md }}>
                                                    <View style={{ borderBottomWidth: 1, borderBottomColor: theme.border + '50', paddingBottom: 4, marginBottom: spacing.sm }}>
                                                        <ThemedText color="textSecondary" weight="medium" style={{ fontSize: 10 }}>{role.toUpperCase()}</ThemedText>
                                                    </View>
                                                    <View style={styles.squadGrid}>
                                                        {(players as any[]).map((player, index) => {
                                                            const isCaptain = selectedSquad?.captainId?._id?.toString() === player._id?.toString();
                                                            const isVC = selectedSquad?.viceCaptainId?._id?.toString() === player._id?.toString();
                                                            const isWK = selectedSquad?.wicketKeeperId?._id?.toString() === player._id?.toString();
                                                            return (
                                                                <View key={player._id || index} style={styles.squadItem}>
                                                                    <View style={[styles.playerAvatarPlaceholder, { backgroundColor: theme.primary + '20' }]}>
                                                                        {player.image
                                                                            ? <Image source={{ uri: player.image }} style={{ width: 40, height: 40, borderRadius: 20 }} />
                                                                            : <Ionicons name="person" size={20} color={theme.primary} />}
                                                                    </View>
                                                                    <View style={{ flex: 1 }}>
                                                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                                                            <ThemedText weight="bold" variant="small" numberOfLines={1} style={{ flex: 1 }}>{player.name}</ThemedText>
                                                                            {isCaptain && <View style={[styles.badge, { backgroundColor: theme.primary + '25' }]}><ThemedText variant="caption" weight="bold" color="primary">C</ThemedText></View>}
                                                                            {isVC && <View style={[styles.badge, { backgroundColor: theme.textSecondary + '25' }]}><ThemedText variant="caption" weight="bold" color="textSecondary">VC</ThemedText></View>}
                                                                            {isWK && <View style={[styles.badge, { backgroundColor: '#f59e0b25' }]}><ThemedText variant="caption" weight="bold" style={{ color: '#f59e0b' }}>WK</ThemedText></View>}
                                                                        </View>
                                                                        <ThemedText variant="caption" color="textSecondary">{player.role}</ThemedText>
                                                                    </View>
                                                                </View>
                                                            );
                                                        })}
                                                    </View>
                                                </View>
                                            )
                                        ))}
                                    </View>
                                );

                                return (
                                    <>
                                        {hasPxi ? (
                                            <>
                                                {renderGroups(squadGroups.playingXI, "PLAYING XI")}
                                                {hasBench && renderGroups(squadGroups.bench, "ON BENCH")}
                                            </>
                                        ) : (
                                            renderGroups(squadGroups.bench, "SQUAD")
                                        )}
                                    </>
                                );
                            })()}
                        </>
                    )}

                    {sheetType === 'fantasy-all' && (
                        <>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg }}>
                                <ThemedText variant="subtitle" weight="bold">Fantasy Player Leaderboard</ThemedText>
                                <TouchableOpacity onPress={() => bottomSheetRef.current?.close()}>
                                    <Ionicons name="close" size={24} color={theme.text} />
                                </TouchableOpacity>
                            </View>
                            <View style={{ gap: spacing.md }}>
                                {FANTASY_TOP_PLAYERS.concat(FANTASY_TOP_PLAYERS).map((player, idx) => (
                                    <View key={idx} style={[styles.statListCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : theme.borderLight }]}>
                                        <View style={styles.fantasyAvatarPlaceholder}>
                                            <Ionicons name="person" size={24} color={theme.primary} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <ThemedText weight="bold">{player.name}</ThemedText>
                                            <ThemedText variant="caption" color="textSecondary">{player.team} • Batter</ThemedText>
                                        </View>
                                        <ThemedText weight="bold" color="primary">{player.points} pts</ThemedText>
                                    </View>
                                ))}
                            </View>
                        </>
                    )}

                    {sheetType === 'analysis' && (
                        <>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
                                <ThemedText variant="subtitle" weight="bold">
                                    {analysisTab.replace(/([A-Z])/g, ' $1').trim().toUpperCase()}
                                </ThemedText>
                                <TouchableOpacity onPress={() => bottomSheetRef.current?.close()}>
                                    <Ionicons name="close" size={24} color={theme.text} />
                                </TouchableOpacity>
                            </View>

                            <View style={{ gap: spacing.sm }}>
                                {FANTASY_TOP_PLAYERS.concat(FANTASY_TOP_PLAYERS).map((player, idx) => (
                                    <View key={idx} style={[styles.statListCard, { borderBottomWidth: 1, borderBottomColor: theme.border }]}>
                                        <ThemedText weight="bold" style={{ width: 30 }}>{idx + 1}</ThemedText>
                                        <View style={{ flex: 1 }}>
                                            <ThemedText weight="bold">{player.name}</ThemedText>
                                            <ThemedText variant="caption" color="textSecondary">{player.team}</ThemedText>
                                        </View>
                                        <ThemedText weight="bold" color="primary">
                                            {analysisTab.includes('SR') ? (120 + Math.random() * 50).toFixed(1) :
                                                analysisTab.includes('Eco') ? (3 + Math.random() * 4).toFixed(2) :
                                                    analysisTab.includes('Wickets') ? Math.floor(Math.random() * 15) :
                                                        Math.floor(Math.random() * 500)}
                                        </ThemedText>
                                    </View>
                                ))}
                            </View>
                        </>
                    )}
                </BottomSheetScrollView>
            </BottomSheet>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingBottom: spacing.sm,
    },
    navRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        justifyContent: 'space-between',
    },
    navLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        flex: 1,
    },
    navRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    backButton: {
        padding: spacing.xs,
    },
    headerTitle: {
        fontSize: 16,
    },
    headerIcon: {
        padding: spacing.xs,
    },
    tabContentContainer: { // New style for LiveTab wrapper
        flex: 1,
    },
    tabContent: {
        flex: 1,
    },
    tabCard: {
        margin: spacing.md,
        padding: spacing.md,
    },
    cardTitle: {
        marginBottom: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: 'transparent',
        paddingBottom: spacing.xs,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: '#f8fafc',
    },
    infoLabel: {
        flex: 1,
        fontSize: 13,
    },
    infoValue: {
        flex: 2,
        textAlign: 'right',
        fontSize: 13,
    },
    commentaryItem: {
        flexDirection: 'row',
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    overColumn: {
        width: 50,
    },
    commentaryText: {
        flex: 1,
    },
    squadRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: spacing.sm,
    },
    teamSquad: {
        flex: 1,
        gap: 4,
    },
    squadTeamName: {
        fontSize: 14,
        marginBottom: 4,
        color: '#1877f2',
    },
    // --- Live Tab Detailed Styles ---
    liveScoreSection: {
        padding: spacing.md,
        backgroundColor: '#111827',
    },
    mainScoreRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    teamScoreInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    leftInfoBlock: {
        flex: 1.2,
        flexDirection: 'row',
        alignItems: 'center',
    },
    scoreTextsBlock: {
        marginLeft: spacing.md,
    },
    teamCodeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    scoreRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 8,
        marginTop: -2,
    },
    teamLogoBadge: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#1e293b',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#334155',
    },
    scoreTeamLogo: {
        width: 24,
        height: 24,
    },
    codeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    teamCodeText: {
        fontSize: 16,
    },
    p1BadgeText: {
        fontSize: 10,
    },
    p1Badge: {
        backgroundColor: '#ef4444',
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderRadius: 4,
        marginLeft: 2,
    },
    scoreValueRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 8,
        marginTop: 2,
    },
    liveScoreText: {
        fontSize: 28,
        color: '#2dd4bf', // Teal/Cyan
    },
    oversText: {
        fontSize: 14,
    },
    scoreDivider: {
        width: 1.5,
        height: 35,
        backgroundColor: 'rgba(255,255,255,0.2)',
        transform: [{ rotate: '25deg' }],
        borderRadius: 1,
        opacity: 0.6,
    },
    dividerWrapper: {
        flex: 0.8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryScore: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bigZeroText: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#fde047',
    },
    normalStatusText: {
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
        paddingHorizontal: 4,
    },
    muteIcon: {
        opacity: 0.5,
    },
    crrTossRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: spacing.md,
        paddingTop: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: '#1f2937',
    },
    overSummaryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#1e293b',
    },
    overBallsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    overSummaryMarker: {
        paddingHorizontal: 6,
        marginHorizontal: 4,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 4,
        height: 24,
    },
    overScrollContent: {
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        flexGrow: 1,
    },
    overBall: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    boundaryBall: {
        backgroundColor: '#0e7490', // Darker teal
    },
    overBallPlaceholder: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#334155',
        borderStyle: 'dashed',
    },
    liveTeamHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.md,
    },
    teamLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    teamScoreBadges: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    badgeLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#334155',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    oddsBox: {
        minWidth: 40,
        height: 32,
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 6,
    },
    oddsBoxBlue: {
        backgroundColor: '#1d4ed8', // Darker blue
    },
    oddsBoxRed: {
        backgroundColor: '#991b1b', // Darker red
    },
    oddsText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    sessionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: spacing.md,
        borderRadius: 8,
        marginTop: spacing.sm,
    },
    batIconSmall: {
        transform: [{ rotate: '45deg' }],
    },
    statValueBox: {
        minWidth: 32,
        paddingHorizontal: 6,
        paddingVertical: 4,
        borderRadius: 4,
        alignItems: 'center',
    },
    statsTable: {
        paddingHorizontal: spacing.md,
        marginBottom: spacing.md,
    },
    tableHeader: {
        flexDirection: 'row',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#1e293b',
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 12,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#1e293b',
    },
    colBatter: {
        flex: 3,
    },
    colStatSmall: {
        flex: 1,
        textAlign: 'right',
        fontSize: 13,
    },
    partnershipStrip: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingVertical: 8,
        backgroundColor: '#111827',
        marginBottom: spacing.md,
    },
    predictionSection: {
        padding: spacing.md,
        backgroundColor: '#111827',
    },
    predictionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    predictionButtonsRow: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    predButton: {
        flex: 1,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#334155',
        borderRadius: 8,
        alignItems: 'center',
        backgroundColor: '#1e293b',
    },
    notificationStrip: {
        padding: spacing.md,
        marginTop: spacing.sm,
    },
    notificationInner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        backgroundColor: '#1e293b',
        padding: spacing.md,
        borderRadius: spacing.md,
    },
    // Scorecard styles (re-added for tab)
    inningsSelectors: {
        flexDirection: 'row',
        maxHeight: 60,
    },
    inningsTab: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderBottomWidth: 3,
        borderBottomColor: 'transparent',
    },
    scorecardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        marginBottom: 8,
    },
    colName: {
        flex: 2,
    },
    scoreCols: {
        flex: 3,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    colStat: {
        width: 35,
        textAlign: 'center',
    },
    playerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
    },
    playerNameCol: {
        flex: 2,
    },
    // Fantasy styles
    fantasyXiContainer: {
        gap: spacing.md,
    },
    xiSection: {
        flexDirection: 'row',
        gap: spacing.md,
        alignItems: 'center',
    },
    predictionRow: {
        marginTop: spacing.sm,
    },
    predictionBar: {
        height: 12,
        borderRadius: 6,
        flexDirection: 'row',
        overflow: 'hidden',
    },
    predictionFill: {
        height: '100%',
    },
    predictionLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 4,
    },
    // Graph styles
    graphPlaceholder: {
        height: 200,
        alignItems: 'center',
        justifyContent: 'center',
    },
    manhattanContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        height: 100,
        paddingHorizontal: spacing.sm,
    },
    manhattanBar: {
        width: 15,
        borderRadius: 2,
    },
    teamSelectorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderRadius: 12,
        gap: spacing.md,
    },
    teamLogoBadgeSmall: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    h2hContainer: {
        marginTop: spacing.sm,
    },
    h2hStatRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: spacing.lg,
    },
    h2hTeamInfo: {
        alignItems: 'center',
        width: 40,
    },
    h2hDivider: {
        flex: 1,
        alignItems: 'center',
    },
    h2hProgressContainer: {
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 3,
        width: '100%',
        marginTop: 4,
        overflow: 'hidden',
    },
    h2hProgressBar: {
        height: '100%',
        borderRadius: 3,
    },
    h2hBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        minWidth: 35,
        alignItems: 'center',
    },
    badge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    squadGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.md,
    },
    squadItem: {
        width: width > 600 ? (width - spacing.md * 4) / 3 : (width - spacing.md * 3) / 2,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        padding: spacing.sm,
        borderRadius: 8,
    },
    playerAvatarPlaceholder: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    fantasyPlayerCard: {
        padding: spacing.sm,
        alignItems: 'center',
        borderRadius: 12,
    },
    fantasyAvatarPlaceholder: {
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    },
    fantasyPointsBadge: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'white',
    },
    statListCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    projectedSection: {
        padding: spacing.md,
    },
    projTable: {
        width: '100%',
    },
    projRow: {
        flexDirection: 'row',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
    },
    projColHeader: {
        flex: 1.5,
    },
    projColValue: {
        flex: 1,
        textAlign: 'center',
    },
    // Partnership styles
    partnershipRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
    },
    partnershipPlayer: {
        flex: 1,
    },
    partnershipCenter: {
        flex: 1.5,
        alignItems: 'center',
        paddingHorizontal: spacing.sm,
    },
    partnershipBarContainer: {
        height: 8,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 4,
        flexDirection: 'row',
        overflow: 'hidden',
        width: '100%',
        marginTop: 6,
    },
    partnershipBar: {
        height: '100%',
    },
    // Points Table Styles
    pointsTableHeader: {
        flexDirection: 'row',
        paddingVertical: 10,
        borderBottomWidth: 1,
        marginBottom: 8,
    },
    pointsTableRow: {
        flexDirection: 'row',
        paddingVertical: 12,
        alignItems: 'center',
        borderBottomWidth: 1,
    },
    colRank: {
        width: 32,
    },
    colTeam: {
        flex: 1.2,
    },
    colStatMini: {
        width: 25,
        textAlign: 'center',
    },
    colStatMiniText: {
        width: 25,
        textAlign: 'center',
        fontSize: 10,
    },
    colNrrCompact: {
        width: 45,
        textAlign: 'center',
    },
    colNrrCompactText: {
        width: 45,
        textAlign: 'center',
        fontSize: 9,
    },
    colCupRCompact: {
        width: 40,
        alignItems: 'center',
    },
    fab: {
        position: 'absolute',
        bottom: spacing.lg,
        right: spacing.lg,
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalBg: {
        ...StyleSheet.absoluteFillObject,
    },
    dialogCard: {
        width: '85%',
        borderRadius: 16,
        padding: spacing.lg,
        ...elevation.lg,
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
    dropdownMenu: {
        borderWidth: 1,
        borderTopWidth: 0,
        borderBottomLeftRadius: 8,
        borderBottomRightRadius: 8,
        marginTop: -4,
        ...elevation.sm,
    },
    dropdownItem: {
        padding: 12,
    },
    typeButton: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 4,
        alignItems: 'center',
        borderRadius: 8,
        borderWidth: 1,
    },
    saveButton: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: 8,
    },
    // --- Enhanced Commentary Styles ---
    ballBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    overSummaryCard: {
        marginHorizontal: spacing.md,
        marginVertical: spacing.sm,
        padding: spacing.md,
        borderRadius: 12,
        borderWidth: 1,
    },
    overSummaryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 8,
        marginBottom: 8,
        borderBottomWidth: 1,
    },
    overSummaryDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    overBallsList: {
        flexDirection: 'row',
        gap: 6,
        flex: 1,
    },
    tinyBall: {
        width: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    overStatsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    // --- New Filter & Modal Styles ---
    filterScrollContainer: {
        borderBottomWidth: 1,
        height: 54,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 10,
        height: 36,
        alignSelf: 'center',
    },
    overFilterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: spacing.md,
        borderBottomWidth: 1,
    },
    tinyBallFilter: {
        width: 18,
        height: 18,
        borderRadius: 9,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 4,
    },
    overModalCard: {
        width: '92%',
        maxHeight: '80%',
        borderRadius: 16,
        padding: spacing.md,
        overflow: 'hidden',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: spacing.md,
        marginBottom: spacing.xs,
        borderBottomWidth: 1,
    },
    // --- Wicket Card Styles ---
    wicketCardContainer: {
        marginHorizontal: spacing.md,
        marginVertical: spacing.sm,
    },
    wicketCardRed: {
        borderRadius: 12,
        padding: spacing.md,
        overflow: 'hidden',
    },
    wicketTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    wicketAvatarContainer: {
        marginRight: spacing.md,
    },
    wicketAvatarCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    wicketAvatarText: {
        color: 'white',
        fontSize: 18,
    },
    wicketMainInfo: {
        flex: 1,
    },
    wicketPlayerName: {
        color: 'white',
        fontSize: 18,
        marginBottom: 2,
    },
    wicketDismissal: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 13,
    },
    outTag: {
        backgroundColor: 'black',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    outTagText: {
        color: 'white',
        fontSize: 10,
    },
    wicketStatsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    wicketStatItem: {
        alignItems: 'center',
    },
    wicketStatLabel: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 10,
        marginBottom: 2,
    },
    wicketStatValue: {
        color: 'white',
        fontSize: 15,
    },
});

export default MatchDetailScreen;
