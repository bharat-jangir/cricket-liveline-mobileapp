import React, { useState } from 'react';
import { View, TouchableOpacity, ScrollView, StyleSheet, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { spacing, fontSize, borderRadius } from '../theme';
import { Card } from '../components/ui/Card';
import { Text as ThemedText } from '../components/ui/Text';

type Gender = 'mens' | 'womens';
type Format = 'odi' | 'test' | 't20';
type Category = 'batters' | 'bowlers' | 'allrounders' | 'teams';

interface RankingData {
    id?: string;
    rank: number;
    name: string;
    team: string;
    rating: number;
}

const mockBatters: RankingData[] = [
    { id: 'p1', rank: 1, name: 'Virat Kohli', team: 'IND', rating: 890 },
    { id: 'p4', rank: 2, name: 'Babar Azam', team: 'PAK', rating: 865 },
    { rank: 3, name: 'Steve Smith', team: 'AUS', rating: 850 },
    { rank: 4, name: 'Kane Williamson', team: 'NZ', rating: 835 },
    { rank: 5, name: 'Joe Root', team: 'ENG', rating: 820 },
    { rank: 6, name: 'Rohit Sharma', team: 'IND', rating: 810 },
    { rank: 7, name: 'David Warner', team: 'AUS', rating: 795 },
    { rank: 8, name: 'Quinton de Kock', team: 'SA', rating: 780 },
];

const mockBowlers: RankingData[] = [
    { id: 'p6', rank: 1, name: 'Jasprit Bumrah', team: 'IND', rating: 895 },
    { id: 'p2', rank: 2, name: 'Pat Cummins', team: 'AUS', rating: 870 },
    { rank: 3, name: 'Trent Boult', team: 'NZ', rating: 855 },
    { rank: 4, name: 'Kagiso Rabada', team: 'SA', rating: 840 },
    { rank: 5, name: 'Mitchell Starc', team: 'AUS', rating: 825 },
];

const mockAllRounders: RankingData[] = [
    { rank: 1, name: 'Shakib Al Hasan', team: 'BAN', rating: 880 },
    { id: 'p3', rank: 2, name: 'Ben Stokes', team: 'ENG', rating: 865 },
    { rank: 3, name: 'Ravindra Jadeja', team: 'IND', rating: 850 },
];

const mockTeams: RankingData[] = [
    { rank: 1, name: 'India', team: 'IND', rating: 122 },
    { rank: 2, name: 'Australia', team: 'AUS', rating: 118 },
    { rank: 3, name: 'England', team: 'ENG', rating: 115 },
];

export const RankingsScreen: React.FC = () => {
    const { theme, isDark } = useTheme();
    const navigation = useNavigation();
    const [gender, setGender] = useState<Gender>('mens');
    const [format, setFormat] = useState<Format>('odi');
    const [category, setCategory] = useState<Category>('batters');

    const getRankingsData = () => {
        switch (category) {
            case 'batters': return mockBatters;
            case 'bowlers': return mockBowlers;
            case 'allrounders': return mockAllRounders;
            case 'teams': return mockTeams;
            default: return mockBatters;
        }
    };

    const renderRankingItem = ({ item }: { item: RankingData }) => (
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
                if (category !== 'teams') {
                    (navigation as any).navigate('PlayerProfile', { playerId: item.id || item.name });
                }
            }}
        >
            <Card style={styles.rankingCard}>
                <View style={styles.rankingContent}>
                    <View style={styles.rankInfo}>
                        <View style={[styles.rankBadge, { backgroundColor: theme.primary + '15' }]}>
                            <ThemedText style={[styles.rankNumber, { color: theme.primary }]}>#{item.rank}</ThemedText>
                        </View>
                        <View style={styles.playerInfo}>
                            <ThemedText variant="body" weight="semibold">{item.name}</ThemedText>
                            <View style={styles.teamBadge}>
                                <Ionicons name="flag-outline" size={12} color={theme.textSecondary} />
                                <ThemedText variant="small" color="textSecondary">{item.team}</ThemedText>
                            </View>
                        </View>
                    </View>
                    <View style={styles.ratingInfo}>
                        <ThemedText variant="title" weight="bold" style={{ color: theme.primary }}>
                            {item.rating}
                        </ThemedText>
                        <ThemedText variant="small" color="textSecondary">Rating</ThemedText>
                    </View>
                </View>
            </Card>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <LinearGradient colors={isDark ? [theme.surface, theme.background] : [theme.primary, theme.primaryDark]} style={styles.header}>
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <ThemedText variant="body" weight="bold" style={styles.headerTitle}>
                        ICC Rankings
                    </ThemedText>
                    <View style={{ width: 40 }} />
                </View>
            </LinearGradient>

            {/* Main Tabs (Gender & Format) */}
            <View style={{ backgroundColor: theme.surface }}>
                <View style={[styles.tabContainer, { borderBottomWidth: 1, borderBottomColor: theme.border }]}>
                    {(['mens', 'womens'] as Gender[]).map((g) => (
                        <TouchableOpacity
                            key={g}
                            style={[styles.tab, gender === g && { borderBottomColor: theme.primary, borderBottomWidth: 3 }]}
                            onPress={() => setGender(g)}
                        >
                            <ThemedText style={[styles.tabText, { color: gender === g ? theme.primary : theme.textSecondary }]}>
                                {g === 'mens' ? "Men's" : "Women's"}
                            </ThemedText>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={[styles.tabContainer, { borderBottomWidth: 1, borderBottomColor: theme.border }]}>
                    {(['odi', 'test', 't20'] as Format[]).map((f) => (
                        <TouchableOpacity
                            key={f}
                            style={[styles.tab, format === f && { borderBottomColor: theme.primary, borderBottomWidth: 3 }]}
                            onPress={() => setFormat(f)}
                        >
                            <ThemedText style={[styles.tabText, { color: format === f ? theme.primary : theme.textSecondary }]}>
                                {f.toUpperCase()}
                            </ThemedText>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Category Pills - Scrollable */}
            <View style={{ backgroundColor: theme.surface, borderBottomWidth: 1, borderBottomColor: theme.border }}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoryContainer}
                >
                    {[
                        { id: 'batters', label: 'Batters', icon: 'baseball-outline' },
                        { id: 'bowlers', label: 'Bowlers', icon: 'tennisball-outline' },
                        { id: 'allrounders', label: 'All-Rounders', icon: 'star-outline' },
                        { id: 'teams', label: 'Teams', icon: 'people-outline' },
                    ].map((cat) => (
                        <TouchableOpacity
                            key={cat.id}
                            activeOpacity={0.7}
                            style={[
                                styles.categoryTab,
                                category === cat.id ? { backgroundColor: theme.primary, borderColor: theme.primary } : { backgroundColor: theme.background, borderColor: theme.border }
                            ]}
                            onPress={() => setCategory(cat.id as Category)}
                        >
                            <Ionicons
                                name={cat.icon as any}
                                size={16}
                                color={category === cat.id ? 'white' : theme.text}
                            />
                            <ThemedText style={[styles.categoryText, { color: category === cat.id ? 'white' : theme.text }]}>
                                {cat.label}
                            </ThemedText>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* List */}
            <FlatList
                data={getRankingsData()}
                renderItem={renderRankingItem}
                keyExtractor={(item) => `${category}-${item.rank}`}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingBottom: spacing.sm },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 50,
    },
    backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { color: 'white' },
    tabContainer: { flexDirection: 'row', paddingHorizontal: spacing.md },
    tab: { flex: 1, paddingVertical: spacing.md, alignItems: 'center' },
    tabText: { fontSize: fontSize.md, fontWeight: '600' },
    categoryContainer: {
        flexDirection: 'row',
        padding: spacing.md,
        gap: spacing.sm,
    },
    categoryTab: {
        flexDirection: 'row',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        alignItems: 'center',
        gap: 6,
        borderWidth: 1,
    },
    categoryText: { fontSize: fontSize.sm, fontWeight: '600' },
    listContent: { padding: spacing.md, paddingBottom: 40 },
    rankingCard: { marginBottom: spacing.sm, padding: spacing.md },
    rankingContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    rankInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
    rankBadge: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    rankNumber: { fontSize: fontSize.md, fontWeight: 'bold' },
    playerInfo: { flex: 1, gap: 2 },
    teamBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    ratingInfo: { alignItems: 'flex-end' },
});
