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

const PRIMARY_COLOR = '#004aad';
const BG_COLOR = '#f8f9fa';
const TEXT_COLOR = '#1e293b';
const SUBTEXT_COLOR = '#64748b';

// --- Types ---
interface StoreOrder {
    id: string;
    customer_name: string;
    phone: string;
    amount: number;
    store_pincode: string;
    payment_type: string;
    status: 'PENDING' | 'DISPATCHED' | 'DELIVERED';
    date: string;
    time: string;
    location: string;
}

const StoreManagerDashboardScreen = ({ navigation }: any) => {
    const [activeTab, setActiveTab] = useState<'PENDING' | 'DISPATCHED' | 'DELIVERED'>('PENDING');
    const [orders, setOrders] = useState<StoreOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // --- API Fetch Function ---
    const fetchOrders = useCallback(async () => {
        try {
            setLoading(true);

            // 1. Determine which endpoint to call based on the Active Tab
            let endpoint = '';
            switch (activeTab) {
                case 'PENDING':
                    endpoint = '/store-manager/fetch-pending-leads';
                    break;
                case 'DISPATCHED':
                    // Make sure this endpoint exists in your backend
                    endpoint = '/store-manager/fetch-dispatched-leads'; 
                    break;
                case 'DELIVERED':
                    // Make sure this endpoint exists in your backend
                    endpoint = '/store-manager/fetch-delivered-leads'; 
                    break;
                default:
                    endpoint = '/store-manager/fetch-pending-leads';
            }

            console.log(`Fetching ${activeTab} from: ${SERVER_URL}${endpoint}`);
            const response = await fetch(`${SERVER_URL}${endpoint}`);

            if (!response.ok) {
                // If specific endpoint fails (e.g. 404), clear list to avoid errors
                console.warn(`Failed to fetch ${activeTab} leads`);
                setOrders([]);
                return;
            }

            const data = await response.json();
            console.log(`${activeTab} Data:`, data);

            // 2. Map the backend response
            const formattedData = data.map((item: any) => ({
                id: `${item.lead_id}`, 
                customer_name: item.lead_name,
                phone: item.phone,
                amount: item.estimated_cost,
                advance_received: item.advance_received,
                // Set status to match the current tab (or use backend status if available)
                status: activeTab, 
                date: new Date(item.handover_at || item.created_at || new Date()).toLocaleDateString(),
                time: new Date(item.handover_at || item.created_at || new Date()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                location: item.location || '',
            }));

            setOrders(formattedData);

        } catch (error) {
            console.error("Error:", error);
            // Optional: Alert only on critical errors
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [activeTab]); // Removed 'refreshing' dependency to avoid loops, kept activeTab

    // --- Initial Load & Tab Change ---
    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    // --- Pull to Refresh Handler ---
    const onRefresh = () => {
        setRefreshing(true);
        fetchOrders().then(() => setRefreshing(false));
    };

    /* ===== Card Renderer ===== */
    const renderCard = ({ item }: { item: StoreOrder }) => {
        const getStatusColor = () => {
            switch (item.status) {
                case 'DISPATCHED': return '#3b82f6';
                case 'DELIVERED': return '#10b981';
                default: return PRIMARY_COLOR; // PENDING
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
                        updateOrder: (updates: any) => {
                            // If status changed, remove it from current list (immediate UI update)
                            if (updates.status && updates.status !== activeTab) {
                                setOrders(prev => prev.filter(o => o.id !== updates.id));
                            } else {
                                // Otherwise update the item in place
                                setOrders(prev => prev.map(o => o.id === updates.id ? { ...o, ...updates } : o));
                            }
                        },
                    })
                }
            >
                {/* Colored Status Strip */}
                <View style={[styles.statusStrip, { backgroundColor: statusColor }]} />

                <View style={styles.cardContent}>
                    {/* Header: ID and Status */}
                    <View style={styles.cardHeader}>
                        <View style={styles.idContainer}>
                            <Icon name="pound" size={12} color={SUBTEXT_COLOR} />
                            <Text style={styles.orderId}>{item.id}</Text>
                        </View>
                        <View style={[styles.badge, { backgroundColor: statusColor + '15' }]}>
                            <Text style={[styles.badgeText, { color: statusColor }]}>{item.status}</Text>
                        </View>
                    </View>

                    {/* Main Info */}
                    <View style={styles.mainInfo}>
                        <Text style={styles.customerName} numberOfLines={1}>{item.customer_name}</Text>
                        <Text style={styles.amount}>₹{item.amount?.toLocaleString()}</Text>
                    </View>

                    {/* Divider */}
                    <View style={styles.divider} />

                    {/* Footer */}
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

            {/* ===== Header ===== */}
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

            {/* ===== Tabs ===== */}
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
                            onPress={() => setActiveTab(tab.key as any)}
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

            {/* ===== List Section ===== */}
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
                        data={orders} // We render 'orders' directly because we fetch specific data
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