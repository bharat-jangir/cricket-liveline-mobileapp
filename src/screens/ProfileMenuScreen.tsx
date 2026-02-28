import React, { useState } from 'react';
import {
    View,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Image,
    Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useTheme } from '../theme/ThemeContext';
import { spacing } from '../theme';
import { Card } from '../components/ui/Card';
import { Text as ThemedText } from '../components/ui/Text';

export const ProfileMenuScreen: React.FC = () => {
    const { theme, toggleTheme, isDark } = useTheme();
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const isLoggedIn = false;
    const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
    const [selectedSetting, setSelectedSetting] = useState<string>(''); // This would come from your auth state

    const menuItems = [
        { id: 'rankings', title: 'Rankings', icon: 'podium', screen: 'Rankings' },
        { id: 'series', title: 'All Series', icon: 'trophy', screen: 'Series' },
        { id: 'venues', title: 'All Venues', icon: 'location', screen: 'AllVenues' },
        { id: 'players', title: 'Players', icon: 'people', screen: 'Players' },
    ];

    const settingsItems = [
        { id: 'notifications', title: 'Notifications', icon: 'notifications-outline' },
        { id: 'theme', title: 'Theme Settings', icon: 'color-palette-outline' },
        { id: 'language', title: 'Language', icon: 'language-outline' },
        { id: 'about', title: 'About', icon: 'information-circle-outline' },
    ];

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: isDark ? theme.surface : theme.primary }]}>
                <View style={styles.headerContent}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={20} color="white" />
                    </TouchableOpacity>
                    <ThemedText variant="body" color="white" weight="bold">
                        Profile & Menu
                    </ThemedText>
                </View>
            </View>

            <ScrollView style={styles.content}>

                {/* User Profile Section */}
                <Card style={[styles.profileCard, { backgroundColor: theme.surface }]}>
                    {isLoggedIn ? (
                        <View style={styles.profileContent}>
                            <View style={styles.avatarContainer}>
                                <Image
                                    source={require('../../assets/no-bg-logo.png')}
                                    style={styles.avatar}
                                    resizeMode="contain"
                                />
                            </View>
                            <View style={styles.userInfo}>
                                <ThemedText variant="title" weight="bold">John Doe</ThemedText>
                                <ThemedText color="textSecondary">Cricket Enthusiast</ThemedText>
                            </View>
                            <TouchableOpacity style={styles.editButton}>
                                <Ionicons name="pencil" size={20} color={theme.primary} />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.loginPrompt}>
                            <Ionicons name="person-circle-outline" size={60} color={theme.textLight} />
                            <ThemedText variant="body" color="textSecondary" style={styles.loginText}>
                                Sign in to access your profile and personalized features
                            </ThemedText>
                            <TouchableOpacity style={[styles.loginButton, { backgroundColor: theme.primary }]}>
                                <ThemedText color="white" weight="semibold">Login / Register</ThemedText>
                            </TouchableOpacity>
                        </View>
                    )}
                </Card>

                {/* Menu Items */}
                <View style={styles.section}>
                    <ThemedText variant="title" weight="semibold" style={styles.sectionTitle}>
                        Cricket Hub
                    </ThemedText>
                    {menuItems.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={[styles.menuItem, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}
                            onPress={() => {
                                if (item.screen === 'Series') {
                                    navigation.navigate('Main', { screen: 'Series' } as any);
                                } else if (item.screen === 'Rankings') {
                                    navigation.navigate('Rankings');
                                } else if (item.screen === 'AllVenues') {
                                    navigation.navigate('AllVenues');
                                } else if (item.screen === 'Players') {
                                    navigation.navigate('AllPlayers');
                                }
                            }}
                        >
                            <View style={styles.menuItemContent}>
                                <Ionicons name={item.icon as any} size={24} color={theme.primary} />
                                <ThemedText variant="body" style={styles.menuItemText}>
                                    {item.title}
                                </ThemedText>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={theme.textLight} />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Settings */}
                <View style={styles.section}>
                    <ThemedText variant="title" weight="semibold" style={styles.sectionTitle}>
                        Settings
                    </ThemedText>
                    {settingsItems.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={[styles.menuItem, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}
                            onPress={() => {
                                setSelectedSetting(item.title);
                                setBottomSheetVisible(true);
                            }}
                        >
                            <View style={styles.menuItemContent}>
                                <Ionicons name={item.icon as any} size={24} color={theme.textSecondary} />
                                <ThemedText variant="body" style={styles.menuItemText}>
                                    {item.title}
                                </ThemedText>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={theme.textLight} />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* App Info */}
                <View style={[styles.appInfo, { borderTopColor: theme.border }]}>
                    <ThemedText color="textLight" variant="small" align="center">
                        Cricket Pulse v1.0.0
                    </ThemedText>
                    <ThemedText color="textLight" variant="small" align="center">
                        Your ultimate cricket companion
                    </ThemedText>
                </View>
                {/* Bottom Sheet Modal */}
                <Modal
                    visible={bottomSheetVisible}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setBottomSheetVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <TouchableOpacity
                            style={[styles.modalBackground, { backgroundColor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.5)' }]}
                            onPress={() => setBottomSheetVisible(false)}
                        />
                        <View style={[styles.bottomSheet, { backgroundColor: theme.surface }]}>
                            <View style={styles.bottomSheetHeader}>
                                <View style={[styles.bottomSheetHandle, { backgroundColor: theme.border }]} />
                                <TouchableOpacity
                                    style={styles.closeButton}
                                    onPress={() => setBottomSheetVisible(false)}
                                >
                                    <Ionicons name="close" size={24} color={theme.text} />
                                </TouchableOpacity>
                            </View>
                            <ScrollView style={styles.bottomSheetContent}>
                                {selectedSetting === 'Theme Settings' ? (
                                    <View style={styles.themeContent}>
                                        <ThemedText variant="title" weight="bold" style={styles.settingTitle}>
                                            Choose Theme
                                        </ThemedText>

                                        <View style={styles.themeOptions}>
                                            <TouchableOpacity
                                                style={[styles.themeOption, { borderColor: !isDark ? theme.primary : theme.border }]}
                                                onPress={() => {
                                                    if (isDark) {
                                                        toggleTheme();
                                                    }
                                                }}
                                            >
                                                <View style={[styles.themePreview, { backgroundColor: '#f8fafc' }]}>
                                                    <View style={[styles.previewHeader, { backgroundColor: '#0284c7' }]} />
                                                    <View style={styles.previewContent}>
                                                        <View style={[styles.previewCard, { backgroundColor: '#ffffff' }]} />
                                                        <View style={[styles.previewCard, { backgroundColor: '#ffffff' }]} />
                                                    </View>
                                                </View>
                                                <View style={styles.themeInfo}>
                                                    <ThemedText weight="semibold">Light Theme</ThemedText>
                                                    <View style={styles.radioButton}>
                                                        <View style={[styles.radioOuter, { borderColor: theme.primary }]}>
                                                            {!isDark && <View style={[styles.radioInner, { backgroundColor: theme.primary }]} />}
                                                        </View>
                                                    </View>
                                                </View>
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                style={[styles.themeOption, { borderColor: isDark ? theme.primary : theme.border }]}
                                                onPress={() => {
                                                    if (!isDark) {
                                                        toggleTheme();
                                                    }
                                                }}
                                            >
                                                <View style={[styles.themePreview, { backgroundColor: '#020617' }]}>
                                                    <View style={[styles.previewHeader, { backgroundColor: '#0f172a' }]} />
                                                    <View style={styles.previewContent}>
                                                        <View style={[styles.previewCard, { backgroundColor: '#1e293b' }]} />
                                                        <View style={[styles.previewCard, { backgroundColor: '#1e293b' }]} />
                                                    </View>
                                                </View>
                                                <View style={styles.themeInfo}>
                                                    <ThemedText weight="semibold">Dark Theme</ThemedText>
                                                    <View style={styles.radioButton}>
                                                        <View style={[styles.radioOuter, { borderColor: theme.primary }]}>
                                                            {isDark && <View style={[styles.radioInner, { backgroundColor: theme.primary }]} />}
                                                        </View>
                                                    </View>
                                                </View>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ) : (
                                    <View style={styles.settingContent}>
                                        <ThemedText variant="title" weight="bold" style={styles.settingTitle}>
                                            {selectedSetting}
                                        </ThemedText>
                                        <ThemedText color="textSecondary">Settings for {selectedSetting} will be available soon.</ThemedText>
                                    </View>
                                )}
                            </ScrollView>
                        </View>
                    </View>
                </Modal>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingTop: spacing.md,
        paddingBottom: spacing.md,
        paddingHorizontal: spacing.lg,
    },
    content: {
        flex: 1,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    backButton: {
        padding: spacing.xs,
    },
    profileCard: {
        margin: spacing.lg,
        padding: spacing.lg,
    },
    profileContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    avatarContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(2, 132, 199, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatar: {
        width: 40,
        height: 40,
    },
    userInfo: {
        flex: 1,
    },
    editButton: {
        padding: spacing.sm,
    },
    loginPrompt: {
        alignItems: 'center',
        paddingVertical: spacing.lg,
    },
    loginText: {
        textAlign: 'center',
        marginVertical: spacing.md,
        lineHeight: 20,
    },
    loginButton: {
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        borderRadius: 25,
        marginTop: spacing.sm,
    },
    section: {
        marginHorizontal: spacing.lg,
        marginBottom: spacing.lg,
    },
    sectionTitle: {
        marginBottom: spacing.md,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderBottomWidth: 1,
        marginBottom: spacing.xs,
        borderRadius: 8,
    },
    menuItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    menuItemText: {
        flex: 1,
    },
    appInfo: {
        borderTopWidth: 1,
        paddingTop: spacing.lg,
        paddingBottom: spacing.xl,
        marginTop: spacing.lg,
        gap: spacing.xs,
    },
    // Bottom Sheet Styles
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalBackground: {
        flex: 1,
    },
    bottomSheet: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '70%',
    },
    bottomSheetHeader: {
        alignItems: 'center',
        paddingTop: spacing.md,
        paddingHorizontal: spacing.lg,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    bottomSheetHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        position: 'absolute',
        left: '50%',
        marginLeft: -20,
    },
    closeButton: {
        padding: spacing.xs,
        marginLeft: 'auto',
    },
    bottomSheetContent: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xl,
    },
    settingContent: {
        paddingTop: spacing.md,
    },
    settingTitle: {
        marginBottom: spacing.lg,
    },
    themeContent: {
        padding: spacing.lg,
    },
    themeOptions: {
        gap: spacing.lg,
    },
    themeOption: {
        borderWidth: 2,
        borderRadius: 12,
        padding: spacing.md,
    },
    themePreview: {
        height: 120,
        borderRadius: 8,
        marginBottom: spacing.md,
        overflow: 'hidden',
    },
    previewHeader: {
        height: 30,
        width: '100%',
    },
    previewContent: {
        flex: 1,
        padding: spacing.sm,
        gap: spacing.xs,
    },
    previewCard: {
        height: 20,
        borderRadius: 4,
    },
    themeInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    radioButton: {
        padding: spacing.xs,
    },
    radioOuter: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
});
