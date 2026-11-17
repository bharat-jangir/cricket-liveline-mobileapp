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
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Rect, Line, Circle, Polyline, G, Text as SvgText, Path } from 'react-native-svg';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { createMaterialTopTabNavigator, MaterialTopTabBar } from '@react-navigation/material-top-tabs';
import BottomSheet, { BottomSheetScrollView, BottomSheetBackdrop, BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { LinearGradient } from 'expo-linear-gradient';
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
    fetchMatchAnalytics,
    resetMatchState,
    setRefreshing,
    updateLiveStatusFromSocket,
    updateCommentaryFromSocket,
    removeLatestCommentary,
    clearCommentary
} from '../store/matchSlice';
import { MatchService } from '../services/match.service';
import { setLanguage, toggleMute } from '../store/appSlice';
import * as Speech from 'expo-speech';
import { MatchDetailSkeleton, ScorecardBodySkeleton } from '../components/MatchDetailSkeleton';
import { SessionsTable } from '../components/SessionsTable';
import { RefreshControl } from 'react-native';

// --- Helper Components ---

const InfoRow = ({ label, value }: { label: string; value: string }) => {
    const { theme } = useTheme();
    return (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
            <ThemedText variant="caption" color="textSecondary">{label}</ThemedText>
            <ThemedText variant="caption" weight="medium">{value || 'N/A'}</ThemedText>
        </View>
    );
};

const TeamLogo = ({ team, size = 24 }: { team: any; size?: number }) => {
    const { theme } = useTheme();
    const logoUrl = team?.logo;
    
    return (
        <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: theme.surface, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {logoUrl ? (
                <Image source={{ uri: logoUrl }} style={{ width: '100%', height: '100%' }} />
            ) : (
                <Ionicons name="shirt" size={size * 0.6} color={theme.textSecondary} />
            )}
        </View>
    );
};

const getBallBg = (item: any) => {
    const runs = item.runs || 0;
    const isWicket = item.type === 'wicket' || item.isWicket;
    if (isWicket) return '#ef4444';
    if (runs === 4) return '#3b82f6';
    if (runs === 6) return '#8b5cf6';
    return 'rgba(255,255,255,0.1)';
};

const ParsedCommentaryText = ({ text, style }: { text: string; style?: any }) => {
    const { theme, isDark } = useTheme();
    if (!text) return null;

    // Very simple parser for now, can be expanded to highlight names, numbers etc.
    const words = text.split(' ');
    return (
        <ThemedText style={style}>
            {words.map((word, i) => {
                const isHighlight = /^[0-9]+$/.test(word) || ['WICKET', 'FOUR', 'SIX', 'OUT'].includes(word.toUpperCase());
                return (
                    <ThemedText 
                        key={i} 
                        weight={isHighlight ? "bold" : "normal"}
                        color={isHighlight ? "primary" : "text"}
                    >
                        {word}{' '}
                    </ThemedText>
                );
            })}
        </ThemedText>
    );
};

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
    if (!squads || !squads.length) return null;

    // Normalize source team ID
    const targetId = (teamObj?._id || teamObj)?.toString();
    if (!targetId) return squads[fallbackIndex] ?? null;

    // Try ID match
    const byId = squads.find(
        (s: any) => (s.teamId?._id || s.teamId)?.toString() === targetId
    );
    if (byId) return byId;

    // Fallback: positional (index 0 usually maps to teamA, index 1 to teamB)
    return squads[fallbackIndex] ?? null;
};

const BALL_EVENT_MAP: Record<string, string> = {
    // 1. Single Letter/Short Codes
    'b': 'Ball',
    'o': 'Over',
    'w': 'Wicket',
    'f': 'Fast Bowler',
    's': 'Spin Bowler',
    'e': 'Players Entering',
    'a': 'Appeal',
    'i': 'Innings Break',
    'p': 'Player Injured',
    'd': 'Drizzle',

    // 2. Wide Ball Codes
    'wd': 'Wide',
    'wd1': 'Wide + 1 Run',
    'wd2': 'Wide + 2 Runs',
    'wd3': 'Wide + 3 Runs',
    'wd4': 'Wide + 4 Runs',
    'wd5': 'Wide + 5 Runs',
    'wd6': 'Wide + 6 Runs',

    // 3. No Ball Codes
    'nb': 'No Ball',
    'nb1': 'No Ball + 1 Run',
    'nb2': 'No Ball + 2 Runs',
    'nb3': 'No Ball + 3 Runs',
    'nb4': 'No Ball + 4 Runs',
    'nb5': 'No Ball + 5 Runs',
    'nb6': 'No Ball + 6 Runs',

    // 4. Bye and Leg Bye Codes
    'by1': 'Bye Single',
    'by2': 'Bye Double',
    'by3': 'Bye Triple',
    'by4': 'Bye Four',
    'lb': 'Leg By',
    'lb1': 'Leg By Single',
    'lb2': 'Leg By Double',
    'lb3': 'Leg By Triple',
    'lb4': 'Leg By Four',

    // 5. Special Event Codes
    'fh': 'Free Hit',
    'cd': 'Catch Drop',
    'cc': 'Covers Coming',
    'ba': 'Ball In Air',
    'no': 'Not out',
    'tu': 'Third Umpire',
    'u': 'Third Umpire',
    'ruka': 'Bowler Stopped',

    // 6. Wicket Type Codes
    '^1': 'Bowled',
    '^2': 'Caught Out',
    '^3': 'Caught and bowled',
    '^4': 'Run Out',
    '^5': 'LBW Out',
    '^6': 'Hit Wicket',
    '^7': 'Caught Behind',
    '^8': 'Stumped Out',
    '^9': 'Mankaded',
    '^10': 'Obst. the field',
    '^11': 'Retired Hurt',
    '^12': 'Retired Out',
    '^13': 'Absent Hurt',
    '^14': 'Timed Out',

    // 7. Break Codes (mapped directly just in case)
    '/0': 'Lunch Break',
    '/1': 'Tea Break',
    '/2': 'Stumps',
};

const getBallDisplayText = (val: string) => {
    if (!val) return '0';
    const trimmed = val.toString().trim();
    return BALL_EVENT_MAP[trimmed] || BALL_EVENT_MAP[trimmed.toLowerCase()] || trimmed;
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

    useEffect(() => {
        if (squads.length === 0 && !refreshing.details) {
            dispatch(fetchSquads(matchId));
        }
    }, [dispatch, matchId, squads.length]);

    const onRefresh = useCallback(() => {
        dispatch(setRefreshing({ key: 'details', value: true }));
        dispatch(fetchMatchDetails(matchId));
        dispatch(fetchSquads(matchId));
    }, [dispatch, matchId]);

    return (
        <ScrollView 
            style={[styles.tabContent, { backgroundColor: theme.background }]}
            refreshControl={<RefreshControl refreshing={refreshing.details} onRefresh={onRefresh} colors={[theme.primary]} />}
        >
            <View style={{ padding: spacing.md }}>
                <Card style={{ marginBottom: spacing.md }}>
                    <ThemedText weight="bold" style={{ marginBottom: spacing.sm }}>Match Info</ThemedText>
                    <View style={{ gap: spacing.sm }}>
                        <InfoRow label="Match" value={match?.matchNumber || 'Match'} />
                        <InfoRow label="Series" value={match?.seriesId?.name || ''} />
                        <InfoRow label="Date" value={match?.matchDate ? new Date(match.matchDate).toLocaleDateString() : ''} />
                        <InfoRow label="Time" value={match?.matchTime || ''} />
                        <InfoRow label="Venue" value={match?.venueId?.name || ''} />
                        <InfoRow label="Toss" value={match?.toss?.tossText || 'TBA'} />
                    </View>
                </Card>

                <View style={{ flexDirection: 'row', gap: spacing.md }}>
                    <TouchableOpacity style={{ flex: 1 }} onPress={() => onTeamPress(0)}>
                        <Card style={{ alignItems: 'center', padding: spacing.md }}>
                            <TeamLogo team={match?.teamAId} size={40} />
                            <ThemedText variant="small" weight="bold" style={{ marginTop: spacing.xs }}>{match?.teamAId?.shortName || 'T1'}</ThemedText>
                        </Card>
                    </TouchableOpacity>
                    <TouchableOpacity style={{ flex: 1 }} onPress={() => onTeamPress(1)}>
                        <Card style={{ alignItems: 'center', padding: spacing.md }}>
                            <TeamLogo team={match?.teamBId} size={40} />
                            <ThemedText variant="small" weight="bold" style={{ marginTop: spacing.xs }}>{match?.teamBId?.shortName || 'T2'}</ThemedText>
                        </Card>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
};


const CommentaryTab = ({ matchId }: { matchId: string }) => {
    const { theme, isDark } = useTheme();
    const dispatch = useAppDispatch();
    const { commentary: reduxCommentary, refreshing, liveStatus, details: match, loading } = useAppSelector(state => state.match);

    const [activeFilter, setActiveFilter] = useState('All');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [selectedOver, setSelectedOver] = useState<any>(null);
    const overBottomSheetRef = useRef<BottomSheet>(null);

    const innArray = useMemo(() => {
        const arr = liveStatus?.innings || match?.liveStatus?.innings || [];
        const currentInn = liveStatus?.currentInning || match?.currentInning || 1;
        const count = Math.max(currentInn, arr.length);
        
        const result = [];
        for (let i = 1; i <= count; i++) {
            const existing = arr.find((inn: any) => inn.inningNumber === i);
            if (existing) {
                result.push(existing);
            } else {
                result.push({
                    _id: `dummy-inning-${i}`,
                    inningNumber: i,
                });
            }
        }
        return result;
    }, [liveStatus, match]);

    const filters = useMemo(() => {
        const baseBefore = ['All', 'Highlights', 'Overs', 'W', '6s', '4s'];
        const baseAfter = ['Milestones', 'Maiden'];
        const inningFilters = innArray.map((_, idx) => {
            const suffix = idx === 0 ? 'st' : idx === 1 ? 'nd' : idx === 2 ? 'rd' : 'th';
            return `${idx + 1}${suffix} Inn`;
        });
        return [...baseBefore, ...inningFilters, ...baseAfter];
    }, [innArray]);

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

    const getBackendFilter = useCallback((uiFilter: string) => {
        switch (uiFilter) {
            case 'All': return { type: 'all' };
            case '4s': return { type: 'four' };
            case '6s': return { type: 'six' };
            case 'W': return { type: 'wicket' };
            case 'Maiden': return { type: 'maiden' };
            case 'Milestones': return { type: 'milestone' };
            case 'Overs': return { type: 'over' };
            case 'Highlights': return { type: 'highlight' };
            default: {
                const inningMatch = uiFilter.match(/^(\d+)(?:st|nd|rd|th)\s+Inn$/i);
                if (inningMatch) {
                    const inningIdx = parseInt(inningMatch[1], 10) - 1;
                    const innId = innArray[inningIdx]?._id || innArray[inningIdx]?.id;
                    if (innId && !innId.toString().startsWith('dummy-')) {
                        return { inningId: innId, type: 'all' };
                    }
                }
                return { type: 'all' };
            }
        }
    }, [innArray]);

    const onRefresh = useCallback(() => {
        setPage(1);
        setHasMore(true);
        dispatch(setRefreshing({ key: 'commentary', value: true }));
        const params = getBackendFilter(activeFilter);
        const currentLimit = activeFilter === 'Overs' ? 30 : 20;
        dispatch(fetchCommentary({ matchId, page: 1, limit: currentLimit, ...params })).then((res: any) => {
            if (res.payload?.data?.length < currentLimit) setHasMore(false);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dispatch, matchId, activeFilter]); // removed getBackendFilter to prevent infinite reload on liveStatus update

    const loadMore = useCallback(() => {
        const currentLimit = activeFilter === 'Overs' ? 30 : 20;
        if (!loading.commentary && !refreshing.commentary && hasMore && reduxCommentary.length > 0) {
            const nextPage = page + 1;
            setPage(nextPage);
            const params = getBackendFilter(activeFilter);
            dispatch(fetchCommentary({ matchId, page: nextPage, limit: currentLimit, ...params })).then((res: any) => {
                if (!res.payload?.data || res.payload.data.length < currentLimit) {
                    setHasMore(false);
                }
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dispatch, matchId, page, activeFilter, hasMore, refreshing.commentary, loading.commentary, reduxCommentary.length]); // removed getBackendFilter

    useEffect(() => {
        dispatch(clearCommentary());
        setPage(1);
        setHasMore(true);
        const params = getBackendFilter(activeFilter);
        const currentLimit = activeFilter === 'Overs' ? 30 : 20;
        dispatch(fetchCommentary({ matchId, page: 1, limit: currentLimit, ...params })).then((res: any) => {
            if (res.payload?.data?.length < currentLimit) setHasMore(false);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeFilter, matchId, dispatch]); // removed getBackendFilter to prevent reloading every ball

    const processedCommentary = useMemo(() => {
        if (reduxCommentary.length > 0) {
            console.log('[CommentaryData] First item keys:', Object.keys(reduxCommentary[0]));
            console.log('[CommentaryData] First item values:', JSON.stringify(reduxCommentary[0]).substring(0, 200));
        }
        // Just return as is, or add calculated fields if needed
        const processed = reduxCommentary.map(item => {
            if (item.type === 'over_end') return item;
            // Use provided ball number or calculate it
            const ballNum = item.ballNumber || item.ball_no || 0;
            const overNum = item.overNumber || item.over || 0;
            const ballInOv = item.ballInOver || item.ball_in_over || 0;
            
            let calculatedIndex = '0.0';
            
            // If the backend gave us an explicit string like "44.1" (e.g. in `overs` or `over_str`)
            if (item.overs && typeof item.overs === 'string' && item.overs.includes('.')) {
                calculatedIndex = item.overs;
            } else if (item.over_str && typeof item.over_str === 'string' && item.over_str.includes('.')) {
                calculatedIndex = item.over_str;
            } else if (item.ballLabel && typeof item.ballLabel === 'string' && /^\d+\.\d+$/.test(item.ballLabel)) {
                // Sometimes ballLabel contains the index "44.1" instead of the outcome "W"
                calculatedIndex = item.ballLabel;
            } else if (ballNum > 0) {
                const over = Math.floor((ballNum - 1) / 6) + 1;
                const ball = (ballNum - 1) % 6 + 1;
                calculatedIndex = `${over - 1}.${ball}`;
            } else if (overNum > 0) {
                // If we have overNumber, try to use ballInOver for the fraction
                let fraction = ballInOv > 0 ? ballInOv : '0';
                
                // Fallback: If this is a socket event and we don't have the fraction,
                // we might try to guess it from liveStatus if it's the very latest ball,
                // but for now, we'll just show the over number if fraction is missing.
                calculatedIndex = `${overNum - 1}.${fraction}`;
            }

            // Decide what to show inside the circular bubble (W, 4, 6, wd)
            let result = item.ballLabel || item.runs?.toString() || '0';
            
            // If ballLabel was the index (e.g. "44.1"), then we shouldn't show "44.1" in the bubble!
            if (/^\d+\.\d+$/.test(result)) {
                if (item.isWicket || item.type === 'wicket' || item.type === 'w') {
                    result = 'W';
                } else if (item.extras && item.extras > 0) {
                    result = item.ballType || 'wd'; // fallback to ballType if available
                } else if (item.runs !== undefined) {
                    result = item.runs.toString();
                } else {
                    result = '-';
                }
            }

            return {
                ...item,
                calculatedIndex,
                calculatedResult: result
            };
        });

        // Insert inning dividers
        const withDividers: any[] = [];
        let currentInningId: string | null = null;

        processed.forEach((item, index) => {
            if (item.inningId && item.inningId !== currentInningId) {
                withDividers.push({
                    type: 'inning_divider',
                    _id: `divider-${item.inningId}`,
                    inningNumber: item.inningNumber || (index === 0 ? 1 : 2),
                    timestamp: item.timestamp
                });
                currentInningId = item.inningId;
            }
            withDividers.push(item);
        });

        return withDividers;
    }, [reduxCommentary]);

    const filteredCommentary = processedCommentary; // Sorting/filtering handled by backend

    const renderWicketCard = (item: any) => {
        const data = item.wicketData || item.highlightData || item;
        const sr = data.wicketBatsmanSR || (data.wicketBatsmanBalls ? ((data.wicketBatsmanRuns / data.wicketBatsmanBalls) * 100).toFixed(1) : '0.0');

        return (
            <View style={styles.wicketCardContainer}>
                <View style={[styles.wicketCardRed, { backgroundColor: '#ef4444' }]}>
                    <View style={styles.wicketTopRow}>
                        <View style={styles.wicketAvatarContainer}>
                            <View style={styles.wicketAvatarCircle}>
                                <ThemedText style={styles.wicketAvatarText} weight="bold">
                                    {(data.wicketBatsmanName || 'P')?.substring(0, 1).toUpperCase()}
                                </ThemedText>
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

                    <View style={styles.wicketStatsRow}>
                        <View style={styles.wicketStatItem}>
                            <ThemedText style={styles.wicketStatLabel}>RUNS</ThemedText>
                            <ThemedText weight="bold" style={styles.wicketStatValue}>{data.wicketBatsmanRuns || 0}</ThemedText>
                        </View>
                        <View style={styles.wicketStatItem}>
                            <ThemedText style={styles.wicketStatLabel}>BALLS</ThemedText>
                            <ThemedText weight="bold" style={styles.wicketStatValue}>{data.wicketBatsmanBalls || 0}</ThemedText>
                        </View>
                        <View style={styles.wicketStatItem}>
                            <ThemedText style={styles.wicketStatLabel}>4s</ThemedText>
                            <ThemedText weight="bold" style={styles.wicketStatValue}>{data.wicketBatsmanFours || 0}</ThemedText>
                        </View>
                        <View style={styles.wicketStatItem}>
                            <ThemedText style={styles.wicketStatLabel}>6s</ThemedText>
                            <ThemedText weight="bold" style={styles.wicketStatValue}>{data.wicketBatsmanSixes || 0}</ThemedText>
                        </View>
                        <View style={styles.wicketStatItem}>
                            <ThemedText style={styles.wicketStatLabel}>SR</ThemedText>
                            <ThemedText weight="bold" style={styles.wicketStatValue}>{sr}</ThemedText>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    const renderMilestoneCard = (item: any) => {
        const data = item.highlightData || item;
        return (
            <View style={styles.milestoneCardContainer}>
                <LinearGradient
                    colors={isDark ? ['#d9770630', '#f59e0b10'] : ['#f59e0b15', '#fef3c7']}
                    style={[
                        styles.milestoneCard,
                        {
                            borderColor: '#d9770640',
                            borderWidth: 1
                        }
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <View style={styles.milestoneHeader}>
                        <View style={[styles.milestoneIconContainer, { backgroundColor: '#d97706' }]}>
                            <Ionicons name="trophy" size={14} color="white" />
                        </View>
                        <ThemedText weight="bold" style={{ color: '#d97706', fontSize: 11, letterSpacing: 0.5 }}>
                            MILESTONE REACHED
                        </ThemedText>
                    </View>
                    <ThemedText weight="bold" style={{ fontSize: 15, marginTop: 8 }}>
                        {item.commentary || 'Player reached a milestone!'}
                    </ThemedText>
                </LinearGradient>
            </View>
        );
    };

    const renderOverSummary = (item: any) => {
        const data = item.highlightData || item;
        const balls = (data.overSummaryBallsData || data.ballsData || []).map((b: any) =>
            typeof b === 'string' ? b : b.ballLabel || '•'
        );
        const isMaidenOver = item.isMaiden || data.isMaiden || false;

        return (
            <Card style={[
                styles.overSummaryCard,
                {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
                    borderColor: theme.border + '30'
                }
            ]}>
                <View style={[styles.overSummaryHeader, { borderBottomColor: theme.border }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <ThemedText weight="bold" variant="small">
                            {`END OF OVER ${data.overSummaryNumber || item.overNumber || ''}`}
                        </ThemedText>
                        {isMaidenOver && (
                            <View style={{ backgroundColor: theme.primary + '15', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                                <ThemedText weight="bold" style={{ fontSize: 9, color: theme.primary }}>MAIDEN</ThemedText>
                            </View>
                        )}
                    </View>
                    <ThemedText weight="bold" color="primary">
                        {`${data.overSummaryRuns || item.runs || 0} Runs · ${data.overSummaryWickets || item.wickets || 0} Wkts`}
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
                        <ThemedText variant="small" weight="bold">{data.matchScore || item.score || ''}</ThemedText>
                        <ThemedText variant="caption" color="textSecondary">Score after {data.matchOvers || item.overNumber || ''} ov</ThemedText>
                    </View>
                </View>
            </Card>
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: theme.background }}>
            <View style={[styles.filterScrollContainer, { borderBottomColor: theme.border + '20' }]}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}>
                    {filters.map((filter) => (
                        <TouchableOpacity
                            key={filter}
                            style={[styles.filterChip, { backgroundColor: isDark ? theme.surface : '#f1f5f9' }, activeFilter === filter && { backgroundColor: theme.primary }]}
                            onPress={() => setActiveFilter(filter)}
                        >
                            <ThemedText variant="caption" weight="bold" color={activeFilter === filter ? 'white' : 'textSecondary'}>{filter}</ThemedText>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <FlatList
                data={processedCommentary}
                keyExtractor={(item) => `comm-${item._id}-${item.timestamp}`}
                style={[styles.tabContent, { backgroundColor: theme.background }]}
                contentContainerStyle={{ paddingVertical: spacing.sm, paddingBottom: spacing.xl + 60 }}
                onRefresh={onRefresh}
                refreshing={refreshing.commentary}
                onEndReached={loadMore}
                onEndReachedThreshold={0.5}
                renderItem={({ item }) => {
                    const isWicket = item.type === 'wicket' || item.isWicket;
                    const isBoundary = item.runs === 4 || item.runs === 6;

                    if (item.type === 'over_end') {
                        if (activeFilter === 'Overs') {
                            return (
                                <TouchableOpacity style={[styles.overFilterRow, { borderBottomColor: theme.border + '20' }]} onPress={() => handleOverPress(item)}>
                                    <ThemedText weight="bold">Ov {item.overNumber}</ThemedText>
                                    <ThemedText variant="caption">{item.runs} runs</ThemedText>
                                    <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
                                </TouchableOpacity>
                            );
                        }
                        return renderOverSummary(item);
                    }

                    if (item.type === 'inning_divider') {
                        return (
                            <View style={{ paddingVertical: spacing.md, paddingHorizontal: spacing.md, alignItems: 'center' }}>
                                <View style={{ height: 1, backgroundColor: theme.border + '30', width: '100%', position: 'absolute', top: '50%' }} />
                                <View style={{ backgroundColor: theme.surface, paddingHorizontal: spacing.lg, borderRadius: 20, borderColor: theme.border + '40', borderWidth: 1 }}>
                                    <ThemedText variant="caption" weight="bold" color="primary">INNINGS {item.inningNumber}</ThemedText>
                                </View>
                            </View>
                        );
                    }

                    if (item.type === 'milestone') {
                        return renderMilestoneCard(item);
                    }

                    if (isWicket) {
                        return renderWicketCard(item);
                    }

                    return (
                        <View key={item._id} style={[styles.commentaryItem, { borderBottomColor: theme.border + '30', backgroundColor: isWicket ? '#ef444410' : isBoundary ? theme.primary + '05' : 'transparent' }]}>
                            <View style={styles.overColumn}>
                                <View style={[styles.ballBadge, { backgroundColor: getBallBg(item) }]}>
                                    <ThemedText weight="bold" style={{ fontSize: 11 }} color={isWicket || isBoundary ? 'white' : 'text'}>{item.calculatedResult}</ThemedText>
                                </View>
                                <ThemedText variant="caption" color="textSecondary" style={{ marginTop: 4 }}>{item.calculatedIndex}</ThemedText>
                            </View>
                            <View style={styles.commentaryText}>
                                {item.bowlerName && <ThemedText variant="small" weight="bold">{item.bowlerName} to {item.batsmanName}</ThemedText>}
                                <ParsedCommentaryText text={item.commentary || 'Ball delivered'} />
                            </View>
                        </View>
                    );
                }}
                ListEmptyComponent={
                    loading.commentary && page === 1 ? (
                        <View style={{ padding: spacing.xl, alignItems: 'center', marginTop: 40 }}>
                            <ActivityIndicator size="large" color={theme.primary} />
                        </View>
                    ) : (
                        <View style={{ padding: spacing.xl, alignItems: 'center', marginTop: 40 }}>
                            <Ionicons name="filter-outline" size={48} color={theme.textSecondary} />
                            <ThemedText color="textSecondary">No {activeFilter.toLowerCase()} found.</ThemedText>
                        </View>
                    )
                }
                ListFooterComponent={loading.commentary && page > 1 ? <ActivityIndicator style={{ marginVertical: 20 }} color={theme.primary} /> : null}
            />

            <BottomSheet
                ref={overBottomSheetRef}
                index={-1}
                snapPoints={snapPoints}
                enablePanDownToClose
                backdropComponent={renderBackdrop}
                backgroundStyle={{ backgroundColor: theme.surface }}
                handleIndicatorStyle={{ backgroundColor: theme.textSecondary + '40' }}
            >
                <View style={{ flex: 1 }}>
                    <View style={[styles.bottomSheetHeader, { borderBottomColor: theme.border + '20' }]}>
                        <View>
                            <ThemedText variant="subtitle" weight="bold">Over {selectedOver?.overNumber} Summary</ThemedText>
                            <ThemedText variant="caption" color="textSecondary">
                                Bowled by {selectedOver?.highlightData?.overSummaryBowlerName || selectedOver?.bowlerName || 'Bowler'}
                            </ThemedText>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <ThemedText weight="bold" color="primary" style={{ fontSize: 18 }}>
                                {selectedOver?.runs || 0} Runs
                            </ThemedText>
                            <ThemedText variant="caption" color="textSecondary">
                                {selectedOver?.wickets || 0} Wickets {selectedOver?.isMaiden && '· Maiden'}
                            </ThemedText>
                        </View>
                    </View>

                    <BottomSheetScrollView contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: spacing.xl + 40 }}>
                        {(!selectedOver?.ballsData || selectedOver.ballsData.length === 0) ? (
                            <View style={{ padding: spacing.xl, alignItems: 'center' }}>
                                <Ionicons name="information-circle-outline" size={48} color={theme.textSecondary} />
                                <ThemedText color="textSecondary" style={{ marginTop: spacing.sm }}>No ball data available for this over.</ThemedText>
                            </View>
                        ) : (
                            selectedOver.ballsData.map((ball: any, index: number) => {
                                const ballWicket = ball.isWicket;
                                const ballBoundary = ball.runs === 4 || ball.runs === 6;

                                // Calculate chronological or index-based ball index
                                let ballIndexText = `${selectedOver.overNumber - 1}.${index + 1}`;
                                if (ball.ballNumber) {
                                    const over = Math.floor((ball.ballNumber - 1) / 6) + 1;
                                    const b = (ball.ballNumber - 1) % 6 + 1;
                                    ballIndexText = `${over - 1}.${b}`;
                                }

                                return (
                                    <View
                                        key={ball.ballId || `ball-${index}`}
                                        style={[
                                            styles.commentaryItem,
                                            {
                                                borderBottomColor: theme.border + '15',
                                                backgroundColor: ballWicket ? '#ef444410' : ballBoundary ? theme.primary + '05' : 'transparent',
                                                paddingVertical: spacing.md,
                                                paddingHorizontal: spacing.sm,
                                                borderRadius: 8,
                                                marginVertical: 2
                                            }
                                        ]}
                                    >
                                        <View style={styles.overColumn}>
                                            <View style={[styles.ballBadge, { backgroundColor: getBallBg(ball) }]}>
                                                <ThemedText weight="bold" style={{ fontSize: 11 }} color={ballWicket || ballBoundary ? 'white' : 'text'}>
                                                    {ball.ballLabel || ball.runs?.toString() || '0'}
                                                </ThemedText>
                                            </View>
                                            <ThemedText variant="caption" color="textSecondary" style={{ marginTop: 4 }}>
                                                {ballIndexText}
                                            </ThemedText>
                                        </View>
                                        <View style={styles.commentaryText}>
                                            {ball.bowlerName && (
                                                <ThemedText variant="small" weight="bold">
                                                    {ball.bowlerName} to {ball.batsmanName}
                                                </ThemedText>
                                            )}
                                            <ParsedCommentaryText text={ball.commentary || 'Ball delivered'} />
                                        </View>
                                    </View>
                                );
                            })
                        )}
                    </BottomSheetScrollView>
                </View>
            </BottomSheet>
        </View>
    );
};


const ScorecardTab = ({ matchId }: { matchId: string }) => {
    const navigation = useNavigation<MatchDetailNavigationProp>();
    const { theme, isDark } = useTheme();
    const dispatch = useAppDispatch();
    const { scorecard: reduxScorecard, refreshing, liveStatus, details: match, loading: reduxLoading } = useAppSelector(state => state.match);
    const [activeInnings, setActiveInnings] = useState(() => liveStatus?.currentInning || match?.currentInning || 1);

    // Sync active innings with current live inning when it changes
    useEffect(() => {
        if (liveStatus?.currentInning) {
            setActiveInnings(liveStatus.currentInning);
        }
    }, [liveStatus?.currentInning]);

    const onRefresh = useCallback(() => {
        dispatch(setRefreshing({ key: 'scorecard', value: true }));
        dispatch(fetchScorecard({ matchId, inning: activeInnings }));
        dispatch(fetchPartnerships({ matchId, inning: activeInnings }));
    }, [dispatch, matchId, activeInnings]);

    useEffect(() => {
        // Lazy load scorecard data when switching innings if not already present
        if (!reduxScorecard[activeInnings] && !refreshing.scorecard) {
            dispatch(fetchScorecard({ matchId, inning: activeInnings }));
        }
        // Always refresh partnerships to ensure up-to-date stats
        dispatch(fetchPartnerships({ matchId, inning: activeInnings }));
    }, [dispatch, matchId, activeInnings]);

    const scorecardData = reduxScorecard[activeInnings];
    const loading = (!scorecardData && !refreshing.scorecard) || reduxLoading.scorecard;

    const inningsList = useMemo(() => {
        const arr = liveStatus?.innings || match?.liveStatus?.innings || [];
        const currentInn = liveStatus?.currentInning || match?.currentInning || 1;
        const count = Math.max(currentInn, arr.length);
        
        const list = [];
        for (let i = 1; i <= count; i++) {
            const inn = arr.find((item: any) => item.inningNumber === i);
            const suffix = i === 1 ? 'st' : i === 2 ? 'nd' : i === 3 ? 'rd' : 'th';
            
            if (inn) {
                list.push({
                    id: i,
                    label: inn.battingTeamId?.shortName ? `${inn.battingTeamId.shortName} ${i}${suffix} Inn` : `Innings ${i}`,
                    score: `${inn.totalRuns || 0}/${inn.totalWickets || 0}`
                });
            } else {
                list.push({
                    id: i,
                    label: `${i}${suffix} Innings`,
                    score: '0/0'
                });
            }
        }
        return list;
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

    const currentStrikerIdStr = liveStatus?.currentStrikerId?.toString();
    const currentNonStrikerIdStr = liveStatus?.currentNonStrikerId?.toString();
    const currentBowlerIdStr = liveStatus?.currentBowlerId?.toString();

    // Merge live data into scorecard for immediate updates
    const battingWithLive = useMemo(() => {
        return batting.map((p: any) => {
            const pId = (p.playerId?._id || p.playerId || '').toString();
            if (pId === currentStrikerIdStr && liveStatus?.striker) {
                return { ...p, runs: liveStatus.striker.runs, balls: liveStatus.striker.balls, fours: liveStatus.striker.fours, sixes: liveStatus.striker.sixes };
            }
            if (pId === currentNonStrikerIdStr && liveStatus?.nonStriker) {
                return { ...p, runs: liveStatus.nonStriker.runs, balls: liveStatus.nonStriker.balls, fours: liveStatus.nonStriker.fours, sixes: liveStatus.nonStriker.sixes };
            }
            return p;
        });
    }, [batting, currentStrikerIdStr, currentNonStrikerIdStr, liveStatus?.striker, liveStatus?.nonStriker]);

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

            {loading ? (
                <ScorecardBodySkeleton />
            ) : (
                <>
                    <Card style={styles.tabCard}>
                        <View style={[styles.scorecardHeader, { borderBottomColor: theme.border }]}>
                            <ThemedText variant="small" weight="bold" style={styles.colName}>Batting</ThemedText>
                            <View style={styles.scoreCols}>
                                <View style={styles.colStatFixed}><ThemedText variant="small" weight="bold" style={{ textAlign: 'center' }}>R</ThemedText></View>
                                <View style={styles.colStatFixed}><ThemedText variant="small" weight="bold" style={{ textAlign: 'center' }}>B</ThemedText></View>
                                <View style={styles.colStatFixed}><ThemedText variant="small" weight="bold" style={{ textAlign: 'center' }}>4s</ThemedText></View>
                                <View style={styles.colStatFixed}><ThemedText variant="small" weight="bold" style={{ textAlign: 'center' }}>6s</ThemedText></View>
                            </View>
                        </View>
                        {battingWithLive.length === 0 && (
                            <ThemedText style={{ padding: spacing.md, textAlign: 'center' }} color="textSecondary">No batting records found.</ThemedText>
                        )}
                        {Array.isArray(battingWithLive) && battingWithLive.map((player: any, idx: number) => {
                            const pId = (player.playerId?._id || player.playerId || '').toString();
                            const isStriker = pId === currentStrikerIdStr;

                            return (
                                <TouchableOpacity
                                    key={pId || `bat-${idx}`}
                                    onPress={() => navigation.navigate('PlayerProfile', { playerId: pId })}
                                >
                                    <View style={[styles.playerRow, { borderBottomColor: theme.border + '50' }]}>
                                        <View style={styles.playerNameCol}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                                <ThemedText weight="semibold" style={{ color: isStriker ? theme.primary : theme.text }}>
                                                    {player.playerName || player.playerId?.name || 'Unknown'}
                                                </ThemedText>
                                                {isStriker && <Ionicons name="flashlight" size={12} color={theme.primary} style={styles.batIconSmall} />}
                                            </View>
                                            <ThemedText variant="caption" color="textSecondary">{player.dismissalText || 'not out'}</ThemedText>
                                        </View>
                                        <View style={styles.scoreCols}>
                                            <View style={styles.colStatFixed}><ThemedText weight="bold" style={{ textAlign: 'center' }}>{player.runs || 0}</ThemedText></View>
                                            <View style={styles.colStatFixed}><ThemedText variant="small" style={{ textAlign: 'center' }}>{player.balls || 0}</ThemedText></View>
                                            <View style={styles.colStatFixed}><ThemedText variant="small" style={{ textAlign: 'center' }}>{player.fours || 0}</ThemedText></View>
                                            <View style={styles.colStatFixed}><ThemedText variant="small" style={{ textAlign: 'center' }}>{player.sixes || 0}</ThemedText></View>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}

                        {/* Extras Row */}
                        <View style={[styles.playerRow, { borderBottomColor: theme.border + '50', backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#f9fafb' }]}>
                            <View style={styles.playerNameCol}>
                                <ThemedText weight="bold">Extras</ThemedText>
                                <ThemedText variant="caption" color="textSecondary">
                                    {` (wd ${scorecardData?.inning?.wides || 0}, nb ${scorecardData?.inning?.noBalls || 0}, b ${scorecardData?.inning?.byes || 0}, lb ${scorecardData?.inning?.legByes || 0})`}
                                </ThemedText>
                            </View>
                            <View style={styles.scoreCols}>
                                <View style={styles.colStatFixed}><ThemedText weight="bold" style={{ textAlign: 'center' }}>{scorecardData?.inning?.extras || 0}</ThemedText></View>
                                <View style={styles.colStatFixed}></View>
                                <View style={styles.colStatFixed}></View>
                                <View style={styles.colStatFixed}></View>
                            </View>
                        </View>

                        {/* Total Row */}
                        <View style={[styles.playerRow, { borderBottomColor: theme.border, paddingTop: 12, paddingBottom: 15 }]}>
                            <View style={styles.playerNameCol}>
                                <ThemedText weight="bold" style={{ fontSize: 16 }}>Total</ThemedText>
                                <ThemedText variant="caption" color="textSecondary">
                                    {`${scorecardData?.inning?.totalWickets || scorecardData?.wickets || 0} wickets, ${scorecardData?.inning?.overs || scorecardData?.overs || '0.0'} overs`}
                                </ThemedText>
                            </View>
                            <View style={styles.scoreCols}>
                                <View style={styles.colStatFixed}><ThemedText weight="bold" style={{ textAlign: 'center', fontSize: 18 }}>{scorecardData?.inning?.totalRuns || scorecardData?.totalRuns || 0}</ThemedText></View>
                                <View style={styles.colStatFixed}></View>
                                <View style={styles.colStatFixed}></View>
                                <View style={styles.colStatFixed}></View>
                            </View>
                        </View>
                    </Card>

                    <Card style={styles.tabCard}>
                        <View style={styles.scorecardHeader}>
                            <ThemedText variant="small" weight="bold" style={styles.colName}>Bowling</ThemedText>
                            <View style={styles.scoreCols}>
                                <View style={styles.colStatFixed}><ThemedText variant="small" weight="bold" style={{ textAlign: 'center' }}>O</ThemedText></View>
                                <View style={styles.colStatFixed}><ThemedText variant="small" weight="bold" style={{ textAlign: 'center' }}>M</ThemedText></View>
                                <View style={styles.colStatFixed}><ThemedText variant="small" weight="bold" style={{ textAlign: 'center' }}>R</ThemedText></View>
                                <View style={styles.colStatFixed}><ThemedText variant="small" weight="bold" style={{ textAlign: 'center' }}>W</ThemedText></View>
                            </View>
                        </View>
                        {bowling.length === 0 && (
                            <ThemedText style={{ padding: spacing.md, textAlign: 'center' }} color="textSecondary">No bowling records found.</ThemedText>
                        )}
                        {Array.isArray(bowling) && bowling.map((bowler: any, idx: number) => {
                            const pId = (bowler.playerId?._id || bowler.playerId || '').toString();
                            const isBowler = pId === currentBowlerIdStr;

                            return (
                                <TouchableOpacity
                                    key={pId || `bowl-${idx}`}
                                    onPress={() => navigation.navigate('PlayerProfile', { playerId: pId })}
                                >
                                    <View style={[styles.playerRow, { borderBottomColor: theme.border + '50' }]}>
                                        <View style={styles.playerNameCol}>
                                            <ThemedText weight="semibold" style={{ color: isBowler ? theme.primary : theme.text }}>
                                                {bowler.playerName || bowler.playerId?.name || 'Unknown'}
                                            </ThemedText>
                                        </View>
                                        <View style={styles.scoreCols}>
                                            <View style={styles.colStatFixed}><ThemedText variant="small" style={{ textAlign: 'center' }}>{bowler.overs || '0.0'}</ThemedText></View>
                                            <View style={styles.colStatFixed}><ThemedText variant="small" style={{ textAlign: 'center' }}>{bowler.maidens || 0}</ThemedText></View>
                                            <View style={styles.colStatFixed}><ThemedText variant="small" style={{ textAlign: 'center' }}>{bowler.runs || 0}</ThemedText></View>
                                            <View style={styles.colStatFixed}><ThemedText weight="bold" style={{ textAlign: 'center' }}>{bowler.wickets || 0}</ThemedText></View>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </Card>

                    <Card style={styles.tabCard}>
                        <ThemedText variant="subtitle" weight="bold" style={styles.cardTitle}>Fall of Wickets</ThemedText>
                        {!scorecardData?.fallOfWickets || scorecardData.fallOfWickets.length === 0 ? (
                            <ThemedText style={{ padding: spacing.md, textAlign: 'center' }} color="textSecondary">No wickets fallen.</ThemedText>
                        ) : (
                            <View style={{ paddingVertical: spacing.sm }}>
                                <View style={[styles.scorecardHeader, { borderBottomColor: theme.border, paddingBottom: 6 }]}>
                                    <View style={{ width: 45 }}><ThemedText variant="small" weight="bold">Wkt</ThemedText></View>
                                    <View style={{ flex: 1 }}><ThemedText variant="small" weight="bold">Batsman</ThemedText></View>
                                    <View style={{ width: 85, alignItems: 'center' }}><ThemedText variant="small" weight="bold">Score</ThemedText></View>
                                    <View style={{ width: 55, alignItems: 'flex-end' }}><ThemedText variant="small" weight="bold">Over</ThemedText></View>
                                </View>
                                {scorecardData.fallOfWickets.map((wkt: any, idx: number) => (
                                    <View key={idx} style={[styles.playerRow, { borderBottomColor: theme.border + '30', paddingVertical: spacing.sm }]}>
                                        <View style={{ width: 45 }}>
                                            <ThemedText weight="bold" style={{ color: theme.primary }}>{wkt.wicketNumber}</ThemedText>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <ThemedText weight="semibold">{wkt.batsmanName}</ThemedText>
                                        </View>
                                        <View style={{ width: 85, alignItems: 'center' }}>
                                            <ThemedText weight="bold">{wkt.score}</ThemedText>
                                        </View>
                                        <View style={{ width: 55, alignItems: 'flex-end' }}>
                                            <ThemedText color="textSecondary">{wkt.over}</ThemedText>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}
                    </Card>

                    <Card style={styles.tabCard}>
                        <ThemedText variant="subtitle" weight="bold" style={styles.cardTitle}>Partnerships</ThemedText>
                        {partnerships.length === 0 && (
                            <ThemedText style={{ padding: spacing.md, textAlign: 'center' }} color="textSecondary">No partnership records found.</ThemedText>
                        )}
                        <View style={{ paddingVertical: spacing.sm }}>
                            {Array.isArray(partnerships) && partnerships.map((part: any, idx: number) => {
                                const p1Name = part.batsman1Id?.name || part.batsman1Name || 'Batsman 1';
                                const p2Name = part.batsman2Id?.name || part.batsman2Name || 'Batsman 2';
                                const p1Runs = part.batsman1Runs || 0;
                                const p1Balls = part.batsman1Balls || 0;
                                const p2Runs = part.batsman2Runs || 0;
                                const p2Balls = part.batsman2Balls || 0;
                                const totalRuns = part.totalRuns || part.runs || 0;
                                const totalBalls = part.totalBalls || part.balls || 0;
                                const p1Pct = totalRuns > 0 ? (p1Runs / totalRuns) * 100 : 50;

                                return (
                                    <View key={idx} style={[styles.partnershipRow, { borderBottomColor: theme.border + '30' }]}>
                                        <View style={styles.partnershipPlayer}>
                                            <ThemedText variant="small" weight="bold" style={{ textAlign: 'left' }}>{p1Name}
                                                {/* <View style={{ width: 5, height: 5, backgroundColor: theme.primary, borderRadius: 5, marginLeft: 2 }}></View> */}</ThemedText>
                                            <ThemedText variant="caption" style={{ textAlign: 'left', color: `${theme.primary}` }}>
                                                {p1Runs}({p1Balls})</ThemedText>
                                        </View>

                                        <View style={styles.partnershipCenter}>
                                            <ThemedText weight="bold" color="primary">{totalRuns} ({totalBalls})</ThemedText>
                                            <View style={styles.partnershipBarContainer}>
                                                <View style={[styles.partnershipBar, { width: `${p1Pct}%`, backgroundColor: theme.primary, borderTopLeftRadius: 4, borderBottomLeftRadius: 4 }]} />
                                                <View style={[styles.partnershipBar, { width: `${100 - p1Pct}%`, backgroundColor: theme.secondary + '40', borderTopRightRadius: 4, borderBottomRightRadius: 4 }]} />
                                            </View>
                                        </View>

                                        <View style={[styles.partnershipPlayer, { alignItems: 'flex-end' }]}>
                                            <ThemedText variant="small" weight="bold" style={{ textAlign: 'right' }}>
                                                {/* <View style={{ width: 5, height: 5, backgroundColor: theme.secondary, borderRadius: 5 }}></View> */}
                                                {p2Name}</ThemedText>
                                            <ThemedText variant="caption" style={{ textAlign: 'right', color: `${theme.secondary}` }}>{p2Runs}({p2Balls})</ThemedText>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    </Card>
                </>
            )}

            <View style={{ height: 100 }} />
        </ScrollView>
    );
};

const ScoreSummaryHeader = ({ liveStatus, match, isConnected }: { liveStatus: any, match: any, isConnected?: boolean }) => {
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

    if (isScheduled || isCompleted) {
        const innings = liveStatus?.innings || match?.liveStatus?.innings || [];
        const t1Id = match?.teamAId?._id || match?.teamAId;
        const t2Id = match?.teamBId?._id || match?.teamBId;

        const t1Innings = innings.filter((i: any) => (i.battingTeamId?._id || i.battingTeamId) === t1Id).sort((a: any, b: any) => a.inningNumber - b.inningNumber);
        const t2Innings = innings.filter((i: any) => (i.battingTeamId?._id || i.battingTeamId) === t2Id).sort((a: any, b: any) => a.inningNumber - b.inningNumber);

        const winnerId = match?.result?.winnerId || match?.winnerId;
        const isT1Winner = winnerId && (winnerId?._id || winnerId) === (t1Id?._id || t1Id);
        const isT2Winner = winnerId && (winnerId?._id || winnerId) === (t2Id?._id || t2Id);

        return (
            <View style={[styles.liveScoreSection, { backgroundColor: headerBg, paddingVertical: 20, paddingHorizontal: 15 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    {/* LEFT SIDE: Team 1 */}
                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <View style={[styles.teamLogoBadge, { width: 44, height: 44, borderRadius: 22, backgroundColor: isDark ? theme.background : 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.1)' }]}>
                            {match?.teamAId?.logo ? <Image source={{ uri: match?.teamAId?.logo }} style={{ width: 30, height: 30 }} /> : <Ionicons name="shirt-outline" size={20} color="white" />}
                        </View>
                        <View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <ThemedText weight="bold" color="white" style={{ fontSize: 13 }}>{match?.teamAId?.shortName || match?.teamAId?.name}</ThemedText>
                                {isT1Winner && <Ionicons name="trophy" size={14} color="#fde047" />}
                            </View>
                            {isCompleted && t1Innings.map((inn: any, idx: number) => (
                                <ThemedText key={idx} weight={idx === t1Innings.length - 1 ? "bold" : "medium"} color="white" style={{ fontSize: idx === t1Innings.length - 1 ? 15 : 12, opacity: idx === t1Innings.length - 1 ? 1 : 0.7 }}>
                                    {inn.totalRuns}-{inn.totalWickets}
                                    {idx === t1Innings.length - 1 && <ThemedText variant="caption" color="white" style={{ opacity: 0.6 }}> ({inn.totalOvers || Math.floor((inn.totalBalls || 0) / 6)})</ThemedText>}
                                </ThemedText>
                            ))}
                        </View>
                    </View>

                    {/* CENTER SIDE: Time / VS */}
                    <View style={{ flex: 0.8, alignItems: 'center' }}>
                        {isScheduled ? (
                            <ThemedText weight="bold" style={{ color: "#fde047", fontSize: 20, letterSpacing: 0.5 }}>
                                {formatMatchTime(match?.matchDate)}
                            </ThemedText>
                        ) : (
                            <Ionicons name="flash" size={20} color="rgba(255,255,255,0.2)" />
                        )}
                    </View>

                    {/* RIGHT SIDE: Team 2 */}
                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
                        <View style={{ alignItems: 'flex-end' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                {isT2Winner && <Ionicons name="trophy" size={14} color="#fde047" />}
                                <ThemedText weight="bold" color="white" style={{ fontSize: 13 }}>{match?.teamBId?.shortName || match?.teamBId?.name}</ThemedText>
                            </View>
                            {isCompleted && t2Innings.map((inn: any, idx: number) => (
                                <ThemedText key={idx} weight={idx === t2Innings.length - 1 ? "bold" : "medium"} color="white" style={{ textAlign: 'right', fontSize: idx === t2Innings.length - 1 ? 15 : 12, opacity: idx === t2Innings.length - 1 ? 1 : 0.7 }}>
                                    {inn.totalRuns}-{inn.totalWickets}
                                    {idx === t2Innings.length - 1 && <ThemedText variant="caption" color="white" style={{ opacity: 0.6 }}> ({inn.totalOvers || Math.floor((inn.totalBalls || 0) / 6)})</ThemedText>}
                                </ThemedText>
                            ))}
                        </View>
                        <View style={[styles.teamLogoBadge, { width: 44, height: 44, borderRadius: 22, backgroundColor: isDark ? theme.background : 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.1)' }]}>
                            {match?.teamBId?.logo ? <Image source={{ uri: match?.teamBId?.logo }} style={{ width: 30, height: 30 }} /> : <Ionicons name="shirt-outline" size={20} color="white" />}
                        </View>
                    </View>
                </View>

                {/* FOOTER: Result / Date */}
                <View style={{ marginTop: 15, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', alignItems: 'center' }}>
                    <ThemedText variant="caption" weight="bold" style={{ color: isCompleted ? "#fde047" : "white", opacity: isCompleted ? 1 : 0.8 }}>
                        {isCompleted ? (match?.result?.resultText || 'MATCH FINISHED') : `${formatMatchDate(match?.matchDate)} • ${toss || 'PRE-MATCH'}`}
                    </ThemedText>
                </View>
            </View>
        );
    }

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
                            {/* {isConnected && !isScheduled && !isCompleted && (
                                <View style={[styles.p1Badge, { backgroundColor: '#22c55e', flexDirection: 'row', alignItems: 'center', gap: 3 }]}>
                                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: 'white' }} />
                                    <ThemedText color="white" weight="bold" style={styles.p1BadgeText}>LIVE</ThemedText>
                                </View>
                            )} */}
                            {!!liveStatus?.powerPlay && !isScheduled && !isCompleted && (
                                <View style={[styles.p1Badge, { backgroundColor: '#e24242c2' }]}>
                                    <ThemedText color="white" weight="bold" style={styles.p1BadgeText}>PP</ThemedText>
                                </View>
                            )}
                            {/* {isScheduled && (
                                <View style={[styles.p1Badge, { backgroundColor: '#f59e0b' }]}>
                                    <ThemedText color="white" weight="bold" style={styles.p1BadgeText}>UPCOMING</ThemedText>
                                </View>
                            )} */}
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

                        const rawVal = (liveStatus?.currentBall || '0').toString().trim();
                        const val = getBallDisplayText(rawVal);
                        const isBig = ['0', '1', '2', '3', '4', '5', '6', 'w', 'b'].includes(rawVal.toLowerCase());

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
                    <ThemedText color="white" variant="small" style={{ opacity: 0.8 }}>CRR: {Number(crr || 0).toFixed(2)}</ThemedText>
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

    // Fix: Ensure 'wd' (wide) is not caught by 'label.includes(w)' as a wicket
    const isWicket = ball.type === 'wicket' || ball.isWicket || (label === 'w' || label === 'wicket');
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
            <ThemedText
                variant="small"
                weight="bold"
                color={isWicket || isFour || isSix ? 'white' : 'text'}
                style={{ fontSize: (ball.ballLabel?.length > 2) ? 8 : 10 }} // Shrink font for longer labels like 'wd+1'
            >
                {isWicket ? 'W' : (ball.ballLabel || ball.runs)}
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

    useEffect(() => {
        const inning = liveStatus?.currentInning || 1;
        // Fetch specific data for Live tab on mount
        if (!sessionsData || sessionsData.length === 0) {
            dispatch(fetchSessions(matchId));
        }
        if (!recentOversData) {
            dispatch(fetchRecentOvers({ matchId, inning }));
        }
    }, [dispatch, matchId, liveStatus?.currentInning]);

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

    // Derived stats for players (Prefer LIVE socket objects)
    const striker = useMemo(() => {
        // 1. Try Live Object from socket first
        if (liveStatus?.striker) return liveStatus.striker;

        // 2. Fallback to Scorecard lookup
        const sid = liveStatus?.currentStrikerId?._id || liveStatus?.currentStrikerId;
        const sidStr = sid?.toString();
        return currentScorecard?.batting?.find((p: any) => (p.playerId?._id || p.playerId)?.toString() === sidStr) || null;
    }, [currentScorecard, liveStatus?.currentStrikerId, liveStatus?.striker]);

    const nonStriker = useMemo(() => {
        if (liveStatus?.nonStriker) return liveStatus.nonStriker;

        const nsid = liveStatus?.currentNonStrikerId?._id || liveStatus?.currentNonStrikerId;
        const nsidStr = nsid?.toString();
        return currentScorecard?.batting?.find((p: any) => (p.playerId?._id || p.playerId)?.toString() === nsidStr) || null;
    }, [currentScorecard, liveStatus?.currentNonStrikerId, liveStatus?.nonStriker]);

    const bowler = useMemo(() => {
        if (liveStatus?.bowler) return liveStatus.bowler;

        const bid = liveStatus?.currentBowlerId?._id || liveStatus?.currentBowlerId;
        const bidStr = bid?.toString();
        return currentScorecard?.bowling?.find((p: any) => (p.playerId?._id || p.playerId)?.toString() === bidStr) || null;
    }, [currentScorecard, liveStatus?.currentBowlerId, liveStatus?.bowler]);

    // Stable list of active batters to prevent UI "jumping" when strike changes
    const activeBatters = useMemo(() => {
        const list = [];
        if (striker) list.push(striker);
        if (nonStriker) list.push(nonStriker);

        // Sort by playerId string for stable fixed position
        return list.sort((a, b) => {
            const idA = (a.playerId?._id || a.playerId || '').toString();
            const idB = (b.playerId?._id || b.playerId || '').toString();
            return idA.localeCompare(idB);
        });
    }, [striker, nonStriker]);

    const currentStrikerIdStr = useMemo(() => {
        const sid = liveStatus?.currentStrikerId?._id || liveStatus?.currentStrikerId;
        return sid?.toString();
    }, [liveStatus?.currentStrikerId]);

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

                    {!!matchDate && (
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
                                                <ThemedText key={ball.ballId || `ostart-${bIdx}`} color="textSecondary" weight="bold" variant="small" style={{ marginRight: 4 }}>
                                                    {`Ov ${ball.overNumber}:`}
                                                </ThemedText>
                                            );
                                        }
                                        if (ball.type === 'over_summary') {
                                            return (
                                                <View key={ball.ballId || `os-${bIdx}`} style={{ flexDirection: 'row', alignItems: 'center' }}>
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
                                                key={ball.ballId || `${bIdx}-${ball.ballId || bIdx}`}
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

                {/* Consolidated Market Section (Odds, Session, Lambi) */}
                <View style={{ paddingHorizontal: spacing.md, marginBottom: spacing.md }}>
                    <Card style={{ padding: spacing.xs, backgroundColor: isDark ? theme.surface : theme.borderLight, borderColor: theme.border }}>
                        {/* Match Odds Row */}
                        {!!(liveStatus?.oddsBlue !== undefined || liveStatus?.oddsRed !== undefined) && (
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
                        {!!(liveStatus?.session || liveStatus?.sessionBlue || liveStatus?.sessionRed) && (
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
                        {!!(liveStatus?.lambi || liveStatus?.lambiBlue || liveStatus?.lambiRed) && (
                            <View style={[styles.sessionRow, { backgroundColor: 'transparent', paddingHorizontal: spacing.xs, height: 40, borderBottomWidth: (sessionsData && sessionsData.length > 0) ? StyleSheet.hairlineWidth : 0, borderBottomColor: theme.border }]}>
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

                        {/* Mini Session Table (only last session) */}
                        {(() => {
                            const lastSes = sessionsData && sessionsData.length > 0 ? sessionsData[sessionsData.length - 1] : null;
                            if (!lastSes) return null;

                            const diff = lastSes.pass - lastSes.open;
                            const statusColor = diff > 0 ? theme.success : (diff < 0 ? theme.error : theme.warning);
                            const statusIcon = diff > 0 ? '>' : (diff < 0 ? '<' : '=');

                            return (
                                <View style={{ marginTop: 2, paddingTop: 4, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border }}>
                                    <View style={[styles.miniSessionHeader, { marginBottom: 2 }]}>
                                        <ThemedText variant="caption" weight="bold" style={{ flex: 1.5, fontSize: 10, opacity: 0.5 }}>L. SESSION</ThemedText>
                                        <ThemedText variant="caption" weight="bold" style={{ flex: 1, fontSize: 10, opacity: 0.5, textAlign: 'center' }}>OPEN</ThemedText>
                                        <ThemedText variant="caption" weight="bold" style={{ flex: 1, fontSize: 10, opacity: 0.5, textAlign: 'center' }}>MIN</ThemedText>
                                        <ThemedText variant="caption" weight="bold" style={{ flex: 1, fontSize: 10, opacity: 0.5, textAlign: 'center' }}>MAX</ThemedText>
                                        <ThemedText variant="caption" weight="bold" style={{ flex: 1, fontSize: 10, opacity: 0.5, textAlign: 'right' }}>PASS</ThemedText>
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', height: 22 }}>
                                        <ThemedText weight="bold" style={{ flex: 1.5, fontSize: 10.5 }}>{lastSes.session} Ov</ThemedText>
                                        <ThemedText style={{ flex: 1, fontSize: 10.5, textAlign: 'center' }}>{lastSes.open}</ThemedText>
                                        <ThemedText style={{ flex: 1, fontSize: 10.5, textAlign: 'center', opacity: 0.7 }}>{lastSes.min}</ThemedText>
                                        <ThemedText style={{ flex: 1, fontSize: 10.5, textAlign: 'center', opacity: 0.7 }}>{lastSes.max}</ThemedText>
                                        <ThemedText weight="bold" style={{ flex: 1, fontSize: 10.5, textAlign: 'right', color: statusColor }}>{statusIcon}{lastSes.pass}</ThemedText>
                                    </View>
                                </View>
                            );
                        })()}
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

                    {activeBatters.length > 0 ? (
                        activeBatters.map((player: any) => {
                            const pId = (player.playerId?._id || player.playerId || '').toString();
                            const isStriker = pId === currentStrikerIdStr;

                            return (
                                <View key={pId} style={[styles.tableRow, { borderBottomColor: theme.border }]}>
                                    <View style={[styles.colBatter, { flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
                                        <ThemedText
                                            weight="bold"
                                            onPress={() => {
                                                navigation.navigate('PlayerProfile', {
                                                    playerId: pId,
                                                });
                                            }}
                                            style={{ color: isStriker ? theme.primary : (isDark ? 'rgba(255,255,255,0.7)' : theme.textSecondary) }}
                                        >
                                            {player.playerName || player.name || player.playerId?.name || 'Player'}
                                        </ThemedText>
                                        {isStriker && <Ionicons name="flashlight" size={12} color={theme.primary} style={styles.batIconSmall} />}
                                    </View>
                                    <ThemedText weight="medium" style={styles.colStatSmall} color={isStriker ? 'text' : 'textSecondary'}>
                                        {player.runs || 0} ({player.balls || 0})
                                    </ThemedText>
                                    <ThemedText style={styles.colStatSmall} color={isStriker ? 'text' : 'textSecondary'}>{player.fours || 0}</ThemedText>
                                    <ThemedText style={styles.colStatSmall} color={isStriker ? 'text' : 'textSecondary'}>{player.sixes || 0}</ThemedText>
                                    <ThemedText style={styles.colStatSmall} color={isStriker ? 'text' : 'textSecondary'}>{formatSR(player.runs, player.balls)}</ThemedText>
                                </View>
                            );
                        })
                    ) : (
                        <ThemedText style={{ padding: spacing.sm, textAlign: 'center' }} color="textSecondary">No Batters Active</ThemedText>
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

                {/* Session Table for Live Match */}
                <SessionsTable sessions={sessionsData} />

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

                            {!!isCategorySelectorVisible && (
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

const SummaryTab = ({ matchId }: { matchId: string }) => {
    const { theme, isDark } = useTheme();
    const {
        details: match,
        scorecard: reduxScorecard,
        recentOvers: recentOversData,
    } = useAppSelector(state => state.match);

    const recentBalls = useMemo(() => {
        if (!recentOversData || !Array.isArray(recentOversData)) return [];
        const balls = recentOversData.flatMap(ov => ov.balls || []);
        return balls.slice(-12);
    }, [recentOversData]);

    const topPerformers = useMemo(() => {
        const results: any[] = [];
        [1, 2].forEach(innNum => {
            const sc = reduxScorecard[innNum];
            if (sc) {
                const bestBatter = sc.batting && sc.batting.length > 0 ? [...sc.batting].sort((a, b) => (b.runs || 0) - (a.runs || 0))[0] : null;
                const bestBowler = sc.bowling && sc.bowling.length > 0 ? [...sc.bowling].sort((a, b) => (b.wickets || 0) - (a.wickets || 0) || (a.runs || 0) - (b.runs || 0))[0] : null;
                if (bestBatter) results.push({ type: 'bat', ...bestBatter, inning: innNum });
                if (bestBowler) results.push({ type: 'bowl', ...bestBowler, inning: innNum });
            }
        });
        return results;
    }, [reduxScorecard]);

    return (
        <ScrollView style={{ flex: 1, backgroundColor: theme.background }}>
            <View style={{ padding: spacing.md, gap: spacing.md }}>

                <Card style={[styles.tabCard, { backgroundColor: theme.primary + '10', borderLeftWidth: 4, borderLeftColor: theme.primary, paddingVertical: 15 }]}>
                    <ThemedText weight="bold" style={{ fontSize: 16 }}>{match?.result?.resultText || 'Match Concluded'}</ThemedText>
                </Card>

                {!!(match?.playerOfMatch || match?.pom) && (
                    <Card style={styles.tabCard}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
                            <View style={[styles.pomIconContainer, { backgroundColor: isDark ? '#333' : '#f0f0f0' }]}>
                                <Ionicons name="medal" size={28} color="#fde047" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <ThemedText variant="caption" color="textSecondary">PLAYER OF THE MATCH</ThemedText>
                                <ThemedText weight="bold" style={{ fontSize: 18 }}>{match?.playerOfMatch?.name || match?.playerOfMatch || match?.pom?.name || 'N/A'}</ThemedText>
                                <ThemedText variant="small" color="textSecondary">{match?.playerOfMatch?.performance || ''}</ThemedText>
                            </View>
                        </View>
                    </Card>
                )}

                <View style={{ gap: spacing.sm }}>
                    <ThemedText weight="bold" style={{ marginLeft: 4 }}>Top Performers</ThemedText>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                        {topPerformers.map((p, idx) => (
                            <View key={idx} style={[styles.performerCard, { backgroundColor: isDark ? theme.surface : '#fff', borderColor: theme.border, borderWidth: 1 }]}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <ThemedText variant="caption" weight="bold" color="primary">INN {p.inning}</ThemedText>
                                    <Ionicons name={p.type === 'bat' ? 'baseball-outline' : 'disc-outline'} size={14} color={theme.textSecondary} />
                                </View>
                                <ThemedText weight="bold" numberOfLines={1}>{p.playerName || p.playerId?.name}</ThemedText>
                                <ThemedText style={{ fontSize: 16, marginTop: 4 }} weight="bold">
                                    {p.type === 'bat' ? `${p.runs}(${p.balls})` : `${p.wickets}/${p.runs}`}
                                </ThemedText>
                            </View>
                        ))}
                    </View>
                </View>

                <Card style={styles.tabCard}>
                    <ThemedText variant="subtitle" weight="bold" style={{ marginBottom: 12 }}>Last Delivery Highlights</ThemedText>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {recentBalls.map((ball, idx) => (
                            <AnimatedBall key={idx} ball={ball} isLast={false} theme={theme} isDark={isDark} />
                        ))}
                    </ScrollView>
                </Card>

                <Card style={styles.tabCard}>
                    <ThemedText weight="bold" style={{ marginBottom: 10 }}>Match Poll Results</ThemedText>
                    <View style={{ gap: 12 }}>
                        <View>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                                <ThemedText variant="small" weight="medium">{match?.teamAId?.shortName || 'Team A'}</ThemedText>
                                <ThemedText variant="small" weight="bold">64%</ThemedText>
                            </View>
                            <View style={{ height: 8, backgroundColor: isDark ? '#333' : '#eee', borderRadius: 4, overflow: 'hidden' }}>
                                <View style={{ width: '64%', height: '100%', backgroundColor: theme.primary }} />
                            </View>
                        </View>
                        <View>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                                <ThemedText variant="small" weight="medium">{match?.teamBId?.shortName || 'Team B'}</ThemedText>
                                <ThemedText variant="small" weight="bold">36%</ThemedText>
                            </View>
                            <View style={{ height: 8, backgroundColor: isDark ? '#333' : '#eee', borderRadius: 4, overflow: 'hidden' }}>
                                <View style={{ width: '36%', height: '100%', backgroundColor: theme.secondary }} />
                            </View>
                        </View>
                    </View>
                </Card>

            </View>
            <View style={{ height: 100 }} />
        </ScrollView>
    );
};

const FantasyTab = ({ matchId, onViewAll, onAnalysis }: { matchId: string, onViewAll: () => void, onAnalysis: (type: string) => void }) => {
    const { theme, isDark } = useTheme();
    const dispatch = useAppDispatch();
    const { refreshing, analytics } = useAppSelector(state => state.match);

    useEffect(() => {
        if (!analytics && !refreshing.analytics) {
            dispatch(fetchMatchAnalytics(matchId));
        }
    }, [dispatch, matchId, analytics]);

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

const ManhattanChart = ({ data, theme, teamCode, color }: { data: any[], theme: any, teamCode: string, color: string }) => {
    if (!data || data.length === 0) return (
        <View style={[styles.graphPlaceholder, { height: 160 }]}>
            <ThemedText color="textSecondary">No data available yet</ThemedText>
        </View>
    );

    const chartWidth = Dimensions.get('window').width - spacing.lg * 4;
    const chartHeight = 150;
    const maxRuns = Math.max(...data.map(o => o.runs), 10);
    const barWidth = (chartWidth / Math.max(data.length, 20)) * 0.8;
    const spacingX = chartWidth / Math.max(data.length, 20);

    return (
        <View style={{ marginVertical: spacing.md }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs }}>
                <ThemedText variant="caption" weight="bold" style={{ color: color }}>{teamCode}</ThemedText>
                <ThemedText variant="caption" color="textSecondary">Max: {maxRuns} Runs</ThemedText>
            </View>
            <Svg width={chartWidth} height={chartHeight}>
                {/* Horizontal Grid Lines */}
                {[0, 0.5, 1].map((v, i) => (
                    <Line
                        key={i}
                        x1="0"
                        y1={chartHeight * v}
                        x2={chartWidth}
                        y2={chartHeight * v}
                        stroke={theme.border}
                        strokeWidth="0.5"
                        strokeDasharray="4,4"
                    />
                ))}

                {Array.isArray(data) && data.map((over, index) => {
                    const h = (over.runs / maxRuns) * chartHeight;
                    const x = index * spacingX;
                    return (
                        <G key={index}>
                            <Rect
                                x={x}
                                y={chartHeight - h}
                                width={barWidth}
                                height={h}
                                fill={color}
                                rx={2}
                            />
                            {over.wickets > 0 && Array.from({ length: over.wickets }).map((_, wIdx) => (
                                <Circle
                                    key={wIdx}
                                    cx={x + barWidth / 2}
                                    cy={chartHeight - h - (wIdx + 1) * 8}
                                    r={3}
                                    fill={theme.error}
                                />
                            ))}
                        </G>
                    );
                })}
            </Svg>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                <ThemedText variant="small" color="textSecondary">Over 1</ThemedText>
                <ThemedText variant="small" color="textSecondary">Over {data.length}</ThemedText>
            </View>
        </View>
    );
};

const WormChart = ({ analytics, theme, team1Code, team2Code }: { analytics: any[], theme: any, team1Code: string, team2Code: string }) => {
    if (!analytics || analytics.length === 0) return null;

    const chartWidth = Dimensions.get('window').width - spacing.lg * 4;
    const chartHeight = 200;

    const allScores = analytics.flatMap(inn => inn.overs.map((o: any) => o.cumulativeRuns));
    const maxScore = Math.max(...allScores, 1);
    const maxOvers = Math.max(...analytics.map(inn => inn.overs.length), 20);

    const getPoints = (overs: any[]) => {
        return overs.map((o, i) => {
            const x = (i / (maxOvers - 1)) * chartWidth;
            const y = chartHeight - (o.cumulativeRuns / maxScore) * chartHeight;
            return `${x},${y}`;
        }).join(' ');
    };

    return (
        <View style={{ marginVertical: spacing.md }}>
            <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.sm, justifyContent: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <View style={{ width: 12, height: 3, backgroundColor: theme.primary, borderRadius: 2 }} />
                    <ThemedText variant="small" weight="medium">{team1Code}</ThemedText>
                </View>
                {analytics.length > 1 && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <View style={{ width: 12, height: 3, backgroundColor: theme.secondary, borderRadius: 2 }} />
                        <ThemedText variant="small" weight="medium">{team2Code}</ThemedText>
                    </View>
                )}
            </View>

            <Svg width={chartWidth} height={chartHeight}>
                {/* Grid */}
                {[0, 0.25, 0.5, 0.75, 1].map((v, i) => (
                    <Line
                        key={i}
                        x1="0"
                        y1={chartHeight * v}
                        x2={chartWidth}
                        y2={chartHeight * v}
                        stroke={theme.border}
                        strokeWidth="0.5"
                    />
                ))}

                {Array.isArray(analytics) && analytics.map((inn, idx) => (
                    <Polyline
                        key={idx}
                        points={getPoints(inn.overs)}
                        fill="none"
                        stroke={idx === 0 ? theme.primary : theme.secondary}
                        strokeWidth="2"
                    />
                ))}
            </Svg>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                <ThemedText variant="small" color="textSecondary">Start</ThemedText>
                <ThemedText variant="small" color="textSecondary">End</ThemedText>
            </View>
        </View>
    );
};

const GraphsTab = () => {
    const { theme } = useTheme();
    const dispatch = useAppDispatch();
    const { analytics, refreshing, details: match } = useAppSelector(state => state.match);

    useEffect(() => {
        if (!analytics && !refreshing.analytics && match?._id) {
            dispatch(fetchMatchAnalytics(match._id));
        }
    }, [dispatch, match?._id, analytics]);

    const onRefresh = useCallback(() => {
        if (match?._id) {
            dispatch(setRefreshing({ key: 'analytics', value: true }));
            dispatch(fetchMatchAnalytics(match._id));
        }
    }, [dispatch, match?._id]);

    const team1Code = match?.teamAId?.shortName || match?.teamAId?.code || 'T1';
    const team2Code = match?.teamBId?.shortName || match?.teamBId?.code || 'T2';

    const renderComparisonHeader = () => {
        if (!analytics || analytics.length < 2) return null;

        const inn1 = analytics[0];
        const inn2 = analytics[1];
        const commonOver = Math.min(inn1.overs.length, inn2.overs.length);

        if (commonOver === 0) return null;

        const over1 = inn1.overs[commonOver - 1];
        const over2 = inn2.overs[commonOver - 1];

        return (
            <Card style={[styles.tabCard, { borderLeftWidth: 4, borderLeftColor: theme.primary }]}>
                <ThemedText variant="subtitle" weight="bold">At This Stage (Over {commonOver})</ThemedText>
                <View style={{ flexDirection: 'row', marginTop: spacing.md, justifyContent: 'space-around' }}>
                    <View style={{ alignItems: 'center' }}>
                        <ThemedText color="textSecondary" variant="small" weight="bold">{team1Code}</ThemedText>
                        <ThemedText variant="title" weight="bold">{over1.cumulativeRuns}/{inn1.overs.reduce((acc: number, cur: any, idx: number) => idx < commonOver ? acc + cur.wickets : acc, 0)}</ThemedText>
                        <ThemedText variant="caption" color="primary">RR: {(over1.cumulativeRuns / commonOver).toFixed(2)}</ThemedText>
                    </View>
                    <View style={{ width: 1, backgroundColor: theme.border }} />
                    <View style={{ alignItems: 'center' }}>
                        <ThemedText color="textSecondary" variant="small" weight="bold">{team2Code}</ThemedText>
                        <ThemedText variant="title" weight="bold">{over2.cumulativeRuns}/{inn2.overs.reduce((acc: number, cur: any, idx: number) => idx < commonOver ? acc + cur.wickets : acc, 0)}</ThemedText>
                        <ThemedText variant="caption" color="secondary">RR: {(over2.cumulativeRuns / commonOver).toFixed(2)}</ThemedText>
                    </View>
                </View>
            </Card>
        );
    };

    return (
        <ScrollView
            style={[styles.tabContent, { backgroundColor: theme.background }]}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing.analytics}
                    onRefresh={onRefresh}
                    colors={[theme.primary]}
                    tintColor={theme.primary}
                />
            }
        >
            {renderComparisonHeader()}

            <Card style={styles.tabCard}>
                <ThemedText variant="subtitle" weight="bold" style={styles.cardTitle}>Run Rate Worm</ThemedText>
                <WormChart analytics={analytics || []} theme={theme} team1Code={team1Code} team2Code={team2Code} />
            </Card>

            <Card style={styles.tabCard}>
                <ThemedText variant="subtitle" weight="bold" style={styles.cardTitle}>Manhattan - Run Rate per Over</ThemedText>
                {analytics && analytics.length > 0 && (
                    <ManhattanChart
                        data={analytics[0].overs}
                        theme={theme}
                        teamCode={team1Code}
                        color={theme.primary}
                    />
                )}
                {analytics && analytics.length > 1 && (
                    <ManhattanChart
                        data={analytics[1].overs}
                        theme={theme}
                        teamCode={team2Code}
                        color={theme.secondary}
                    />
                )}
                {(!analytics || analytics.length === 0) && (
                    <View style={styles.graphPlaceholder}>
                        <Ionicons name="stats-chart" size={60} color={theme.primary + '30'} />
                        <ThemedText color="textSecondary">Waiting for match data...</ThemedText>
                    </View>
                )}
            </Card>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
};

const PointsTableTab = ({ seriesId }: { seriesId: string }) => {
    const { theme, isDark } = useTheme();
    const dispatch = useAppDispatch();
    const { pointsTable, loading, refreshing } = useAppSelector(state => state.match);

    useEffect(() => {
        if (seriesId && pointsTable.length === 0 && !refreshing.pointsTable) {
            dispatch(fetchPointsTable(seriesId));
        }
    }, [dispatch, seriesId, pointsTable.length]);

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
                {Array.isArray(pointsTable) && pointsTable.map((item: any, idx: number) => {
                    const team = item.teamId;
                    const nrr = Number(item.netRunRate || 0).toFixed(3);
                    const nrrPrefix = Number(nrr) > 0 ? '+' : '';

                    return (
                        <View key={idx} style={[styles.pointsTableRow, { borderBottomColor: theme.border + '50' }]}>
                            <View style={styles.colRank}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                                    <ThemedText style={{ fontSize: 11, fontWeight: 'bold' }}>{item.position || idx + 1}</ThemedText>
                                    {!!item.qualify && (
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

    // 1. Initial Load: Fetch essentials for the initial view (Header + Score + Active Players)
    useEffect(() => {
        if (!matchId) return;
        dispatch(fetchMatchDetails(matchId));
        dispatch(fetchLiveStatus(matchId));
        // We fetch scorecards initially because they provide the fallback stats for active players
        dispatch(fetchScorecard({ matchId, inning: 1 }));
        dispatch(fetchScorecard({ matchId, inning: 2 }));

        return () => {
            dispatch(resetMatchState());
        };
    }, [matchId, dispatch]);

    // 1b. Dynamic Inning Load: If live status shows an inning we didn't fetch yet, fetch it
    useEffect(() => {
        if (liveStatus?.currentInning && liveStatus.currentInning > 2 && !reduxScorecard[liveStatus.currentInning]) {
            dispatch(fetchScorecard({ matchId, inning: liveStatus.currentInning }));
        }
    }, [liveStatus?.currentInning, matchId, !!reduxScorecard[liveStatus?.currentInning], loading.scorecard]);

    // 1c. Live Inning Sync: Fetch live status to get updated innings list when current inning changes
    useEffect(() => {
        if (matchId && liveStatus?.currentInning) {
            dispatch(fetchLiveStatus(matchId));
        }
    }, [liveStatus?.currentInning, matchId, dispatch]);


    // Live socket data — rich per-event updates
    const {
        matchUpdate,
        scorecardDelta,
        latestCommentary,
        prependCommentary,
        isConnected,
    } = useLiveMatch(matchId);



    
    const currentInning = liveStatus?.currentInning || 1;
    const loadingMatch = loading.details;
    const loadingStatus = loading.liveStatus;

    // On WICKET or OVER_END, do a lightweight REST refresh (scorecard via socket already updates the tab)
    useEffect(() => {
        if (!matchUpdate) return;
        if (matchUpdate.type === 'WICKET' || matchUpdate.type === 'OVER_END') {
            dispatch(fetchPartnerships({ matchId, inning: currentInning }));
            dispatch(fetchRecentOvers({ matchId, inning: currentInning }));
            dispatch(fetchSessions(matchId));
        }

        // If the backend sent an UNDO (currentBall = 'confirming'), we must fetch a fresh commentary 
        // list so we can remove the deleted ball and any deleted highlights.
        if (matchUpdate.currentBall === 'confirming') {
            dispatch(removeLatestCommentary());
            // We can optionally refresh recent overs if needed, but it's not absolutely necessary
            dispatch(fetchRecentOvers({ matchId, inning: currentInning }));
        }
    }, [matchUpdate?.type, matchUpdate?.timestamp, matchUpdate?.currentBall, matchId, dispatch, currentInning]);

    const currentScorecard = reduxScorecard[currentInning];

    const [selectedTeamIndex, setSelectedTeamIndex] = useState<0 | 1 | null>(null);
    const [sheetType, setSheetType] = useState<'squad' | 'fantasy-all' | 'analysis' | 'language'>('squad');
    const appLanguage = useAppSelector(state => state.app.language);
    const isMuted = useAppSelector(state => state.app.isMuted);
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

    // ─── Stable Tab Components to prevent 'stale' route error ──────────────
    const InfoTabWrapper = useCallback(() => (
        <InfoTab matchId={matchId} onTeamPress={handleTeamPress} />
    ), [matchId, handleTeamPress]);

    const LiveTabWrapper = useCallback(() => (
        <View style={{ flex: 1 }}>
            <LiveTab matchId={matchId} onTeamPress={handleTeamPress} />
        </View>
    ), [matchId, handleTeamPress]);

    const FantasyTabWrapper = useCallback(() => (
        <FantasyTab matchId={matchId} onViewAll={handleFantasyViewAll} onAnalysis={handleAnalysisPress} />
    ), [matchId, handleFantasyViewAll, handleAnalysisPress]);

    const CommentaryTabWrapper = useCallback(() => (
        <CommentaryTab matchId={matchId} />
    ), [matchId]);

    const ScorecardTabWrapper = useCallback(() => (
        <ScorecardTab matchId={matchId} />
    ), [matchId]);

    const PointsTabWrapper = useCallback(() => (
        <PointsTableTab seriesId={match?.seriesId?._id || (typeof match?.seriesId === 'string' ? match?.seriesId : '')} />
    ), [match?.seriesId?._id, match?.seriesId]);

    const SummaryTabWrapper = useCallback(() => (
        <SummaryTab matchId={matchId} />
    ), [matchId]);

    const isCompleted = match?.status === 'completed';

    // Determine initial route based on match status
    const initialRouteName = useMemo(() => {
        if (match?.status === 'live') return 'Live';
        if (match?.status === 'completed') return 'Summary';
        return 'Info';
    }, [match?.status]);

    // ─── Skeleton while match data loads ────────────────────────────────────────
    // Wait for core data to avoid partial "pop-in" and "No Batters Active" flickers
    
    const hasCurrentScorecard = !!reduxScorecard[currentInning];
    // Defensive check: only wait for scorecard if it's a standard inning (1-4). 
    // If currentInning is 6 (anomaly), don't stay stuck on skeleton.
    const isLoadingScorecard = loading.scorecard;
    const shouldWaitScorecard = isLoadingScorecard && !hasCurrentScorecard;
    
    if (!match || !liveStatus || shouldWaitScorecard) {
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
                            <TouchableOpacity style={styles.headerIcon} onPress={() => dispatch(toggleMute())}>
                                <Ionicons name={isMuted ? "volume-mute" : "volume-high"} size={20} color="white" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.navigate('MatchLedger', { matchId })}>
                                <Ionicons name="pin-outline" size={20} color="white" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.headerIcon}>
                                <Ionicons name="notifications-outline" size={20} color="white" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.headerIcon} onPress={() => {
                                setSheetType('language');
                                bottomSheetRef.current?.expand();
                            }}>
                                <Ionicons name="ellipsis-vertical" size={20} color="white" />
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
                        <ScoreSummaryHeader liveStatus={liveStatus} match={match} isConnected={isConnected} />
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
                <Tab.Screen name="Info" component={InfoTabWrapper} />
                <Tab.Screen name="Fantasy" component={FantasyTabWrapper} />
                {isCompleted ? (
                    <Tab.Screen name="Summary" component={SummaryTabWrapper} />
                ) : (
                    <Tab.Screen name="Live" component={LiveTabWrapper} />
                )}
                {!match?.noScorecards && <Tab.Screen name="Scorecard" component={ScorecardTabWrapper} />}
                {!match?.noCommentry && <Tab.Screen name="Commentary" component={CommentaryTabWrapper} />}
                <Tab.Screen name="Graphs" component={GraphsTab} />
                {!!match?.seriesId?.hasPoints && (
                    <Tab.Screen name="Points" options={{ tabBarLabel: 'Points Table' }} component={PointsTabWrapper} />
                )}
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
                                if (loading.squads) {
                                    return (
                                        <View style={{ padding: spacing.xl, alignItems: 'center' }}>
                                            <ActivityIndicator size="large" color={theme.primary} />
                                        </View>
                                    );
                                }

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

                    {sheetType === 'language' && (
                        <>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg }}>
                                <ThemedText variant="subtitle" weight="bold">Commentary Language</ThemedText>
                                <TouchableOpacity onPress={() => bottomSheetRef.current?.close()}>
                                    <Ionicons name="close" size={24} color={theme.text} />
                                </TouchableOpacity>
                            </View>
                            <View style={{ gap: spacing.md }}>
                                {[
                                    { code: 'en', label: 'English', demo: 'Language set to English' },
                                    { code: 'hi', label: 'Hindi (हिंदी)', demo: 'भाषा हिंदी में सेट हो गई है' },
                                    { code: 'ta', label: 'Tamil (தமிழ்)', demo: 'Mozhi thamizhukku maatrapattadhu' }
                                ].map(lang => (
                                    <TouchableOpacity
                                        key={lang.code}
                                        style={[styles.statListCard, { backgroundColor: appLanguage === lang.code ? theme.primary + '20' : (isDark ? 'rgba(255,255,255,0.05)' : theme.borderLight), borderColor: appLanguage === lang.code ? theme.primary : 'transparent' }]}
                                        onPress={() => {
                                            dispatch(setLanguage(lang.code as 'en' | 'hi' | 'ta'));
                                            Speech.stop();
                                            Speech.speak(lang.demo, { language: lang.code, pitch: 1, rate: 1.1 });
                                            setTimeout(() => bottomSheetRef.current?.close(), 500);
                                        }}
                                    >
                                        <Ionicons name="language-outline" size={24} color={appLanguage === lang.code ? theme.primary : theme.textSecondary} />
                                        <View style={{ flex: 1, marginLeft: spacing.md }}>
                                            <ThemedText weight="bold" color={appLanguage === lang.code ? 'primary' : 'text'}>{lang.label}</ThemedText>
                                        </View>
                                        {appLanguage === lang.code && <Ionicons name="checkmark-circle" size={24} color={theme.primary} />}
                                    </TouchableOpacity>
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
        fontSize: 20,
        color: '#2dd4bf', // Teal/Cyan
    },
    oversText: {
        fontSize: 12,
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
        fontSize: 40,
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
    miniSessionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
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
    colStatFixed: {
        width: 38,
        alignItems: 'center',
        justifyContent: 'center',
    },
    colStat: {
        width: 38,
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
    pomIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
    },
    performerCard: {
        width: '48%',
        padding: spacing.md,
        borderRadius: 12,
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
    bottomSheetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        marginBottom: spacing.xs,
    },
    milestoneCardContainer: {
        marginHorizontal: spacing.md,
        marginVertical: spacing.sm,
    },
    milestoneCard: {
        borderRadius: 12,
        padding: spacing.md,
    },
    milestoneHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    milestoneIconContainer: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default MatchDetailScreen;
