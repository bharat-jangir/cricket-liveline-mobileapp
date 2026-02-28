import React, { useState, useMemo, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, TextInput, Image, SafeAreaView, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useTheme } from '../theme/ThemeContext';
import { spacing, borderRadius } from '../theme';
import { Text as ThemedText } from '../components/ui/Text';
import { mockPlayers, Player } from '../data/mockData';

type NavigationProp = StackNavigationProp<RootStackParamList>;
type RoleFilter = 'All' | 'Batsman' | 'Bowler' | 'All-Rounder';

const ROLES: RoleFilter[] = ['All', 'Batsman', 'Bowler', 'All-Rounder'];

export const AllPlayersScreen: React.FC = () => {
    const { theme, isDark } = useTheme();
    const navigation = useNavigation<NavigationProp>();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRole, setSelectedRole] = useState<RoleFilter>('All');
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const filteredPlayers = useMemo(() => {
        let players = mockPlayers;

        if (selectedRole !== 'All') {
            players = players.filter(p => p.role === selectedRole);
        }

        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            players = players.filter(p =>
                p.name.toLowerCase().includes(lowerQuery) ||
                p.country.toLowerCase().includes(lowerQuery)
            );
        }
        return players;
    }, [searchQuery, selectedRole]);

    const handleLoadMore = useCallback(() => {
        if (isLoadingMore || searchQuery.length > 0) return;
        setIsLoadingMore(true);
        setTimeout(() => setIsLoadingMore(false), 1500);
    }, [isLoadingMore, searchQuery]);

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
            onPress={() => navigation.navigate('PlayerProfile', { playerId: item.id })}
            activeOpacity={0.8}
        >
            <View style={styles.cardHeader}>
                <Image
                    source={{ uri: item.image }}
                    style={[styles.playerImage, { backgroundColor: isDark ? theme.border : '#f0f0f0' }]}
                    resizeMode="cover"
                />
                <View style={styles.playerInfo}>
                    <ThemedText variant="subtitle" weight="bold" numberOfLines={1}>
                        {item.name}
                    </ThemedText>
                    <ThemedText variant="caption" color="textSecondary" style={styles.countryText}>
                        {item.country}
                    </ThemedText>
                    <View style={[styles.roleBadge, { backgroundColor: theme.primary + '15' }]}>
                        <ThemedText variant="caption" color="primary" weight="semibold">
                            {item.role}
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
                        allowFontScaling={false}
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
                data={filteredPlayers}
                keyExtractor={(item) => item.id}
                renderItem={renderPlayerCard}
                numColumns={2}
                columnWrapperStyle={styles.rowWrapper}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={searchQuery ? undefined : renderFooter}
                ListEmptyComponent={() => (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="people-outline" size={48} color={theme.border} />
                        <ThemedText color="textSecondary" style={styles.emptyText}>
                            No players found matching your criteria.
                        </ThemedText>
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
