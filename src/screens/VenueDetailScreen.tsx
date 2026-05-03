import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions, ScrollView, FlatList, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { Svg, Circle, G } from 'react-native-svg';
import BottomSheet, { BottomSheetScrollView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { useNavigation, useRoute } from '@react-navigation/native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { Text as ThemedText } from '../components/ui/Text';
import { spacing } from '../theme';
import { LinearGradient } from 'expo-linear-gradient';
import { MatchCard } from '../components/MatchCard';
import { VenueService } from '../services/venue.service';
import { MatchService } from '../services/match.service';
import { useFetch } from '../hooks/useFetch';
import { Card } from '@/components/ui/Card';

const TopTab = createMaterialTopTabNavigator();
const { width } = Dimensions.get('window');

// --- Tabs ---
function OverviewTab() {
    const { theme, isDark } = useTheme();
    const route = useRoute<any>();
    const { venueId } = route.params || {};

    const { data: venue, loading } = useFetch(
        () => VenueService.getVenueDetails(venueId),
        [venueId]
    );

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
                <ActivityIndicator size="small" color={theme.primary} />
            </View>
        );
    }

    if (!venue) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
                <ThemedText color="textSecondary">Venue details not found</ThemedText>
            </View>
        );
    }

    const infoItems = [
        { label: 'Established', value: venue.established || 'N/A' },
        { label: 'Capacity', value: venue.capacity || 'N/A' },
        { label: 'Known As', value: venue.knownAs || venue.name },
        { label: 'Ends', value: venue.ends || 'N/A' },
        { label: 'Host', value: venue.host || 'N/A' },
        { label: 'Timezone', value: venue.timezone || 'N/A' },
    ];

    return (
        <ScrollView style={{ flex: 1, backgroundColor: theme.background }} contentContainerStyle={{ padding: spacing.md }}>
            <View style={{ backgroundColor: theme.card, padding: spacing.md, borderRadius: 12, borderWidth: 1, borderColor: theme.border }}>
                <ThemedText variant="title" weight="bold" style={{ marginBottom: spacing.md }}>Venue Information</ThemedText>

                {infoItems.map((item, index) => (
                    <View key={index} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: index === infoItems.length - 1 ? 0 : 1, borderBottomColor: theme.border }}>
                        <ThemedText color="textSecondary">{item.label}</ThemedText>
                        <ThemedText weight="bold" style={{ flex: 1, textAlign: 'right', marginLeft: spacing.lg }}>{item.value}</ThemedText>
                    </View>
                ))}
            </View>

            {venue.groundDimensions && (
                <View style={{ marginTop: spacing.lg, backgroundColor: theme.card, padding: spacing.md, borderRadius: 12, borderWidth: 1, borderColor: theme.border }}>
                    <ThemedText variant="title" weight="bold" style={{ marginBottom: spacing.md }}>Ground Dimensions</ThemedText>

                    <View style={{ alignItems: 'center', marginVertical: spacing.xl }}>
                        <View style={{ width: 280, height: 280, borderRadius: 140, backgroundColor: '#16a34a', borderWidth: 2, borderColor: 'rgba(0,0,0,0.1)', justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 }}>
                            {/* Pitch */}
                            <View style={{ width: 34, height: 100, backgroundColor: '#944704', borderRadius: 4, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 2 }} />

                            {/* Ends */}
                            <View style={{ position: 'absolute', top: -35, left: 0, right: 0, alignItems: 'center' }}>
                                <ThemedText style={{ fontSize: 13, fontWeight: 'bold' }} color="textSecondary">{venue.groundDimensions.topEndName || 'North End'}</ThemedText>
                            </View>
                            <View style={{ position: 'absolute', bottom: -35, left: 0, right: 0, alignItems: 'center' }}>
                                <ThemedText style={{ fontSize: 13, fontWeight: 'bold' }} color="textSecondary">{venue.groundDimensions.bottomEndName || 'South End'}</ThemedText>
                            </View>

                            {/* Distances */}
                            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' }}>
                                <DistanceLabel distance={venue.groundDimensions.distances?.top} angle={270} />
                                <DistanceLabel distance={venue.groundDimensions.distances?.topRight} angle={315} />
                                <DistanceLabel distance={venue.groundDimensions.distances?.right} angle={0} />
                                <DistanceLabel distance={venue.groundDimensions.distances?.bottomRight} angle={45} />
                                <DistanceLabel distance={venue.groundDimensions.distances?.bottom} angle={90} />
                                <DistanceLabel distance={venue.groundDimensions.distances?.bottomLeft} angle={135} />
                                <DistanceLabel distance={venue.groundDimensions.distances?.left} angle={180} />
                                <DistanceLabel distance={venue.groundDimensions.distances?.topLeft} angle={225} />
                            </View>
                        </View>
                    </View>
                </View>
            )}
        </ScrollView>
    );
}

const DistanceLabel = ({ distance, angle }: { distance?: number, angle: number }) => {
    if (distance === undefined || distance === null) return null;
    const radius = 105;
    const rad = angle * (Math.PI / 180);
    const x = radius * Math.cos(rad);
    const y = radius * Math.sin(rad);

    return (
        <View style={{ position: 'absolute', transform: [{ translateX: x }, { translateY: y }] }}>
            <ThemedText style={{
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
            </ThemedText>
        </View>
    );
}

interface Match {
    _id: string;
    id: string;
    gender?: string;
    matchFormat?: string;
    matchType?: string;
    seriesId?: { name: string };
    series?: string;
    [key: string]: any;
}

function MatchesTab() {
    const { theme, isDark } = useTheme();
    const route = useRoute<any>();
    const { venueId } = route.params || {};
    const [gender, setGender] = useState<'Men' | 'Women'>('Men');
    const [matchType, setMatchType] = useState('All');
    const [expandedSeries, setExpandedSeries] = useState<Record<string, boolean>>({});

    const { data: matches, loading } = useFetch<Match[]>(async () => {
        const res = await MatchService.getMatches({ venueId, limit: 50 } as any);
        return res;
    }, [venueId]);

    const matchTypes = ['All', 'T20I', 'ODI', 'Test', 'IPL'];

    const toggleSeries = (seriesName: string) => {
        setExpandedSeries(prev => ({ ...prev, [seriesName]: !prev[seriesName] }));
    };

    const filteredMatches = useMemo(() => {
        if (!matches || !Array.isArray(matches)) return [];

        return matches.filter(match => {
            // Gender filter
            if (gender === 'Men' && match.gender === 'female') return false;
            if (gender === 'Women' && match.gender !== 'female') return false;

            // Match Type filter
            if (matchType === 'All') return true;

            const format = (match.matchFormat || '').toLowerCase();
            const type = (match.matchType || '').toLowerCase();

            if (matchType === 'T20I') return format === 't20i' || format === 't20';
            if (matchType === 'ODI') return format === 'odi';
            if (matchType === 'Test') return format === 'test';
            if (matchType === 'IPL') return type === 'league';

            return true;
        });
    }, [matches, matchType, gender]);

    const groupedMatches = useMemo(() => {
        const groups = filteredMatches.reduce((acc, match) => {
            const seriesName = match.seriesId?.name || match.series || 'Other Series';
            if (!acc[seriesName]) acc[seriesName] = [];

            // Only add if we have less than 5 matches for this series
            if (acc[seriesName].length < 5) {
                acc[seriesName].push(match);
            }
            return acc;
        }, {} as Record<string, any[]>);

        return groups;
    }, [filteredMatches]);

    if (loading && !matches) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
                <ActivityIndicator size="small" color={theme.primary} />
            </View>
        );
    }

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
                    <ThemedText color="textSecondary" style={{ textAlign: 'center', marginTop: spacing.xl }}>No matches available for this venue</ThemedText>
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
                                        {matches.map((match: any) => (
                                            <View key={match._id || match.id} style={{ width: 320 }}>
                                                <MatchCard match={match} />
                                            </View>
                                        ))}
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

const DonutChart = ({ batFirst, bowlFirst }: any) => {
    const total = (batFirst || 0) + (bowlFirst || 0);
    const batFirstPer = total > 0 ? (batFirst / total) * 100 : 50;
    const bowlFirstPer = total > 0 ? (bowlFirst / total) * 100 : 50;
    
    const size = 160;
    const strokeWidth = 18;
    const center = size / 2;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    
    const batFirstOffset = circumference - (circumference * batFirstPer) / 100;

    return (
        <View style={{ alignItems: 'center', marginVertical: spacing.lg }}>
            <View style={{ width: size, height: size }}>
                <Svg width={size} height={size}>
                    <G rotation="-90" origin={`${center}, ${center}`}>
                        <Circle
                            cx={center}
                            cy={center}
                            r={radius}
                            stroke="#3b82f6"
                            strokeWidth={strokeWidth}
                            fill="transparent"
                            strokeDasharray={circumference}
                            strokeDashoffset={0}
                            opacity={0.8}
                        />
                        <Circle
                            cx={center}
                            cy={center}
                            r={radius}
                            stroke="#22c55e"
                            strokeWidth={strokeWidth}
                            fill="transparent"
                            strokeDasharray={circumference}
                            strokeDashoffset={batFirstOffset}
                            strokeLinecap="round"
                        />
                    </G>
                </Svg>
                <View style={{ position: 'absolute', width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
                    <ThemedText variant="title" weight="bold" style={{ fontSize: 24 }}>{total}</ThemedText>
                    <ThemedText variant="caption" color="textSecondary" style={{ textTransform: 'uppercase', letterSpacing: 1 }}>Matches</ThemedText>
                </View>
            </View>
            
            <View style={{ flexDirection: 'row', gap: 24, marginTop: spacing.xl }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#22c55e' }} />
                    <View>
                        <ThemedText variant="small" weight="bold">Bat First</ThemedText>
                        <ThemedText variant="caption" color="textSecondary">{Math.round(batFirstPer)}% Win Rate</ThemedText>
                    </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#3b82f6' }} />
                    <View>
                        <ThemedText variant="small" weight="bold">Bowl First</ThemedText>
                        <ThemedText variant="caption" color="textSecondary">{Math.round(bowlFirstPer)}% Win Rate</ThemedText>
                    </View>
                </View>
            </View>
        </View>
    );
};

const RecordCard = ({ label, value, icon, color, theme }: any) => (
    <Card style={{ 
        width: '48%', 
        padding: spacing.md, 
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: theme.borderLight,
        shadowOpacity: 0.05,
        shadowRadius: 5
    }}>
        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: color + '15', justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm }}>
            <Ionicons name={icon as any} size={20} color={color} />
        </View>
        <ThemedText variant="caption" color="textLight" weight="bold" style={{ textTransform: 'uppercase', fontSize: 9, letterSpacing: 0.5 }}>{label}</ThemedText>
        <ThemedText weight="bold" style={{ fontSize: 18, marginTop: 4 }}>{value || 'N/A'}</ThemedText>
    </Card>
);

function StatsTab() {
    const { theme, isDark } = useTheme();
    const route = useRoute<any>();
    const { venueId } = route.params || {};
    const [matchType, setMatchType] = useState('T20I');
    const matchTypes = ['T20I', 'ODI', 'Test', 'IPL'];

    const { data: statsData, loading } = useFetch<any>(
        () => VenueService.getVenueStats(venueId),
        [venueId]
    );

    const currentStats = useMemo(() => {
        if (!statsData) return null;
        let key = 't20';
        switch (matchType) {
            case 'T20I': key = 't20'; break;
            case 'ODI': key = 'odi'; break;
            case 'Test': key = 'firstClass'; break;
            case 'IPL': key = 'ipl'; break;
            default: key = 't20';
        }
        return statsData[key] || null;
    }, [statsData, matchType]);

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
                <ActivityIndicator size="small" color={theme.primary} />
            </View>
        );
    }

    if (!currentStats || (currentStats && currentStats.matches === 0)) {
        return (
            <View style={{ flex: 1, backgroundColor: theme.background }}>
                <View style={{ padding: spacing.md, paddingBottom: 0 }}>
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
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl }}>
                    <Ionicons name="stats-chart-outline" size={48} color={theme.textSecondary} style={{ opacity: 0.5, marginBottom: spacing.md }} />
                    <ThemedText color="textSecondary" style={{ textAlign: 'center' }}>No statistics available for {matchType} matches at this venue.</ThemedText>
                </View>
            </View>
        );
    }

    return (
        <ScrollView style={{ flex: 1, backgroundColor: theme.background }} contentContainerStyle={{ paddingBottom: spacing.xl }}>
            <View style={{ padding: spacing.md }}>
                {/* Type Filters */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, marginBottom: spacing.md }}>
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

                {/* Donut Chart Card */}
                <Card style={{ padding: spacing.lg, marginBottom: spacing.md, alignItems: 'center' }}>
                    <View style={{ alignSelf: 'flex-start' }}>
                        <ThemedText variant="subtitle" weight="bold">Win Distribution</ThemedText>
                        <ThemedText variant="caption" color="textSecondary">Matches based on toss decision</ThemedText>
                    </View>
                    <DonutChart 
                        batFirst={currentStats.winBatFirst || 0} 
                        bowlFirst={currentStats.winBowlFirst || 0} 
                    />
                </Card>

                {/* Innings Averages */}
                <Card style={{ padding: spacing.lg, marginBottom: spacing.md }}>
                    <ThemedText variant="subtitle" weight="bold" style={{ marginBottom: spacing.md }}>Innings Averages</ThemedText>
                    {[
                        { label: '1st Innings', score: currentStats.avg1stInn, color: '#10b981' },
                        { label: '2nd Innings', score: currentStats.avg2ndInn, color: '#3b82f6' },
                        ...(matchType === 'Test' ? [
                            { label: '3rd Innings', score: currentStats.avg3rdInn, color: '#f59e0b' },
                            { label: '4th Innings', score: currentStats.avg4thInn, color: '#ef4444' }
                        ] : [])
                    ].map((item, index) => (
                        <View key={index} style={{ marginBottom: spacing.md }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                                <ThemedText variant="small" weight="medium" color="textSecondary">{item.label}</ThemedText>
                                <ThemedText weight="bold">{item.score || '0'}</ThemedText>
                            </View>
                            <View style={{ height: 8, backgroundColor: theme.border, borderRadius: 4, overflow: 'hidden' }}>
                                <View style={{ width: `${Math.min((item.score || 0) / 4.5, 100)}%`, height: '100%', backgroundColor: item.color }} />
                            </View>
                        </View>
                    ))}
                </Card>

                {/* Records Grid */}
                <View style={{ paddingHorizontal: 4 }}>
                    <ThemedText variant="subtitle" weight="bold" style={{ marginBottom: spacing.md }}>Venue Records</ThemedText>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                        <RecordCard label="Highest Total" value={currentStats.highestTotal} icon="trending-up" color="#10b981" theme={theme} />
                        <RecordCard label="Lowest Total" value={currentStats.lowestTotal} icon="trending-down" color="#ef4444" theme={theme} />
                        <RecordCard label="Highest Chased" value={currentStats.highestChased} icon="rocket" color="#3b82f6" theme={theme} />
                        <RecordCard label="Lowest Defended" value={currentStats.lowestDefended} icon="shield" color="#f59e0b" theme={theme} />
                    </View>
                </View>
            </View>
        </ScrollView>
    );
}

    function NewsTab() {
        const { theme, isDark } = useTheme();
        const navigation = useNavigation<any>();

        // In a real app, news would also be fetched
        const venueNews = [
            { id: '1', title: 'Major matches announced for this venue', date: '2 days ago', image: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&q=80' },
            { id: '2', title: 'New pitch preparation underway', date: '1 week ago', image: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&q=80' },
        ];

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
        const { theme, isDark } = useTheme();
        const route = useRoute<any>();
        const { venueId } = route.params || {};
        const bottomSheetRef = useRef<BottomSheet>(null);
        const snapPoints = useMemo(() => ['50%', '80%'], []);

        const { data: venue } = useFetch(
            () => VenueService.getVenueDetails(venueId),
            [venueId]
        );

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

        if (!venue) return null;

        const fullDescription = venue.description || `The ${venue.name}, situated in ${venue.city}, ${venue.country}, is a premier cricket venue with a seating capacity of ${venue.capacity || 'N/A'} spectators.`;

        return (
            <View style={{ flex: 1, backgroundColor: theme.background }}>
                <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.md }}>

                    {/* Info Card */}
                    <View style={{ backgroundColor: theme.card, padding: spacing.md, borderRadius: 12, borderWidth: 1, borderColor: theme.border, marginBottom: spacing.md }}>
                        <ThemedText weight="bold" variant="title" style={{ marginBottom: spacing.xs }}>{venue.name}</ThemedText>

                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs, marginTop: spacing.xs }}>
                            <Ionicons name="location-outline" size={16} color={theme.textSecondary} style={{ marginRight: spacing.xs }} />
                            <ThemedText variant="caption" color="textSecondary">{venue.city}, {venue.country}</ThemedText>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs }}>
                            <Ionicons name="calendar-outline" size={16} color={theme.textSecondary} style={{ marginRight: spacing.xs }} />
                            <ThemedText variant="caption" color="textSecondary">Established: {venue.established || 'N/A'}</ThemedText>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                            <Ionicons name="golf-outline" size={16} color={theme.textSecondary} style={{ marginRight: spacing.xs, marginTop: 2 }} />
                            <ThemedText variant="caption" color="textSecondary" style={{ flex: 1 }}>Ends: {venue.ends || 'N/A'}</ThemedText>
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
                            About {venue.name}
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
    const { theme, isDark } = useTheme();
    const navigation = useNavigation();
    const route = useRoute<any>();
    const { venueId } = route.params || {};

    const { data: venue, loading } = useFetch(
        () => VenueService.getVenueDetails(venueId),
        [venueId]
    );

    if (loading && !venue) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    const venueName = venue?.name || "Venue Details";
    const venueCity = venue?.city || "";

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
                            {venue?.image ? (
                                <Image source={{ uri: venue.image }} style={{ width: '100%', height: '100%', borderRadius: 30 }} />
                            ) : (
                                <ThemedText style={styles.emoji}>🏟️</ThemedText>
                            )}
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
                    tabBarAllowFontScaling: false,
                    tabBarScrollEnabled: true,
                    tabBarItemStyle: { width: width / 3.5 },
                }}
            >
                <TopTab.Screen
                    name="Overview"
                    component={OverviewTab}
                    initialParams={{ venueId }}
                />
                <TopTab.Screen
                    name="Matches"
                    component={MatchesTab}
                    initialParams={{ venueId }}
                />
                <TopTab.Screen
                    name="Stats"
                    component={StatsTab}
                    initialParams={{ venueId }}
                />
                <TopTab.Screen
                    name="News"
                    component={NewsTab}
                    initialParams={{ venueId }}
                />
                <TopTab.Screen
                    name="About"
                    component={AboutTab}
                    initialParams={{ venueId }}
                />
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
