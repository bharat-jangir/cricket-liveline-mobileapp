import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { spacing, fontSize } from '../theme';
import { Card } from '../components/ui/Card';
import { Text as ThemedText } from '../components/ui/Text';

const searchSuggestions = [
  'India vs Australia',
  'Virat Kohli',
  'IPL 2024',
  'World Cup',
  'Live Scores',
  'Cricket News',
];

const recentSearches = [
  'MS Dhoni',
  'England vs Pakistan',
  'T20 World Cup',
];

export const GlobalSearchScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.primary }]}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          
          <View style={[styles.searchContainer, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <Ionicons name="search" size={20} color="white" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search teams, players, matches..."
              placeholderTextColor="rgba(255,255,255,0.7)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close" size={20} color="white" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView style={styles.content}>
          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <View style={styles.section}>
              <ThemedText variant="title" weight="semibold" style={styles.sectionTitle}>
                Recent Searches
              </ThemedText>
              {recentSearches.map((item, index) => (
                <TouchableOpacity 
                  key={index}
                  style={[styles.searchItem, { borderBottomColor: theme.border }]}
                  onPress={() => setSearchQuery(item)}
                >
                  <Ionicons name="time-outline" size={20} color={theme.textSecondary} />
                  <ThemedText style={styles.searchItemText}>{item}</ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Search Suggestions */}
          <View style={styles.section}>
            <ThemedText variant="title" weight="semibold" style={styles.sectionTitle}>
              Popular Searches
            </ThemedText>
            {searchSuggestions.map((item, index) => (
              <TouchableOpacity 
                key={index}
                style={[styles.searchItem, { borderBottomColor: theme.border }]}
                onPress={() => setSearchQuery(item)}
              >
                <Ionicons name="trending-up" size={20} color={theme.primary} />
                <ThemedText style={styles.searchItemText}>{item}</ThemedText>
              </TouchableOpacity>
            ))}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  backButton: {
    padding: spacing.xs,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 25,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: 'white',
    fontSize: fontSize.md,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  section: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    marginBottom: spacing.md,
  },
  searchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    gap: spacing.md,
  },
  searchItemText: {
    flex: 1,
  },
});