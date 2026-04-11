import React, { useEffect, useRef } from 'react';
import {
    View,
    Animated,
    StyleSheet,
    SafeAreaView,
    Dimensions,
    TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { spacing, borderRadius } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Single shimmer pulse hook ───────────────────────────────────────────────
function useShimmer(duration = 1200) {
    const anim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(anim, { toValue: 1, duration, useNativeDriver: true }),
                Animated.timing(anim, { toValue: 0, duration, useNativeDriver: true }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, []);

    return anim;
}

// ─── Skeleton block ───────────────────────────────────────────────────────────
const SkeletonBox: React.FC<{
    width?: number | string;
    height?: number;
    borderRad?: number;
    style?: any;
}> = ({ width = '100%', height = 14, borderRad = borderRadius.sm, style }) => {
    const { theme, isDark } = useTheme();
    const shimmer = useShimmer();

    const baseColor  = isDark ? '#1e293b' : '#e2e8f0';
    const shineColor = isDark ? '#334155' : '#f1f5f9';

    const opacity = shimmer.interpolate({
        inputRange:  [0, 1],
        outputRange: [1, 0.4],
    });

    return (
        <Animated.View
            style={[
                {
                    width: width as any,
                    height,
                    borderRadius: borderRad,
                    backgroundColor: baseColor,
                    opacity,
                },
                style,
            ]}
        />
    );
};

// ─── Header skeleton ──────────────────────────────────────────────────────────
const HeaderSkeleton: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { theme, isDark } = useTheme();
    const headerBg = isDark ? theme.surface : theme.primary;

    return (
        <View style={[styles.header, { backgroundColor: headerBg }]}>
            <SafeAreaView>
                <View style={styles.navRow}>
                    <TouchableOpacity onPress={onBack} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <SkeletonBox width={180} height={18} style={{ opacity: 0.4 }} />
                    <View style={{ flex: 1 }} />
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        <SkeletonBox width={20} height={20} borderRad={10} style={{ opacity: 0.3 }} />
                        <SkeletonBox width={20} height={20} borderRad={10} style={{ opacity: 0.3 }} />
                        <SkeletonBox width={20} height={20} borderRad={10} style={{ opacity: 0.3 }} />
                    </View>
                </View>
            </SafeAreaView>
        </View>
    );
};

// ─── Tab bar skeleton ─────────────────────────────────────────────────────────
const TabBarSkeleton: React.FC = () => {
    const { theme, isDark } = useTheme();
    const tabs = ['Info', 'Live', 'Fantasy', 'Commentary', 'Scorecard'];

    return (
        <View style={[styles.tabBar, { backgroundColor: isDark ? theme.surface : theme.primary }]}>
            {tabs.map((t) => (
                <View key={t} style={styles.tabItem}>
                    <SkeletonBox width={48} height={14} style={{ opacity: 0.35 }} />
                </View>
            ))}
        </View>
    );
};

// ─── Score header skeleton ────────────────────────────────────────────────────
const ScoreHeaderSkeleton: React.FC = () => {
    const { theme, isDark } = useTheme();
    const bg = isDark ? theme.surface : theme.primary;

    return (
        <View style={[styles.scoreSection, { backgroundColor: bg }]}>
            <View style={styles.scoreRow}>
                {/* Team A */}
                <View style={styles.teamSide}>
                    <SkeletonBox width={48} height={48} borderRad={24} style={{ opacity: 0.3 }} />
                    <SkeletonBox width={36} height={14} style={{ marginTop: 8, opacity: 0.4 }} />
                    <SkeletonBox width={80} height={28} style={{ marginTop: 6, opacity: 0.5 }} />
                    <SkeletonBox width={50} height={12} style={{ marginTop: 4, opacity: 0.3 }} />
                </View>

                {/* VS divider */}
                <View style={styles.vsDivider}>
                    <SkeletonBox width={24} height={14} borderRad={4} style={{ opacity: 0.3 }} />
                </View>

                {/* Team B */}
                <View style={[styles.teamSide, { alignItems: 'flex-end' }]}>
                    <SkeletonBox width={48} height={48} borderRad={24} style={{ opacity: 0.3 }} />
                    <SkeletonBox width={36} height={14} style={{ marginTop: 8, opacity: 0.4 }} />
                    <SkeletonBox width={80} height={28} style={{ marginTop: 6, opacity: 0.5 }} />
                    <SkeletonBox width={50} height={12} style={{ marginTop: 4, opacity: 0.3 }} />
                </View>
            </View>

            {/* Status strip */}
            <View style={[styles.statusStrip, { borderTopColor: 'rgba(255,255,255,0.1)' }]}>
                <SkeletonBox width={120} height={12} style={{ opacity: 0.3 }} />
                <SkeletonBox width={160} height={12} style={{ opacity: 0.3 }} />
            </View>
        </View>
    );
};

// ─── Info tab skeleton body ───────────────────────────────────────────────────
const InfoBodySkeleton: React.FC = () => {
    const { theme, isDark } = useTheme();
    const cardBg = isDark ? theme.card : theme.surface;
    const borderColor = theme.border;

    const Card: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
            {children}
        </View>
    );

    const Row: React.FC<{ last?: boolean }> = ({ last }) => (
        <View style={[styles.infoRow, !last && { borderBottomColor: borderColor, borderBottomWidth: StyleSheet.hairlineWidth }]}>
            <SkeletonBox width={80} height={13} />
            <SkeletonBox width={160} height={13} />
        </View>
    );

    return (
        <View style={{ padding: spacing.md, gap: spacing.md }}>
            {/* Series card */}
            <Card>
                <SkeletonBox width={60} height={16} style={{ marginBottom: spacing.sm }} />
                <SkeletonBox width={200} height={14} />
            </Card>

            {/* Match info card */}
            <Card>
                <SkeletonBox width={90} height={16} style={{ marginBottom: spacing.sm }} />
                <Row />
                <Row />
                <Row />
                <Row last />
            </Card>

            {/* Playing XI card */}
            <Card>
                <SkeletonBox width={80} height={16} style={{ marginBottom: spacing.md }} />
                <View style={[styles.teamSelectorRow, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9', marginBottom: spacing.sm }]}>
                    <SkeletonBox width={24} height={24} borderRad={12} />
                    <SkeletonBox width={120} height={14} style={{ flex: 1, marginLeft: spacing.sm }} />
                    <SkeletonBox width={16} height={16} borderRad={8} />
                </View>
                <View style={[styles.teamSelectorRow, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                    <SkeletonBox width={24} height={24} borderRad={12} />
                    <SkeletonBox width={120} height={14} style={{ flex: 1, marginLeft: spacing.sm }} />
                    <SkeletonBox width={16} height={16} borderRad={8} />
                </View>
            </Card>

            {/* H2H card */}
            <Card>
                <SkeletonBox width={100} height={16} style={{ marginBottom: spacing.md }} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ alignItems: 'center', gap: spacing.xs }}>
                        <SkeletonBox width={36} height={14} />
                        <SkeletonBox width={28} height={28} borderRad={14} />
                    </View>
                    <View style={{ flex: 1, marginHorizontal: spacing.md }}>
                        <SkeletonBox width="100%" height={8} borderRad={4} />
                    </View>
                    <View style={{ alignItems: 'center', gap: spacing.xs }}>
                        <SkeletonBox width={36} height={14} />
                        <SkeletonBox width={28} height={28} borderRad={14} />
                    </View>
                </View>
            </Card>
        </View>
    );
};

// ─── Main exported component ──────────────────────────────────────────────────
export const MatchDetailSkeleton: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { theme } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <HeaderSkeleton onBack={onBack} />
            <ScoreHeaderSkeleton />
            <TabBarSkeleton />
            <InfoBodySkeleton />
        </View>
    );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1 },

    // Header
    header: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.sm },
    navRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 44 },
    backButton: { padding: spacing.xs, marginRight: 4 },

    // Tab bar
    tabBar: {
        flexDirection: 'row',
        height: 48,
        alignItems: 'center',
        paddingHorizontal: spacing.sm,
    },
    tabItem: {
        paddingHorizontal: 16,
        height: 48,
        justifyContent: 'center',
    },

    // Score header
    scoreSection: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
    scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    teamSide: { flex: 1, alignItems: 'flex-start' },
    vsDivider: { width: 40, alignItems: 'center' },
    statusStrip: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: spacing.sm,
        paddingTop: spacing.sm,
        borderTopWidth: StyleSheet.hairlineWidth,
    },

    // Info body cards
    card: {
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        borderWidth: StyleSheet.hairlineWidth,
        marginBottom: 0,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: spacing.sm,
        alignItems: 'center',
    },
    teamSelectorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.sm,
        borderRadius: borderRadius.md,
    },
});
