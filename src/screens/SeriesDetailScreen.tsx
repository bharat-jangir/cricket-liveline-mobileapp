import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { spacing } from '../theme';
import { Text as ThemedText } from '../components/ui/Text';
import { useRoute, useNavigation } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';

type TabType = 'overview' | 'fixtures' | 'teams' | 'squads' | 'stats' | 'venues' | 'news' | 'videos';

const { width } = Dimensions.get('window');

export const SeriesDetailScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'SeriesDetail'>>();
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ThemedText variant="title" color="white">←</ThemedText>
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <View style={styles.imageContainer}>
            <ThemedText style={styles.emoji}>🏆</ThemedText>
          </View>
          <View style={styles.headerInfo}>
            <ThemedText variant="subtitle" color="white" weight="bold">ICC World Cup 2024</ThemedText>
            <ThemedText variant="caption" color="white">Oct 5 - Nov 19 • 48 Matches</ThemedText>
          </View>
        </View>
      </View>

      <View style={[styles.tabWrapper, { backgroundColor: theme.surface }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabContainer}>
          {(['overview', 'fixtures', 'teams', 'squads', 'stats', 'venues', 'news', 'videos'] as TabType[]).map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && { borderBottomColor: theme.primary, borderBottomWidth: 3 }]}
              onPress={() => setActiveTab(tab)}
            >
              <ThemedText
                variant="body"
                weight={activeTab === tab ? 'bold' : undefined}
                color={activeTab === tab ? 'primary' : 'textSecondary'}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <ThemedText variant="subtitle" weight="bold">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</ThemedText>
        <ThemedText variant="body" color="textSecondary" style={styles.placeholder}>
          {activeTab} content coming soon...
        </ThemedText>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: spacing.md },
  backButton: { marginBottom: spacing.xs },
  headerContent: { flexDirection: 'row', alignItems: 'center' },
  imageContainer: { width: 60, height: 60, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: spacing.sm },
  emoji: { fontSize: 32 },
  headerInfo: { flex: 1, gap: 4 },
  tabWrapper: { borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  tabContainer: { paddingHorizontal: spacing.xs },
  tab: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderBottomWidth: 3, borderBottomColor: 'transparent' },
  content: { flex: 1 },
  contentContainer: { padding: spacing.lg },
  placeholder: { marginTop: spacing.md },
});
