import React, { useState, useRef, useCallback, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions, Text, ScrollView, FlatList, Image } from 'react-native';
import BottomSheet, { BottomSheetScrollView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { useNavigation, useRoute } from '@react-navigation/native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { Text as ThemedText } from '../components/ui/Text';
import { spacing } from '../theme';
import { LinearGradient } from 'expo-linear-gradient';
import { MatchCard } from '../components/MatchCard';
import { completedMatches } from '../data/mockData';

const TopTab = createMaterialTopTabNavigator();
const { width } = Dimensions.get('window');

// --- Mock Data ---
const venueDetails = {
    established: '1982',
    capacity: '132,000',
    knownAs: 'Sardar Patel Stadium, Motera',
    ends: 'Adani Pavilion End, GMDC End',
    host: 'Gujarat, Gujarat Titans',
    timezone: 'UTC +05:30',
    groundDimensions: {
        topEndName: "Adani Pavilion End",
        bottomEndName: "GMDC End",
        distances: {
            top: 79,
            topRight: 57,
            right: 62,
            bottomRight: 70,
            bottom: 82,
            bottomLeft: 81,
            left: 74,
            topLeft: 61,
        }
    }
};

const venueStats = {
    t20: { matchesPlayed: 25, batFirstWon: 12, bowlFirstWon: 13, avgFirstInnings: 165, highestTotal: '234/4', lowestTotal: '66/10' },
    odi: { matchesPlayed: 30, batFirstWon: 16, bowlFirstWon: 14, avgFirstInnings: 245, highestTotal: '365/2', lowestTotal: '85/10' },
    test: { matchesPlayed: 16, batFirstWon: 8, bowlFirstWon: 5, avgFirstInnings: 350, highestTotal: '550/7', lowestTotal: '81/10' },
};

const venueNews = [
    { id: '1', title: 'World Cup final to be held at Narendra Modi Stadium', date: '2 days ago', image: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&q=80' },
    { id: '2', title: 'New pitch laid out for the upcoming IPL season', date: '1 week ago', image: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&q=80' },
    { id: '3', title: 'Record crowd expected for IND vs AUS series', date: '2 weeks ago', image: 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=800&q=80' },
];

// --- Tabs ---
function OverviewTab() {
    const { theme } = useTheme();
    return (
        <ScrollView style={{ flex: 1, backgroundColor: theme.background }} contentContainerStyle={{ padding: spacing.md }}>
            <View style={{ backgroundColor: theme.card, padding: spacing.md, borderRadius: 12, borderWidth: 1, borderColor: theme.border }}>
                <ThemedText variant="title" weight="bold" style={{ marginBottom: spacing.md }}>Venue Information</ThemedText>

                {[
                    { label: 'Established', value: venueDetails.established },
                    { label: 'Capacity', value: venueDetails.capacity },
                    { label: 'Known As', value: venueDetails.knownAs },
                    { label: 'Ends', value: venueDetails.ends },
                    { label: 'Host', value: venueDetails.host },
                    { label: 'Timezone', value: venueDetails.timezone },
                ].map((item, index) => (
                    <View key={index} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: index === 5 ? 0 : 1, borderBottomColor: theme.border }}>
                        <ThemedText color="textSecondary">{item.label}</ThemedText>
                        <ThemedText weight="bold" style={{ flex: 1, textAlign: 'right', marginLeft: spacing.lg }}>{item.value}</ThemedText>
                    </View>
                ))}
            </View>

            {venueDetails.groundDimensions && (
                <View style={{ marginTop: spacing.lg, backgroundColor: theme.card, padding: spacing.md, borderRadius: 12, borderWidth: 1, borderColor: theme.border }}>
                    <ThemedText variant="title" weight="bold" style={{ marginBottom: spacing.md }}>Ground Dimensions</ThemedText>

                    <View style={{ alignItems: 'center', marginVertical: spacing.xl }}>
                        <View style={{ width: 280, height: 280, borderRadius: 140, backgroundColor: '#16a34a', borderWidth: 2, borderColor: 'rgba(0,0,0,0.1)', justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 }}>
                            {/* Pitch */}
                            <View style={{ width: 34, height: 100, backgroundColor: '#944704', borderRadius: 4, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 2 }} />

                            {/* Ends */}
                            <View style={{ position: 'absolute', top: -35, left: 0, right: 0, alignItems: 'center' }}>
                                <ThemedText style={{ fontSize: 13, fontWeight: 'bold' }} color="textSecondary">{venueDetails.groundDimensions.topEndName}</ThemedText>
                            </View>
                            <View style={{ position: 'absolute', bottom: -35, left: 0, right: 0, alignItems: 'center' }}>
                                <ThemedText style={{ fontSize: 13, fontWeight: 'bold' }} color="textSecondary">{venueDetails.groundDimensions.bottomEndName}</ThemedText>
                            </View>

                            {/* Distances */}
                            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' }}>
                                <DistanceLabel distance={venueDetails.groundDimensions.distances.top} angle={270} />
                                <DistanceLabel distance={venueDetails.groundDimensions.distances.topRight} angle={315} />
                                <DistanceLabel distance={venueDetails.groundDimensions.distances.right} angle={0} />
                                <DistanceLabel distance={venueDetails.groundDimensions.distances.bottomRight} angle={45} />
                                <DistanceLabel distance={venueDetails.groundDimensions.distances.bottom} angle={90} />
                                <DistanceLabel distance={venueDetails.groundDimensions.distances.bottomLeft} angle={135} />
                                <DistanceLabel distance={venueDetails.groundDimensions.distances.left} angle={180} />
                                <DistanceLabel distance={venueDetails.groundDimensions.distances.topLeft} angle={225} />
                            </View>
                        </View>
                    </View>
                </View>
            )}
        </ScrollView>
    );
}

const DistanceLabel = ({ distance, angle }: { distance: number, angle: number }) => {
    const radius = 105;
    const rad = angle * (Math.PI / 180);
    const x = radius * Math.cos(rad);
    const y = radius * Math.sin(rad);

    return (
        <View style={{ position: 'absolute', transform: [{ translateX: x }, { translateY: y }] }}>
            <Text style={{
                fontSize: 11,
                color: 'white',
                fontWeight: 'bold',
                textShadowColor: 'rgba(0,0,0,0.7)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 2,
                backgroundColor: 'rgba(0,0,0,0.3)',
                paddingHorizontal: 4,
                paddingVertical: 2,
                borderRadius: 4,
                overflow: 'hidden'
            }}>
                {distance}m
            </Text>
        </View>
    );
}

function MatchesTab() {
    const { theme } = useTheme();
    const [gender, setGender] = useState<'Men' | 'Women'>('Men');
    const [matchType, setMatchType] = useState('All');
    const [expandedSeries, setExpandedSeries] = useState<Record<string, boolean>>({});

    const matchTypes = ['All', 'T20I', 'ODI', 'Test', 'IPL'];

    const toggleSeries = (seriesName: string) => {
        setExpandedSeries(prev => ({ ...prev, [seriesName]: !prev[seriesName] }));
    };

    // Grouping completedMatches as a quick mock to show the accordion
    const groupedMatches = completedMatches.reduce((acc, match) => {
        if (!acc[match.series]) acc[match.series] = [];
        acc[match.series].push(match);
        return acc;
    }, {} as Record<string, typeof completedMatches>);

    return (
        <View style={{ flex: 1, backgroundColor: theme.background }}>
            <View style={{ padding: spacing.md, paddingBottom: 0 }}>
                {/* Gender Toggle */}
                <View style={{ flexDirection: 'row', backgroundColor: theme.card, borderRadius: 8, padding: 4, marginBottom: spacing.md, borderWidth: 1, borderColor: theme.border }}>
                    <TouchableOpacity
                        style={{ flex: 1, paddingVertical: 8, alignItems: 'center', backgroundColor: gender === 'Men' ? theme.primary : 'transparent', borderRadius: 6 }}
                        onPress={() => setGender('Men')}
                    >
                        <ThemedText weight="bold" color={gender === 'Men' ? 'white' : 'textSecondary'}>Men</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={{ flex: 1, paddingVertical: 8, alignItems: 'center', backgroundColor: gender === 'Women' ? theme.primary : 'transparent', borderRadius: 6 }}
                        onPress={() => setGender('Women')}
                    >
                        <ThemedText weight="bold" color={gender === 'Women' ? 'white' : 'textSecondary'}>Women</ThemedText>
                    </TouchableOpacity>
                </View>

                {/* Type Filters */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.md }}>
                    {matchTypes.map(type => (
                        <TouchableOpacity
                            key={type}
                            style={{
                                paddingHorizontal: spacing.xl,
                                paddingVertical: spacing.sm,
                                borderRadius: 20,
                                backgroundColor: matchType === type ? theme.primary : theme.card,
                                borderWidth: 1,
                                borderColor: matchType === type ? theme.primary : theme.border
                            }}
                            onPress={() => setMatchType(type)}
                        >
                            <ThemedText weight="bold" color={matchType === type ? 'white' : 'textSecondary'}>{type}</ThemedText>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: spacing.xl }}>
                {Object.keys(groupedMatches).length === 0 && (
                    <ThemedText color="textSecondary" style={{ textAlign: 'center', marginTop: spacing.xl }}>No matches available</ThemedText>
                )}
                {Object.entries(groupedMatches).map(([series, matches]) => {
                    const isExpanded = expandedSeries[series] !== false; // Default to expanded
                    return (
                        <View key={series} style={{ marginBottom: spacing.md, backgroundColor: theme.card, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: theme.border }}>
                            <TouchableOpacity
                                style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, backgroundColor: theme.card }}
                                onPress={() => toggleSeries(series)}
                                activeOpacity={0.7}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 }}>
                                    <Ionicons name="trophy-outline" size={20} color={theme.textSecondary} />
                                    <ThemedText weight="bold" style={{ fontSize: 15 }} numberOfLines={1}>{series}</ThemedText>
                                </View>
                                <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color={theme.textSecondary} />
                            </TouchableOpacity>

                            {isExpanded && (
                                <View style={{ paddingBottom: spacing.md }}>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.sm, gap: spacing.md }}>
                                        {matches.map(match => (
                                            <View key={match.id} style={{ width: 320 }}>
                                                <MatchCard match={match} />
                                            </View>
                                        ))}
                                        {/* Since mock data has few matches per series, we duplicate one to show horizontal scrolling layout better */}
                                        {matches.length === 1 && (
                                            <View style={{ width: 320 }}>
                                                <MatchCard match={{ ...matches[0], id: matches[0].id + '_mock' }} />
                                            </View>
                                        )}
                                    </ScrollView>
                                </View>
                            )}
                        </View>
                    );
                })}
            </ScrollView>
        </View>
    );
}

function StatsTab() {
    const { theme } = useTheme();
    const [gender, setGender] = useState<'Men' | 'Women'>('Men');
    const [matchType, setMatchType] = useState('T20I');
    const stats = venueStats['t20']; // Using t20 mock data for now

    const matchTypes = ['T20I', 'ODI', 'Test', 'IPL'];

    return (
        <ScrollView style={{ flex: 1, backgroundColor: theme.background }} contentContainerStyle={{ paddingBottom: spacing.xl }}>
            <View style={{ padding: spacing.md, paddingBottom: 0 }}>
                {/* Gender Toggle */}
                <View style={{ flexDirection: 'row', backgroundColor: theme.card, borderRadius: 8, padding: 4, marginBottom: spacing.md, borderWidth: 1, borderColor: theme.border }}>
                    <TouchableOpacity
                        style={{ flex: 1, paddingVertical: 8, alignItems: 'center', backgroundColor: gender === 'Men' ? theme.primary : 'transparent', borderRadius: 6 }}
                        onPress={() => setGender('Men')}
                    >
                        <ThemedText weight="bold" color={gender === 'Men' ? 'white' : 'textSecondary'}>Men</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={{ flex: 1, paddingVertical: 8, alignItems: 'center', backgroundColor: gender === 'Women' ? theme.primary : 'transparent', borderRadius: 6 }}
                        onPress={() => setGender('Women')}
                    >
                        <ThemedText weight="bold" color={gender === 'Women' ? 'white' : 'textSecondary'}>Women</ThemedText>
                    </TouchableOpacity>
                </View>

                {/* Type Filters */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.md }}>
                    {matchTypes.map(type => (
                        <TouchableOpacity
                            key={type}
                            style={{
                                paddingHorizontal: spacing.xl,
                                paddingVertical: spacing.sm,
                                borderRadius: 20,
                                backgroundColor: matchType === type ? theme.primary : theme.card,
                                borderWidth: 1,
                                borderColor: matchType === type ? theme.primary : theme.border
                            }}
                            onPress={() => setMatchType(type)}
                        >
                            <ThemedText weight="bold" color={matchType === type ? 'white' : 'textSecondary'}>{type}</ThemedText>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <View style={{ paddingHorizontal: spacing.md, gap: spacing.lg }}>

                {/* Win Percentage (Last 5 Matches) */}
                <View style={{ backgroundColor: theme.card, padding: spacing.md, borderRadius: 12, borderWidth: 1, borderColor: theme.border }}>
                    <ThemedText variant="title" weight="bold" style={{ marginBottom: spacing.md }}>Last 5 Matches Performance</ThemedText>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xl }}>
                        <View style={{ width: 120, height: 120, borderRadius: 60, borderWidth: 12, borderColor: '#ef4444', borderTopColor: '#22c55e', borderRightColor: '#22c55e', justifyContent: 'center', alignItems: 'center' }}>
                            <ThemedText weight="bold" variant="title">80%</ThemedText>
                            <ThemedText variant="caption" color="textSecondary">Win Bat First</ThemedText>
                        </View>
                        <View style={{ gap: spacing.sm }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#22c55e' }} />
                                <ThemedText>Win Bat First (80%)</ThemedText>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#ef4444' }} />
                                <ThemedText>Win Bowl First (20%)</ThemedText>
                            </View>
                        </View>
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.lg, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: theme.border }}>
                        <View style={{ alignItems: 'center' }}>
                            <ThemedText color="textSecondary" variant="caption">Avg 1st Innings</ThemedText>
                            <ThemedText weight="bold" style={{ fontSize: 16 }}>{stats.avgFirstInnings}</ThemedText>
                        </View>
                        <View style={{ alignItems: 'center' }}>
                            <ThemedText color="textSecondary" variant="caption">Avg 2nd Innings</ThemedText>
                            <ThemedText weight="bold" style={{ fontSize: 16 }}>148</ThemedText>
                        </View>
                    </View>
                </View>

                {/* Score Records */}
                <View style={{ backgroundColor: theme.card, padding: spacing.md, borderRadius: 12, borderWidth: 1, borderColor: theme.border, gap: spacing.md }}>
                    <ThemedText variant="title" weight="bold">Venue Records</ThemedText>

                    <View>
                        <ThemedText color="textSecondary" variant="caption">Highest Total</ThemedText>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <ThemedText weight="bold" style={{ fontSize: 16, color: '#22c55e' }}>207-4 <ThemedText variant="caption" color="textSecondary">(20.0 ov) by SCO</ThemedText></ThemedText>
                            <ThemedText variant="caption">SCO vs ITA</ThemedText>
                        </View>
                    </View>

                    <View>
                        <ThemedText color="textSecondary" variant="caption">Lowest Total</ThemedText>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <ThemedText weight="bold" style={{ fontSize: 16, color: '#ef4444' }}>66-10 <ThemedText variant="caption" color="textSecondary">(14.2 ov) by ITA</ThemedText></ThemedText>
                            <ThemedText variant="caption">SCO vs ITA</ThemedText>
                        </View>
                    </View>

                    <View style={{ height: 1, backgroundColor: theme.border, marginVertical: spacing.xs }} />

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <ThemedText>Highest Chased</ThemedText>
                        <ThemedText weight="bold">186-4</ThemedText>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <ThemedText>Lowest Defended</ThemedText>
                        <ThemedText weight="bold">142-8</ThemedText>
                    </View>
                </View>

                {/* Average Pitch Behavior */}
                <View style={{ backgroundColor: theme.card, padding: spacing.md, borderRadius: 12, borderWidth: 1, borderColor: theme.border }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
                        <ThemedText variant="subtitle" weight="bold">Avg Pitch Behavior</ThemedText>
                        <ThemedText variant="caption" color="textSecondary">Last 10 matches</ThemedText>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm }}>
                        <ThemedText>Batting Friendly</ThemedText>
                        <ThemedText weight="bold" color="primary">65%</ThemedText>
                    </View>
                    <View style={{ height: 8, backgroundColor: theme.border, borderRadius: 4, overflow: 'hidden' }}>
                        <View style={{ width: '65%', height: '100%', backgroundColor: theme.primary }} />
                    </View>
                </View>

                {/* Avg Scores By Over */}
                <View style={{ backgroundColor: theme.card, padding: spacing.md, borderRadius: 12, borderWidth: 1, borderColor: theme.border }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
                        <ThemedText variant="subtitle" weight="bold">Avg Scores on Venue</ThemedText>
                        <ThemedText variant="caption" color="textSecondary">Last 10 matches</ThemedText>
                    </View>

                    {/* Table Header */}
                    <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: theme.border, paddingBottom: spacing.sm, marginBottom: spacing.sm }}>
                        <ThemedText weight="bold" style={{ flex: 1 }}>Overs</ThemedText>
                        <ThemedText weight="bold" style={{ flex: 1, textAlign: 'center' }}>1st Inn</ThemedText>
                        <ThemedText weight="bold" style={{ flex: 1, textAlign: 'center' }}>2nd Inn</ThemedText>
                    </View>

                    {/* Table Rows */}
                    {[
                        { over: '6', inn1: '48', inn2: '45' },
                        { over: '10', inn1: '76', inn2: '71' },
                        { over: '15', inn1: '118', inn2: '110' },
                        { over: '20', inn1: '165', inn2: '148' }
                    ].map((row, index) => (
                        <View key={index} style={{ flexDirection: 'row', paddingVertical: spacing.sm, borderBottomWidth: index === 3 ? 0 : 1, borderBottomColor: theme.border }}>
                            <ThemedText style={{ flex: 1 }}>{row.over}</ThemedText>
                            <ThemedText style={{ flex: 1, textAlign: 'center' }}>{row.inn1}</ThemedText>
                            <ThemedText style={{ flex: 1, textAlign: 'center' }}>{row.inn2}</ThemedText>
                        </View>
                    ))}
                </View>

                {/* Pace vs Spin */}
                <View style={{ backgroundColor: theme.card, padding: spacing.md, borderRadius: 12, borderWidth: 1, borderColor: theme.border }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
                        <ThemedText variant="title" weight="bold">Pace vs Spin</ThemedText>
                        <ThemedText variant="caption" color="textSecondary">Wickets</ThemedText>
                    </View>

                    <View style={{ flexDirection: 'row', height: 24, borderRadius: 12, overflow: 'hidden', marginBottom: spacing.sm }}>
                        <View style={{ flex: 6, backgroundColor: '#ef4444', justifyContent: 'center', paddingLeft: spacing.sm }}>
                            <ThemedText color="white" weight="bold" style={{ fontSize: 12 }}>60%</ThemedText>
                        </View>
                        <View style={{ flex: 4, backgroundColor: '#22c55e', justifyContent: 'center', alignItems: 'flex-end', paddingRight: spacing.sm }}>
                            <ThemedText color="white" weight="bold" style={{ fontSize: 12 }}>40%</ThemedText>
                        </View>
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444' }} />
                            <ThemedText variant="caption">Pace (54 Wkts)</ThemedText>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e' }} />
                            <ThemedText variant="caption">Spin (36 Wkts)</ThemedText>
                        </View>
                    </View>
                </View>

            </View>
        </ScrollView>
    );
}

function NewsTab() {
    const { theme } = useTheme();
    const navigation = useNavigation<any>();

    return (
        <ScrollView style={{ flex: 1, backgroundColor: theme.background }} contentContainerStyle={{ padding: spacing.md }}>
            {venueNews.map(item => (
                <TouchableOpacity
                    key={item.id}
                    style={{ backgroundColor: theme.card, borderRadius: 12, marginBottom: spacing.md, overflow: 'hidden', borderWidth: 1, borderColor: theme.border }}
                    onPress={() => navigation.navigate('NewsDetail')}
                    activeOpacity={0.8}
                >
                    <View style={{ height: 180, backgroundColor: theme.border }}>
                        <Image source={{ uri: item.image }} style={{ width: '100%', height: '100%' }} />
                        <LinearGradient
                            colors={['transparent', 'rgba(0,0,0,0.8)']}
                            style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 100 }}
                        />
                        <View style={{ position: 'absolute', bottom: spacing.md, left: spacing.md, right: spacing.md }}>
                            <ThemedText weight="bold" color="white" numberOfLines={2} style={{ fontSize: 16, marginBottom: spacing.xs, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }}>
                                {item.title}
                            </ThemedText>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                                <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.8)" />
                                <ThemedText variant="caption" style={{ color: 'rgba(255,255,255,0.8)' }}>{item.date}</ThemedText>
                            </View>
                        </View>
                    </View>
                </TouchableOpacity>
            ))}
        </ScrollView>
    );
}

function AboutTab() {
    const { theme } = useTheme();
    const bottomSheetRef = useRef<BottomSheet>(null);
    const snapPoints = useMemo(() => ['50%', '80%'], []);

    const handleOpenBottomSheet = useCallback(() => {
        bottomSheetRef.current?.expand();
    }, []);

    const renderBackdrop = useCallback(
        (props: any) => (
            <BottomSheetBackdrop
                {...props}
                disappearsOnIndex={-1}
                appearsOnIndex={0}
                pressBehavior="close"
            />
        ),
        []
    );

    const fullDescription = `The Narendra Modi Stadium, situated inside the Sardar Vallabhbhai Patel Sports Enclave in Ahmedabad, Gujarat, is the largest cricket stadium in the world and the largest stadium overall, with a seating capacity of 132,000 spectators.\n\nConstructed in 1982 to promote cricket in the province, it initially accommodated 49,000 fans. The stadium underwent a major reconstruction between 2015 and 2020.\n\nIt has hosted numerous memorable matches, including matches during the 1987, 1996, and 2011 Cricket World Cups. The stadium features state-of-the-art facilities, modern dressing rooms, and world-class floodlights ensuring un-interrupted day/night matches.`;

    return (
        <View style={{ flex: 1, backgroundColor: theme.background }}>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.md }}>

                {/* Info Card */}
                <View style={{ backgroundColor: theme.card, padding: spacing.md, borderRadius: 12, borderWidth: 1, borderColor: theme.border, marginBottom: spacing.md }}>
                    <ThemedText weight="bold" variant="title" style={{ marginBottom: spacing.xs }}>Narendra Modi Stadium</ThemedText>

                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs, marginTop: spacing.xs }}>
                        <Ionicons name="location-outline" size={16} color={theme.textSecondary} style={{ marginRight: spacing.xs }} />
                        <ThemedText variant="caption" color="textSecondary">Ahmedabad, Gujarat</ThemedText>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs }}>
                        <Ionicons name="calendar-outline" size={16} color={theme.textSecondary} style={{ marginRight: spacing.xs }} />
                        <ThemedText variant="caption" color="textSecondary">Established: {venueDetails.established}</ThemedText>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                        <Ionicons name="golf-outline" size={16} color={theme.textSecondary} style={{ marginRight: spacing.xs, marginTop: 2 }} />
                        <ThemedText variant="caption" color="textSecondary" style={{ flex: 1 }}>Ends: {venueDetails.ends}</ThemedText>
                    </View>
                </View>

                {/* Description Card */}
                <View style={{ backgroundColor: theme.card, padding: spacing.md, borderRadius: 12, borderWidth: 1, borderColor: theme.border }}>
                    <ThemedText weight="bold" variant="subtitle" style={{ marginBottom: spacing.sm }}>About Venue</ThemedText>
                    <ThemedText color="textSecondary" numberOfLines={4} style={{ lineHeight: 22 }}>
                        {fullDescription}
                    </ThemedText>
                    <TouchableOpacity onPress={handleOpenBottomSheet} style={{ marginTop: spacing.sm }}>
                        <ThemedText color="primary" weight="semibold">Read more</ThemedText>
                    </TouchableOpacity>
                </View>

            </ScrollView>

            <BottomSheet
                ref={bottomSheetRef}
                index={-1}
                snapPoints={snapPoints}
                enablePanDownToClose={true}
                backdropComponent={renderBackdrop}
                backgroundStyle={{ backgroundColor: theme.card }}
                handleIndicatorStyle={{ backgroundColor: theme.border }}
            >
                <BottomSheetScrollView contentContainerStyle={{ padding: spacing.xl }}>
                    <ThemedText variant="title" weight="bold" style={{ marginBottom: spacing.md }}>
                        About Narendra Modi Stadium
                    </ThemedText>
                    <ThemedText style={{ lineHeight: 24, color: theme.textSecondary }}>
                        {fullDescription}
                    </ThemedText>
                </BottomSheetScrollView>
            </BottomSheet>
        </View>
    );
}


// --- Main Navigator ---
export const VenueDetailScreen: React.FC = () => {
    const { theme } = useTheme();
    const navigation = useNavigation();
    const route = useRoute<any>();

    // Note: in a real app, we'd fetch venue data based on route.params.venueId
    const venueName = "Narendra Modi Stadium";
    const venueCity = "Ahmedabad";

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <LinearGradient colors={[theme.primary, theme.primaryDark]} style={styles.header}>
                <SafeAreaView>
                    <View style={styles.headerTop}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                            <Ionicons name="arrow-back" size={24} color="white" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.headerContent}>
                        <View style={styles.imageContainer}>
                            <ThemedText style={styles.emoji}>🏟️</ThemedText>
                        </View>
                        <View style={styles.headerInfo}>
                            <ThemedText variant="title" color="white" weight="bold">{venueName}</ThemedText>
                            <ThemedText variant="caption" color="white" style={{ opacity: 0.8 }}>{venueCity}</ThemedText>
                        </View>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            <TopTab.Navigator
                screenOptions={{
                    tabBarStyle: { backgroundColor: theme.surface, elevation: 0, shadowOpacity: 0 },
                    tabBarIndicatorStyle: { backgroundColor: theme.primary, height: 3, borderTopLeftRadius: 3, borderTopRightRadius: 3 },
                    tabBarActiveTintColor: theme.primary,
                    tabBarInactiveTintColor: theme.textSecondary,
                    tabBarLabelStyle: { textTransform: 'none', fontWeight: 'bold', fontSize: 13 },
                    tabBarScrollEnabled: true,
                    tabBarItemStyle: { width: width / 3.5 },
                }}
            >
                <TopTab.Screen name="Overview" component={OverviewTab} />
                <TopTab.Screen name="Matches" component={MatchesTab} />
                <TopTab.Screen name="Stats" component={StatsTab} />
                <TopTab.Screen name="News" component={NewsTab} />
                <TopTab.Screen name="About" component={AboutTab} />
            </TopTab.Navigator>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingBottom: spacing.lg, elevation: 4 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, paddingTop: spacing.sm },
    backBtn: { padding: spacing.sm, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)' },
    headerContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, marginTop: spacing.md },
    imageContainer: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
    emoji: { fontSize: 30 },
    headerInfo: { flex: 1 },
});
