import React from 'react';
import { View, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions, Text } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { Text as ThemedText } from '../components/ui/Text';
import { spacing } from '../theme';
import { LinearGradient } from 'expo-linear-gradient';

const TopTab = createMaterialTopTabNavigator();
const { width } = Dimensions.get('window');

// --- Placeholder Tabs ---
function OverviewTab() {
    const { theme } = useTheme();
    return (
        <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }}>
            <ThemedText variant="title" color="textSecondary">Overview Screen</ThemedText>
            <ThemedText variant="caption" color="textLight" style={{ marginTop: spacing.sm }}>Coming soon...</ThemedText>
        </View>
    );
}

function MatchesTab() {
    const { theme } = useTheme();
    return (
        <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }}>
            <ThemedText variant="title" color="textSecondary">Matches Screen</ThemedText>
            <ThemedText variant="caption" color="textLight" style={{ marginTop: spacing.sm }}>Coming soon...</ThemedText>
        </View>
    );
}

function StatsTab() {
    const { theme } = useTheme();
    return (
        <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }}>
            <ThemedText variant="title" color="textSecondary">Stats Screen</ThemedText>
            <ThemedText variant="caption" color="textLight" style={{ marginTop: spacing.sm }}>Coming soon...</ThemedText>
        </View>
    );
}

function NewsTab() {
    const { theme } = useTheme();
    return (
        <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }}>
            <ThemedText variant="title" color="textSecondary">News Screen</ThemedText>
            <ThemedText variant="caption" color="textLight" style={{ marginTop: spacing.sm }}>Coming soon...</ThemedText>
        </View>
    );
}

function AboutTab() {
    const { theme } = useTheme();
    return (
        <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }}>
            <ThemedText variant="title" color="textSecondary">About Screen</ThemedText>
            <ThemedText variant="caption" color="textLight" style={{ marginTop: spacing.sm }}>Coming soon...</ThemedText>
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
