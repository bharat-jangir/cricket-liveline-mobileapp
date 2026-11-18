import React, { useEffect, useState } from 'react';
import {
    View,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/ThemeContext';
import { spacing, fontSize } from '../theme';
import { Text as ThemedText } from '../components/ui/Text';
import { axiosInstance } from '../services/apiClient';
import { useDebounce } from '../hooks/useDebounce';

const RECENT_KEY = 'recentSearches';

type Results = { matches: any[]; series: any[]; players: any[]; venues: any[] };
const EMPTY: Results = { matches: [], series: [], players: [], venues: [] };

export const GlobalSearchScreen: React.FC = () => {
    const { theme, isDark } = useTheme();
    const navigation = useNavigation<any>();
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState<Results>(EMPTY);
    const [loading, setLoading] = useState(false);
    const [failed, setFailed] = useState(false);
    const [recent, setRecent] = useState<string[]>([]);
    const term = useDebounce(searchQuery.trim(), 350);

    useEffect(() => {
        AsyncStorage.getItem(RECENT_KEY).then(v => v && setRecent(JSON.parse(v))).catch(() => undefined);
    }, []);

    useEffect(() => {
        if (term.length < 2) { setResults(EMPTY); setLoading(false); setFailed(false); return; }
        let cancelled = false;
        setLoading(true);
        axiosInstance.get('/app/search', { params: { q: term } })
            .then(res => { if (!cancelled) { setResults({ ...EMPTY, ...(res.data?.data?.result || {}) }); setFailed(false); } })
            .catch(() => { if (!cancelled) setFailed(true); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [term]);

    const remember = (q: string) => {
        const next = [q, ...recent.filter(r => r.toLowerCase() !== q.toLowerCase())].slice(0, 5);
        setRecent(next);
        AsyncStorage.setItem(RECENT_KEY, JSON.stringify(next)).catch(() => undefined);
    };
    const go = (fn: () => void) => { if (term) remember(term); fn(); };

    const total = results.matches.length + results.series.length + results.players.length + results.venues.length;

    const Row = ({ icon, title, sub, onPress }: { icon: any; title: string; sub?: string; onPress: () => void }) => (
        <TouchableOpacity style={[styles.searchItem, { borderBottomColor: theme.border }]} onPress={() => go(onPress)}>
            <Ionicons name={icon} size={20} color={theme.primary} />
            <View style={{ flex: 1 }}>
                <ThemedText numberOfLines={1}>{title}</ThemedText>
                {sub ? <ThemedText variant="caption" color="textSecondary" numberOfLines={1}>{sub}</ThemedText> : null}
            </View>
        </TouchableOpacity>
    );
    const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
        <View style={styles.section}>
            <ThemedText variant="title" weight="semibold" style={styles.sectionTitle}>{title}</ThemedText>
            {children}
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: isDark ? theme.surface : theme.primary }]}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>

                <View style={[styles.searchContainer, { backgroundColor: isDark ? theme.background : 'rgba(255,255,255,0.2)' }]}>
                    <Ionicons name="search" size={20} color={isDark ? theme.textSecondary : "white"} />
                    <TextInput
                        style={[styles.searchInput, { color: isDark ? theme.text : "white" }]}
                        placeholder="Search teams, players, matches..."
                        placeholderTextColor={isDark ? theme.textLight : "rgba(255,255,255,0.7)"}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoFocus
                        autoCorrect={false}
                        returnKeyType="search"
                        maxFontSizeMultiplier={1.3}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close" size={20} color={isDark ? theme.textSecondary : "white"} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
                {term.length < 2 ? (
                    recent.length > 0 ? (
                        <Section title="Recent Searches">
                            {recent.map(item => (
                                <TouchableOpacity key={item} style={[styles.searchItem, { borderBottomColor: theme.border }]} onPress={() => setSearchQuery(item)}>
                                    <Ionicons name="time-outline" size={20} color={theme.textSecondary} />
                                    <ThemedText style={styles.searchItemText}>{item}</ThemedText>
                                </TouchableOpacity>
                            ))}
                        </Section>
                    ) : (
                        <View style={{ paddingTop: 60, alignItems: 'center' }}>
                            <Ionicons name="search-outline" size={44} color={theme.border} />
                            <ThemedText color="textSecondary" style={{ marginTop: spacing.md }}>Search matches, series, players and venues</ThemedText>
                        </View>
                    )
                ) : loading ? (
                    <ActivityIndicator style={{ marginTop: 40 }} color={theme.primary} />
                ) : failed ? (
                    <ThemedText color="textSecondary" style={{ marginTop: 40, textAlign: 'center' }}>Search is unavailable right now. Please try again.</ThemedText>
                ) : total === 0 ? (
                    <ThemedText color="textSecondary" style={{ marginTop: 40, textAlign: 'center' }}>No results for "{term}"</ThemedText>
                ) : (
                    <>
                        {results.matches.length > 0 && (
                            <Section title="Matches">
                                {results.matches.map(m => (
                                    <Row key={m.id || m._id} icon="tennisball-outline" title={`${m.team1?.name || m.teamAId?.name || 'Team'} vs ${m.team2?.name || m.teamBId?.name || 'Team'}`} sub={m.series || m.title}
                                        onPress={() => navigation.navigate('MatchDetails', { matchId: m.id || m._id })} />
                                ))}
                            </Section>
                        )}
                        {results.series.length > 0 && (
                            <Section title="Series">
                                {results.series.map(x => (
                                    <Row key={x._id} icon="trophy-outline" title={x.name} sub={x.activeFormat} onPress={() => navigation.navigate('SeriesDetail', { seriesId: x._id })} />
                                ))}
                            </Section>
                        )}
                        {results.players.length > 0 && (
                            <Section title="Players">
                                {results.players.map(x => (
                                    <Row key={x._id} icon="person-outline" title={x.name} sub={[x.country, String(x.role || '').replace(/-/g, ' ')].filter(Boolean).join(' • ')} onPress={() => navigation.navigate('PlayerProfile', { playerId: x._id })} />
                                ))}
                            </Section>
                        )}
                        {results.venues.length > 0 && (
                            <Section title="Venues">
                                {results.venues.map(x => (
                                    <Row key={x._id} icon="location-outline" title={x.name} sub={[x.city, x.country].filter(Boolean).join(', ')} onPress={() => navigation.navigate('VenueDetail', { venueId: x._id })} />
                                ))}
                            </Section>
                        )}
                        <View style={{ height: 40 }} />
                    </>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        gap: spacing.md,
    },
    backButton: {
        padding: spacing.xs,
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: 25,
        gap: spacing.sm,
    },
    searchInput: {
        flex: 1,
        fontSize: fontSize.md,
    },
    content: {
        flex: 1,
        paddingHorizontal: spacing.lg,
    },
    section: {
        marginTop: spacing.lg,
    },
    sectionTitle: {
        marginBottom: spacing.md,
    },
    searchItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        gap: spacing.md,
    },
    searchItemText: {
        flex: 1,
    },
});
