import React, { useState, useMemo, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, TextInput, Image, SafeAreaView, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useTheme } from '../theme/ThemeContext';
import { spacing, borderRadius } from '../theme';
import { Text as ThemedText } from '../components/ui/Text';
import { VenueService } from '../services/venue.service';
import { usePagination } from '../hooks/usePagination';
import { useDebounce } from '../hooks/useDebounce';

type NavigationProp = StackNavigationProp<RootStackParamList>;

export const AllVenuesScreen: React.FC = () => {
    const { theme, isDark } = useTheme();
    const navigation = useNavigation<NavigationProp>();
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearch = useDebounce(searchQuery, 500);

    const {
        items: venues,
        loading,
        loadingMore,
        refreshing,
        loadMore,
        refresh
    } = usePagination<any>(
        (params) => VenueService.getVenues({ ...params, search: debouncedSearch }),
        [debouncedSearch]
    );

    const onRefresh = React.useCallback(() => {
        refresh();
    }, [refresh]);

    const renderFooter = () => {
        if (!loadingMore) return null;
        return (
            <View style={{ paddingVertical: spacing.md, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={theme.primary} />
            </View>
        );
    };

    const renderVenueItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={[styles.venueCard, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => navigation.navigate('VenueDetail', { venueId: item.id })}
            activeOpacity={0.7}
        >
            <Image
                source={{ uri: item.image || item.venueImage }}
                style={[styles.venueImage, { backgroundColor: isDark ? theme.border : '#f0f0f0' }]}
                resizeMode="cover"
            />
            <View style={styles.venueInfo}>
                <ThemedText variant="subtitle" weight="bold" numberOfLines={1}>
                    {item.name}
                </ThemedText>

                <View style={styles.venueLocation}>
                    <Ionicons name="location-outline" size={14} color={theme.textSecondary} />
                    <ThemedText variant="caption" color="textSecondary" style={styles.locationText} numberOfLines={1}>
                        {item.city}, {item.country}
                    </ThemedText>
                </View>

                {item.capacity && (
                    <View style={styles.venueCapacity}>
                        <Ionicons name="people-outline" size={14} color={theme.textSecondary} />
                        <ThemedText variant="caption" color="textSecondary" style={styles.capacityText}>
                            Cap: {item.capacity}
                        </ThemedText>
                    </View>
                )}
            </View>
            <View style={styles.chevronContainer}>
                <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
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
                    All Venues
                </ThemedText>
            </View>

            {/* Search Bar */}
            <View style={[styles.searchContainer, { backgroundColor: theme.surface }]}>
                <View style={[styles.searchBar, { backgroundColor: theme.background, borderColor: theme.border }]}>
                    <Ionicons name="search" size={20} color={theme.textSecondary} style={styles.searchIcon} />
                    <TextInput
                        style={[styles.searchInput, { color: theme.text }]}
                        placeholder="Search venues by name or city..."
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
            </View>

            {/* Venue List */}
            <FlatList
                data={venues}
                keyExtractor={(item) => item._id || item.id}
                renderItem={renderVenueItem}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                onEndReached={loadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={renderFooter}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={theme.primary}
                        colors={[theme.primary]}
                    />
                }
                ListEmptyComponent={() => (
                    !loading && !refreshing ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="search-outline" size={48} color={theme.border} />
                        <ThemedText color="textSecondary" style={styles.emptyText}>
                            No venues found matching "{searchQuery}"
                        </ThemedText>
                    </View>
                    ) : null
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
        padding: spacing.md,
        paddingTop: spacing.sm,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        height: 48,
        borderRadius: borderRadius.md,
        borderWidth: 1,
    },
    searchIcon: {
        marginRight: spacing.sm,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        paddingVertical: spacing.sm,
    },
    listContainer: {
        padding: spacing.md,
        paddingBottom: spacing.xxl,
    },
    venueCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.sm,
        marginBottom: spacing.md,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    venueImage: {
        width: 80,
        height: 80,
        borderRadius: borderRadius.md,
        marginRight: spacing.md,
    },
    venueInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    venueLocation: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.xs,
    },
    locationText: {
        marginLeft: spacing.xs,
    },
    venueCapacity: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.xs,
    },
    capacityText: {
        marginLeft: spacing.xs,
    },
    chevronContainer: {
        padding: spacing.sm,
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
