import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Text as ThemedText } from './ui/Text';
import { Card } from './ui/Card';
import { spacing } from '../theme';

interface Session {
  _id: string;
  session: number;
  open: number;
  pass: number;
  min: number;
  max: number;
}

interface SessionsTableProps {
  sessions: Session[];
}

export const SessionsTable: React.FC<SessionsTableProps> = ({ sessions }) => {
  const { theme, isDark } = useTheme();

  if (!sessions || sessions.length === 0) {
    return null; // Don't show anything if no sessions
  }

  return (
    <Card style={styles.container}>
      <View style={styles.titleRow}>
        <ThemedText variant="small" weight="bold" color="textSecondary">
          Sessions Table
        </ThemedText>
        {/* <View style={styles.badge}>
          <ThemedText variant="caption" weight="bold" color="primary">LIVE</ThemedText>
        </View> */}
      </View>

      <View style={styles.header}>
        <ThemedText variant="caption" weight="bold" style={styles.headerLabel}>SESSION</ThemedText>
        <ThemedText variant="caption" weight="bold" style={styles.headerLabel}>OPEN</ThemedText>
        <ThemedText variant="caption" weight="bold" style={styles.headerLabel}>PASS</ThemedText>
        <ThemedText variant="caption" weight="bold" style={styles.headerLabel}>MIN</ThemedText>
        <ThemedText variant="caption" weight="bold" style={[styles.headerLabel, { textAlign: 'right' }]}>MAX</ThemedText>
      </View>

      {sessions.map((item, index) => {
        const diff = item.pass - item.open;
        const statusColor = diff > 0 ? theme.success : (diff < 0 ? theme.error : theme.warning);
        const statusIcon = diff > 0 ? '>' : (diff < 0 ? '<' : '=');

        return (
          <View
            key={item._id || index}
            style={[
              styles.row,
              { borderBottomColor: theme.border + '20' },
              index === sessions.length - 1 && { borderBottomWidth: 0 }
            ]}
          >
            <View style={styles.sessionCell}>
              <ThemedText weight="bold" style={{ fontSize: 13 }}>
                {item.session} Over
              </ThemedText>
            </View>

            <ThemedText weight="medium" style={[styles.cell, { fontSize: 13 }]}>{item.open}</ThemedText>

            <View style={[styles.cell, { flexDirection: 'row', alignItems: 'center', gap: 2 }]}>
              <ThemedText weight="bold" style={{ color: statusColor, fontSize: 13 }}>{statusIcon} {item.pass}</ThemedText>
            </View>

            <ThemedText variant="caption" weight="bold" style={styles.cell}>{item.min}</ThemedText>
            <ThemedText variant="caption" weight="bold" style={[styles.cell, { textAlign: 'right' }]}>{item.max}</ThemedText>
          </View>
        );
      })}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.sm,
    padding: spacing.sm,
    marginHorizontal: spacing.md,
    borderRadius: 8,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: 'rgba(24, 119, 242, 0.1)',
    borderRadius: 4,
  },
  header: {
    flexDirection: 'row',
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    marginBottom: 4,
  },
  headerLabel: {
    flex: 1,
    opacity: 0.5,
    fontSize: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  sessionCell: {
    flex: 1,
  },
  cell: {
    flex: 1,
  },
  emptyText: {
    textAlign: 'center',
    padding: spacing.md,
  }
});
