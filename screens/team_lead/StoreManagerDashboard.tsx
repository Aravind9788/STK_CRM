import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    ActivityIndicator,
    StatusBar,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SERVER_URL } from '../../config';

// --- Theme Colors ---
const THEME_BLUE = '#003478';
const BG_LIGHT = '#F5F9FF';
const CARD_WHITE = '#FFFFFF';

const StoreManagerDashboard = () => {
    const [pincode, setPincode] = useState('palakkad');
    const [loading, setLoading] = useState(false);

    // --- Dummy Values for Testing ---
    const [storeData, setStoreData] = useState<any>({
        storeName: 'Downtown Electronics',
        completedAlerts: 9,
        pendingAlerts: 7,
        noActionAlerts: 5,
        performance: 60,
        deliveries: { current: 14, total: 28 },
        team: [
            { name: 'John Smith', score: '16 / 20', color: '#60A5FA' },
            { name: 'Emily Johnson', score: '15 / 20', color: '#F97316' },
            { name: 'Michael Brown', score: '9 / 20', color: '#4ADE80' },
            { name: 'Sarah Lee', score: '6 / 20', color: '#60A5FA' },
        ]
    });

    const fetchStoreData = async () => {
        try {
            setLoading(true);

            // Get authentication token
            const token = await AsyncStorage.getItem('userToken');
            console.log('Fetching store data with token:', token ? 'Token present' : 'No token');

            const response = await fetch(`${SERVER_URL}/team-lead/store-manager-overview?pincode=${pincode}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            console.log('Store data response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Store data fetch error:', response.status, errorText);
                throw new Error(`Failed to fetch store data: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log('Store data received:', data);

            // Transform backend data to match UI structure
            const transformedTeam = data.orders_pending_breakdown?.map((member: any) => ({
                name: member.name,
                score: `${member.count} / ${data.orders_pending_count}`,
                color: '#60A5FA' // Can vary colors based on performance
            })) || [];

            setStoreData({
                storeName: data.store_name || 'Store',
                completedAlerts: data.orders_completed_count || 0,
                pendingAlerts: data.orders_pending_count || 0,
                noActionAlerts: data.no_action_count || 0,
                performance: data.performance_score || 0,
                deliveries: {
                    current: data.deliveries_completed || 0,
                    total: data.deliveries_total || 0
                },
                team: transformedTeam
            });
        } catch (error) {
            console.error('Error fetching store data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Load data on mount and when pincode changes
    useEffect(() => {
        fetchStoreData();
    }, [pincode]);



    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={BG_LIGHT} />

            {/* Navigation Bar */}
            <View style={styles.navRow}>
                <TouchableOpacity><Icon name="chevron-left" size={32} color={THEME_BLUE} /></TouchableOpacity>
                <TouchableOpacity><Icon name="bell" size={26} color={THEME_BLUE} /></TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

                {/* Title Section - Left Aligned */}
                <View style={styles.headerTextSection}>
                    <Text style={styles.mainTitle}>Store Manager Dashboard</Text>
                    <Text style={styles.subTitle}>Store Manager Dashboard</Text>
                </View>

                {/* 1. STORE LOCATION SELECTOR */}
                <View style={styles.card}>
                    <Text style={styles.inputLabel}>Select Store Location</Text>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={pincode}
                            onValueChange={(itemValue: string) => setPincode(itemValue)}
                            style={styles.picker}
                        >
                            <Picker.Item label="Palakkad" value="palakkad" />
                            <Picker.Item label="Ernakulam" value="ernakulam" />
                            <Picker.Item label="Azhapula" value="azhapula" />
                            <Picker.Item label="Trissur" value="trissur" />
                        </Picker>
                    </View>
                    <Text style={styles.storeResultText}>{storeData.storeName}</Text>
                </View>

                {/* 2. ALERT CARDS */}
                <AlertItem icon="check-circle-outline" label="ORDERS COMPLETED ALERTS" count={storeData.completedAlerts} color="#4ADE80" />

                <View style={styles.card}>
                    <View style={styles.alertHeader}>
                        <View style={[styles.iconBox, { backgroundColor: '#FFEDD5' }]}>
                            <Icon name="clock-outline" size={22} color="#F97316" />
                        </View>
                        <Text style={styles.alertLabel}>ORDERS PENDING ALERTS</Text>
                        <Text style={[styles.alertCount, { color: '#F97316' }]}>{storeData.pendingAlerts}</Text>
                    </View>
                    {/* Detailed list in alert card */}
                    <View style={styles.alertDetails}>
                        {storeData.team.map((m: any, i: number) => (
                            <View key={i} style={styles.miniRow}>
                                <View style={[styles.dot, { backgroundColor: m.color }]} />
                                <Text style={styles.miniText}>{m.name}  {m.score.split('/')[0]} Leads</Text>
                            </View>
                        ))}
                    </View>
                </View>

                <AlertItem icon="alert-outline" label="NO ACTION ALERTS" count={storeData.noActionAlerts} color="#F97316" subtext="No Response in the Last 24 Hours" />

                {/* 3. STORE DELIVERIES STATUS */}
                <View style={styles.card}>
                    <View style={styles.rowBetween}>
                        <Text style={styles.cardHeading}>Store Deliveries Status</Text>
                        <Text style={styles.countText}>{storeData.deliveries.current} / {storeData.deliveries.total}</Text>
                    </View>
                    <View style={styles.barTrack}>
                        <View style={[styles.barFill, {
                            width: `${storeData.deliveries.total > 0
                                ? Math.round((storeData.deliveries.current / storeData.deliveries.total) * 100)
                                : 0}%`
                        }]} />
                    </View>
                </View>


            </ScrollView>
        </SafeAreaView>
    );
};

// --- Helper Components ---
const AlertItem = ({ icon, label, count, color, subtext }: any) => (
    <View style={styles.card}>
        <View style={styles.alertHeader}>
            <View style={[styles.iconBox, { backgroundColor: color + '15' }]}>
                <Icon name={icon} size={22} color={color} />
            </View>
            <Text style={styles.alertLabel}>{label}</Text>
            <Text style={[styles.alertCount, { color }]}>{count}</Text>
        </View>
        {subtext && <Text style={styles.miniSubtext}>{subtext}</Text>}
    </View>
);

// --- Styles ---
const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: BG_LIGHT },
    navRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10 },
    container: { paddingHorizontal: 20, paddingBottom: 30 },
    headerTextSection: { marginTop: 15, marginBottom: 15, paddingHorizontal: 5 },
    mainTitle: { fontSize: 22, fontWeight: '800', color: THEME_BLUE },
    subTitle: { fontSize: 14, color: '#64748B', marginTop: 4 },

    card: { backgroundColor: CARD_WHITE, borderRadius: 15, padding: 18, marginBottom: 15, elevation: 3 },
    inputLabel: { fontSize: 13, fontWeight: '700', color: '#64748B', marginBottom: 8 },
    pickerContainer: { backgroundColor: '#F1F5F9', borderRadius: 8, overflow: 'hidden' },
    picker: { height: 50, color: '#1E293B' },
    storeResultText: { marginTop: 12, fontSize: 18, fontWeight: '700', color: '#1E293B' },

    alertHeader: { flexDirection: 'row', alignItems: 'center' },
    iconBox: { width: 38, height: 38, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    alertLabel: { flex: 1, fontSize: 13, fontWeight: '700', color: '#475569' },
    alertCount: { fontSize: 22, fontWeight: '800' },
    alertDetails: { marginTop: 10, paddingLeft: 50 },
    miniRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 3 },
    miniText: { fontSize: 12, color: '#64748B' },
    miniSubtext: { fontSize: 12, color: '#94A3B8', marginLeft: 50, marginTop: 5 },

    cardHeading: { fontSize: 16, fontWeight: '700', color: THEME_BLUE, marginBottom: 15 },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    countText: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
    barTrack: { height: 8, backgroundColor: '#E2E8F0', borderRadius: 4, overflow: 'hidden' },
    barFill: { height: '100%', backgroundColor: '#4ADE80' },

    donutRow: { flexDirection: 'row', alignItems: 'center' },
    donutInfo: { flex: 1.6 },
    infoRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
    dot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
    infoLabel: { flex: 1, fontSize: 12, color: '#64748B' },
    infoScore: { fontSize: 12, fontWeight: '700', color: '#1E293B' },
    donutContainer: { flex: 1, alignItems: 'flex-end' },
    donutCircle: {
        width: 85, height: 85, borderRadius: 42.5, borderWidth: 10,
        borderColor: '#DBEAFE', borderTopColor: '#60A5FA', borderRightColor: '#60A5FA',
        justifyContent: 'center', alignItems: 'center'
    },
    donutPercent: { fontSize: 20, fontWeight: '800', color: '#1E293B' }
});

export default StoreManagerDashboard;