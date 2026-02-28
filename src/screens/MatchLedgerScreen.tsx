import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, FlatList, Modal, TextInput, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme/ThemeContext';
import { Text as ThemedText } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { spacing, borderRadius, elevation } from '@/theme';

// --- Mock Data ---

type LedgerEntry = {
    id: string;
    clientName: string;
    amount: number;
    type: 'plus' | 'minus' | 'pending';
    category: string;
    rate?: string;
    sessionChoice?: 'Yes' | 'No';
};

type MatchLedger = {
    matchId: string;
    title: string;
    date: string;
    entries: LedgerEntry[];
};

const MOCK_LEDGERS: MatchLedger[] = [
    {
        matchId: 'm1',
        title: 'IND vs AUS - ODI',
        date: 'Oct 8, 2024',
        entries: [
            { id: '1', clientName: 'Rahul', amount: 5000, type: 'plus', category: 'Match Odds', rate: '1.85' },
            { id: '2', clientName: 'Amit', amount: 2000, type: 'minus', category: 'Session', sessionChoice: 'Yes', rate: '55' },
            { id: '3', clientName: 'Sanjay', amount: 15000, type: 'plus', category: 'Match Odds', rate: '1.90' },
            { id: '4', clientName: 'Karan', amount: 8000, type: 'pending', category: 'Fancy', sessionChoice: 'No', rate: '48' },
            { id: '5', clientName: 'Vikram', amount: 1200, type: 'plus', category: 'Session', sessionChoice: 'Yes', rate: '60' },
        ]
    },
    {
        matchId: 'm2',
        title: 'ENG vs NZ - T20',
        date: 'Oct 10, 2024',
        entries: [
            { id: '6', clientName: 'Amit', amount: 4500, type: 'plus', category: 'Match Odds', rate: '2.10' },
            { id: '7', clientName: 'Rahul', amount: 10000, type: 'pending', category: 'Tied Match', rate: '15.0' },
        ]
    }
];

const BET_CATEGORIES = ['Match Odds', 'Session', 'Fancy', 'Tied Match', 'Custom'];

export const MatchLedgerScreen: React.FC = () => {
    const { theme, isDark } = useTheme();
    const navigation = useNavigation();
    const route = useRoute<RouteProp<RootStackParamList, 'MatchLedger'>>();

    const { matchId: preSelectedMatchId, autoOpenAddEntry } = route.params || {};

    const initialMatch = MOCK_LEDGERS.find(m => m.matchId === preSelectedMatchId) || MOCK_LEDGERS[0];
    const [selectedMatch, setSelectedMatch] = useState<MatchLedger>(initialMatch);
    const [isMatchSelectorVisible, setIsMatchSelectorVisible] = useState(false);

    // Add Entry State
    const [isAddEntryVisible, setIsAddEntryVisible] = useState(!!autoOpenAddEntry);
    const [newClientName, setNewClientName] = useState('');
    const [newAmount, setNewAmount] = useState('');
    const [newRate, setNewRate] = useState('');
    const [newCategory, setNewCategory] = useState(BET_CATEGORIES[0]);
    const [newSessionChoice, setNewSessionChoice] = useState<'Yes' | 'No'>('Yes');
    const [newType, setNewType] = useState<'plus' | 'minus' | 'pending'>('pending');
    const [isCategorySelectorVisible, setIsCategorySelectorVisible] = useState(false);

    // local state for the entries of the currently selected match
    const [entries, setEntries] = useState<LedgerEntry[]>(selectedMatch.entries);

    // Sync entries when match changes
    React.useEffect(() => {
        setEntries(selectedMatch.entries);
    }, [selectedMatch]);

    // Calculations
    const totalPlus = entries.filter(e => e.type === 'plus').reduce((sum, e) => sum + e.amount, 0);
    const totalMinus = entries.filter(e => e.type === 'minus').reduce((sum, e) => sum + e.amount, 0);
    const netBalance = totalPlus - totalMinus;
    const isNetPositive = netBalance >= 0;

    const handleAddEntry = () => {
        if (!newClientName.trim() || !newAmount || isNaN(Number(newAmount))) {
            alert("Please enter a valid client name and amount.");
            return;
        }

        const newEntry: LedgerEntry = {
            id: Date.now().toString(),
            clientName: newClientName.trim(),
            amount: Math.abs(Number(newAmount)),
            type: newType,
            category: newCategory,
            rate: newRate.trim() || undefined,
            sessionChoice: (newCategory === 'Session' || newCategory === 'Fancy') ? newSessionChoice : undefined,
        };

        setEntries(prev => [newEntry, ...prev]);
        setIsAddEntryVisible(false);
        setNewClientName('');
        setNewAmount('');
        setNewRate('');
        setNewType('pending');
        setNewCategory(BET_CATEGORIES[0]);
        setNewSessionChoice('Yes');
    };

    const handleDeleteEntry = (id: string) => {
        setEntries(prev => prev.filter(e => e.id !== id));
    };

    const toggleEntryType = (id: string) => {
        setEntries(prev => prev.map(entry => {
            if (entry.id === id) {
                let nextType: 'plus' | 'minus' | 'pending' = 'pending';
                if (entry.type === 'pending') nextType = 'plus';
                else if (entry.type === 'plus') nextType = 'minus';
                else if (entry.type === 'minus') nextType = 'pending';
                return { ...entry, type: nextType };
            }
            return entry;
        }));
    };

    const formatCurrency = (amount: number) => {
        return `₹${amount.toLocaleString('en-IN')}`;
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <LinearGradient colors={isDark ? [theme.surface, theme.background] : [theme.primary, theme.primaryDark]} style={styles.header}>
                <SafeAreaView>
                    <View style={styles.headerTop}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                            <Ionicons name="arrow-back" size={24} color="white" />
                        </TouchableOpacity>
                        <ThemedText variant="title" color="white" weight="bold">Account Book</ThemedText>
                        <View style={{ width: 40 }} />
                    </View>
                </SafeAreaView>
            </LinearGradient>

            {/* Match Selector */}
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setIsMatchSelectorVisible(true)}
                style={[styles.matchSelector, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}
            >
                <View style={{ flex: 1 }}>
                    <ThemedText variant="small" color="textSecondary" weight="bold" style={{ textTransform: 'uppercase' }}>Selected Match</ThemedText>
                    <ThemedText variant="subtitle" weight="bold" style={{ marginTop: 2 }}>{selectedMatch.title}</ThemedText>
                    <ThemedText variant="caption" color="textSecondary">{selectedMatch.date}</ThemedText>
                </View>
                <Ionicons name="chevron-down-circle" size={24} color={theme.primary} />
            </TouchableOpacity>

            {/* Summary Dashboard */}
            <View style={[styles.summaryContainer, { backgroundColor: isDark ? theme.surface : theme.primaryLight + '15' }]}>
                <View style={styles.summaryRow}>
                    <View style={styles.summaryItem}>
                        <ThemedText variant="small" color="textSecondary" weight="bold">Total Plus</ThemedText>
                        <ThemedText style={{ fontSize: 20, fontWeight: 'bold', color: theme.success }}>{formatCurrency(totalPlus)}</ThemedText>
                    </View>
                    <View style={[styles.summaryDivider, { backgroundColor: theme.border }]} />
                    <View style={styles.summaryItem}>
                        <ThemedText variant="small" color="textSecondary" weight="bold">Total Minus</ThemedText>
                        <ThemedText style={{ fontSize: 20, fontWeight: 'bold', color: theme.error }}>{formatCurrency(totalMinus)}</ThemedText>
                    </View>
                </View>

                <View style={[styles.netBalanceCard, { backgroundColor: theme.surface, borderColor: isNetPositive ? theme.success : theme.error }]}>
                    <ThemedText variant="subtitle" weight="bold">Net Balance</ThemedText>
                    <ThemedText style={{ fontSize: 24, fontWeight: '800', color: isNetPositive ? theme.success : theme.error }}>
                        {isNetPositive ? '+' : '-'}{formatCurrency(Math.abs(netBalance))}
                    </ThemedText>
                </View>
            </View>

            {/* Action Bar */}
            <View style={styles.actionBar}>
                <ThemedText variant="subtitle" weight="bold">Client Ledger</ThemedText>
                <TouchableOpacity
                    style={[styles.addButton, { backgroundColor: theme.primary }]}
                    onPress={() => setIsAddEntryVisible(true)}
                >
                    <Ionicons name="add" size={20} color="white" />
                    <ThemedText variant="small" color="white" weight="bold" style={{ marginLeft: 4 }}>Add Entry</ThemedText>
                </TouchableOpacity>
            </View>

            {/* Ledger List */}
            <FlatList
                data={entries}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={{ padding: spacing.xl, alignItems: 'center' }}>
                        <Ionicons name="document-text-outline" size={48} color={theme.textLight} />
                        <ThemedText color="textSecondary" style={{ marginTop: spacing.md }}>No entries for this match yet.</ThemedText>
                    </View>
                }
                renderItem={({ item }) => (
                    <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => toggleEntryType(item.id)}
                    >
                        <Card style={[styles.ledgerRow, { borderLeftColor: item.type === 'plus' ? theme.success : (item.type === 'minus' ? theme.error : theme.textLight) }]}>
                            <View style={{ flex: 1 }}>
                                <ThemedText weight="bold" style={{ fontSize: 16 }}>{item.clientName}</ThemedText>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: spacing.xs }}>
                                    <ThemedText variant="small" color="textSecondary">{item.category}</ThemedText>
                                    {!!(item.sessionChoice || item.rate) && <View style={styles.dot} />}
                                    {!!item.sessionChoice && (
                                        <ThemedText variant="small" weight="bold" color={item.sessionChoice === 'Yes' ? 'primary' : 'error'}>
                                            {item.sessionChoice}
                                        </ThemedText>
                                    )}
                                    {!!(item.sessionChoice && item.rate) && <View style={styles.dot} />}
                                    {!!item.rate && (
                                        <ThemedText variant="small" color="textSecondary">@{item.rate}</ThemedText>
                                    )}
                                </View>
                            </View>
                            <View style={{ alignItems: 'flex-end', marginRight: spacing.md }}>
                                <ThemedText weight="bold" style={{ fontSize: 16, color: item.type === 'plus' ? theme.success : (item.type === 'minus' ? theme.error : theme.text) }}>
                                    {item.type === 'plus' ? '+' : item.type === 'minus' ? '-' : ''}{formatCurrency(item.amount)}
                                </ThemedText>
                                <ThemedText variant="caption" color="textSecondary" style={{ textTransform: 'uppercase' }}>
                                    {item.type}
                                </ThemedText>
                            </View>
                            <TouchableOpacity onPress={() => handleDeleteEntry(item.id)} style={{ padding: spacing.xs }}>
                                <Ionicons name="trash-outline" size={20} color={theme.error} />
                            </TouchableOpacity>
                        </Card>
                    </TouchableOpacity>
                )}
            />

            {/* Select Match Modal */}
            <Modal visible={isMatchSelectorVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <TouchableOpacity style={styles.modalBg} onPress={() => setIsMatchSelectorVisible(false)} />
                    <View style={[styles.bottomSheet, { backgroundColor: theme.surface }]}>
                        <View style={[styles.sheetHeader, { borderBottomColor: theme.border }]}>
                            <ThemedText variant="title" weight="bold">Select Match</ThemedText>
                            <TouchableOpacity onPress={() => setIsMatchSelectorVisible(false)}>
                                <Ionicons name="close" size={24} color={theme.text} />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={MOCK_LEDGERS}
                            keyExtractor={item => item.matchId}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[styles.matchOption, { borderBottomColor: theme.border }]}
                                    onPress={() => {
                                        setSelectedMatch(item);
                                        setIsMatchSelectorVisible(false);
                                    }}
                                >
                                    <View style={{ flex: 1 }}>
                                        <ThemedText weight="bold">{item.title}</ThemedText>
                                        <ThemedText variant="small" color="textSecondary">{item.date}</ThemedText>
                                    </View>
                                    {selectedMatch.matchId === item.matchId && <Ionicons name="checkmark-circle" size={24} color={theme.primary} />}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>

            {/* Add Entry Modal */}
            <Modal visible={isAddEntryVisible} transparent animationType="fade">
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <TouchableOpacity style={styles.modalBg} onPress={() => setIsAddEntryVisible(false)} />
                    <View style={[styles.dialogCard, { backgroundColor: theme.surface }]}>
                        <ThemedText variant="subtitle" weight="bold" style={{ marginBottom: spacing.md }}>Add Ledger Entry</ThemedText>

                        <View style={{ marginBottom: spacing.md }}>
                            <ThemedText variant="small" color="textSecondary" style={{ marginBottom: 4 }}>Client Name</ThemedText>
                            <TextInput
                                style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                                placeholder="Enter client name"
                                placeholderTextColor={theme.textLight}
                                value={newClientName}
                                onChangeText={setNewClientName}
                            />
                        </View>

                        <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md }}>
                            <View style={{ flex: 1 }}>
                                <ThemedText variant="small" color="textSecondary" style={{ marginBottom: 4 }}>Amount (₹)</ThemedText>
                                <TextInput
                                    style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                                    placeholder="e.g. 5000"
                                    placeholderTextColor={theme.textLight}
                                    keyboardType="numeric"
                                    value={newAmount}
                                    onChangeText={setNewAmount}
                                />
                            </View>

                            <View style={{ flex: 1 }}>
                                <ThemedText variant="small" color="textSecondary" style={{ marginBottom: 4 }}>Rate / Odds</ThemedText>
                                <TextInput
                                    style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                                    placeholder="e.g. 1.85 or 55"
                                    placeholderTextColor={theme.textLight}
                                    keyboardType="numeric"
                                    value={newRate}
                                    onChangeText={setNewRate}
                                />
                            </View>
                        </View>

                        <View style={{ marginBottom: spacing.lg }}>
                            <ThemedText variant="small" color="textSecondary" style={{ marginBottom: 4 }}>Bet Category</ThemedText>
                            <TouchableOpacity
                                style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}
                                onPress={() => setIsCategorySelectorVisible(!isCategorySelectorVisible)}
                            >
                                <ThemedText>{newCategory}</ThemedText>
                                <Ionicons name={isCategorySelectorVisible ? "chevron-up" : "chevron-down"} size={20} color={theme.textLight} />
                            </TouchableOpacity>

                            {isCategorySelectorVisible && (
                                <View style={[styles.dropdownMenu, { backgroundColor: theme.background, borderColor: theme.border }]}>
                                    {BET_CATEGORIES.map((cat, index) => (
                                        <TouchableOpacity
                                            key={cat}
                                            style={[styles.dropdownItem, index < BET_CATEGORIES.length - 1 && { borderBottomColor: theme.border, borderBottomWidth: 1 }]}
                                            onPress={() => {
                                                setNewCategory(cat);
                                                setIsCategorySelectorVisible(false);
                                            }}
                                        >
                                            <ThemedText color={newCategory === cat ? 'primary' : 'text'}>{cat}</ThemedText>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>

                        {(newCategory === 'Session' || newCategory === 'Fancy') && (
                            <View style={{ marginBottom: spacing.lg }}>
                                <ThemedText variant="small" color="textSecondary" style={{ marginBottom: 8 }}>Session Choice</ThemedText>
                                <View style={{ flexDirection: 'row', gap: spacing.md }}>
                                    <TouchableOpacity
                                        style={[
                                            styles.typeButton,
                                            { backgroundColor: newSessionChoice === 'Yes' ? theme.primaryLight : theme.background, borderColor: newSessionChoice === 'Yes' ? theme.primary : theme.border }
                                        ]}
                                        onPress={() => setNewSessionChoice('Yes')}
                                    >
                                        <ThemedText variant="small" weight="bold" color={newSessionChoice === 'Yes' ? 'primary' : 'textSecondary'}>Yes (Lagai)</ThemedText>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[
                                            styles.typeButton,
                                            { backgroundColor: newSessionChoice === 'No' ? '#FF3B3015' : theme.background, borderColor: newSessionChoice === 'No' ? '#FF3B30' : theme.border }
                                        ]}
                                        onPress={() => setNewSessionChoice('No')}
                                    >
                                        <ThemedText variant="small" weight="bold" color={newSessionChoice === 'No' ? 'error' : 'textSecondary'}>No (Khai)</ThemedText>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl }}>
                            <TouchableOpacity
                                style={[
                                    styles.typeButton,
                                    { backgroundColor: newType === 'pending' ? theme.primaryLight : theme.background, borderColor: newType === 'pending' ? theme.primary : theme.border }
                                ]}
                                onPress={() => setNewType('pending')}
                            >
                                <ThemedText variant="small" weight="bold" color={newType === 'pending' ? 'primary' : 'textSecondary'}>Pending</ThemedText>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.typeButton,
                                    { backgroundColor: newType === 'plus' ? theme.success : theme.background, borderColor: newType === 'plus' ? theme.success : theme.border }
                                ]}
                                onPress={() => setNewType('plus')}
                            >
                                <ThemedText variant="small" weight="bold" color={newType === 'plus' ? 'white' : 'textSecondary'}>Plus (+)</ThemedText>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.typeButton,
                                    { backgroundColor: newType === 'minus' ? theme.error : theme.background, borderColor: newType === 'minus' ? theme.error : theme.border }
                                ]}
                                onPress={() => setNewType('minus')}
                            >
                                <ThemedText variant="small" weight="bold" color={newType === 'minus' ? 'white' : 'textSecondary'}>Minus (-)</ThemedText>
                            </TouchableOpacity>
                        </View>

                        <View style={{ flexDirection: 'row', gap: spacing.md, justifyContent: 'flex-end' }}>
                            <TouchableOpacity style={{ padding: spacing.sm }} onPress={() => setIsAddEntryVisible(false)}>
                                <ThemedText color="textSecondary" weight="bold">Cancel</ThemedText>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.saveButton, { backgroundColor: theme.primary }]} onPress={handleAddEntry}>
                                <ThemedText color="white" weight="bold">Save Entry</ThemedText>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingBottom: 20, paddingHorizontal: spacing.md, paddingTop: spacing.md },
    headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
    backBtn: { padding: spacing.xs },

    matchSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.lg,
        borderBottomWidth: 1,
    },

    summaryContainer: {
        padding: spacing.lg,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        ...elevation.sm,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.md,
    },
    summaryItem: {
        flex: 1,
        alignItems: 'center',
    },
    summaryDivider: {
        width: 1,
        height: '100%',
    },
    netBalanceCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.md,
        borderRadius: borderRadius.md,
        borderWidth: 1,
    },

    actionBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        paddingBottom: spacing.sm,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: 8,
        borderRadius: 20,
    },

    listContent: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xxl,
    },
    ledgerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        marginBottom: spacing.sm,
        borderLeftWidth: 4,
    },
    dot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#8E8E93',
    },

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalBg: {
        ...StyleSheet.absoluteFillObject,
    },
    bottomSheet: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '70%',
        paddingBottom: spacing.xxl,
    },
    sheetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.lg,
        borderBottomWidth: 1,
    },
    matchOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.lg,
        borderBottomWidth: 1,
    },

    dialogCard: {
        width: '85%',
        borderRadius: 16,
        padding: spacing.lg,
        ...elevation.lg,
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
    dropdownMenu: {
        borderWidth: 1,
        borderTopWidth: 0,
        borderBottomLeftRadius: 8,
        borderBottomRightRadius: 8,
        marginTop: -4,
        ...elevation.sm,
    },
    dropdownItem: {
        padding: 12,
    },
    typeButton: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 4,
        alignItems: 'center',
        borderRadius: 8,
        borderWidth: 1,
    },
    saveButton: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: 8,
    }
});
