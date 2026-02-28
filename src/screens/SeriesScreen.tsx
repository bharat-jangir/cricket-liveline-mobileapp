import React, { useState, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, SectionList, TextInput } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { spacing } from '../theme';
import { Text as ThemedText } from '../components/ui/Text';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

type TabType = 'all' | 'active' | 'international' | 'domestic' | 'leagues';

// Define the param list for the Top Tabs
type TopTabParamList = {
    All: { type: 'all' };
    Active: { type: 'active' };
    International: { type: 'international' };
    Domestic: { type: 'domestic' };
    Leagues: { type: 'leagues' };
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

const MOCK_SERIES: Series[] = [
    { id: '1', name: 'ICC World Cup 2024', date: 'Oct 5 - Nov 19', matches: 48, image: '🏆', month: 'October 2024', type: 'international', isActive: true },
    { id: '2', name: 'Big Bash League', date: 'Oct 15 - Jan 24', matches: 61, image: '⚡', month: 'October 2024', type: 'leagues', isActive: false },
    { id: '3', name: 'India vs Australia', date: 'Nov 22 - Jan 7', matches: 5, image: '🏏', month: 'November 2024', type: 'international', isActive: true },
    { id: '4', name: 'Indian Premier League', date: 'Nov 25 - Dec 20', matches: 74, image: '🎯', month: 'November 2024', type: 'domestic', isActive: false },
    { id: '5', name: 'Pakistan Super League', date: 'Dec 17 - Jan 18', matches: 34, image: '🌟', month: 'December 2024', type: 'leagues', isActive: true },
    { id: '6', name: 'England vs New Zealand', date: 'Dec 5 - Dec 15', matches: 3, image: '🏴', month: 'December 2024', type: 'international', isActive: false },
];

const TopTab = createMaterialTopTabNavigator<TopTabParamList>();

const SeriesList = () => {
    const route = useRoute<RouteProp<TopTabParamList, keyof TopTabParamList>>();
    const { type } = route.params;
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const { theme } = useTheme();
    const [search, setSearch] = useState('');

    // Memoize filtering to prevent heavy calculation on every render
    const groupedSeries = useMemo(() => {
        const filtered = MOCK_SERIES.filter(s =>
            (type === 'all' || (type === 'active' ? s.isActive : s.type === type)) &&
            s.name.toLowerCase().includes(search.toLowerCase())
        );

        return filtered.reduce((acc, series) => {
            const existing = acc.find(g => g.title === series.month);
            if (existing) {
                existing.data.push(series);
            } else {
                acc.push({ title: series.month, data: [series] });
            }
            return acc;
        }, [] as { title: string; data: Series[] }[]);
    }, [search, type]);

    return (
        <View style={[styles.listContainer, { backgroundColor: theme.background }]}>
            <View style={[styles.searchContainer, { backgroundColor: theme.surface }]}>
                <TextInput
                    style={[styles.searchInput, { color: theme.text, backgroundColor: theme.background }]}
                    placeholder="Search series..."
                    placeholderTextColor={theme.textSecondary}
                    value={search}
                    onChangeText={setSearch}
                    allowFontScaling={false}
                />
            </View>

            <SectionList
                sections={groupedSeries}
                keyExtractor={item => item.id}
                renderSectionHeader={({ section }) => (
                    <View style={[styles.monthHeader, { backgroundColor: theme.background }]}>
                        <ThemedText variant="subtitle" weight="bold">{section.title}</ThemedText>
                    </View>
                )}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[styles.card, { backgroundColor: theme.surface }]}
                        onPress={() => navigation.navigate('SeriesDetail', { seriesId: item.id })}
                        activeOpacity={0.7}
                    >
                        <View style={styles.imageContainer}>
                            <ThemedText style={styles.emoji}>{item.image}</ThemedText>
                        </View>
                        <View style={styles.cardContent}>
                            <ThemedText variant="subtitle" weight="bold">{item.name}</ThemedText>
                            <ThemedText variant="caption" color="textSecondary">{item.date}</ThemedText>
                            <ThemedText variant="caption" color="primary" weight="semibold">{item.matches} Matches</ThemedText>
                        </View>
                    </TouchableOpacity>
                )}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
};

export const SeriesScreen: React.FC = () => {
    const { theme, isDark } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <LinearGradient colors={isDark ? [theme.surface, theme.background] : [theme.primary, theme.primaryDark]} style={styles.header}>
                <ThemedText variant="title" color="white" weight="bold">Series</ThemedText>
            </LinearGradient>

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
                <TopTab.Screen name="International" component={SeriesList} initialParams={{ type: 'international' }} />
                <TopTab.Screen name="Domestic" component={SeriesList} initialParams={{ type: 'domestic' }} />
                <TopTab.Screen name="Leagues" component={SeriesList} initialParams={{ type: 'leagues' }} />
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
});
