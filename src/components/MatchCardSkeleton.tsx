import React, { useEffect, useRef } from 'react';
import {
    View,
    Animated,
    StyleSheet,
    Dimensions,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { spacing, borderRadius } from '../theme';

// ─── Single shimmer pulse hook ───────────────────────────────────────────────
function useShimmer(duration = 1000) {
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
    const { isDark } = useTheme();
    const shimmer = useShimmer();

    const baseColor = isDark ? '#1e293b' : '#e2e8f0';

    const opacity = shimmer.interpolate({
        inputRange: [0, 1],
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

// ─── Main exported component ──────────────────────────────────────────────────
/**
 * A skeleton component that mimics the layout of MatchCard.tsx.
 * Used for loading states in Match tab screens.
 */
export const MatchCardSkeleton: React.FC = () => {
    const { theme } = useTheme();

    return (
        <View
            style={[
                styles.container,
                {
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                }
            ]}
        >
            {/* Header: Series info & Format badge */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <SkeletonBox width={16} height={16} borderRad={8} style={{ opacity: 0.3 }} />
                    <SkeletonBox width={120} height={14} style={{ opacity: 0.4 }} />
                </View>
                <View style={styles.headerRight}>
                    <SkeletonBox width={40} height={20} borderRad={10} style={{ opacity: 0.5 }} />
                    <SkeletonBox width={20} height={20} borderRad={10} style={{ opacity: 0.3 }} />
                </View>
            </View>

            {/* Teams Section */}
            <View style={styles.teamsContainer}>
                {/* Team 1 Row */}
                <View style={styles.teamRow}>
                    <View style={styles.teamInfo}>
                        <SkeletonBox width={40} height={40} borderRad={20} style={{ opacity: 0.3 }} />
                        <SkeletonBox width={80} height={18} style={{ opacity: 0.5 }} />
                    </View>
                    <View style={styles.scoreInfo}>
                        <SkeletonBox width={60} height={18} style={{ opacity: 0.6 }} />
                        <SkeletonBox width={40} height={12} style={{ marginTop: 4, opacity: 0.3 }} />
                    </View>
                </View>

                {/* Team 2 Row */}
                <View style={styles.teamRow}>
                    <View style={styles.teamInfo}>
                        <SkeletonBox width={40} height={40} borderRad={20} style={{ opacity: 0.3 }} />
                        <SkeletonBox width={100} height={18} style={{ opacity: 0.5 }} />
                    </View>
                    <View style={styles.scoreInfo}>
                        <SkeletonBox width={50} height={18} style={{ opacity: 0.6 }} />
                        <SkeletonBox width={45} height={12} style={{ marginTop: 4, opacity: 0.3 }} />
                    </View>
                </View>
            </View>

            {/* Footer */}
            <View style={[styles.footer, { borderTopColor: theme.border }]}>
                <View style={styles.footerLeft}>
                    <SkeletonBox width={12} height={12} borderRad={6} style={{ opacity: 0.3 }} />
                    <SkeletonBox width={150} height={12} style={{ opacity: 0.35 }} />
                </View>
            </View>

            {/* Result / Status Strip (Optional placeholder) */}
            <View style={styles.resultPlaceholder}>
                <SkeletonBox width="100%" height={24} borderRad={borderRadius.lg} style={{ opacity: 0.2 }} />
            </View>
        </View>
    );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        borderWidth: 1,
        marginBottom: spacing.md,
        marginHorizontal: spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        flex: 1,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    teamsContainer: {
        gap: spacing.md,
        marginBottom: spacing.md,
    },
    teamRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    teamInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        flex: 1,
    },
    scoreInfo: {
        alignItems: 'flex-end',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: spacing.md,
        borderTopWidth: 1,
    },
    footerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        flex: 1,
    },
    resultPlaceholder: {
        marginTop: spacing.sm,
    },
});

export default MatchCardSkeleton;
