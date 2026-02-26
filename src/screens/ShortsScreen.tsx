import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  Animated,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useTheme } from '../theme/ThemeContext';
import { Text as ThemedText } from '../components/ui/Text';
import { spacing } from '../theme';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

interface Short {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  likes: number;
  comments: number;
  shares: number;
  views: string;
}

const MOCK_SHORTS: Short[] = [
  {
    id: '1',
    title: 'Virat Kohli Century',
    description: 'Amazing century by Virat Kohli against Australia! 🏏🔥',
    thumbnail: 'https://via.placeholder.com/400x700/1877f2/ffffff?text=Short+1',
    likes: 12500,
    comments: 340,
    shares: 89,
    views: '1.2M',
  },
  {
    id: '2',
    title: 'Best Catches 2024',
    description: 'Top 10 catches of the year! Unbelievable moments 🤯',
    thumbnail: 'https://via.placeholder.com/400x700/42a5f5/ffffff?text=Short+2',
    likes: 8900,
    comments: 210,
    shares: 45,
    views: '890K',
  },
  {
    id: '3',
    title: 'Bumrah Bowling',
    description: 'Jasprit Bumrah destroying the batting lineup 💪',
    thumbnail: 'https://via.placeholder.com/400x700/1877f2/ffffff?text=Short+3',
    likes: 15200,
    comments: 450,
    shares: 120,
    views: '1.5M',
  },
  {
    id: '4',
    title: 'IPL Highlights',
    description: 'Best moments from IPL 2024 final match! 🏆',
    thumbnail: 'https://via.placeholder.com/400x700/42a5f5/ffffff?text=Short+4',
    likes: 20100,
    comments: 680,
    shares: 200,
    views: '2.1M',
  },
];

export const ShortsScreen: React.FC = () => {
  const { theme } = useTheme();
  const tabBarHeight = useBottomTabBarHeight();
  const shortHeight = SCREEN_HEIGHT - tabBarHeight;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedShorts, setLikedShorts] = useState<Set<string>>(new Set());
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>(
    MOCK_SHORTS.reduce((acc, short) => ({ ...acc, [short.id]: short.likes }), {})
  );
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const lastTap = useRef<number>(0);

  const formatCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const handleDoubleTap = (shortId: string) => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      handleLike(shortId);
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.3, duration: 100, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
      ]).start();
    }
    lastTap.current = now;
  };

  const handleLike = (shortId: string) => {
    const isLiked = likedShorts.has(shortId);
    const newLikedShorts = new Set(likedShorts);

    if (isLiked) {
      newLikedShorts.delete(shortId);
      setLikeCounts(prev => ({ ...prev, [shortId]: prev[shortId] - 1 }));
    } else {
      newLikedShorts.add(shortId);
      setLikeCounts(prev => ({ ...prev, [shortId]: prev[shortId] + 1 }));
    }
    setLikedShorts(newLikedShorts);
  };

  const renderShort = ({ item }: { item: Short }) => {
    const isLiked = likedShorts.has(item.id);

    return (
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => handleDoubleTap(item.id)}
        style={[styles.shortContainer, { height: shortHeight }]}
      >
        <View style={styles.videoPlaceholder}>
          <ThemedText variant="title" color="white" weight="bold">
            {item.title}
          </ThemedText>
        </View>

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.bottomGradient}
        >
          <View style={styles.bottomInfo}>
            <ThemedText variant="body" color="white" weight="semibold">
              {item.title}
            </ThemedText>
            <ThemedText variant="small" color="white" style={styles.description}>
              {item.description}
            </ThemedText>
            <View style={styles.viewsContainer}>
              <Ionicons name="eye-outline" size={14} color="white" />
              <ThemedText variant="small" color="white" style={styles.views}>
                {item.views} views
              </ThemedText>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.rightActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleLike(item.id)}
          >
            <Animated.View style={{ transform: [{ scale: isLiked ? scaleAnim : 1 }] }}>
              <Ionicons
                name={isLiked ? 'heart' : 'heart-outline'}
                size={32}
                color={isLiked ? '#ff0050' : 'white'}
              />
            </Animated.View>
            <ThemedText variant="small" color="white" weight="semibold">
              {formatCount(likeCounts[item.id])}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="chatbubble-outline" size={28} color="white" />
            <ThemedText variant="small" color="white" weight="semibold">
              {formatCount(item.comments)}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="arrow-redo-outline" size={28} color="white" />
            <ThemedText variant="small" color="white" weight="semibold">
              {formatCount(item.shares)}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="ellipsis-vertical" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={MOCK_SHORTS}
        renderItem={renderShort}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={shortHeight}
        snapToAlignment="start"
        decelerationRate="fast"
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.y / shortHeight);
          setCurrentIndex(index);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  shortContainer: {
    width: SCREEN_WIDTH,
    backgroundColor: '#000',
  },
  videoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
    justifyContent: 'flex-end',
  },
  bottomInfo: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  description: {
    marginTop: spacing.xs,
    opacity: 0.9,
  },
  viewsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  views: {
    marginLeft: spacing.xs,
    opacity: 0.8,
  },
  rightActions: {
    position: 'absolute',
    right: spacing.md,
    bottom: 100,
    gap: spacing.lg,
  },
  actionButton: {
    alignItems: 'center',
    gap: spacing.xs,
  },
});
