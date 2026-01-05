import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    FlatList,
    Platform,
    Image,
    ActivityIndicator,
    RefreshControl,
    Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SERVER_URL } from '../../config';
import { useFocusEffect } from '@react-navigation/native';
import { fetchWithToken, setNavigationRef } from '../../fetchWithToken';

const PRIMARY_COLOR = '#004aad';
const BG_COLOR = '#f8f9fa';
const TEXT_COLOR = '#1e293b';
const SUBTEXT_COLOR = '#64748b';

// --- Types ---
interface StoreOrder {
    id: string;
    customer_name: string;
    phone: string;
    amount: number; // Represents Estimated Cost (Pending) or Balance (Delivered)
    status: 'PENDING' | 'DISPATCHED' | 'DELIVERED';
    date: string;
    time: string;
    location: string;
    vehicle_number?: string; // Optional: for dispatched view
    driver_name?: string;    // Optional: for dispatched view
}

const StoreManagerDashboardScreen = ({ navigation }: any) => {
    const [activeTab, setActiveTab] = useState<'PENDING' | 'DISPATCHED' | 'DELIVERED'>('PENDING');
    const [orders, setOrders] = useState<StoreOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // --- FETCH LOGIC ---
    const fetchOrders = useCallback(async () => {
        try {
            if (!refreshing) setLoading(true);

            let url = '';
            // 1. Select Endpoint based on Tab
            switch (activeTab) {
                case 'PENDING':
                    url = `${SERVER_URL}/store-manager/fetch-pending-leads`;
                    break;
                case 'DISPATCHED':
                    url = `${SERVER_URL}/store-manager/fetch-dispatch-details`;
                    break;
                case 'DELIVERED':
                    url = `${SERVER_URL}/store-manager/fetch-delivered-details`;
                    break;
            }

            console.log(`Fetching ${activeTab} from:`, url); // Debug Log

            const response = await fetchWithToken(url);
            if (!response.ok) {
                // Handle empty lists or 404s gracefully
                if (response.status === 404) {
                    setOrders([]);
                    return;
                }
                throw new Error('Failed to fetch orders');
            }

            const data = await response.json();
            console.log(`${activeTab} Data:`, data);

            // 2. Normalize Data (Map different API responses to one UI format)
            const formattedData = data.map((item: any) => {
                let dateObj = new Date();

                // Handle various date keys from different endpoints
                const dateStr = item.handover_at || item.dispatched_at || item.delivered_at || new Date().toISOString();
                dateObj = new Date(dateStr);

                return {
                    id: String(item.lead_code || item.lead_id), // Ensure ID is string
                    customer_name: item.lead_name || item.customer_name || 'Unknown',
                    phone: item.phone || '',

                    // Pending and Delivered show Cost, Dispatched now also returns amount
                    amount: item.amount || item.estimated_cost || item.total_estimated_cost || 0,

                    status: activeTab, // Explicitly set status based on current tab

                    date: dateObj.toLocaleDateString('en-GB'),
                    time: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
                    location: item.location || '',

                    // Extra fields for Dispatch Tab
                    vehicle_number: item.vehicle_number,
                    driver_name: item.driver_name
                };
            });

            setOrders(formattedData);

        } catch (error) {
            console.error("Fetch Error:", error);
            setOrders([]); // Clear list on error
            // Optional: Alert.alert("Error", "Unable to load orders.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [activeTab, refreshing]);

    // --- EFFECT HOOKS ---

    // 1. Set navigation ref and fetch when Tab changes
    useEffect(() => {
        setNavigationRef(navigation);
        fetchOrders();
    }, [activeTab, fetchOrders]);

    // 2. Fetch when coming back to this screen (focus)
    useFocusEffect(
        useCallback(() => {
            fetchOrders();
        }, [fetchOrders])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchOrders();
    };

    /* ===== Card Renderer ===== */
    const renderCard = ({ item }: { item: StoreOrder }) => {
        // Dynamic Status Color
        const getStatusColor = () => {
            switch (item.status) {
                case 'DISPATCHED': return '#3b82f6'; // Blue
                case 'DELIVERED': return '#10b981'; // Green
                default: return '#f59e0b'; // Amber (Pending)
            }
        };
        const statusColor = getStatusColor();

        return (
            <TouchableOpacity
                style={styles.card}
                activeOpacity={0.9}
                onPress={() =>
                    navigation.navigate('StoreOrderDetails', {
                        lead_id: item.id,
                        status: item.status
                    })
                }
            >
                <View style={[styles.statusStrip, { backgroundColor: statusColor }]} />

                <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                        <View style={styles.idContainer}>
                            <Icon name="pound" size={12} color={SUBTEXT_COLOR} />
                            <Text style={styles.orderId}>{item.id}</Text>
                        </View>
                        <View style={[styles.badge, { backgroundColor: statusColor + '15' }]}>
                            <Text style={[styles.badgeText, { color: statusColor }]}>{item.status}</Text>
                        </View>
                    </View>

                    <View style={styles.mainInfo}>
                        <Text style={styles.customerName} numberOfLines={1}>{item.customer_name}</Text>

                        {/* Different Subtext based on Status */}
                        {item.status === 'PENDING' && (
                            <Text style={styles.amount}>₹{item.amount?.toLocaleString()}</Text>
                        )}
                        {item.status === 'DISPATCHED' && (
                            <Text style={styles.amount}>₹{item.amount?.toLocaleString()}</Text>
                        )}
                        {item.status === 'DELIVERED' && (
                            <Text style={styles.amount}>₹{item.amount?.toLocaleString()}</Text>
                        )}
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.cardFooter}>
                        <View style={styles.dateTimeContainer}>
                            <Icon name="calendar-clock" size={16} color={SUBTEXT_COLOR} style={{ marginRight: 6 }} />
                            <Text style={styles.dateText}>{item.date} • {item.time}</Text>
                        </View>

                        <View style={styles.actionBtn}>
                            <Text style={styles.actionText}>View</Text>
                            <Icon name="chevron-right" size={16} color={PRIMARY_COLOR} />
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Welcome back,</Text>
                    <Text style={styles.headerTitle}>Store Manager</Text>
                </View>
                <Image
                    source={{ uri: 'https://stkassociates.co.in/wp-content/uploads/STK-Associates-Logo-1.png' }}
                    style={styles.logo}
                />
            </View>

            {/* Tabs */}
            <View style={styles.tabContainer}>
                {[
                    { key: 'PENDING', label: 'Pending', icon: 'clipboard-clock-outline' },
                    { key: 'DISPATCHED', label: 'Dispatched', icon: 'truck-fast-outline' },
                    { key: 'DELIVERED', label: 'Delivered', icon: 'check-all' },
                ].map((tab) => {
                    const isActive = activeTab === tab.key;
                    const activeColor = PRIMARY_COLOR;

                    return (
                        <TouchableOpacity
                            key={tab.key}
                            style={[styles.tabBtn, isActive && { borderBottomColor: activeColor }]}
                            onPress={() => {
                                setOrders([]); // Clear current list immediately for better UX
                                setActiveTab(tab.key as any);
                            }}
                        >
                            <Icon
                                name={tab.icon}
                                size={20}
                                color={isActive ? activeColor : '#94a3b8'}
                                style={{ marginBottom: 4 }}
                            />
                            <Text style={[styles.tabText, isActive && { color: activeColor, fontWeight: '700' }]}>
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Content List */}
            <View style={styles.listContainer}>
                <View style={styles.listHeaderRow}>
                    <Text style={styles.sectionHeading}>
                        {activeTab === 'PENDING' ? 'Orders to Dispatch' :
                            activeTab === 'DISPATCHED' ? 'On The Way' : 'Completed Orders'}
                    </Text>
                    <Text style={styles.countText}>{orders.length} Orders</Text>
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
                        <Text style={styles.loadingText}>Fetching {activeTab.toLowerCase()} orders...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={orders}
                        renderItem={renderCard}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={{ padding: 16, paddingBottom: 50 }}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[PRIMARY_COLOR]} />
                        }
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <View style={styles.emptyIconBg}>
                                    <Icon name="clipboard-text-off-outline" size={40} color="#cbd5e1" />
                                </View>
                                <Text style={styles.emptyTitle}>No Orders Found</Text>
                                <Text style={styles.emptySub}>There are no {activeTab.toLowerCase()} orders at the moment.</Text>
                            </View>
                        }
                    />
                )}
            </View>
        </SafeAreaView>
    );
};

export default StoreManagerDashboardScreen;

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: BG_COLOR, ...Platform.select({ android: { paddingTop: StatusBar.currentHeight } }) },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    logo: { width: 100, height: 35, resizeMode: 'contain' },
    greeting: { fontSize: 13, color: SUBTEXT_COLOR, fontWeight: '500' },
    headerTitle: { fontSize: 20, fontWeight: '800', color: TEXT_COLOR },
    tabContainer: { flexDirection: 'row', backgroundColor: '#fff', paddingTop: 5, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
    tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
    tabText: { fontSize: 12, fontWeight: '600', color: '#94a3b8' },
    listContainer: { flex: 1 },
    listHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 15, marginBottom: 5 },
    sectionHeading: { fontSize: 16, fontWeight: '800', color: TEXT_COLOR },
    countText: { fontSize: 12, fontWeight: '600', color: SUBTEXT_COLOR, backgroundColor: '#e2e8f0', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 10, color: SUBTEXT_COLOR, fontSize: 14 },
    card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3, overflow: 'hidden' },
    statusStrip: { width: 5, height: '100%' },
    cardContent: { flex: 1, padding: 16 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    idContainer: { flexDirection: 'row', alignItems: 'center' },
    orderId: { fontSize: 12, fontWeight: '700', color: SUBTEXT_COLOR, marginLeft: 2 },
    badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    badgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
    mainInfo: { marginBottom: 12 },
    customerName: { fontSize: 16, fontWeight: '800', color: TEXT_COLOR, marginBottom: 4 },
    amount: { fontSize: 18, fontWeight: '900', color: PRIMARY_COLOR },
    subDetail: { fontSize: 14, fontWeight: '600', color: TEXT_COLOR },
    divider: { height: 1, backgroundColor: '#f1f5f9', marginBottom: 10 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    dateTimeContainer: { flexDirection: 'row', alignItems: 'center' },
    dateText: { fontSize: 12, color: SUBTEXT_COLOR, fontWeight: '600' },
    actionBtn: { flexDirection: 'row', alignItems: 'center' },
    actionText: { fontSize: 12, fontWeight: '700', color: PRIMARY_COLOR, marginRight: 2 },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
    emptyIconBg: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: TEXT_COLOR, marginBottom: 5 },
    emptySub: { fontSize: 14, color: SUBTEXT_COLOR },
});