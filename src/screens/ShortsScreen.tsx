import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, FlatList, Dimensions, TouchableOpacity, Animated, Image, ActivityIndicator, ViewToken } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useIsFocused } from '@react-navigation/native';
import { Text as ThemedText } from '../components/ui/Text';
import { spacing } from '../theme';
import { ContentService, Short } from '../services/content.service';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const LIKED_KEY = 'likedShorts';

const formatCount = (n: number) => (n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n));

interface ItemProps {
  item: Short;
  height: number;
  active: boolean;
  muted: boolean;
  liked: boolean;
  likes: number;
  onToggleMute: () => void;
  onLike: () => void;
}

const ShortItem = React.memo(function ShortItem({ item, height, active, muted, liked, likes, onToggleMute, onLike }: ItemProps) {
  const [paused, setPaused] = useState(false);
  const [buffering, setBuffering] = useState(true);
  const [failed, setFailed] = useState(false);
  const heart = useRef(new Animated.Value(1)).current;
  const lastTap = useRef(0);

  // Restart from the top whenever the clip becomes active again
  const videoRef = useRef<Video>(null);
  useEffect(() => {
    if (!active) { setPaused(false); videoRef.current?.setPositionAsync(0).catch(() => undefined); }
  }, [active]);

  const pop = () => Animated.sequence([
    Animated.timing(heart, { toValue: 1.35, duration: 100, useNativeDriver: true }),
    Animated.timing(heart, { toValue: 1, duration: 100, useNativeDriver: true }),
  ]).start();

  const onTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) { if (!liked) onLike(); pop(); lastTap.current = 0; return; }
    lastTap.current = now;
    setTimeout(() => { if (lastTap.current === now) setPaused((p) => !p); }, 310); // single tap = play/pause
  };

  const onStatus = (s: AVPlaybackStatus) => {
    if (!s.isLoaded) { if ((s as any).error) setFailed(true); return; }
    setBuffering(s.isBuffering);
  };

  return (
    <View style={[styles.item, { height }]}>
      <TouchableOpacity activeOpacity={1} onPress={onTap} style={StyleSheet.absoluteFill} accessibilityLabel={`${item.title}. Tap to ${paused ? 'play' : 'pause'}, double tap to like`}>
        {failed ? (
          <View style={styles.fallback}>
            {item.thumbnail ? <Image source={{ uri: item.thumbnail }} style={StyleSheet.absoluteFill} resizeMode="cover" blurRadius={8} /> : null}
            <Ionicons name="alert-circle-outline" size={44} color="white" />
            <ThemedText color="white" style={{ marginTop: spacing.sm }}>Video unavailable</ThemedText>
          </View>
        ) : (
          <Video
            ref={videoRef}
            source={{ uri: item.videoUrl }}
            posterSource={item.thumbnail ? { uri: item.thumbnail } : undefined}
            usePoster={!!item.thumbnail}
            style={StyleSheet.absoluteFill}
            resizeMode={ResizeMode.COVER}
            shouldPlay={active && !paused}
            isLooping
            isMuted={muted}
            onPlaybackStatusUpdate={onStatus}
            onError={() => setFailed(true)}
          />
        )}
        {active && buffering && !failed && <ActivityIndicator style={styles.spinner} color="white" size="large" />}
        {paused && !failed && <Ionicons name="play" size={64} color="rgba(255,255,255,0.85)" style={styles.pauseIcon} />}
      </TouchableOpacity>

      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.bottomGradient} pointerEvents="none">
        <View style={styles.bottomInfo}>
          <ThemedText variant="body" color="white" weight="bold" style={styles.title}>{item.title}</ThemedText>
          {item.description ? <ThemedText variant="small" color="white" numberOfLines={3} style={{ marginTop: spacing.xs, opacity: 0.9 }}>{item.description}</ThemedText> : null}
          <View style={styles.views}>
            <Ionicons name="eye-outline" size={14} color="white" />
            <ThemedText variant="small" color="white" style={{ marginLeft: spacing.xs, opacity: 0.8 }}>{formatCount(item.views)} views</ThemedText>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.action} onPress={() => { onLike(); pop(); }} accessibilityLabel={liked ? 'Unlike' : 'Like'} accessibilityState={{ selected: liked }}>
          <Animated.View style={{ transform: [{ scale: liked ? heart : 1 }] }}>
            <Ionicons name={liked ? 'heart' : 'heart-outline'} size={32} color={liked ? '#ff0050' : 'white'} />
          </Animated.View>
          <ThemedText variant="small" color="white" weight="semibold">{formatCount(likes)}</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.action} onPress={onToggleMute} accessibilityLabel={muted ? 'Unmute' : 'Mute'}>
          <Ionicons name={muted ? 'volume-mute' : 'volume-high'} size={28} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
});

export const ShortsScreen: React.FC = () => {
  const tabBarHeight = useBottomTabBarHeight();
  const focused = useIsFocused();
  const itemHeight = SCREEN_HEIGHT - tabBarHeight;

  const [shorts, setShorts] = useState<Short[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const loadingMore = useRef(false);
  const viewed = useRef(new Set<string>());

  useEffect(() => {
    AsyncStorage.getItem(LIKED_KEY).then((v) => v && setLiked(new Set(JSON.parse(v)))).catch(() => undefined);
  }, []);

  const load = useCallback(async (p: number) => {
    try {
      const res = await ContentService.getShorts(p, 8);
      setShorts((prev) => (p === 1 ? res.result : [...prev, ...res.result.filter((r) => !prev.some((x) => x._id === r._id))]));
      setLikeCounts((prev) => ({ ...prev, ...Object.fromEntries(res.result.map((s) => [s._id, prev[s._id] ?? s.likes])) }));
      setPage(p);
      setHasMore(!!res.pagination && res.pagination.page < res.pagination.totalPages);
      setError(false);
      if (p === 1 && res.result[0]) setActiveId((cur) => cur ?? res.result[0]._id);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      loadingMore.current = false;
    }
  }, []);
  useEffect(() => { load(1); }, [load]);

  // Count one view per clip per session when it becomes active
  useEffect(() => {
    if (activeId && focused && !viewed.current.has(activeId)) { viewed.current.add(activeId); ContentService.viewShort(activeId); }
  }, [activeId, focused]);

  const onViewable = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const first = viewableItems.find((v) => v.isViewable);
    if (first?.item) setActiveId((first.item as Short)._id);
  }).current;

  const toggleLike = useCallback(async (id: string) => {
    const wasLiked = liked.has(id);
    const next = new Set(liked);
    wasLiked ? next.delete(id) : next.add(id);
    setLiked(next);
    setLikeCounts((c) => ({ ...c, [id]: Math.max(0, (c[id] ?? 0) + (wasLiked ? -1 : 1)) }));
    AsyncStorage.setItem(LIKED_KEY, JSON.stringify([...next])).catch(() => undefined);
    try {
      const real = await ContentService.likeShort(id, !wasLiked);
      setLikeCounts((c) => ({ ...c, [id]: real }));
    } catch {
      // revert optimistic change
      const back = new Set(next);
      wasLiked ? back.add(id) : back.delete(id);
      setLiked(back);
      setLikeCounts((c) => ({ ...c, [id]: Math.max(0, (c[id] ?? 0) + (wasLiked ? 1 : -1)) }));
      AsyncStorage.setItem(LIKED_KEY, JSON.stringify([...back])).catch(() => undefined);
    }
  }, [liked]);

  if (loading) return <View style={styles.center}><ActivityIndicator color="white" size="large" /></View>;

  if (shorts.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name={error ? 'cloud-offline-outline' : 'play-circle-outline'} size={56} color="rgba(255,255,255,0.6)" />
        <ThemedText color="white" style={{ marginTop: spacing.md, textAlign: 'center', paddingHorizontal: spacing.lg }}>
          {error ? 'Could not load shorts. Check your connection.' : 'No shorts yet. New highlights will show up here.'}
        </ThemedText>
        <TouchableOpacity onPress={() => { setLoading(true); load(1); }} style={{ marginTop: spacing.md }}>
          <ThemedText color="white" weight="bold">Refresh</ThemedText>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={shorts}
        keyExtractor={(i) => i._id}
        renderItem={({ item }) => (
          <ShortItem
            item={item}
            height={itemHeight}
            active={focused && item._id === activeId}
            muted={muted}
            liked={liked.has(item._id)}
            likes={likeCounts[item._id] ?? item.likes}
            onToggleMute={() => setMuted((m) => !m)}
            onLike={() => toggleLike(item._id)}
          />
        )}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={itemHeight}
        snapToAlignment="start"
        decelerationRate="fast"
        getItemLayout={(_, index) => ({ length: itemHeight, offset: itemHeight * index, index })}
        onViewableItemsChanged={onViewable}
        viewabilityConfig={{ itemVisiblePercentThreshold: 70 }}
        windowSize={3}
        maxToRenderPerBatch={2}
        removeClippedSubviews
        onEndReached={() => { if (hasMore && !loadingMore.current) { loadingMore.current = true; load(page + 1); } }}
        onEndReachedThreshold={1}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  item: { width: SCREEN_WIDTH, backgroundColor: '#000' },
  fallback: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111' },
  spinner: { position: 'absolute', alignSelf: 'center', top: '48%' },
  pauseIcon: { position: 'absolute', alignSelf: 'center', top: '44%' },
  bottomGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 220, justifyContent: 'flex-end' },
  bottomInfo: { padding: spacing.lg, paddingBottom: spacing.xl, paddingRight: 80 },
  title: { fontSize: 16, textShadowColor: 'rgba(0,0,0,0.75)', textShadowOffset: { width: -1, height: 1 }, textShadowRadius: 10 },
  views: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  actions: { position: 'absolute', right: spacing.md, bottom: 100, gap: spacing.lg },
  action: { alignItems: 'center', gap: spacing.xs },
});
