import React, { useRef, useEffect, useState } from "react";
import {
  View,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  FlatList,
  Dimensions,
  Animated,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { useTheme } from "../theme/ThemeContext";
import { spacing, fontSize, borderRadius } from "../theme";
import { Card } from "../components/ui/Card";
import { Text as ThemedText } from "../components/ui/Text";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Mock data
const topNews = [
  {
    id: "1",
    title: "India wins World Cup Final",
    summary: "Historic victory at Wankhede Stadium",
    image: "🏆",
  },
  {
    id: "2",
    title: "Kohli breaks batting record",
    summary: "New milestone in international cricket",
    image: "🏏",
  },
  {
    id: "3",
    title: "IPL 2024 auction updates",
    summary: "Major signings and surprises",
    image: "💰",
  },
  {
    id: "4",
    title: "Australia tour announced",
    summary: "Five-match series scheduled",
    image: "🇦🇺",
  },
  {
    id: "5",
    title: "New cricket stadium opens",
    summary: "State-of-the-art facility unveiled",
    image: "🏟️",
  },
];

const liveMatchesData = [
  {
    id: "1",
    team1: "IND",
    team2: "AUS",
    score1: "287/4",
    score2: "180/6",
    status: "Live",
  },
  {
    id: "2",
    team1: "ENG",
    team2: "PAK",
    score1: "156/7",
    score2: "89/3",
    status: "Live",
  },
  {
    id: "3",
    team1: "SA",
    team2: "NZ",
    score1: "245/8",
    score2: "198/5",
    status: "Live",
  },
];

const newsCards = [
  {
    id: "1",
    title: "Cricket World Cup 2024 Schedule Released",
    time: "2 hours ago",
    category: "Tournament",
  },
  {
    id: "2",
    title: "Player Transfers: Major Signings This Season",
    time: "4 hours ago",
    category: "Transfers",
  },
  {
    id: "3",
    title: "New Rules Announced for T20 Format",
    time: "6 hours ago",
    category: "Rules",
  },
  {
    id: "4",
    title: "Stadium Capacity Increased for Finals",
    time: "8 hours ago",
    category: "Venues",
  },
];

export const HomeScreen: React.FC = () => {
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const newsCarouselRef = useRef<FlatList>(null);
  const [currentNewsIndex, setCurrentNewsIndex] = React.useState(0);
  const HEADER_HEIGHT = spacing.lg + spacing.sm + 40;
  const NEWS_HEIGHT = 300;
  const INITIAL_SHEET_TOP = NEWS_HEIGHT;
  const EXPANDED_SHEET_TOP = HEADER_HEIGHT + 2;
  const translateY = useRef(new Animated.Value(INITIAL_SHEET_TOP)).current;
  const [isExpanded, setIsExpanded] = useState(false);

  const onScrollEndDrag = (event: any) => {
    const { contentOffset } = event.nativeEvent;
    const scrolledDistance = contentOffset.y;
    const threshold = 10;

    if (scrolledDistance > threshold && !isExpanded) {
      Animated.timing(translateY, {
        toValue: EXPANDED_SHEET_TOP,
        duration: 300,
        useNativeDriver: true,
      }).start();
      setIsExpanded(true);
    } else if (scrolledDistance <= 10 && isExpanded) {
      Animated.timing(translateY, {
        toValue: INITIAL_SHEET_TOP,
        duration: 300,
        useNativeDriver: true,
      }).start();
      setIsExpanded(false);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentNewsIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % topNews.length;
        newsCarouselRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
        return nextIndex;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const renderNewsItem = ({ item }: { item: (typeof topNews)[0] }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => navigation.navigate('NewsDetail', { newsId: item.id })}
      style={styles.newsItem}
    >
      <LinearGradient
        colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
        style={styles.newsGradient}
      >
        <View style={styles.newsImageContainer}>
          <ThemedText style={styles.newsEmoji}>{item.image}</ThemedText>
        </View>
        <View style={styles.newsTextContainer}>
          <ThemedText style={styles.newsTitle}>{item.title}</ThemedText>
          <ThemedText style={styles.newsSummary}>{item.summary}</ThemedText>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderLiveMatch = ({ item }: { item: (typeof liveMatchesData)[0] }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => navigation.navigate('MatchDetails', { matchId: item.id })}
    >
      <Card style={styles.liveMatchCard} elevation="md">
        <View style={styles.cardHeader}>
          <ThemedText style={[styles.matchTitleText, { color: theme.textSecondary }]}>
            {item.team1} vs {item.team2}
          </ThemedText>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <ThemedText style={styles.liveText}>LIVE</ThemedText>
          </View>
        </View>
        <View style={styles.matchInfo}>
          <ThemedText style={[styles.teamScore, { color: theme.text }]}>
            {item.team1} ({item.score1})
          </ThemedText>
          <ThemedText style={[styles.teamScore, { color: theme.text }]}>
            {item.team2} ({item.score2})
          </ThemedText>
        </View>
      </Card>
    </TouchableOpacity>
  );

  const renderNewsCard = ({ item }: { item: (typeof newsCards)[0] }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => navigation.navigate('NewsDetail', { newsId: item.id })}
    >
      <Card style={styles.newsCard}>
        <View style={styles.newsCardImageContainer}>
          <View style={styles.newsCardImage}>
            <ThemedText style={styles.newsCardEmoji}>📰</ThemedText>
          </View>
        </View>
        <View style={styles.newsCardContent}>
          <View
            style={[
              styles.categoryBadge,
              { backgroundColor: theme.primary + "20" },
            ]}
          >
            <ThemedText style={[styles.categoryText, { color: theme.primary }]}>
              {item.category}
            </ThemedText>
          </View>
          <ThemedText variant="body" weight="semibold" style={styles.newsCardTitle}>
            {item.title}
          </ThemedText>
          <ThemedText color="textSecondary" variant="small">
            {item.time}
          </ThemedText>
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <LinearGradient
        colors={isExpanded ? (isDark ? [theme.surface, theme.background] : [theme.primary, theme.primaryDark]) : ["transparent", "transparent"]}
        style={[styles.header, { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20 }]}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.logoContainer}>
              <Image
                source={require("../../assets/no-bg-logo.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <View>
              <ThemedText style={styles.appTitle}>Cricket Pulse</ThemedText>
              <ThemedText style={styles.appSubtitle}>Live Cricket Scores</ThemedText>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => navigation.navigate('GlobalSearch')}
            >
              <Ionicons name="search" size={20} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => navigation.navigate('ProfileMenu')}
            >
              <Ionicons name="menu" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Top News Carousel */}
      <View style={[styles.newsCarouselContainer, { marginTop: 0 }]}>
        <FlatList
          ref={newsCarouselRef}
          data={topNews}
          renderItem={renderNewsItem}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          snapToInterval={300}
          decelerationRate="fast"
          onMomentumScrollEnd={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.y / 300);
            setCurrentNewsIndex(index);
          }}
        />
        <View style={styles.newsIndicators}>
          {topNews.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                {
                  backgroundColor:
                    index === currentNewsIndex
                      ? theme.primary
                      : isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)",
                },
              ]}
            />
          ))}
        </View>
      </View>

      {/* Bottom Sheet */}
      <Animated.View
        style={[
          styles.bottomSheet,
          {
            backgroundColor: theme.surface,
            transform: [{ translateY }],
            borderTopLeftRadius: isExpanded ? 0 : 24,
            borderTopRightRadius: isExpanded ? 0 : 24,
          },
        ]}
      >
        {/* <View
          style={[
            styles.bottomSheetHandle,
            { backgroundColor: theme.textSecondary },
          ]}
        /> */}

        {/* Navigation Breadcrumb */}
        <View style={[styles.breadcrumbNav, { backgroundColor: theme.surface }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.breadcrumbContainer}>
            <TouchableOpacity onPress={() => navigation.navigate('Main', { screen: 'Matches' })}>
              <ThemedText style={[styles.breadcrumbText, { color: theme.text, backgroundColor: isDark ? theme.border : theme.primary + '10' }]}>Matches <Ionicons name="chevron-forward" size={14} color={theme.text} /></ThemedText>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Main', { screen: 'Fixtures' })}>
              <ThemedText style={[styles.breadcrumbText, { color: theme.text, backgroundColor: isDark ? theme.border : theme.primary + '10' }]}>Fixtures <Ionicons name="chevron-forward" size={14} color={theme.text} /></ThemedText>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Rankings')}>
              <ThemedText style={[styles.breadcrumbText, { color: theme.text, backgroundColor: isDark ? theme.border : theme.primary + '10' }]}>Rankings <Ionicons name="chevron-forward" size={14} color={theme.text} /></ThemedText>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => console.log('Market Book pressed')}>
              <ThemedText style={[styles.breadcrumbText, { color: theme.text, backgroundColor: isDark ? theme.border : theme.primary + '10' }]}>Market Book <Ionicons name="chevron-forward" size={14} color={theme.text} /></ThemedText>
            </TouchableOpacity>
          </ScrollView>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          onScrollEndDrag={onScrollEndDrag}
          bounces={false}
          style={styles.scrollContent}
        >
          {/* Live Matches Section */}
          <View style={[styles.section, { paddingHorizontal: spacing.lg, paddingVertical: 5 }]}>
            <FlatList
              data={liveMatchesData}
              renderItem={renderLiveMatch}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
              nestedScrollEnabled
            />
          </View>

          {/* News Section */}
          <View style={styles.section}>
            <View style={[styles.sectionHeader, { paddingHorizontal: spacing.lg }]}>
              <ThemedText
                variant="title"
                weight="semibold"
                style={styles.sectionTitle}
              >
                News
              </ThemedText>
              <TouchableOpacity onPress={() => navigation.navigate('AllNews')}>
                <ThemedText style={[styles.viewAllText, { color: theme.primary }]}>View All <Ionicons name="chevron-forward" size={14} color={theme.primary} /></ThemedText>
              </TouchableOpacity>
            </View>
            {newsCards.map((item) => (
              <View key={item.id}>{renderNewsCard({ item })}</View>
            ))}
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg + 10,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  logo: {
    width: 32,
    height: 32,
  },
  appTitle: {
    fontSize: fontSize.xl,
    fontWeight: "bold",
    color: "white",
  },
  appSubtitle: {
    fontSize: fontSize.xs,
    color: "rgba(255, 255, 255, 0.8)",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  headerButton: {
    padding: spacing.sm,
    borderRadius: 20,
    position: "relative",
  },
  notificationDot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    backgroundColor: "#ef4444",
    borderRadius: 4,
  },
  // News Carousel
  newsCarouselContainer: {
    height: 300,
    marginTop: 0,
  },
  newsItem: {
    height: 300,
    width: SCREEN_WIDTH,
    margin: 0,
    // backgroundColor:"orange"
  },
  newsGradient: {
    flex: 1,
    // justifyContent: 'space-between',
    // padding: spacing.lg,
  },
  newsImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor:"red",
    width: SCREEN_WIDTH

  },
  newsEmoji: {
    fontSize: 60,
  },
  newsTextContainer: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  newsTitle: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: spacing.xs,
  },
  newsSummary: {
    fontSize: fontSize.sm,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  newsIndicators: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    position: 'absolute',
    top: '50%',
    right: 15,
    transform: [{ translateY: -40 }],
    opacity: 0.5
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  // Bottom Sheet
  bottomSheet: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT,
    paddingTop: spacing.sm,
    zIndex: 10,
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: spacing.lg,
  },
  // Navigation Breadcrumb
  breadcrumbNav: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
    elevation: 0.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  breadcrumbContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breadcrumbText: {
    fontSize: fontSize.md,
    fontWeight: '500',
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  breadcrumbSeparator: {
    fontSize: fontSize.md,
    fontWeight: '400',
  },
  scrollContent: {
    flex: 1,
    paddingBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    marginBottom: 0,
  },
  viewAllText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  horizontalList: {
    paddingRight: spacing.lg,
  },
  // Live Match Cards
  liveMatchCard: {
    width: 160,
    height: 80,
    marginRight: spacing.md,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 0.002,

  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  liveDot: {
    width: 4,
    height: 4,
    backgroundColor: "#ef4444",
    borderRadius: 2,
  },
  liveText: {
    fontSize: 8,
    color: "#ef4444",
    fontWeight: "600",
  },
  matchTitle: {
    alignItems: "flex-start",
    marginBottom: spacing.xs,
  },
  matchTitleText: {
    fontSize: 10,
    fontWeight: "500",
  },
  matchInfo: {
    alignItems: "flex-start",
  },
  teamScore: {
    fontSize: fontSize.xs,
    marginBottom: 2,
  },
  // News Cards
  newsCard: {
    marginBottom: spacing.md,
    padding: 0,
    overflow: 'hidden',
  },
  newsCardImageContainer: {
    height: 120,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  newsCardImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  newsCardEmoji: {
    fontSize: 40,
  },
  newsCardContent: {
    padding: spacing.lg,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  categoryText: {
    fontSize: fontSize.xs,
    fontWeight: "600",
  },
  newsCardTitle: {
    marginBottom: spacing.xs,
    lineHeight: fontSize.md * 1.4,
  },
});