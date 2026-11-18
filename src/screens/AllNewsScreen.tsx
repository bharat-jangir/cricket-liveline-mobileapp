import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Image, SafeAreaView, ActivityIndicator, RefreshControl, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useTheme } from '../theme/ThemeContext';
import { spacing, borderRadius } from '../theme';
import { Text as ThemedText } from '../components/ui/Text';
import { Card } from '../components/ui/Card';
import { Article, ContentService, NEWS_CATEGORIES, categoryLabel } from '../services/content.service';

const CATEGORIES = ['all', ...NEWS_CATEGORIES];

export const timeAgo = (iso?: string) => {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d < 7 ? `${d}d ago` : new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const AllNewsScreen: React.FC = () => {
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [category, setCategory] = useState('all');
  const [items, setItems] = useState<Article[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const reqId = useRef(0);

  const load = useCallback(async (p: number, mode: 'initial' | 'more' | 'refresh' = 'initial') => {
    const id = ++reqId.current;
    if (mode === 'initial') setLoading(true);
    if (mode === 'more') setLoadingMore(true);
    try {
      const res = await ContentService.getNews({ page: p, limit: 10, category: category === 'all' ? undefined : category });
      if (id !== reqId.current) return;
      setItems((prev) => (p === 1 ? res.result : [...prev, ...res.result]));
      setPage(p);
      setHasMore(!!res.pagination && res.pagination.page < res.pagination.totalPages);
      setError(false);
    } catch {
      if (id === reqId.current) setError(true);
    } finally {
      if (id === reqId.current) { setLoading(false); setLoadingMore(false); setRefreshing(false); }
    }
  }, [category]);

  useEffect(() => { load(1); }, [load]);

  const renderItem = ({ item }: { item: Article }) => (
    <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.navigate('NewsDetail', { newsId: item._id })} accessibilityRole="button" accessibilityLabel={item.title}>
      <Card style={styles.card}>
        {item.coverImage ? <Image source={{ uri: item.coverImage }} style={[styles.cover, { backgroundColor: theme.border }]} resizeMode="cover" /> : null}
        <View style={styles.cardBody}>
          <View style={[styles.badge, { backgroundColor: theme.primary + '20' }]}>
            <ThemedText variant="caption" weight="semibold" style={{ color: theme.primary }}>{categoryLabel(item.category)}</ThemedText>
          </View>
          <ThemedText variant="subtitle" weight="bold" style={{ marginTop: spacing.xs }}>{item.title}</ThemedText>
          {item.summary ? <ThemedText variant="small" color="textSecondary" numberOfLines={3} style={{ marginTop: spacing.xs }}>{item.summary}</ThemedText> : null}
          <ThemedText variant="caption" color="textLight" style={{ marginTop: spacing.sm }}>{[item.authorName, timeAgo(item.publishedAt)].filter(Boolean).join(' • ')}</ThemedText>
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back} accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <ThemedText variant="title" weight="bold">News</ThemedText>
      </View>

      <View style={{ backgroundColor: theme.surface }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {CATEGORIES.map((c) => {
            const on = c === category;
            return (
              <TouchableOpacity key={c} onPress={() => setCategory(c)} style={[styles.chip, { backgroundColor: on ? theme.primary : theme.background, borderColor: on ? theme.primary : theme.border }]}>
                <ThemedText variant="caption" weight={on ? 'bold' : 'medium'} color={on ? 'white' : 'textSecondary'}>{c === 'all' ? 'All' : categoryLabel(c)}</ThemedText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={items}
        keyExtractor={(i) => i._id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(1, 'refresh'); }} tintColor={theme.primary} />}
        onEndReached={() => { if (hasMore && !loadingMore && !loading) load(page + 1, 'more'); }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={loadingMore ? <ActivityIndicator style={{ margin: spacing.md }} color={theme.primary} /> : null}
        ListEmptyComponent={
          <View style={styles.empty}>
            {loading ? <ActivityIndicator color={theme.primary} /> : (
              <>
                <Ionicons name={error ? 'cloud-offline-outline' : 'newspaper-outline'} size={48} color={theme.border} />
                <ThemedText color="textSecondary" style={{ marginTop: spacing.md, textAlign: 'center' }}>
                  {error ? 'Could not load news. Check your connection.' : 'No articles in this category yet.'}
                </ThemedText>
                {error && <TouchableOpacity onPress={() => load(1)} style={{ marginTop: spacing.md }}><ThemedText color="primary" weight="semibold">Retry</ThemedText></TouchableOpacity>}
              </>
            )}
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, gap: spacing.sm },
  back: { padding: spacing.xs },
  chips: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.sm },
  chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2, borderRadius: borderRadius.full, borderWidth: 1 },
  list: { padding: spacing.md, paddingBottom: spacing.xl },
  card: { padding: 0, overflow: 'hidden', marginBottom: spacing.md },
  cover: { width: '100%', height: 160 },
  cardBody: { padding: spacing.md },
  badge: { alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.sm },
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: spacing.lg },
});
