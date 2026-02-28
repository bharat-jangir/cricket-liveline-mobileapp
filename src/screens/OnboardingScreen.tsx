import React from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { useTheme } from "../theme/ThemeContext";
import { Card } from "../components/ui/Card";
import { Text as ThemedText } from "../components/ui/Text";
import { Button } from "../components/ui/Button";
import { spacing, fontSize, borderRadius } from "../theme";

type OnboardingScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Onboarding"
>;

const languages = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "hi", name: "हिंदी", flag: "🇮🇳" },
  { code: "bn", name: "বাংলা", flag: "🇧🇩" },
];

export const OnboardingScreen: React.FC = () => {
  const navigation = useNavigation<OnboardingScreenNavigationProp>();
  const {
    theme,
    isDark,
    toggleTheme,
    language,
    setLanguage,
    completeOnboarding,
  } = useTheme();

  const handleLanguageSelect = (selectedLanguage: string) => {
    setLanguage(selectedLanguage);
  };

  const handleContinue = async () => {
    await completeOnboarding();
    navigation.replace("Login");
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* ⭐ PREMIUM HEADER ⭐ */}
      <LinearGradient
        colors={isDark ? [theme.surface, theme.background] : [theme.primary, theme.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerInner}>
          <View style={styles.logoWrapper}>
            <Image
              source={require("../../assets/no-bg-logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <View style={styles.textWrapper}>
            <ThemedText style={styles.appTitle}>C</ThemedText>
            <ThemedText style={styles.subTitle}>
              Stay ahead with real-time match insights ⚡
            </ThemedText>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* LANGUAGE CARD */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: theme.primary + "20" },
              ]}
            >
              <Ionicons name="language" size={24} color={theme.primary} />
            </View>

            <View style={styles.sectionInfo}>
              <ThemedText variant="title" weight="semibold">
                Select Language
              </ThemedText>
              <ThemedText color="textSecondary" variant="small">
                Choose your preferred language
              </ThemedText>
            </View>
          </View>

          <View style={styles.languageGrid}>
            {languages.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                onPress={() => handleLanguageSelect(lang.name)}
                style={[
                  styles.languageButton,
                  {
                    backgroundColor:
                      language === lang.name
                        ? theme.primary + "20"
                        : theme.surface,
                    borderColor:
                      language === lang.name ? theme.primary : theme.border,
                  },
                ]}
              >
                <ThemedText style={styles.languageFlag}>{lang.flag}</ThemedText>

                <ThemedText
                  variant="small"
                  weight="medium"
                  color={language === lang.name ? "primary" : "text"}
                >
                  {lang.name}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* THEME CARD */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: theme.primary + "20" },
              ]}
            >
              <Ionicons
                name={isDark ? "moon" : "sunny"}
                size={24}
                color={theme.primary}
              />
            </View>

            <View style={styles.sectionInfo}>
              <ThemedText variant="title" weight="semibold">
                Theme Preference
              </ThemedText>
              <ThemedText color="textSecondary" variant="small">
                {isDark ? "Dark" : "Light"} mode selected
              </ThemedText>
            </View>

            <TouchableOpacity
              onPress={toggleTheme}
              style={[
                styles.themeToggle,
                { backgroundColor: isDark ? theme.primary : theme.border },
              ]}
            >
              <View
                style={[
                  styles.themeToggleThumb,
                  {
                    backgroundColor: theme.surface,
                    transform: [{ translateX: isDark ? 20 : 2 }],
                  },
                ]}
              />
            </TouchableOpacity>
          </View>
        </Card>
      </ScrollView>

      {/* CONTINUE BUTTON */}
      <View
        style={[
          styles.footer,
          { backgroundColor: theme.surface, borderTopColor: theme.border },
        ]}
      >
        <Button
          title="Continue"
          onPress={handleContinue}
          size="large"
          style={styles.continueButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },

  /* ⭐ ULTRA PREMIUM HEADER */
  header: {
    paddingTop: spacing.xl + 25,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },

  headerInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },

  logoWrapper: {
    width: 68,
    height: 68,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },

  logo: {
    width: 56,
    height: 56,
  },

  textWrapper: { flex: 1 },

  appTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "white",
    letterSpacing: 0.3,
  },

  subTitle: {
    marginTop: 4,
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
  },

  /* CONTENT */
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },

  sectionCard: {
    marginBottom: spacing.lg,
    padding: spacing.lg,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
  },

  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },

  sectionInfo: { flex: 1 },

  languageGrid: {
    flexDirection: "row",
    gap: spacing.sm,
  },

  languageButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
  },

  languageFlag: { fontSize: 24, marginBottom: spacing.xs },

  themeToggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    position: "relative",
  },

  themeToggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    position: "absolute",
  },

  footer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
  },

  continueButton: { width: "100%" },
});
