import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    Platform,
    TouchableOpacity,
    Image,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SERVER_URL } from '../../config';
import { fetchWithToken } from '../../fetchWithToken';
import { setNavigationRef } from '../../fetchWithToken';

// --- Theme Color ---
const THEME_BLUE = '#002d69';
const BG_LIGHT = '#f8f9fa';

const TeamLeadDashboardScreen = ({ navigation }: any) => {
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState({
        teamLeadName: 'Team Lead',
        salesPending: 0,
        salesTotal: 0,
        deliveriesCompleted: 0,
        deliveriesTotal: 0,
        goalPercentage: 0
    });

    const fetchDashboardStats = async () => {
        try {
            setLoading(true);
            const response = await fetchWithToken(`${SERVER_URL}/team-lead/dashboard-stats`);

            if (!response.ok) {
                throw new Error('Failed to fetch dashboard stats');
            }

            const data = await response.json();

            setDashboardData({
                teamLeadName: 'Team Lead', // Can get from auth context if available
                salesPending: data.leads_pending_followup || 0,
                salesTotal: data.leads_total_active || 0,
                deliveriesCompleted: data.deliveries_completed || 0,
                deliveriesTotal: data.deliveries_total || 0,
                goalPercentage: data.team_goal_percentage || 0
            });
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setNavigationRef(navigation);
    }, [navigation]);

    useFocusEffect(
        useCallback(() => {
            fetchDashboardStats();
        }, [])
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <StatusBar barStyle="dark-content" backgroundColor={BG_LIGHT} />
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={THEME_BLUE} />
                    <Text style={{ marginTop: 10, color: '#64748B' }}>Loading Dashboard...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={BG_LIGHT} />

            {/* 1. Header with Logo */}
            <View style={styles.header}>
                <Image
                    source={{
                        uri: 'https://stkassociates.co.in/wp-content/uploads/STK-Associates-Logo-1.png',
                    }}
                    style={styles.logo}
                />
                <TouchableOpacity>
                    <Icon name="bell-outline" size={24} color={THEME_BLUE} />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>

                {/* 2. Team Lead Profile Info */}
                <View style={styles.headerTextSection}>
                    <Text style={styles.welcomeText}>Welcome Back,</Text>
                    <Text style={styles.leadName}>{dashboardData.teamLeadName}</Text>
                    <Text style={styles.subTitle}>Here is your team's performance summary for today.</Text>
                </View>

                {/* 3. PERFORMANCE SUMMARY CARD (Store & Sales Combined) */}
                <View style={styles.summaryCard}>
                    <Text style={styles.cardHeading}>Performance Summary</Text>

                    {/* Sales Performance Summary */}
                    <View style={styles.summaryRow}>
                        <View style={[styles.iconBox, { backgroundColor: '#fff7ed' }]}>
                            <Icon name="account-clock-outline" size={22} color="#f97316" />
                        </View>
                        <View style={styles.summaryTextGroup}>
                            <Text style={styles.summaryLabel}>Sales Follow-Ups Pending</Text>
                            <Text style={styles.summaryValue}>{dashboardData.salesPending} / {dashboardData.salesTotal} Leads</Text>
                        </View>
                    </View>

                    {/* Store Performance Summary */}
                    <View style={[styles.summaryRow, { marginTop: 15 }]}>
                        <View style={[styles.iconBox, { backgroundColor: '#f0f9ff' }]}>
                            <Icon name="truck-delivery-outline" size={22} color="#0369a1" />
                        </View>
                        <View style={styles.summaryTextGroup}>
                            <Text style={styles.summaryLabel}>Store Deliveries Progress</Text>
                            <Text style={styles.summaryValue}>{dashboardData.deliveriesCompleted} / {dashboardData.deliveriesTotal} Completed</Text>
                        </View>
                    </View>

                    {/* Goal Progress Bar */}
                    <View style={styles.goalProgressSection}>
                        <View style={styles.rowBetween}>
                            <Text style={styles.progressLabel}>Overall Team Goal</Text>
                            <Text style={styles.progressPercent}>{dashboardData.goalPercentage}%</Text>
                        </View>
                        <View style={styles.track}>
                            <View style={[styles.fill, { width: `${Math.min(dashboardData.goalPercentage, 100)}%` }]} />
                        </View>
                    </View>
                </View>

                {/* 4. NAVIGATION MODULES */}
                <View style={styles.moduleLabelSection}>
                    <Text style={styles.sectionTitle}>Management Modules</Text>
                </View>

                <View style={styles.buttonGrid}>
                    {/* Sales Executive Module */}
                    <TouchableOpacity
                        style={styles.squareCard}
                        activeOpacity={0.85}
                        onPress={() => navigation.navigate('TeamLeadSales')}
                    >
                        <View style={[styles.moduleIcon, { backgroundColor: '#e0e7ff' }]}>
                            <Icon name="account-group" size={32} color="#2563eb" />
                        </View>
                        <Text style={styles.cardTitle}>Sales Executive</Text>
                        <Text style={styles.cardSub}>Check Team Leads & Activity</Text>
                    </TouchableOpacity>

                    {/* Store Manager Module */}
                    <TouchableOpacity
                        style={styles.squareCard}
                        activeOpacity={0.85}
                        onPress={() => navigation.navigate('StoreManagerPerformance')}
                    >
                        <View style={[styles.moduleIcon, { backgroundColor: '#ccfbf1' }]}>
                            <Icon name="store" size={32} color="#0f766e" />
                        </View>
                        <Text style={styles.cardTitle}>Store Manager</Text>
                        <Text style={styles.cardSub}>Orders & Delivery Status</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
};

export default TeamLeadDashboardScreen;

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: BG_LIGHT,
        ...Platform.select({
            android: { paddingTop: StatusBar.currentHeight },
        }),
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    logo: {
        width: 120,
        height: 36,
        resizeMode: 'contain',
    },
    headerTextSection: {
        paddingHorizontal: 25,
        paddingVertical: 20,
    },
    welcomeText: {
        fontSize: 14,
        color: '#64748B',
    },
    leadName: {
        fontSize: 24,
        fontWeight: '800',
        color: THEME_BLUE,
    },
    subTitle: {
        fontSize: 13,
        color: '#64748B',
        marginTop: 5,
        lineHeight: 18,
    },
    summaryCard: {
        backgroundColor: '#fff',
        marginHorizontal: 20,
        padding: 20,
        borderRadius: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    cardHeading: {
        fontSize: 16,
        fontWeight: '800',
        color: THEME_BLUE,
        marginBottom: 20,
    },
    summaryRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    summaryTextGroup: {
        flex: 1,
    },
    summaryLabel: {
        fontSize: 12,
        color: '#64748B',
    },
    summaryValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
        marginTop: 2,
    },
    goalProgressSection: {
        marginTop: 25,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        paddingTop: 15,
    },
    rowBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    progressLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#475569',
    },
    progressPercent: {
        fontSize: 13,
        fontWeight: '700',
        color: THEME_BLUE,
    },
    track: {
        height: 8,
        backgroundColor: '#f1f5f9',
        borderRadius: 4,
        overflow: 'hidden',
    },
    fill: {
        height: '100%',
        backgroundColor: THEME_BLUE,
    },
    moduleLabelSection: {
        paddingHorizontal: 25,
        marginTop: 30,
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: THEME_BLUE,
    },
    buttonGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
    },
    squareCard: {
        width: '48%',
        height: 180,
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 15,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
    },
    moduleIcon: {
        width: 65,
        height: 65,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: THEME_BLUE,
        textAlign: 'center',
    },
    cardSub: {
        fontSize: 11,
        color: '#64748B',
        marginTop: 6,
        textAlign: 'center',
        lineHeight: 15,
    },
});