import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { spacing, fontSize, borderRadius } from '../theme';

interface Match {
  id: string;
  series: string;
  format: string;
  team1: { name: string; code: string; score?: string; overs?: string };
  team2: { name: string; code: string; score?: string; overs?: string };
  status: string;
  venue: string;
  time?: string;
  runRate?: string;
  result?: string;
}

interface MatchCardProps {
  match: Match;
  onPress?: () => void;
}

export const MatchCard: React.FC<MatchCardProps> = ({ match, onPress }) => {
  const { theme } = useTheme();

  const getFormatBadgeColors = (format: string) => {
    switch (format) {
      case 'T20': return ['#f97316', '#dc2626'] as const;
      case 'ODI': return ['#3b82f6', '#8b5cf6'] as const;
      case 'Test': return ['#059669', '#0d9488'] as const;
      default: return ['#6b7280', '#6b7280'] as const;
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.container,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
          shadowColor: theme.shadow,
        }
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="trophy" size={16} color="#A3E635" />
          <Text style={[styles.seriesText, { color: theme.textSecondary }]}>
            {match.series}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <LinearGradient
            colors={getFormatBadgeColors(match.format)}
            style={styles.formatBadge}
          >
            <Text style={styles.formatText}>{match.format}</Text>
          </LinearGradient>
          <TouchableOpacity style={styles.bookmarkButton}>
            <Ionicons name="bookmark-outline" size={16} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Live Status */}
      {match.status === 'Live' && (
        <View style={styles.liveStatus}>
          <View style={styles.liveIndicator} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      )}

      {/* Teams */}
      <View style={styles.teamsContainer}>
        {/* Team 1 */}
        <View style={styles.teamRow}>
          <View style={styles.teamInfo}>
            <LinearGradient
              colors={['#0B1F3F', '#1A3A5C']}
              style={styles.teamLogo}
            >
              <Text style={styles.teamCode}>{match.team1.code}</Text>
            </LinearGradient>
            <Text style={[styles.teamName, { color: theme.text }]}>
              {match.team1.name}
            </Text>
          </View>
          {match.team1.score && (
            <View style={styles.scoreInfo}>
              <Text style={[styles.score, { color: theme.text }]}>
                {match.team1.score}
              </Text>
              <Text style={[styles.overs, { color: theme.textSecondary }]}>
                ({match.team1.overs} ov)
              </Text>
            </View>
          )}
        </View>

        {/* Team 2 */}
        <View style={styles.teamRow}>
          <View style={styles.teamInfo}>
            <LinearGradient
              colors={['#0B1F3F', '#1A3A5C']}
              style={styles.teamLogo}
            >
              <Text style={styles.teamCode}>{match.team2.code}</Text>
            </LinearGradient>
            <Text style={[styles.teamName, { color: theme.text }]}>
              {match.team2.name}
            </Text>
          </View>
          {match.team2.score && (
            <View style={styles.scoreInfo}>
              <Text style={[styles.score, { color: theme.text }]}>
                {match.team2.score}
              </Text>
              <Text style={[styles.overs, { color: theme.textSecondary }]}>
                ({match.team2.overs} ov)
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Footer */}
      <View style={[styles.footer, { borderTopColor: theme.border }]}>
        <View style={styles.footerLeft}>
          <Ionicons name="location-outline" size={12} color={theme.textSecondary} />
          <Text style={[styles.venue, { color: theme.textSecondary }]}>
            {match.venue}
          </Text>
        </View>
        {match.status === 'Scheduled' && match.time && (
          <View style={styles.footerRight}>
            <Ionicons name="time-outline" size={12} color={theme.textSecondary} />
            <Text style={[styles.time, { color: theme.textSecondary }]}>
              {match.time}
            </Text>
          </View>
        )}
        {match.runRate && match.status === 'Live' && (
          <Text style={[styles.runRate, { color: theme.textSecondary }]}>
            RR: {match.runRate}
          </Text>
        )}
      </View>

      {/* Result */}
      {match.result && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultText}>{match.result}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  seriesText: {
    fontSize: fontSize.xs,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  formatBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  formatText: {
    fontSize: fontSize.xs,
    color: 'white',
    fontWeight: '600',
  },
  bookmarkButton: {
    padding: 4,
  },
  liveStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    marginBottom: spacing.sm,
    alignSelf: 'flex-start',
  },
  liveIndicator: {
    width: 6,
    height: 6,
    backgroundColor: '#ef4444',
    borderRadius: 3,
  },
  liveText: {
    fontSize: fontSize.xs,
    color: '#ef4444',
    fontWeight: '600',
  },
  teamsContainer: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
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
  teamLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamCode: {
    fontSize: fontSize.xs,
    fontWeight: 'bold',
    color: '#A3E635',
  },
  teamName: {
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  scoreInfo: {
    alignItems: 'flex-end',
  },
  score: {
    fontSize: fontSize.md,
    fontWeight: 'bold',
  },
  overs: {
    fontSize: fontSize.xs,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  venue: {
    fontSize: fontSize.xs,
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  time: {
    fontSize: fontSize.xs,
  },
  runRate: {
    fontSize: fontSize.xs,
  },
  resultContainer: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: 'rgba(163, 230, 53, 0.1)',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(163, 230, 53, 0.2)',
  },
  resultText: {
    fontSize: fontSize.xs,
    color: '#A3E635',
    fontWeight: '600',
    textAlign: 'center',
  },
});