import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform, StatusBar, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, space, typography } from '../theme';
import { FloatingBackButton } from '../components/FloatingBackButton';

type AnalyticsTab = 'Steps' | 'Distance' | 'Pace';

interface ActivityAnalyticsScreenProps {
    initialTab?: AnalyticsTab;
    navigation: { goBack: () => void };
}

export function ActivityAnalyticsScreen({ initialTab = 'Steps', navigation }: ActivityAnalyticsScreenProps) {
    const [activeTab, setActiveTab] = useState<AnalyticsTab>(initialTab);
    const paddingTop = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 16 : 56;

    // Mock Data Generators based on Tab
    const getHeroData = () => {
        switch (activeTab) {
            case 'Distance': return { value: '6.2', unit: 'KM', trend: '+5%', color: colors.primaryViolet };
            case 'Pace': return { value: '5\'30"', unit: 'AVG', trend: '-2%', color: colors.brandBlue };
            case 'Steps': default: return { value: '12.4k', unit: 'STEPS', trend: '~12%', color: colors.bodyOrange };
        }
    };

    const hero = getHeroData();

    const chartData = [50, 70, 40, 100, 60, 30, 45]; // M T W T F S S percentages
    const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

    return (
        <View style={styles.container}>
            <FloatingBackButton onPress={navigation.goBack} />

            <View style={[styles.header, { paddingTop }]}>
                <Text style={styles.headerTitle}>Activity Analytics</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Tab Switcher */}
                <View style={styles.tabContainer}>
                    {(['Steps', 'Distance', 'Pace'] as AnalyticsTab[]).map(tab => (
                        <Pressable
                            key={tab}
                            style={[
                                styles.tab,
                                activeTab === tab && styles.activeTab
                            ]}
                            onPress={() => setActiveTab(tab)}
                        >
                            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
                        </Pressable>
                    ))}
                </View>

                {/* Hero Section */}
                <View style={styles.heroSection}>
                    <View style={styles.heroRow}>
                        <Text style={styles.heroValue}>{hero.value}</Text>
                        <Text style={styles.heroUnit}>{hero.unit}</Text>
                    </View>
                    <Text style={[styles.trendText, { color: hero.trend.includes('+') ? colors.healthGreen : colors.bodyOrange }]}>
                        {hero.trend} <Text style={{ color: colors.textSecondary, fontWeight: '400' }}>vs last week</Text>
                    </Text>
                </View>

                {/* Chart */}
                <View style={styles.chartContainer}>
                    <View style={styles.infoTag}>
                        <Text style={styles.infoTagLabel}>THURSDAY</Text>
                        <Text style={styles.infoTagValue}>14,203 Steps</Text>
                    </View>
                    <View style={styles.chartBars}>
                        {chartData.map((pct, i) => (
                            <View key={i} style={styles.barCol}>
                                <View style={[
                                    styles.bar,
                                    { height: 100 * (pct / 100) },
                                    activeTab === 'Steps' && i === 3 ? { backgroundColor: 'red' } :
                                        activeTab === 'Steps' ? { backgroundColor: 'rgba(255,255,255,0.1)' } : // Gray for others
                                            i === 3 ? { backgroundColor: hero.color } : { backgroundColor: 'rgba(255,255,255,0.1)' }
                                ]}>
                                    {/* Active day highlight logic */}
                                    {i === 3 && (activeTab === 'Steps') && <View style={[styles.barFill, { backgroundColor: colors.bodyOrange }]} />}
                                </View>
                                <Text style={[styles.dayText, i === 3 && { color: colors.bodyOrange }]}>{days[i]}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>DAILY AVG</Text>
                        <Text style={styles.statValue}>9,842</Text>
                    </View>
                    <View style={[styles.statCard, styles.activestatCard]}>
                        <Text style={[styles.statLabel, { color: colors.bodyOrange }]}>BEST DAY</Text>
                        <Text style={styles.statValue}>14,203</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>WEEKLY</Text>
                        <Text style={styles.statValue}>86.4k</Text>
                    </View>
                </View>

                {/* Daily Breakdown */}
                <Text style={styles.sectionTitle}>Daily Breakdown</Text>
                <View style={styles.breakdownList}>
                    <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownDay}>Monday</Text>
                        <View style={styles.breakdownRight}>
                            <Text style={styles.breakdownValue}>10,432</Text>
                            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textTertiary} />
                        </View>
                    </View>
                    <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownDay}>Tuesday</Text>
                        <View style={styles.breakdownRight}>
                            <Text style={styles.breakdownValue}>12,110</Text>
                            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textTertiary} />
                        </View>
                    </View>
                    <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownDay}>Wednesday</Text>
                        <View style={styles.breakdownRight}>
                            <Text style={[styles.breakdownValue, { color: colors.bodyOrange }]}>8,902</Text>
                            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textTertiary} />
                        </View>
                    </View>
                </View>

                {/* AI Insight */}
                <LinearGradient
                    colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
                    style={styles.insightCard}
                >
                    <View style={styles.insightContent}>
                        <Text style={styles.insightText}>
                            Your pace is up by <Text style={{ color: colors.bodyOrange }}>5%</Text> this week!
                            Consistent morning runs are paying off. Keep this rhythm for optimal recovery.
                        </Text>
                        <View style={styles.aiBadge}>
                            <Text style={styles.aiText}>AI</Text>
                        </View>
                    </View>
                </LinearGradient>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bgMidnight,
    },
    header: {
        alignItems: 'center',
        paddingBottom: space.lg,
    },
    headerTitle: {
        color: colors.textPrimary,
        fontSize: 18,
        fontWeight: '700',
    },
    content: {
        paddingHorizontal: space.md,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: colors.bgElevated,
        borderRadius: radius.lg,
        padding: 4,
        marginBottom: space.xl,
    },
    tab: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: radius.md,
    },
    activeTab: {
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    tabText: {
        color: colors.textSecondary,
        fontSize: 14,
        fontWeight: '600',
    },
    activeTabText: {
        color: colors.textPrimary,
        fontWeight: '700',
    },
    heroSection: {
        alignItems: 'center',
        marginBottom: space.lg,
    },
    heroRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 4,
    },
    heroValue: {
        fontSize: 48,
        fontWeight: '800',
        color: colors.textPrimary,
        letterSpacing: -1,
    },
    heroUnit: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.textTertiary,
        textTransform: 'uppercase',
    },
    trendText: {
        fontSize: 14,
        fontWeight: '600',
        marginTop: 4,
    },
    chartContainer: {
        alignItems: 'center',
        marginBottom: space['2xl'],
        height: 220,
        justifyContent: 'flex-end',
    },
    infoTag: {
        position: 'absolute',
        top: 0,
        alignItems: 'center',
    },
    infoTagLabel: {
        color: colors.textTertiary,
        fontSize: 10,
        fontWeight: '700',
        marginBottom: 2,
        textTransform: 'uppercase',
    },
    infoTagValue: {
        color: colors.textPrimary,
        fontSize: 16,
        fontWeight: '700',
        backgroundColor: colors.bgElevated,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: radius.full,
        overflow: 'hidden',
    },
    chartBars: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 12,
        height: 140,
    },
    barCol: {
        alignItems: 'center',
        gap: 8,
    },
    bar: {
        width: 32,
        borderRadius: 16,
        overflow: 'hidden',
    },
    barFill: {
        flex: 1,
    },
    dayText: {
        color: colors.textTertiary,
        fontSize: 12,
        fontWeight: '700',
    },
    statsGrid: {
        flexDirection: 'row',
        gap: space.md,
        marginBottom: space['2xl'],
    },
    statCard: {
        flex: 1,
        backgroundColor: colors.bgCharcoal,
        paddingVertical: space.md,
        paddingHorizontal: space.sm,
        borderRadius: radius.xl,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.borderSubtle,
    },
    activestatCard: {
        borderColor: 'rgba(255, 92, 0, 0.3)',
    },
    statLabel: {
        color: colors.textTertiary,
        fontSize: 10,
        fontWeight: '800',
        marginBottom: 6,
        textTransform: 'uppercase',
    },
    statValue: {
        color: colors.textPrimary,
        fontSize: 18,
        fontWeight: '700',
    },
    sectionTitle: {
        color: colors.textPrimary,
        fontSize: 18,
        fontWeight: '700',
        marginBottom: space.lg,
    },
    breakdownList: {
        gap: space.md,
        marginBottom: space['2xl'],
    },
    breakdownRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.bgCharcoal,
        padding: space.md,
        borderRadius: radius.xl,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
    },
    breakdownDay: {
        color: colors.textSecondary,
        fontSize: 16,
        fontWeight: '600',
    },
    breakdownRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    breakdownValue: {
        color: colors.textPrimary,
        fontSize: 16,
        fontWeight: '700',
        fontVariant: ['tabular-nums'],
    },
    insightCard: {
        padding: space.lg,
        borderRadius: radius.xl,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    insightContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: space.md,
    },
    insightText: {
        flex: 1,
        color: colors.textSecondary,
        fontSize: 14,
        lineHeight: 22,
    },
    aiBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 0, 0, 0.2)', // Dark red/brown
        justifyContent: 'center',
        alignItems: 'center',
    },
    aiText: {
        color: '#FF4444',
        fontSize: 10,
        fontWeight: '800',
    },
});
