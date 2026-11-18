import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, SafeAreaView, ActivityIndicator, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useTheme } from '../theme/ThemeContext';
import { spacing, borderRadius } from '../theme';
import { Text as ThemedText } from '../components/ui/Text';
import { Card } from '../components/ui/Card';
import { Article, ContentService, categoryLabel, parseBody } from '../services/content.service';
import { timeAgo } from './AllNewsScreen';

export const NewsDetailScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { newsId } = useRoute<RouteProp<RootStackParamList, 'NewsDetail'>>().params;
  const [article, setArticle] = useState<Article | null>(null);
  const [state, setState] = useState<'loading' | 'ok' | 'missing' | 'error'>('loading');

  const load = React.useCallback(() => {
    setState('loading');
    ContentService.getArticle(newsId)
      .then((a) => { setArticle(a); setState(a ? 'ok' : 'missing'); })
      .catch(() => setState('error'));
  }, [newsId]);
  useEffect(load, [load]);

  const Header = (
    <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn} accessibilityLabel="Go back">
        <Ionicons name="arrow-back" size={24} color={theme.text} />
      </TouchableOpacity>
      <View style={{ flex: 1 }} />
      {article && (
        <TouchableOpacity onPress={() => Share.share({ message: `${article.title}${article.summary ? `\n\n${article.summary}` : ''}` }).catch(() => undefined)} style={styles.iconBtn} accessibilityLabel="Share article">
          <Ionicons name="share-outline" size={22} color={theme.text} />
        </TouchableOpacity>
      )}
    </View>
  );

  if (state !== 'ok' || !article) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        {Header}
        <View style={styles.center}>
          {state === 'loading' ? <ActivityIndicator color={theme.primary} /> : (
            <>
              <Ionicons name={state === 'missing' ? 'document-outline' : 'cloud-offline-outline'} size={48} color={theme.border} />
              <ThemedText color="textSecondary" style={{ marginTop: spacing.md, textAlign: 'center' }}>
                {state === 'missing' ? 'This article is no longer available.' : 'Could not load this article.'}
              </ThemedText>
              {state === 'error' && <TouchableOpacity onPress={load} style={{ marginTop: spacing.md }}><ThemedText color="primary" weight="semibold">Retry</ThemedText></TouchableOpacity>}
            </>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {Header}
      <ScrollView contentContainerStyle={styles.content}>
        {article.coverImage ? <Image source={{ uri: article.coverImage }} style={[styles.cover, { backgroundColor: theme.border }]} resizeMode="cover" /> : null}
        <View style={[styles.badge, { backgroundColor: theme.primary + '20' }]}>
          <ThemedText variant="caption" weight="semibold" style={{ color: theme.primary }}>{categoryLabel(article.category)}</ThemedText>
        </View>
        <ThemedText variant="heading" weight="bold" style={styles.title}>{article.title}</ThemedText>
        <ThemedText variant="caption" color="textLight">{[article.authorName, timeAgo(article.publishedAt)].filter(Boolean).join(' • ')}</ThemedText>
        {article.summary ? <ThemedText weight="medium" color="textSecondary" style={styles.summary}>{article.summary}</ThemedText> : null}

        {parseBody(article.body || '').map((b, i) =>
          b.type === 'h' ? (
            <ThemedText key={i} variant="title" weight="bold" style={styles.h}>{b.text}</ThemedText>
          ) : (
            <ThemedText key={i} style={styles.p} selectable>{b.text}</ThemedText>
          ),
        )}

        {article.tags?.length ? (
          <View style={styles.tags}>
            {article.tags.map((t) => (
              <View key={t} style={[styles.tag, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <ThemedText variant="caption" color="textSecondary">#{t}</ThemedText>
              </View>
            ))}
          </View>
        ) : null}

        {article.related?.length ? (
          <View style={{ marginTop: spacing.xl }}>
            <ThemedText variant="title" weight="bold" style={{ marginBottom: spacing.sm }}>Related</ThemedText>
            {article.related.map((r) => (
              <TouchableOpacity key={r._id} onPress={() => navigation.push('NewsDetail', { newsId: r._id })}>
                <Card style={{ marginBottom: spacing.sm }}>
                  <ThemedText weight="semibold">{r.title}</ThemedText>
                  <ThemedText variant="caption" color="textLight" style={{ marginTop: 2 }}>{timeAgo(r.publishedAt)}</ThemedText>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.sm, paddingVertical: spacing.sm, borderBottomWidth: 1 },
  iconBtn: { padding: spacing.sm },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  cover: { width: '100%', height: 200, borderRadius: borderRadius.lg, marginBottom: spacing.md },
  badge: { alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.sm },
  title: { marginTop: spacing.sm, marginBottom: spacing.xs },
  summary: { marginTop: spacing.md },
  h: { marginTop: spacing.lg, marginBottom: spacing.xs },
  p: { marginTop: spacing.md, lineHeight: 24 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg },
  tag: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.full, borderWidth: 1 },
});
