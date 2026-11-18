import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, TextInput, Image, SafeAreaView, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useTheme } from '../theme/ThemeContext';
import { spacing, borderRadius } from '../theme';
import { Text as ThemedText } from '../components/ui/Text';
import { PlayerService } from '../services/player.service';
import { useDebounce } from '../hooks/useDebounce';

interface Player { _id: string; name: string; country?: string; role?: string; image?: string }

type NavigationProp = StackNavigationProp<RootStackParamList>;
type RoleFilter = 'All' | 'Batsman' | 'Bowler' | 'All-Rounder';

const ROLES: RoleFilter[] = ['All', 'Batsman', 'Bowler', 'All-Rounder'];

export const AllPlayersScreen: React.FC = () => {
    const { theme, isDark } = useTheme();
    const navigation = useNavigation<NavigationProp>();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRole, setSelectedRole] = useState<RoleFilter>('All');
    const [players, setPlayers] = useState<Player[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState(false);
    const debounced = useDebounce(searchQuery.trim(), 350);
    const requestId = useRef(0);

    const ROLE_PARAM: Record<RoleFilter, string | undefined> = {
        All: undefined, Batsman: 'batsman', Bowler: 'bowler', 'All-Rounder': 'all-rounder',
    };

    const load = useCallback(async (nextPage: number) => {
        const id = ++requestId.current;
        nextPage === 1 ? setLoading(true) : setIsLoadingMore(true);
        try {
            const res = await PlayerService.getPlayers({ search: debounced || undefined, role: ROLE_PARAM[selectedRole], page: nextPage, limit: 20 });
            if (id !== requestId.current) return; // a newer request superseded this one
            setPlayers(prev => (nextPage === 1 ? res.result : [...prev, ...res.result]));
            setPage(nextPage);
            setHasMore(!!res.pagination && res.pagination.page < res.pagination.totalPages);
            setError(false);
        } catch {
            if (id === requestId.current) setError(true);
        } finally {
            if (id === requestId.current) { setLoading(false); setIsLoadingMore(false); }
        }
    }, [debounced, selectedRole]);

    useEffect(() => { load(1); }, [load]);

    const handleLoadMore = useCallback(() => {
        if (isLoadingMore || loading || !hasMore) return;
        load(page + 1);
    }, [isLoadingMore, loading, hasMore, page, load]);

    const renderFooter = () => {
        if (!isLoadingMore) return null;
        return (
            <View style={{ paddingVertical: spacing.md, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={theme.primary} />
            </View>
        );
    };

    const renderPlayerCard = ({ item }: { item: Player }) => (
        <TouchableOpacity
            style={[styles.playerCard, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => navigation.navigate('PlayerProfile', { playerId: item._id })}
            activeOpacity={0.8}
        >
            <View style={styles.cardHeader}>
                {item.image ? (
                    <Image
                        source={{ uri: item.image }}
                        style={[styles.playerImage, { backgroundColor: isDark ? theme.border : '#f0f0f0' }]}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={[styles.playerImage, { backgroundColor: isDark ? theme.border : '#e2e8f0', alignItems: 'center', justifyContent: 'center' }]}>
                        <ThemedText weight="bold" color="textSecondary">{(item.name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}</ThemedText>
                    </View>
                )}
                <View style={styles.playerInfo}>
                    <ThemedText variant="subtitle" weight="bold" numberOfLines={1}>
                        {item.name}
                    </ThemedText>
                    <ThemedText variant="caption" color="textSecondary" style={styles.countryText}>
                        {item.country}
                    </ThemedText>
                    <View style={[styles.roleBadge, { backgroundColor: theme.primary + '15' }]}>
                        <ThemedText variant="caption" color="primary" weight="semibold">
                            {String(item.role || '').replace(/-/g, ' ')}
                        </ThemedText>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <ThemedText variant="title" weight="bold" style={styles.headerTitle}>
                    All Players
                </ThemedText>
            </View>

            {/* Search Bar */}
            <View style={[styles.searchContainer, { backgroundColor: theme.surface }]}>
                <View style={[styles.searchBar, { backgroundColor: theme.background, borderColor: theme.border }]}>
                    <Ionicons name="search" size={20} color={theme.textSecondary} style={styles.searchIcon} />
                    <TextInput
                        style={[styles.searchInput, { color: theme.text }]}
                        placeholder="Search players or countries..."
                        placeholderTextColor={theme.textSecondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoCorrect={false}
                        maxFontSizeMultiplier={1.3}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Horizontal Role Filters */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterContainer}
                >
                    {ROLES.map((role) => {
                        const isSelected = selectedRole === role;
                        return (
                            <TouchableOpacity
                                key={role}
                                onPress={() => setSelectedRole(role)}
                                style={[
                                    styles.filterChip,
                                    {
                                        backgroundColor: isSelected ? theme.primary : theme.background,
                                        borderColor: isSelected ? theme.primary : theme.border
                                    }
                                ]}
                            >
                                <ThemedText
                                    variant="caption"
                                    weight={isSelected ? 'bold' : 'medium'}
                                    color={isSelected ? 'white' : 'textSecondary'}
                                >
                                    {role}
                                </ThemedText>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {/* Player Grid */}
            <FlatList
                data={players}
                keyExtractor={(item) => item._id}
                renderItem={renderPlayerCard}
                numColumns={2}
                columnWrapperStyle={styles.rowWrapper}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={renderFooter}
                ListEmptyComponent={() => (
                    <View style={styles.emptyContainer}>
                        {loading ? (
                            <ActivityIndicator size="small" color={theme.primary} />
                        ) : (
                            <>
                                <Ionicons name={error ? 'cloud-offline-outline' : 'people-outline'} size={48} color={theme.border} />
                                <ThemedText color="textSecondary" style={styles.emptyText}>
                                    {error ? 'Could not load players. Pull back and try again.' : 'No players found matching your criteria.'}
                                </ThemedText>
                                {error && (
                                    <TouchableOpacity onPress={() => load(1)} style={{ marginTop: spacing.md }}>
                                        <ThemedText color="primary" weight="semibold">Retry</ThemedText>
                                    </TouchableOpacity>
                                )}
                            </>
                        )}
                    </View>
                )}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
    },
    backButton: {
        padding: spacing.xs,
        marginRight: spacing.sm,
    },
    headerTitle: {
        flex: 1,
    },
    searchContainer: {
        paddingHorizontal: spacing.md,
        paddingTop: spacing.sm,
        paddingBottom: spacing.sm,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        height: 48,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        marginBottom: spacing.md,
    },
    searchIcon: {
        marginRight: spacing.sm,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        paddingVertical: spacing.sm,
    },
    filterContainer: {
        gap: spacing.sm,
        paddingBottom: spacing.xs,
    },
    filterChip: {
        paddingHorizontal: spacing.lg,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
    },
    listContainer: {
        padding: spacing.md,
        paddingBottom: spacing.xxl,
    },
    rowWrapper: {
        justifyContent: 'space-between',
        gap: spacing.md,
    },
    playerCard: {
        flex: 1,
        marginBottom: spacing.md,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        overflow: 'hidden',
    },
    cardHeader: {
        alignItems: 'center',
        padding: spacing.md,
    },
    playerImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginBottom: spacing.sm,
    },
    playerInfo: {
        alignItems: 'center',
        width: '100%',
    },
    countryText: {
        marginTop: 2,
        marginBottom: spacing.xs,
    },
    roleBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: 4,
        marginTop: 4,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: spacing.xxl,
    },
    emptyText: {
        marginTop: spacing.md,
        textAlign: 'center',
    },
});
