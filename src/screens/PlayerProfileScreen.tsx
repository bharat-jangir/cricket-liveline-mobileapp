import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Dimensions, ScrollView, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { spacing, borderRadius, fontSize } from '../theme';
import { Text as ThemedText } from '../components/ui/Text';
import { mockPlayers, Player, PlayerStats, completedMatches, Match } from '../data/mockData';
import { PlayerProvider, usePlayerContext } from '../contexts/PlayerContext';
import { MatchCard } from '../components/MatchCard';
// import { Text } from 'react-native-gesture-handler'; // Removed incorrect import

const TopTab = createMaterialTopTabNavigator();
const { width } = Dimensions.get('window');

type StatFormat = 'test' | 'odi' | 't20i';

// --- Tab Components ---

const OverviewTab = ({ player }: { player: Player }) => {
    const { theme, isDark } = useTheme();
    const { statMode } = usePlayerContext();
    const [activeFormat, setActiveFormat] = useState<StatFormat>('odi');
    const { width: windowWidth } = useWindowDimensions();

    const numColumns = windowWidth > 900 ? 4 : windowWidth > 600 ? 3 : 2;
    // Calculate precise width: Total Container (windowWidth - outer padding) - total inner gap margins
    const availableWidth = windowWidth - (spacing.md * 2) - (spacing.lg * 2);
    // Subtract gap spacing explicitly, then divide by columns. 
    // We subtract a tiny extra pixel fraction (.1) to ensure floating point math doesn't overflow the flex row.
    const gapTotal = spacing.sm * (numColumns - 1);
    const boxWidth = ((availableWidth - gapTotal) / numColumns) - 0.1;

    const currentStats: PlayerStats | undefined = player.stats[activeFormat];

    const renderStatBox = (label: string, value?: string) => {
        if (!value) return null;
        return (
            <View style={[styles.statBox, { width: boxWidth, backgroundColor: theme.card, shadowColor: theme.shadow, borderColor: theme.border }]}>
                <ThemedText variant="caption" color="textSecondary" weight="medium" style={{ letterSpacing: 0.5 }}>{label.toUpperCase()}</ThemedText>
                <ThemedText variant="heading" weight="bold" style={styles.statValue}>{value}</ThemedText>
            </View>
        );
    };

    return (
        <ScrollView style={{ flex: 1, backgroundColor: theme.background }} contentContainerStyle={styles.tabContent}>
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={[styles.segmentedControl, { backgroundColor: theme.background }]}>
                    {(['test', 'odi', 't20i'] as StatFormat[]).map((format) => (
                        <TouchableOpacity
                            key={format}
                            style={[
                                styles.segmentBtn,
                                activeFormat === format && [styles.segmentBtnActive, { backgroundColor: theme.primary }]
                            ]}
                            onPress={() => setActiveFormat(format)}
                            activeOpacity={0.8}
                        >
                            <ThemedText
                                variant="caption"
                                weight="bold"
                                color={activeFormat === format ? 'white' : 'textSecondary'}
                            >
                                {format.toUpperCase()}
                            </ThemedText>
                        </TouchableOpacity>
                    ))}
                </View>

                {currentStats ? (
                    <View style={styles.statsGrid}>
                        {renderStatBox('Matches', currentStats.matches)}
                        {statMode === 'Batting' ? (
                            <>
                                {renderStatBox('Runs', currentStats.runs)}
                                {renderStatBox('Average', currentStats.average)}
                                {renderStatBox('Strike Rate', currentStats.strikeRate)}
                                {renderStatBox('High Score', currentStats.highScore)}
                                {renderStatBox('100s', currentStats.hundreds)}
                                {renderStatBox('50s', currentStats.fifties)}
                            </>
                        ) : (
                            <>
                                {renderStatBox('Wickets', currentStats.wickets)}
                                {renderStatBox('Average', currentStats.average)}
                                {renderStatBox('Economy', currentStats.economy || '-')}
                                {renderStatBox('Best Bowling', currentStats.bestBowling)}
                                {renderStatBox('5 Wickets', currentStats.fiveWickets)}
                            </>
                        )}
                    </View>
                ) : (
                    <View style={styles.emptyState}>
                        <ThemedText color="textSecondary">No {activeFormat.toUpperCase()} stats available.</ThemedText>
                    </View>
                )}
            </View>
        </ScrollView>
    );
};

const SeriesAccordion = ({ series, matches }: { series: string, matches: Match[] }) => {
    const { theme } = useTheme();
    const [expanded, setExpanded] = useState(false);

    return (
        <View style={[styles.accordionContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <TouchableOpacity
                style={styles.accordionHeader}
                onPress={() => setExpanded(!expanded)}
                activeOpacity={0.7}
            >
                <ThemedText variant="subtitle" weight="bold">{series}</ThemedText>
                <Ionicons
                    name={expanded ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={theme.textSecondary}
                />
            </TouchableOpacity>

            {expanded && (
                <View style={styles.accordionBody}>
                    {matches.map(match => (
                        <MatchCard key={match.id} match={match} />
                    ))}
                </View>
            )}
        </View>
    );
};

const MatchesTab = () => {
    const { theme, isDark } = useTheme();

    // Group completed matches by series
    const groupedMatches = completedMatches.reduce((acc, match) => {
        if (!acc[match.series]) {
            acc[match.series] = [];
        }
        acc[match.series].push(match);
        return acc;
    }, {} as Record<string, Match[]>);

    return (
        <ScrollView style={{ flex: 1, backgroundColor: theme.background }} contentContainerStyle={styles.tabContent}>
            <View style={{ gap: spacing.md }}>
                {Object.entries(groupedMatches).map(([series, matches]) => (
                    <SeriesAccordion key={series} series={series} matches={matches} />
                ))}
            </View>
        </ScrollView>
    );
};

// Generic Mock News for any player
const genericNews = [
    { id: '1', title: 'Outstanding Performance Secures Victory', date: '2 days ago', image: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&q=80' },
    { id: '2', title: 'Player named in ICC Team of the Decade', date: '1 week ago', image: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&q=80' },
    { id: '3', title: 'Contract renewed for upcoming IPL season', date: '2 weeks ago', image: 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=800&q=80' },
];

const NewsTab = () => {
    const { theme, isDark } = useTheme();
    const navigation = useNavigation<any>();
    return (
        <ScrollView style={{ flex: 1, backgroundColor: theme.background }} contentContainerStyle={styles.tabContent}>
            <View style={{ gap: spacing.md }}>
                {genericNews.map((news) => (
                    <TouchableOpacity
                        key={news.id}
                        style={[styles.newsCard, { backgroundColor: theme.card }]}
                        activeOpacity={0.8}
                        onPress={() => navigation.navigate('NewsDetail', { newsId: news.id })}
                    >
                        <Image source={{ uri: news.image }} style={styles.newsImage} />
                        <LinearGradient
                            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.8)']}
                            style={StyleSheet.absoluteFillObject}
                        />
                        <View style={styles.newsContent}>
                            <ThemedText variant="subtitle" weight="bold" color="white" numberOfLines={2} style={styles.newsTitle}>
                                {news.title}
                            </ThemedText>
                            <ThemedText variant="caption" color="white" style={{ opacity: 0.8 }}>
                                {news.date}
                            </ThemedText>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>
        </ScrollView>
    );
};

const PlayerInfoTab = ({ player }: { player: Player }) => {
    const { theme, isDark } = useTheme();
    return (
        <ScrollView style={{ flex: 1, backgroundColor: theme.background }} contentContainerStyle={styles.tabContent}>
            <View style={[styles.card, { backgroundColor: theme.card, shadowColor: theme.shadow, borderColor: theme.border }]}>
                <ThemedText variant="subtitle" weight="bold" style={styles.sectionTitle}>
                    Personal Information
                </ThemedText>

                <View style={styles.infoGrid}>
                    <View style={styles.infoCol}>
                        <ThemedText variant="caption" color="textSecondary" style={{ marginBottom: 4 }}>BORN</ThemedText>
                        <ThemedText weight="bold" numberOfLines={2}>{player.birthPlace}</ThemedText>
                        <ThemedText variant="caption" color="textSecondary" style={{ marginTop: 2 }}>Age: {player.age}</ThemedText>
                    </View>
                    <View style={styles.infoCol}>
                        <ThemedText variant="caption" color="textSecondary" style={{ marginBottom: 4 }}>BATTING STYLE</ThemedText>
                        <ThemedText weight="bold">{player.battingStyle}</ThemedText>
                    </View>
                    <View style={styles.infoCol}>
                        <ThemedText variant="caption" color="textSecondary" style={{ marginBottom: 4 }}>BOWLING STYLE</ThemedText>
                        <ThemedText weight="bold">{player.bowlingStyle}</ThemedText>
                    </View>
                    <View style={styles.infoCol}>
                        <ThemedText variant="caption" color="textSecondary" style={{ marginBottom: 4 }}>TEAMS</ThemedText>
                        <ThemedText weight="bold" numberOfLines={3} style={{ lineHeight: 22 }}>{player.teams.join(', ')}</ThemedText>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
};

// --- Main Screen Container ---

const PlayerProfileContent = ({ player }: { player: Player }) => {
    const { theme, isDark } = useTheme();
    const navigation = useNavigation();
    const { statMode, toggleStatMode } = usePlayerContext();

    const scale = useSharedValue(1);
    const animatedFabStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }]
        };
    });

    const handleToggle = () => {
        toggleStatMode();
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Sticky Hero Header */}
            <View style={[styles.heroSection, { backgroundColor: theme.primaryDark }]}>
                <SafeAreaView edges={['top']} style={styles.headerControls}>
                    <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7} style={styles.iconButtonWrapper}>
                        <BlurView intensity={30} tint="dark" style={styles.iconBlur}>
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </BlurView>
                    </TouchableOpacity>
                </SafeAreaView>

                <View style={styles.profileContainer}>
                    <View style={styles.heroTextContent}>
                        <ThemedText variant="heading" weight="bold" color="white" style={styles.heroName}>
                            {player.name}
                        </ThemedText>
                        <ThemedText variant="body" color="white" style={styles.heroSubtitle}>
                            {player.country} • {player.role}
                        </ThemedText>
                    </View>
                    <View style={styles.heroImageWrapper}>
                        <Image source={{ uri: player.image }} style={styles.heroImage} />
                    </View>
                </View>
            </View>

            {/* Top Tabs */}
            <TopTab.Navigator
                screenOptions={{
                    tabBarStyle: { backgroundColor: theme.surface, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 },
                    tabBarIndicatorStyle: { backgroundColor: theme.primary, height: 4, borderRadius: 4, bottom: -2 },
                    tabBarActiveTintColor: theme.primary,
                    tabBarInactiveTintColor: theme.textSecondary,
                    tabBarLabelStyle: { textTransform: 'none', fontWeight: 'bold', fontSize: 13 },
                    tabBarAllowFontScaling: false,
                    tabBarScrollEnabled: true,
                    tabBarItemStyle: { width: width / 3.5 },
                }}
            >
                <TopTab.Screen name="Overview">
                    {() => <OverviewTab player={player} />}
                </TopTab.Screen>
                <TopTab.Screen name="Matches" component={MatchesTab} />
                <TopTab.Screen name="News" component={NewsTab} />
                <TopTab.Screen name="PlayerInfo" options={{ title: 'Player Info' }}>
                    {() => <PlayerInfoTab player={player} />}
                </TopTab.Screen>
            </TopTab.Navigator>

            {/* Centered Pill Action Switch (Bat/Bowl) */}
            <View style={styles.pillContainer}>
                <View style={[styles.pillWrapper, { backgroundColor: isDark ? theme.border : theme.surface }]}>
                    <Animated.View
                        style={[
                            styles.pillIndicator,
                            { backgroundColor: theme.primary },
                            useAnimatedStyle(() => ({
                                transform: [{ translateX: withSpring(statMode === 'Batting' ? 0 : 80, { damping: 45, stiffness: 300 }) }]
                            }))
                        ]}
                    />

                    <TouchableOpacity
                        style={styles.pillSegment}
                        activeOpacity={0.8}
                        onPress={() => statMode !== 'Batting' && toggleStatMode()}
                    >
                        <ThemedText weight="bold" color={statMode === 'Batting' ? 'white' : 'textSecondary'} style={{ fontSize: 12, textTransform: 'uppercase' }}>bat</ThemedText>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.pillSegment}
                        activeOpacity={0.8}
                        onPress={() => statMode !== 'Bowling' && toggleStatMode()}
                    >
                        <Ionicons
                            name="tennisball-outline"
                            size={20}
                            color={statMode === 'Bowling' ? 'white' : theme.textSecondary}
                        />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

export const PlayerProfileScreen: React.FC = () => {
    const { theme, isDark } = useTheme();
    const route = useRoute<any>();
    const navigation = useNavigation();

    const { playerId } = route.params;
    const player = mockPlayers.find(p => p.id === playerId);

    if (!player) {
        return (
            <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ThemedText>Player not found.</ThemedText>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: spacing.md }}>
                    <ThemedText color="primary">Go Back</ThemedText>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <PlayerProvider>
            <PlayerProfileContent player={player} />
        </PlayerProvider>
    );
};

// --- Styles ---

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    heroSection: {
        height: 180,
        position: 'relative',
        paddingBottom: spacing.lg,
    },
    headerControls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.xs,
        zIndex: 10,
    },
    iconButtonWrapper: {
        borderRadius: 20,
        overflow: 'hidden',
    },
    iconBlur: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    profileContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.xl,
        marginTop: spacing.md,
    },
    heroTextContent: {
        flex: 1,
        paddingRight: spacing.md,
    },
    heroImageWrapper: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: 4,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    heroImage: {
        width: '100%',
        height: '100%',
        borderRadius: 40,
        borderWidth: 2,
        borderColor: 'white',
    },
    heroName: {
        fontSize: 26,
        letterSpacing: -0.5,
    },
    heroSubtitle: {
        opacity: 0.9,
        marginTop: 4,
        letterSpacing: 0.5,
    },
    tabContent: {
        padding: spacing.md,
        paddingBottom: spacing.xxl * 2, // Leave room for FAB
    },
    card: {
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        padding: spacing.lg,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    segmentedControl: {
        flexDirection: 'row',
        borderRadius: borderRadius.lg,
        padding: 4,
        marginBottom: spacing.xl,
        shadowColor: 'rgba(0,0,0,0.5)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 1, // Recessed look
    },
    segmentBtn: {
        flex: 1,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
        alignItems: 'center',
    },
    segmentBtnActive: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        gap: 2,
    },
    statBox: {
        padding: spacing.sm,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        borderWidth: 1,
        marginBottom: spacing.xs,
        elevation: 2,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
    },
    statValue: {
        marginTop: spacing.xs,
        fontSize: fontSize.xl,
    },
    sectionTitle: {
        marginBottom: spacing.md,
    },
    infoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.md,
    },
    infoCol: {
        width: '45%',
        marginBottom: spacing.sm,
    },
    emptyState: {
        padding: spacing.xl,
        alignItems: 'center',
    },
    pillContainer: {
        position: 'absolute',
        bottom: 30,
        left: 'auto',
        right: 10,
        alignItems: 'center',
        opacity: 0.8,
    },
    pillWrapper: {
        flexDirection: 'row',
        width: 160,
        height: 44,
        borderRadius: 22,
        padding: 4,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        position: 'relative',
    },
    pillIndicator: {
        position: 'absolute',
        left: 4,
        top: 4,
        width: 76,  // Half width - padding
        height: 36, // Full height - padding
        borderRadius: 18,
    },
    pillSegment: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    newsCard: {
        borderRadius: borderRadius.lg,
        height: 160,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
    },
    newsImage: {
        width: '100%',
        height: '100%',
        position: 'absolute',
        backgroundColor: '#444',
    },
    newsContent: {
        flex: 1,
        padding: spacing.lg,
        justifyContent: 'flex-end',
    },
    newsTitle: {
        marginBottom: spacing.xs,
        lineHeight: 22,
    },
    accordionContainer: {
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        overflow: 'hidden',
        marginBottom: spacing.sm,
    },
    accordionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.md,
    },
    accordionBody: {
        padding: spacing.md,
        paddingTop: 0,
        gap: spacing.md,
    }
});
