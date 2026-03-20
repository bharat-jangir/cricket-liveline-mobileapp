import React, { useState, useRef, useMemo, useCallback } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    Image,
    SafeAreaView,
    Modal,
    TextInput,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { createMaterialTopTabNavigator, MaterialTopTabBar } from '@react-navigation/material-top-tabs';
import BottomSheet, { BottomSheetScrollView, BottomSheetBackdrop, BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { useTheme } from '../theme/ThemeContext';
import { spacing, fontSize, borderRadius, elevation } from '../theme';
import { Text as ThemedText } from '../components/ui/Text';
import { Card } from '../components/ui/Card';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useLiveMatch } from '../hooks/useLiveMatch';
import { MatchService } from '../services/match.service';
import { useFetch } from '../hooks/useFetch';

type MatchDetailNavigationProp = StackNavigationProp<RootStackParamList, 'MatchDetails'>;

const Tab = createMaterialTopTabNavigator();
const { width } = Dimensions.get('window');

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

const H2H_DATA = {
    total: 15,
    team1Wins: 8,
    team2Wins: 6,
    noResult: 1,
    lastFive: ['WP', 'LIO', 'WP', 'WP', 'LIO']
};

// --- Tab Components ---

const InfoTab = ({ match, onTeamPress }: { match: any, onTeamPress: (team: 'WP' | 'LIO') => void }) => {
    const { theme, isDark } = useTheme();
    const navigation = useNavigation<MatchDetailNavigationProp>();

    return (
        <ScrollView style={[styles.tabContent, { backgroundColor: theme.background }]}>
            {/* Series Section */}
            <Card style={[styles.tabCard, { borderColor: theme.border }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
                    <ThemedText variant="subtitle" weight="bold">Series</ThemedText>
                    {match?.seriesId && (
                        <TouchableOpacity onPress={() => navigation.navigate('SeriesDetail', { seriesId: match.seriesId._id })}>
                            <ThemedText color="primary" weight="bold" variant="small">View Series {`>`}</ThemedText>
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
                        {(match?.teamAId?.shortName || 'T1')} vs {(match?.teamBId?.shortName || 'T2')}, {match?.matchNumber || 'Match'}
                    </ThemedText>
                </View>
                <View style={[styles.infoRow, { borderBottomColor: theme.border + '50' }]}>
                    <ThemedText color="textSecondary" style={styles.infoLabel}>Date & Time</ThemedText>
                    <ThemedText weight="medium" style={styles.infoValue}>
                        {match?.matchDate ? new Date(match.matchDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'}, {match?.matchTime ? new Date(match.matchTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
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

            {/* Playing XI */}
            <Card style={[styles.tabCard, { borderColor: theme.border }]}>
                <ThemedText variant="subtitle" weight="bold" style={[styles.cardTitle, { borderBottomColor: theme.border }]}>Playing XI</ThemedText>
                <View style={{ gap: spacing.md }}>
                    <TouchableOpacity
                        style={[styles.teamSelectorRow, { backgroundColor: isDark ? theme.surface : theme.borderLight }]}
                        onPress={() => onTeamPress('WP')}
                    >
                        <View style={styles.teamLogoBadgeSmall}>
                            {match?.teamAId?.logo ? <Image source={{ uri: match.teamAId.logo }} style={{ width: 20, height: 20 }} /> : <Ionicons name="shirt-outline" size={16} color={theme.textSecondary} />}
                        </View>
                        <ThemedText weight="bold" style={{ flex: 1 }}>{match?.teamAId?.name || 'Team A'}</ThemedText>
                        <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.teamSelectorRow, { backgroundColor: isDark ? theme.surface : theme.borderLight }]}
                        onPress={() => onTeamPress('LIO')}
                    >
                        <View style={styles.teamLogoBadgeSmall}>
                            {match?.teamBId?.logo ? <Image source={{ uri: match.teamBId.logo }} style={{ width: 20, height: 20 }} /> : <Ionicons name="shirt-outline" size={16} color={theme.textSecondary} />}
                        </View>
                        <ThemedText weight="bold" style={{ flex: 1 }}>{match?.teamBId?.name || 'Team B'}</ThemedText>
                        <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
                    </TouchableOpacity>
                </View>
            </Card>

            {/* Head to Head */}
            <Card style={[styles.tabCard, { borderColor: theme.border }]}>
                <ThemedText variant="subtitle" weight="bold" style={[styles.cardTitle, { borderBottomColor: theme.border }]}>Head to Head</ThemedText>
                <View style={styles.h2hContainer}>
                    <View style={styles.h2hStatRow}>
                        <View style={styles.h2hTeamInfo}>
                            <ThemedText weight="bold">WP</ThemedText>
                            <ThemedText color="primary" variant="title" weight="bold">{H2H_DATA.team1Wins}</ThemedText>
                        </View>
                        <View style={styles.h2hDivider}>
                            <ThemedText variant="small" color="textSecondary">TOT: {H2H_DATA.total}</ThemedText>
                            <View style={styles.h2hProgressContainer}>
                                <View style={[styles.h2hProgressBar, { width: `${(H2H_DATA.team1Wins / H2H_DATA.total) * 100}%`, backgroundColor: theme.primary }]} />
                            </View>
                        </View>
                        <View style={[styles.h2hTeamInfo, { alignItems: 'flex-end' }]}>
                            <ThemedText weight="bold">LIO</ThemedText>
                            <ThemedText color="textSecondary" variant="title" weight="bold">{H2H_DATA.team2Wins}</ThemedText>
                        </View>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'center', marginTop: spacing.md }}>
                        {H2H_DATA.lastFive.map((winner, i) => (
                            <View key={i} style={[styles.h2hBadge, { backgroundColor: winner === 'WP' ? theme.primary : theme.textSecondary }]}>
                                <ThemedText color="white" weight="bold" variant="caption">{winner}</ThemedText>
                            </View>
                        ))}
                    </View>
                </View>
            </Card>

            <View style={{ height: 20 }} />
        </ScrollView>
    );
};

const CommentaryTab = () => {
    const { theme } = useTheme();
    return (
        <ScrollView style={[styles.tabContent, { backgroundColor: theme.background }]}>
            <View style={styles.commentaryItem}>
                <View style={styles.overColumn}>
                    <ThemedText weight="bold">45.2</ThemedText>
                </View>
                <View style={styles.commentaryText}>
                    <ThemedText>Cummins to Rahul, <ThemedText weight="bold">SIX</ThemedText>, what a shot! That's out of the ground.</ThemedText>
                </View>
            </View>
            <View style={styles.commentaryItem}>
                <View style={styles.overColumn}>
                    <ThemedText weight="bold">45.1</ThemedText>
                </View>
                <View style={styles.commentaryText}>
                    <ThemedText>Cummins to Rahul, 2 runs, clipped away to deep mid-wicket for a couple.</ThemedText>
                </View>
            </View>
        </ScrollView>
    );
};

const ScorecardTab = () => {
    const { theme, isDark } = useTheme();
    const [activeInnings, setActiveInnings] = useState(1);

    const INNINGS_DATA = [
        { id: 1, label: 'WP 1st Inn', score: '325/10' },
        { id: 2, label: 'LIO 1st Inn', score: '280/10' },
        { id: 3, label: 'WP 2nd Inn', score: '150/4' },
        { id: 4, label: 'LIO 2nd Inn', score: 'Yet to bat' },
    ];

    const batting = [
        { name: 'Tony de Zorzi', status: 'c Williams b Rabada', runs: 112, balls: 145, fours: 12, sixes: 2, sr: 77.24 },
        { name: 'Kyle Verreynne', status: 'b Sipamla', runs: 85, balls: 110, fours: 8, sixes: 1, sr: 77.27 },
        { name: 'George Linde', status: 'not out', runs: 45, balls: 60, fours: 4, sixes: 1, sr: 75.00 },
    ];

    const bowling = [
        { name: 'Kagiso Rabada', overs: '22', maidens: '4', runs: '75', wickets: '3', economy: '3.40' },
        { name: 'Lizaad Williams', overs: '18', maidens: '2', runs: '68', wickets: '2', economy: '3.77' },
        { name: 'L Sipamla', overs: '15', maidens: '1', runs: '55', wickets: '2', economy: '3.66' },
    ];

    const partnerships = [
        { p1: { name: 'De Zorzi', runs: 65 }, p2: { name: 'Verreynne', runs: 45 }, total: 110, balls: 160 },
        { p1: { name: 'Verreynne', runs: 20 }, p2: { name: 'Linde', runs: 30 }, total: 50, balls: 85 },
    ];

    return (
        <ScrollView style={[styles.tabContent, { backgroundColor: theme.background }]}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.inningsSelectors}
                contentContainerStyle={{ paddingHorizontal: spacing.sm }}
            >
                {INNINGS_DATA.map((inn) => (
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
                <View style={styles.scorecardHeader}>
                    <ThemedText variant="small" weight="bold" style={styles.colName}>Batting</ThemedText>
                    <View style={styles.scoreCols}>
                        <ThemedText variant="small" weight="bold" style={styles.colStat}>R</ThemedText>
                        <ThemedText variant="small" weight="bold" style={styles.colStat}>B</ThemedText>
                        <ThemedText variant="small" weight="bold" style={styles.colStat}>4s</ThemedText>
                        <ThemedText variant="small" weight="bold" style={styles.colStat}>6s</ThemedText>
                    </View>
                </View>
                {batting.map((player, idx) => (
                    <View key={idx} style={styles.playerRow}>
                        <View style={styles.playerNameCol}>
                            <ThemedText weight="semibold" style={{ color: theme.primary }}>{player.name}</ThemedText>
                            <ThemedText variant="caption" color="textSecondary">{player.status}</ThemedText>
                        </View>
                        <View style={styles.scoreCols}>
                            <ThemedText weight="bold" style={styles.colStat}>{player.runs}</ThemedText>
                            <ThemedText variant="small" style={styles.colStat}>{player.balls}</ThemedText>
                            <ThemedText variant="small" style={styles.colStat}>{player.fours}</ThemedText>
                            <ThemedText variant="small" style={styles.colStat}>{player.sixes}</ThemedText>
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
                {bowling.map((bowler, idx) => (
                    <View key={idx} style={styles.playerRow}>
                        <ThemedText weight="semibold" style={[styles.playerNameCol, { color: theme.text }]}>{bowler.name}</ThemedText>
                        <View style={styles.scoreCols}>
                            <ThemedText variant="small" style={styles.colStat}>{bowler.overs}</ThemedText>
                            <ThemedText variant="small" style={styles.colStat}>{bowler.maidens}</ThemedText>
                            <ThemedText variant="small" style={styles.colStat}>{bowler.runs}</ThemedText>
                            <ThemedText weight="bold" style={styles.colStat}>{bowler.wickets}</ThemedText>
                        </View>
                    </View>
                ))}
            </Card>

            {/* Partnerships Section */}
            <Card style={styles.tabCard}>
                <ThemedText variant="subtitle" weight="bold" style={styles.cardTitle}>Partnerships</ThemedText>
                {partnerships.map((part, idx) => {
                    const p1Pct = (part.p1.runs / part.total) * 100;
                    return (
                        <View key={idx} style={{ marginBottom: spacing.md }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                                <View>
                                    <ThemedText variant="small" weight="bold">{part.p1.name}</ThemedText>
                                    <ThemedText variant="caption" color="textSecondary">{part.p1.runs} ({p1Pct.toFixed(0)}%)</ThemedText>
                                </View>
                                <View style={{ alignItems: 'center' }}>
                                    <ThemedText weight="bold">{part.total}</ThemedText>
                                    <ThemedText variant="caption" color="textSecondary">{part.balls} balls</ThemedText>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <ThemedText variant="small" weight="bold">{part.p2.name}</ThemedText>
                                    <ThemedText variant="caption" color="textSecondary">{part.p2.runs} ({(100 - p1Pct).toFixed(0)}%)</ThemedText>
                                </View>
                            </View>
                            <View style={[styles.partnershipBar, { backgroundColor: isDark ? theme.border : theme.borderLight }]}>
                                <View style={[styles.p1Fill, { width: `${p1Pct}%`, backgroundColor: theme.primary }]} />
                                <View style={[styles.p2Fill, { width: `${100 - p1Pct}%`, backgroundColor: theme.textSecondary }]} />
                            </View>
                        </View>
                    );
                })}
            </Card>
        </ScrollView>
    );
};

const ScoreSummaryHeader = ({ liveStatus, match }: { liveStatus: any, match: any }) => {
    const { theme, isDark } = useTheme();
    const headerBg = isDark ? theme.surface : theme.primary;

    if (!liveStatus && !match) return <View style={[styles.liveScoreSection, { backgroundColor: headerBg }]} />

    const teamCode = liveStatus?.battingTeamId?.shortName || liveStatus?.battingTeamId?.name || match?.teamAId?.shortName || 'T1';
    const score = liveStatus?.score || '0-0';
    const overs = liveStatus?.overs || '0.0';
    const crr = liveStatus?.runRate || '0.00';
    const toss = liveStatus?.toss || match?.toss?.tossText || 'Toss Pending';

    return (
        <View style={[styles.liveScoreSection, { backgroundColor: headerBg }]}>
            <View style={styles.mainScoreRow}>
                <View style={styles.teamScoreInfo}>
                    <View style={[styles.teamLogoBadge, { backgroundColor: isDark ? theme.background : 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.1)' }]}>
                        {match?.teamAId?.logo ? <Image source={{ uri: match.teamAId.logo }} style={styles.scoreTeamLogo} /> : <Ionicons name="shirt-outline" size={24} color="white" />}
                    </View>
                    <View>
                        <View style={styles.codeRow}>
                            <ThemedText weight="bold" color="white" style={styles.teamCodeText}>{teamCode}</ThemedText>
                        </View>
                        <View style={styles.scoreValueRow}>
                            <ThemedText variant="title" weight="bold" color="white" style={styles.liveScoreText}>{score}</ThemedText>
                            <ThemedText color="white" style={[styles.oversText, { opacity: 0.8 }]}>{overs}</ThemedText>
                        </View>
                    </View>
                </View>
                <View style={[styles.scoreDivider, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />
                <View style={styles.secondaryScore}>
                    <ThemedText style={[styles.bigZeroText, { color: '#fde047' }]}>{liveStatus?.currentBall || '•'}</ThemedText>
                </View>
            </View>

            <View style={[styles.crrTossRow, { borderTopColor: 'rgba(255,255,255,0.1)' }]}>
                <ThemedText color="white" variant="small" style={{ opacity: 0.8 }}>CRR: {crr}</ThemedText>
                <ThemedText color="white" variant="small" style={{ opacity: 0.8 }} numberOfLines={1}>{toss}</ThemedText>
            </View>
        </View>
    );
};

const BET_CATEGORIES = ['Match Odds', 'Session', 'Fancy', 'Tied Match', 'Custom'];

const LiveTab = ({ navigation, matchId, liveStatus, ballData }: { navigation: MatchDetailNavigationProp, matchId: string, liveStatus: any, ballData: any }) => {
    const { theme, isDark } = useTheme();

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

        // Mock saving entry - in a real app this would call an API or update a global store
        alert(`Entry saved for ${newClientName}: ₹${newAmount} against ${matchId}`);

        setIsAddEntryVisible(false);
        setNewClientName('');
        setNewAmount('');
        setNewRate('');
        setNewType('pending');
        setNewCategory(BET_CATEGORIES[0]);
        setNewSessionChoice('Yes');
    };

    return (
        <View style={styles.tabContentContainer}>
            <ScrollView style={[styles.tabContent, { backgroundColor: theme.background }]}>
                <View style={[styles.overSummaryRow, { backgroundColor: isDark ? theme.surface : theme.background, borderBottomColor: theme.border }]}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.overScrollContent}
                    >
                        <View style={styles.overBallsRow}>
                            <ThemedText color="textSecondary" variant="small">0 = 7</ThemedText>
                            <ThemedText weight="bold" variant="small">Over 10</ThemedText>
                            <View style={[styles.overBall, { backgroundColor: theme.borderLight, borderColor: theme.border, borderWidth: 1 }]}><ThemedText variant="small">2</ThemedText></View>
                            <View style={[styles.overBall, { backgroundColor: theme.borderLight, borderColor: theme.border, borderWidth: 1 }]}><ThemedText variant="small">1</ThemedText></View>
                            <View style={[styles.overBall, styles.boundaryBall]}><ThemedText color="white" variant="small" weight="bold">4</ThemedText></View>
                            <View style={[styles.overBall, { backgroundColor: theme.borderLight, borderColor: theme.border, borderWidth: 1 }]}><ThemedText variant="small">0</ThemedText></View>
                            <View style={[styles.overBall, { backgroundColor: theme.borderLight, borderColor: theme.border, borderWidth: 1 }]}><ThemedText variant="small">6</ThemedText></View>
                            <View style={[styles.overBall, { backgroundColor: theme.borderLight, borderColor: theme.border, borderWidth: 1 }]}><ThemedText variant="small">wd</ThemedText></View>
                            <View style={[styles.overBall, { backgroundColor: theme.borderLight, borderColor: theme.border, borderWidth: 1 }]}><ThemedText variant="small">1</ThemedText></View>
                            <View style={[styles.overBall, { backgroundColor: theme.borderLight, borderColor: theme.border, borderWidth: 1 }]}><ThemedText variant="small">0</ThemedText></View>
                            <View style={[styles.overBallPlaceholder, { borderColor: theme.border }]} />
                            <ThemedText color="textSecondary" variant="small">{`= 7 Overs >`}</ThemedText>
                        </View>
                    </ScrollView>
                </View>

                <View style={styles.liveTeamHeader}>
                    <View style={styles.teamLabelRow}>
                        <ThemedText weight="bold">Western Province</ThemedText>
                        <Ionicons name="information-circle-outline" size={14} color={theme.textSecondary} />
                    </View>
                    <View style={styles.teamScoreBadges}>
                        <View style={[styles.badgeLabel, { backgroundColor: theme.borderLight }]}>
                            <ThemedText variant="small" weight="bold">WP</ThemedText>
                            <Ionicons name="flashlight" size={12} color={theme.primary} />
                        </View>
                        <View style={[styles.statValueBox, { backgroundColor: '#1d4ed8' }]}>
                            <ThemedText variant="small" weight="bold" color="white">63</ThemedText>
                        </View>
                        <View style={[styles.statValueBox, { backgroundColor: '#991b1b' }]}>
                            <ThemedText variant="small" weight="bold" color="white">70</ThemedText>
                        </View>
                    </View>
                </View>

                <View style={styles.statsTable}>
                    <View style={[styles.tableHeader, { borderBottomColor: theme.border }]}>
                        <ThemedText variant="caption" color="textSecondary" style={styles.colBatter}>Batter</ThemedText>
                        <ThemedText variant="caption" color="textSecondary" style={styles.colStatSmall}>R (B)</ThemedText>
                        <ThemedText variant="caption" color="textSecondary" style={styles.colStatSmall}>4s</ThemedText>
                        <ThemedText variant="caption" color="textSecondary" style={styles.colStatSmall}>6s</ThemedText>
                        <ThemedText variant="caption" color="textSecondary" style={styles.colStatSmall}>SR</ThemedText>
                    </View>
                    <View style={[styles.tableRow, { borderBottomColor: theme.border }]}>
                        <ThemedText weight="bold" style={styles.colBatter} color="primary">Tony de Zorzi</ThemedText>
                        <ThemedText style={styles.colStatSmall}>47 (35)</ThemedText>
                        <ThemedText style={styles.colStatSmall}>5</ThemedText>
                        <ThemedText style={styles.colStatSmall}>2</ThemedText>
                        <ThemedText style={styles.colStatSmall}>134.3</ThemedText>
                        <Ionicons name="chevron-down" size={14} color={theme.textLight} />
                    </View>
                    <View style={[styles.tableRow, { borderBottomColor: theme.border }]}>
                        <View style={[styles.colBatter, { flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
                            <ThemedText weight="bold" color="primary">D Bedingham</ThemedText>
                            <Ionicons name="flashlight" size={12} color="#facc15" />
                        </View>
                        <ThemedText style={styles.colStatSmall}>15 (11)</ThemedText>
                        <ThemedText style={styles.colStatSmall}>3</ThemedText>
                        <ThemedText style={styles.colStatSmall}>0</ThemedText>
                        <ThemedText style={styles.colStatSmall}>136.4</ThemedText>
                        <Ionicons name="chevron-down" size={14} color={theme.textLight} />
                    </View>
                </View>

                <View style={[styles.partnershipStrip, { backgroundColor: isDark ? theme.surface : theme.borderLight }]}>
                    <ThemedText color="textSecondary" variant="small">{`P'ship: 46 (30) >`}</ThemedText>
                    <ThemedText color="textSecondary" variant="small">Last wkt: V Kitime 10 (13)</ThemedText>
                </View>

                {/* Bowling Stats Table */}
                <View style={styles.statsTable}>
                    <View style={[styles.tableHeader, { borderBottomColor: theme.border }]}>
                        <ThemedText variant="caption" color="textSecondary" style={styles.colBatter}>Bowler</ThemedText>
                        <ThemedText variant="caption" color="textSecondary" style={styles.colStatSmall}>W-R</ThemedText>
                        <ThemedText variant="caption" color="textSecondary" style={styles.colStatSmall}>Overs</ThemedText>
                        <ThemedText variant="caption" color="textSecondary" style={styles.colStatSmall}>Econ</ThemedText>
                    </View>
                    <View style={[styles.tableRow, { borderBottomColor: theme.border }]}>
                        <ThemedText weight="bold" style={styles.colBatter}>L Sipamla</ThemedText>
                        <ThemedText style={styles.colStatSmall}>0-22</ThemedText>
                        <ThemedText style={styles.colStatSmall}>1.5</ThemedText>
                        <ThemedText style={styles.colStatSmall}>12.00</ThemedText>
                        <Ionicons name="chevron-down" size={14} color={theme.textLight} />
                    </View>
                </View>

                <View style={[styles.predictionSection, { backgroundColor: isDark ? theme.surface : theme.borderLight }]}>
                    <View style={styles.predictionHeaderRow}>
                        <ThemedText weight="bold">Who will win?</ThemedText>
                        <ThemedText color="textSecondary" variant="caption">Total Votes: 36,179</ThemedText>
                    </View>
                    <View style={styles.predictionButtonsRow}>
                        <TouchableOpacity style={[styles.predButton, { backgroundColor: theme.background, borderColor: theme.border }]}><ThemedText weight="bold">WP</ThemedText></TouchableOpacity>
                        <TouchableOpacity style={[styles.predButton, { backgroundColor: theme.background, borderColor: theme.border }]}><ThemedText weight="bold">LIO</ThemedText></TouchableOpacity>
                    </View>
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
                        <View style={styles.projRow}>
                            <ThemedText color="primary" weight="bold" style={styles.projColHeader}>6.91*</ThemedText>
                            <ThemedText weight="bold" style={styles.projColValue}>138</ThemedText>
                            <ThemedText weight="bold" style={styles.projColValue}>345</ThemedText>
                        </View>
                        <View style={styles.projRow}>
                            <ThemedText color="textSecondary" style={styles.projColHeader}>7.0</ThemedText>
                            <ThemedText color="textSecondary" style={styles.projColValue}>140</ThemedText>
                            <ThemedText color="textSecondary" style={styles.projColValue}>350</ThemedText>
                        </View>
                        <View style={[styles.projRow, { borderBottomWidth: 0 }]}>
                            <ThemedText color="textSecondary" style={styles.projColHeader}>8.0</ThemedText>
                            <ThemedText color="textSecondary" style={styles.projColValue}>160</ThemedText>
                            <ThemedText color="textSecondary" style={styles.projColValue}>400</ThemedText>
                        </View>
                    </View>

                    <View style={styles.notificationStrip}>
                        <View style={[styles.notificationInner, { backgroundColor: theme.primary + '15', marginTop: spacing.md }]}>
                            <Ionicons name="notifications-outline" size={18} color={theme.primary} />
                            <ThemedText color="text" variant="small" style={{ flex: 1 }}>Turn on Updates for Match</ThemedText>
                            <TouchableOpacity><ThemedText color="primary" weight="bold" variant="small">Turn On</ThemedText></TouchableOpacity>
                        </View>
                    </View>
                </View>
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

const POINTS_TABLE_DATA = [
    { rank: 1, team: 'LIO', played: 5, won: 4, lost: 1, nr: 0, nrr: '+1.245', cupR: 4, pts: 16, status: 'Q', trophy: true },
    { rank: 2, team: 'WP', played: 5, won: 3, lost: 2, nr: 0, nrr: '+0.856', cupR: 3, pts: 12, status: 'Q' },
    { rank: 3, team: 'DOL', played: 5, won: 2, lost: 2, nr: 1, nrr: '-0.124', cupR: 2, pts: 10 },
    { rank: 4, team: 'TIT', played: 5, won: 2, lost: 3, nr: 0, nrr: '-0.450', cupR: 1, pts: 8, status: 'E' },
    { rank: 5, team: 'WAR', played: 5, won: 1, lost: 4, nr: 0, nrr: '-1.200', cupR: 0, pts: 4, status: 'E' },
];

// --- Tab Components ---

const FantasyTab = ({ onViewAll, onAnalysis }: { onViewAll: () => void, onAnalysis: (type: string) => void }) => {
    const { theme, isDark } = useTheme();
    return (
        <ScrollView style={[styles.tabContent, { backgroundColor: theme.background }]}>
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
    return (
        <ScrollView style={[styles.tabContent, { backgroundColor: theme.background }]}>
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

const PointsTableTab = () => {
    const { theme, isDark } = useTheme();
    return (
        <ScrollView style={[styles.tabContent, { backgroundColor: theme.background }]}>
            <Card style={styles.tabCard}>
                <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: '#22c55e', alignItems: 'center', justifyContent: 'center' }}>
                            <ThemedText color="white" style={{ fontSize: 8 }}>Q</ThemedText>
                        </View>
                        <ThemedText variant="caption" color="textSecondary">Qualified</ThemedText>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center' }}>
                            <ThemedText color="white" style={{ fontSize: 8 }}>E</ThemedText>
                        </View>
                        <ThemedText variant="caption" color="textSecondary">Eliminated</ThemedText>
                    </View>
                </View>

                <View style={[styles.pointsTableHeader, { borderBottomColor: theme.border }]}>
                    <ThemedText variant="small" weight="bold" style={styles.colRank}>#</ThemedText>
                    <ThemedText variant="small" weight="bold" style={styles.colTeam}>TEAM</ThemedText>
                    <ThemedText variant="small" weight="bold" style={styles.colStatMini}>P</ThemedText>
                    <ThemedText variant="small" weight="bold" style={styles.colStatMini}>W</ThemedText>
                    <ThemedText variant="small" weight="bold" style={styles.colStatMini}>L</ThemedText>
                    <ThemedText variant="small" weight="bold" style={styles.colStatMini}>NR</ThemedText>
                    <ThemedText variant="small" weight="bold" style={styles.colNrrCompact}>NRR</ThemedText>
                    <ThemedText variant="small" weight="bold" style={styles.colCupRCompact}>CupR</ThemedText>
                    <ThemedText variant="small" weight="bold" style={styles.colStatMini}>PTS</ThemedText>
                </View>
                {POINTS_TABLE_DATA.map((item, idx) => (
                    <View key={idx} style={[styles.pointsTableRow, { borderBottomColor: theme.border + '50' }]}>
                        <View style={styles.colRank}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                                <ThemedText style={{ fontSize: 11, fontWeight: 'bold' }}>{item.rank}</ThemedText>
                                {item.status && (
                                    <View style={{
                                        width: 12,
                                        height: 12,
                                        borderRadius: 6,
                                        backgroundColor: item.status === 'Q' ? '#22c55e' : '#ef4444',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <ThemedText color="white" style={{ fontSize: 7, fontWeight: 'bold' }}>{item.status}</ThemedText>
                                    </View>
                                )}
                            </View>
                        </View>
                        <View style={[styles.colTeam, { flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
                            <View style={[styles.teamLogoBadgeSmall, { width: 18, height: 18 }]}>
                                <ThemedText weight="bold" style={{ fontSize: 8 }}>{item.team[0]}</ThemedText>
                            </View>
                            <ThemedText style={{ fontSize: 11, fontWeight: 'bold' }}>{item.team}</ThemedText>
                        </View>
                        <ThemedText style={styles.colStatMiniText}>{item.played}</ThemedText>
                        <ThemedText style={styles.colStatMiniText}>{item.won}</ThemedText>
                        <ThemedText style={styles.colStatMiniText}>{item.lost}</ThemedText>
                        <ThemedText style={styles.colStatMiniText}>{item.nr}</ThemedText>
                        <ThemedText style={[styles.colNrrCompactText, { color: item.nrr.startsWith('+') ? theme.primary : theme.textSecondary }]}>{item.nrr}</ThemedText>
                        <View style={styles.colCupRCompact}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                                <ThemedText style={{ fontSize: 10, fontWeight: 'bold' }}>{item.cupR}</ThemedText>
                                {item.trophy && (
                                    <Ionicons name="trophy" size={10} color="#f59e0b" />
                                )}
                            </View>
                        </View>
                        <ThemedText style={[styles.colStatMiniText, { color: theme.primary, fontWeight: 'bold' }]}>{item.pts}</ThemedText>
                    </View>
                ))}
            </Card>
        </ScrollView>
    );
};

// --- Main Screen ---

export const MatchDetailScreen: React.FC = () => {
    const { theme, isDark } = useTheme();
    const navigation = useNavigation<MatchDetailNavigationProp>();
    const route = useRoute<RouteProp<RootStackParamList, 'MatchDetails'>>();
    const { matchId } = route.params;

    // Fetch static match details
    const { data: match, loading: loadingMatch } = useFetch(
        () => MatchService.getMatchDetails(matchId),
        [matchId]
    );

    // Live socket data
    const { matchStatus, ballData, isConnected } = useLiveMatch(matchId);

    // Initial live status from REST (until socket takes over or as a base)
    const { data: initialLiveStatus } = useFetch(
        () => MatchService.getLiveStatus(matchId),
        [matchId]
    );

    const liveStatus = matchStatus || initialLiveStatus;

    const [selectedTeam, setSelectedTeam] = useState<'WP' | 'LIO' | null>(null);
    const [sheetType, setSheetType] = useState<'squad' | 'fantasy-all' | 'analysis'>('squad');
    const [analysisTab, setAnalysisTab] = useState('mostRuns');

    const bottomSheetRef = useRef<BottomSheet>(null);
    const snapPoints = useMemo(() => {
        if (sheetType === 'fantasy-all' || sheetType === 'analysis') return ['70%', '90%'];
        return ['50%', '80%'];
    }, [sheetType]);

    const handleTeamPress = useCallback((team: 'WP' | 'LIO') => {
        setSheetType('squad');
        setSelectedTeam(team);
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

    const team1Name = match?.teamAId?.name || match?.teamA?.name || 'Team 1';
    const team2Name = match?.teamBId?.name || match?.teamB?.name || 'Team 2';
    const team1Code = match?.teamAId?.shortName || match?.teamAId?.code || 'T1';
    const team2Code = match?.teamBId?.shortName || match?.teamBId?.code || 'T2';

    const squad = selectedTeam === 'WP' ? SQUAD_DATA.WP : SQUAD_DATA.LIO; // still mock squad for now

    const groupedSquad = useMemo(() => {
        const groups: { [key: string]: { name: string; role: string }[] } = {
            'Batters': [],
            'Wicket-keepers': [],
            'All-rounders': [],
            'Bowlers': []
        };

        squad.forEach(player => {
            if (player.role.includes('Batter') && !player.role.includes('WK')) groups['Batters'].push(player);
            else if (player.role.includes('WK')) groups['Wicket-keepers'].push(player);
            else if (player.role.includes('All-rounder')) groups['All-rounders'].push(player);
            else if (player.role.includes('Bowler')) groups['Bowlers'].push(player);
        });

        return groups;
    }, [squad, selectedTeam]);

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header section (Navbar) */}
            <View style={[styles.header, { backgroundColor: isDark ? theme.surface : theme.primary }]}>
                <SafeAreaView>
                    <View style={styles.navRow}>
                        <View style={styles.navLeft}>
                            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                                <Ionicons name="arrow-back" size={24} color="white" />
                            </TouchableOpacity>
                            <View style={{ flexDirection: 'row', gap: 4, marginRight: 8 }}>
                                {/* <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: '#22c55e', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'white' }}>
                                    <ThemedText color="white" weight="bold" style={{ fontSize: 10 }}>Q</ThemedText>
                                </View>
                                <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'white' }}>
                                    <ThemedText color="white" weight="bold" style={{ fontSize: 10 }}>E</ThemedText>
                                </View> */}
                            </View>
                            <ThemedText variant="subtitle" color="white" weight="bold" style={[styles.headerTitle, { flex: 1 }]} numberOfLines={1}>
                                CSA Provincial One-Day
                            </ThemedText>
                        </View>
                        <View style={styles.navRight}>
                            <TouchableOpacity style={styles.headerIcon}>
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
                tabBar={(props) => (
                    <View>
                        <MaterialTopTabBar {...props} />
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
                <Tab.Screen name="Info">
                    {() => <InfoTab match={match} onTeamPress={handleTeamPress} />}
                </Tab.Screen>
                <Tab.Screen name="Live">
                    {() => <View style={{flex: 1}}>
                                <ScoreSummaryHeader liveStatus={liveStatus} match={match} />
                                <LiveTab navigation={navigation} matchId={matchId} liveStatus={liveStatus} ballData={ballData} />
                            </View>}
                </Tab.Screen>
                <Tab.Screen name="Fantasy">
                    {() => <FantasyTab onViewAll={handleFantasyViewAll} onAnalysis={handleAnalysisPress} />}
                </Tab.Screen>
                <Tab.Screen name="Commentary" component={CommentaryTab} />
                <Tab.Screen name="Scorecard" component={ScorecardTab} />
                <Tab.Screen name="Graphs" component={GraphsTab} />
                <Tab.Screen name="Points" component={PointsTableTab} options={{ tabBarLabel: 'Points Table' }} />
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
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg }}>
                                <ThemedText variant="subtitle" weight="bold">
                                    {selectedTeam === 'WP' ? 'Western Province' : 'Lions'} Squad
                                </ThemedText>
                                <TouchableOpacity onPress={() => bottomSheetRef.current?.close()}>
                                    <Ionicons name="close" size={24} color={theme.text} />
                                </TouchableOpacity>
                            </View>

                            {Object.entries(groupedSquad).map(([role, players]) => (
                                players.length > 0 && (
                                    <View key={role} style={{ marginBottom: spacing.lg }}>
                                        <View style={{ borderBottomWidth: 1, borderBottomColor: theme.border, paddingBottom: 4, marginBottom: spacing.sm }}>
                                            <ThemedText color="primary" weight="bold" variant="small">{role.toUpperCase()}</ThemedText>
                                        </View>
                                        <View style={styles.squadGrid}>
                                            {players.map((player, index) => (
                                                <View key={index} style={styles.squadItem}>
                                                    <View style={[styles.playerAvatarPlaceholder, { backgroundColor: theme.primary + '20' }]}>
                                                        <Ionicons name="person" size={20} color={theme.primary} />
                                                    </View>
                                                    <View style={{ flex: 1 }}>
                                                        <ThemedText weight="bold" variant="small" numberOfLines={1}>{player.name}</ThemedText>
                                                        <ThemedText variant="caption" color="textSecondary">{player.role}</ThemedText>
                                                    </View>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                )
                            ))}
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
        borderBottomColor: '#f1f5f9',
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
        fontSize: 18,
    },
    p1Badge: {
        backgroundColor: '#ef4444',
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderRadius: 2,
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
        width: 1,
        height: 40,
        backgroundColor: '#334155',
        marginHorizontal: spacing.md,
    },
    secondaryScore: {
        flex: 1,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: spacing.md,
    },
    bigZeroText: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#fde047', // Yellowish
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
        gap: 8,
    },
    overScrollContent: {
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
    },
    overBall: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#1e293b',
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
        backgroundColor: '#1e293b',
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
        borderBottomColor: '#334155',
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
        borderBottomColor: '#334155',
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
    partnershipBar: {
        height: 8,
        borderRadius: 4,
        flexDirection: 'row',
        overflow: 'hidden',
        marginTop: 4,
    },
    p1Fill: {
        height: '100%',
    },
    p2Fill: {
        height: '100%',
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
});

export default MatchDetailScreen;
