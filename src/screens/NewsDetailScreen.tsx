import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import { Text as ThemedText } from '../components/ui/Text';
import { spacing, borderRadius } from '../theme';

export const NewsDetailScreen: React.FC = () => {
  const { theme, isDark } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient colors={isDark ? [theme.surface, theme.background] : [theme.primary, theme.primaryDark]} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="bookmark-outline" size={22} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="share-social-outline" size={22} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.categoryContainer}>
          <View style={[styles.categoryBadge, { backgroundColor: theme.primary }]}>
            <ThemedText variant="small" color="white" weight="semibold">
              Match Report
            </ThemedText>
          </View>
          <View style={styles.timeContainer}>
            <Ionicons name="time-outline" size={14} color={theme.textSecondary} />
            <ThemedText variant="small" color="textSecondary" style={styles.time}>
              2 hours ago
            </ThemedText>
          </View>
        </View>

        <ThemedText variant="heading" weight="bold" style={styles.title}>
          India wins thrilling match against Australia in final over
        </ThemedText>

        <View style={styles.authorSection}>
          <View style={styles.authorInfo}>
            <Ionicons name="person-circle" size={40} color={theme.primary} />
            <View style={styles.authorDetails}>
              <ThemedText weight="semibold">John Smith</ThemedText>
              <ThemedText variant="small" color="textSecondary">
                Senior Cricket Correspondent
              </ThemedText>
            </View>
          </View>
        </View>

        <View style={[styles.imagePlaceholder, { backgroundColor: isDark ? theme.surface : theme.primary + '20' }]}>
          <Ionicons name="image-outline" size={60} color={isDark ? theme.textSecondary : theme.primary} />
        </View>

        <View style={styles.articleContent}>
          <ThemedText variant="body" style={styles.paragraph}>
            In a nail-biting finish that kept fans on the edge of their seats, India secured a dramatic victory against Australia by 5 runs in the final over of the match. The thrilling encounter showcased exceptional cricket from both sides.
          </ThemedText>

          <ThemedText variant="body" style={styles.paragraph}>
            Chasing a target of 287, Australia looked well-positioned at 250/4 with 6 overs remaining. However, India's death bowling proved to be the difference as they picked up crucial wickets at regular intervals.
          </ThemedText>

          <ThemedText variant="title" weight="semibold" style={styles.subheading}>
            Key Moments
          </ThemedText>

          <ThemedText variant="body" style={styles.paragraph}>
            The turning point came in the 48th over when Jasprit Bumrah dismissed the dangerous Glenn Maxwell with a perfect yorker. This breakthrough shifted the momentum completely in India's favor.
          </ThemedText>

          <ThemedText variant="body" style={styles.paragraph}>
            Earlier in the day, Virat Kohli's masterful century (112 off 98 balls) laid the foundation for India's competitive total. His partnership of 156 runs with Shreyas Iyer (78) was crucial in posting a challenging score.
          </ThemedText>

          <ThemedText variant="title" weight="semibold" style={styles.subheading}>
            Player Performances
          </ThemedText>

          <ThemedText variant="body" style={styles.paragraph}>
            • Virat Kohli: 112 runs off 98 balls (12 fours, 2 sixes)
          </ThemedText>
          <ThemedText variant="body" style={styles.paragraph}>
            • Shreyas Iyer: 78 runs off 65 balls
          </ThemedText>
          <ThemedText variant="body" style={styles.paragraph}>
            • Jasprit Bumrah: 3/45 in 10 overs
          </ThemedText>
          <ThemedText variant="body" style={styles.paragraph}>
            • Mohammed Shami: 2/52 in 9.4 overs
          </ThemedText>

          <ThemedText variant="body" style={styles.paragraph}>
            This victory marks India's third consecutive win in the series, putting them in a commanding position with a 3-1 lead. The final match will be played next week at the Wankhede Stadium in Mumbai.
          </ThemedText>
        </View>

        <View style={[styles.relatedSection, { borderTopColor: theme.border }]}>
          <ThemedText variant="title" weight="bold" style={styles.relatedTitle}>
            Related Articles
          </ThemedText>

          <TouchableOpacity style={[styles.relatedCard, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]}>
            <View style={[styles.relatedImage, { backgroundColor: isDark ? theme.border : theme.primary + '20' }]}>
              <Ionicons name="newspaper-outline" size={24} color={isDark ? theme.text : theme.primary} />
            </View>
            <View style={styles.relatedContent}>
              <ThemedText variant="small" weight="semibold" numberOfLines={2}>
                Virat Kohli breaks another record with century
              </ThemedText>
              <ThemedText variant="small" color="textSecondary">
                5 hours ago
              </ThemedText>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.relatedCard, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]}>
            <View style={[styles.relatedImage, { backgroundColor: isDark ? theme.border : theme.primary + '20' }]}>
              <Ionicons name="newspaper-outline" size={24} color={isDark ? theme.text : theme.primary} />
            </View>
            <View style={styles.relatedContent}>
              <ThemedText variant="small" weight="semibold" numberOfLines={2}>
                India's bowling attack proves too strong
              </ThemedText>
              <ThemedText variant="small" color="textSecondary">
                1 day ago
              </ThemedText>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  iconButton: {
    padding: spacing.xs,
  },
  content: {
    flex: 1,
  },
  categoryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  categoryBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  time: {
    marginLeft: spacing.xs,
  },
  title: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
    lineHeight: 32,
  },
  authorSection: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  authorDetails: {
    flex: 1,
  },
  imagePlaceholder: {
    height: 220,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  articleContent: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  paragraph: {
    marginBottom: spacing.md,
    lineHeight: 24,
  },
  subheading: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  relatedSection: {
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
  },
  relatedTitle: {
    marginBottom: spacing.md,
  },
  relatedCard: {
    flexDirection: 'row',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  relatedImage: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  relatedContent: {
    flex: 1,
    marginLeft: spacing.sm,
    justifyContent: 'center',
  },
});
