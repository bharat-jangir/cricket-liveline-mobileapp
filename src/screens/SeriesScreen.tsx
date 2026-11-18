import React, { useState, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, SectionList, TextInput, RefreshControl } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { spacing } from '../theme';
import { Text as ThemedText } from '../components/ui/Text';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

import { SeriesService } from '../services/series.service';
import { usePagination } from '../hooks/usePagination';
import { useDebounce } from '../hooks/useDebounce';
import { ActivityIndicator } from 'react-native';

type TabType = 'all' | 'active' | 'International' | 'Domestic' | 'League' | 'Women';

// Define the param list for the Top Tabs
type TopTabParamList = {
    All: { type: 'all' };
    Active: { type: 'active' };
    International: { type: 'International' };
    Domestic: { type: 'Domestic' };
    Leagues: { type: 'League' };
    Women: { type: 'Women' };
};

interface Series {
    id: string;
    name: string;
    date: string;
    matches: number;
    image: string;
    month: string;
    type: 'international' | 'domestic' | 'leagues';
    isActive?: boolean;
}



const TopTab = createMaterialTopTabNavigator<TopTabParamList>();

const SeriesList = () => {
    const route = useRoute<RouteProp<TopTabParamList, keyof TopTabParamList>>();
    const { type } = (route.params as any) || { type: 'all' };
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const { theme } = useTheme();
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 500);

    const filters = useMemo(() => {
        const f: any = { search: debouncedSearch };
        if (type === 'active') {
            f.status = 'Running';
        } else if (type !== 'all') {
            f.seriesType = type;
        }
        return f;
    }, [type, debouncedSearch]);

    const {
        items: fetchedSeries,
        loading,
        loadingMore,
        refreshing,
        loadMore,
        refresh
    } = usePagination<any>(
        (params) => SeriesService.getSeries({ ...filters, ...params }),
        [filters]
    );

    const onRefresh = React.useCallback(() => {
        refresh();
    }, [refresh]);

    // Memoize grouping (rely on backend sorting)
    const groupedSeries = useMemo(() => {
        if (!fetchedSeries || !Array.isArray(fetchedSeries)) return [];

        return fetchedSeries.reduce((acc: { title: string; data: any[] }[], series: any) => {
            const date = series.startDate ? new Date(series.startDate) : new Date();
            const month = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

            const existing = acc.find((g: any) => g.title === month);
            if (existing) {
                existing.data.push(series);
            } else {
                acc.push({ title: month, data: [series] });
            }
            return acc;
        }, []);
    }, [fetchedSeries]);

    return (
        <View style={[styles.listContainer, { backgroundColor: theme.background }]}>
            <View style={[styles.searchContainer, { backgroundColor: theme.surface }]}>
                <TextInput
                    style={[styles.searchInput, { color: theme.text, backgroundColor: theme.background }]}
                    placeholder="Search series..."
                    placeholderTextColor={theme.textSecondary}
                    value={search}
                    onChangeText={setSearch}
                    maxFontSizeMultiplier={1.3}
                />
            </View>

            <SectionList
                sections={groupedSeries}
                keyExtractor={item => item._id || item.id}
                renderSectionHeader={({ section }) => (
                    <View style={[styles.monthHeader, { backgroundColor: theme.background }]}>
                        <ThemedText variant="subtitle" weight="bold">{section.title}</ThemedText>
                    </View>
                )}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[styles.card, { backgroundColor: theme.surface }]}
                        onPress={() => navigation.navigate('SeriesDetail', { seriesId: item._id || item.id })}
                        activeOpacity={0.7}
                    >
                        <View style={styles.imageContainer}>
                            <ThemedText style={styles.emoji}>{item.image || '🏏'}</ThemedText>
                        </View>
                        <View style={styles.cardContent}>
                            <ThemedText variant="subtitle" weight="bold">{item.name}</ThemedText>
                            <ThemedText variant="caption" color="textSecondary">
                                {item.startDate ? new Date(item.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''} -
                                {item.endDate ? new Date(item.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                            </ThemedText>
                            {/* <ThemedText variant="caption" color="primary" weight="semibold">Tournament: {item.tournamentId?.name || 'Generic'}</ThemedText> */}
                        </View>
                    </TouchableOpacity>
                )}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                onEndReached={loadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={() => (
                    loadingMore ? (
                        <View style={styles.footerLoader}>
                            <ActivityIndicator size="small" color={theme.primary} />
                        </View>
                    ) : null
                )}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={theme.primary}
                        colors={[theme.primary]}
                    />
                }
                ListEmptyComponent={
                    !loading && !refreshing ? (
                        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 50 }}>
                            <ThemedText color="textSecondary">No series found</ThemedText>
                        </View>
                    ) : null
                }
            />
        </View>
    );
};

export const SeriesScreen: React.FC = () => {
    const { theme, isDark } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* <LinearGradient colors={isDark ? [theme.surface, theme.background] : [theme.primary, theme.primaryDark]} style={styles.header}>
                <ThemedText variant="title" color="white" weight="bold">Series</ThemedText>
            </LinearGradient> */}

            <TopTab.Navigator
                initialRouteName="Active"
                screenOptions={{
                    tabBarActiveTintColor: theme.primary,
                    tabBarInactiveTintColor: theme.textSecondary,
                    tabBarIndicatorStyle: { backgroundColor: theme.primary },
                    tabBarStyle: { backgroundColor: theme.surface },
                    tabBarLabelStyle: { fontWeight: 'bold', textTransform: 'capitalize', },
                    tabBarAllowFontScaling: false,
                    tabBarScrollEnabled: true,
                    lazy: true,
                }}
            >
                <TopTab.Screen name="All" component={SeriesList} initialParams={{ type: 'all' }} />
                <TopTab.Screen name="Active" component={SeriesList} initialParams={{ type: 'active' }} />
                <TopTab.Screen name="International" component={SeriesList} initialParams={{ type: 'International' }} />
                <TopTab.Screen name="Domestic" component={SeriesList} initialParams={{ type: 'Domestic' }} />
                <TopTab.Screen name="Leagues" component={SeriesList} initialParams={{ type: 'League' }} />
                <TopTab.Screen name="Women" component={SeriesList} initialParams={{ type: 'Women' }} />
            </TopTab.Navigator>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    listContainer: { flex: 1 },
    header: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, alignItems: 'center' },
    searchContainer: { padding: spacing.sm },
    searchInput: { padding: spacing.sm, borderRadius: 8, fontSize: 16 },
    monthHeader: { paddingVertical: spacing.xs, paddingHorizontal: spacing.md },
    listContent: { padding: spacing.md },
    card: { flexDirection: 'row', borderRadius: 12, padding: spacing.md, marginBottom: spacing.md, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4 },
    imageContainer: { width: 60, height: 60, borderRadius: 8, backgroundColor: 'rgba(56, 189, 248, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
    emoji: { fontSize: 32 },
    cardContent: { flex: 1, justifyContent: 'center', gap: 4 },
    footerLoader: { paddingVertical: spacing.md, alignItems: 'center' },
});
