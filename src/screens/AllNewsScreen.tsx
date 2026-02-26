import React from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import { Text as ThemedText } from '../components/ui/Text';
import { Card } from '../components/ui/Card';
import { spacing, borderRadius } from '../theme';

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  image: string;
  category: string;
  time: string;
  author: string;
}

const MOCK_NEWS: NewsArticle[] = [
  {
    id: '1',
    title: 'India wins thrilling match against Australia',
    summary: 'In a nail-biting finish, India secured victory by 5 runs in the final over...',
    image: 'https://via.placeholder.com/400x250/1877f2/ffffff?text=News+1',
    category: 'Match Report',
    time: '2 hours ago',
    author: 'John Smith',
  },
  {
    id: '2',
    title: 'Virat Kohli breaks another record',
    summary: 'The Indian captain has now scored 50 ODI centuries, breaking multiple records...',
    image: 'https://via.placeholder.com/400x250/42a5f5/ffffff?text=News+2',
    category: 'Records',
    time: '5 hours ago',
    author: 'Sarah Johnson',
  },
  {
    id: '3',
    title: 'IPL 2024 auction dates announced',
    summary: 'BCCI confirms the dates for the upcoming IPL mega auction scheduled for...',
    image: 'https://via.placeholder.com/400x250/1877f2/ffffff?text=News+3',
    category: 'IPL',
    time: '8 hours ago',
    author: 'Mike Wilson',
  },
  {
    id: '4',
    title: 'New cricket rules to be implemented',
    summary: 'ICC announces major changes to playing conditions starting next season...',
    image: 'https://via.placeholder.com/400x250/42a5f5/ffffff?text=News+4',
    category: 'Updates',
    time: '1 day ago',
    author: 'Emma Davis',
  },
  {
    id: '5',
    title: 'Pakistan announces squad for series',
    summary: 'PCB reveals the 15-member squad for the upcoming Test series against...',
    image: 'https://via.placeholder.com/400x250/1877f2/ffffff?text=News+5',
    category: 'Team News',
    time: '1 day ago',
    author: 'Ahmed Khan',
  },
];

export const AllNewsScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const renderNewsItem = ({ item }: { item: NewsArticle }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('NewsDetail', { newsId: item.id })}
    >
      <Card style={styles.newsCard}>
        <View style={styles.imageContainer}>
          <View style={[styles.imagePlaceholder, { backgroundColor: theme.primary }]}>
            <Ionicons name="newspaper-outline" size={40} color="white" />
          </View>
          <View style={[styles.categoryBadge, { backgroundColor: theme.primary }]}>
            <ThemedText variant="small" color="white" weight="semibold">
              {item.category}
            </ThemedText>
          </View>
        </View>
        <View style={styles.newsContent}>
          <ThemedText variant="body" weight="bold" numberOfLines={2}>
            {item.title}
          </ThemedText>
          <ThemedText variant="small" color="textSecondary" style={styles.summary} numberOfLines={2}>
            {item.summary}
          </ThemedText>
          <View style={styles.newsFooter}>
            <View style={styles.authorInfo}>
              <Ionicons name="person-circle-outline" size={16} color={theme.textSecondary} />
              <ThemedText variant="small" color="textSecondary" style={styles.author}>
                {item.author}
              </ThemedText>
            </View>
            <View style={styles.timeInfo}>
              <Ionicons name="time-outline" size={14} color={theme.textSecondary} />
              <ThemedText variant="small" color="textSecondary" style={styles.time}>
                {item.time}
              </ThemedText>
            </View>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient colors={[theme.primary, '#42a5f5']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <ThemedText variant="title" color="white" weight="bold">
            All News
          </ThemedText>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <FlatList
        data={MOCK_NEWS}
        renderItem={renderNewsItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
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
  placeholder: {
    width: 40,
  },
  listContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  newsCard: {
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    height: 180,
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  newsContent: {
    padding: spacing.md,
  },
  summary: {
    marginTop: spacing.xs,
    lineHeight: 18,
  },
  newsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  author: {
    marginLeft: spacing.xs,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  time: {
    marginLeft: spacing.xs,
  },
});
