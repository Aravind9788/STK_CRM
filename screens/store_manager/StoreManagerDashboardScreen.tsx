import React, { useState } from 'react';
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
    Dimensions
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const PRIMARY_COLOR = '#004aad';
const BG_COLOR = '#f8f9fa';
const TEXT_COLOR = '#1e293b';
const SUBTEXT_COLOR = '#64748b';

/* ===============================
   DUMMY DATA
   =============================== */
const DUMMY_STORE_ORDERS = [
    {
        id: 'ORD001',
        customer_name: 'Rajesh Kumar',
        phone: '9876543210',
        amount: 125000,
        store_pincode: '636004',
        payment_type: 'RECEIVED',
        status: 'PENDING',
        date: '21 Dec',
        time: '04:30 PM',
        location: 'Salem Main Rd'
    },
    {
        id: 'ORD002',
        customer_name: 'Priya Interiors',
        phone: '9123456780',
        amount: 98000,
        store_pincode: '682001',
        payment_type: 'COLLECT_AT_SITE',
        status: 'DISPATCHED',
        date: '20 Dec',
        time: '11:15 AM',
        location: 'Kochi Bypass'
    },
    {
        id: 'ORD003',
        customer_name: 'Ahuja Constructions',
        phone: '9000011111',
        amount: 210000,
        store_pincode: '641001',
        payment_type: 'RECEIVED',
        status: 'DELIVERED',
        date: '18 Dec',
        time: '02:00 PM',
        location: 'Coimbatore Ind. Estate'
    },
];

const StoreManagerDashboardScreen = ({ navigation }: any) => {
    const [activeTab, setActiveTab] = useState<'PENDING' | 'DISPATCHED' | 'DELIVERED'>('PENDING');
    const [orders, setOrders] = useState(DUMMY_STORE_ORDERS);

    const filteredData = orders.filter((item) => item.status === activeTab);

    /* ===== Card Renderer ===== */
    const renderCard = ({ item }: { item: any }) => {
        // CHANGED: Force Theme Color for all cards
        const statusColor = PRIMARY_COLOR;

        return (
            <TouchableOpacity
                style={styles.card}
                activeOpacity={0.9}
                onPress={() =>
                    navigation.navigate('StoreOrderDetails', {
                        order: item,
                        updateOrder: (updatedOrder: any) => {
                            setOrders((prev) =>
                                prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
                            );
                        },
                    })
                }
            >
                {/* Colored Status Strip on Left (Now Theme Color) */}
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

                    {/* Main Info: Name and Price */}
                    <View style={styles.mainInfo}>
                        <Text style={styles.customerName} numberOfLines={1}>{item.customer_name}</Text>
                        <Text style={styles.amount}>₹{item.amount.toLocaleString()}</Text>
                    </View>

                    {/* REMOVED: Phone and Pincode View as requested */}

                    {/* Divider */}
                    <View style={styles.divider} />

                    {/* Footer: Date/Time and Action */}
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

            {/* ===== Custom Tabs (Unified Theme Color) ===== */}
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
                    <Text style={styles.countText}>{filteredData.length} Orders</Text>
                </View>

                <FlatList
                    data={filteredData}
                    renderItem={renderCard}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ padding: 16, paddingBottom: 50 }}
                    showsVerticalScrollIndicator={false}
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
            </View>
        </SafeAreaView>
    );
};

export default StoreManagerDashboardScreen;

/* ===== Styles ===== */
const styles = StyleSheet.create({
    safeArea: { 
        flex: 1, 
        backgroundColor: BG_COLOR,
        ...Platform.select({ android: { paddingTop: StatusBar.currentHeight } })
    },

    /* Header */
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    logo: { width: 100, height: 35, resizeMode: 'contain' },
    greeting: { fontSize: 13, color: SUBTEXT_COLOR, fontWeight: '500' },
    headerTitle: { fontSize: 20, fontWeight: '800', color: TEXT_COLOR },

    /* Tabs */
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        paddingTop: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 5,
    },
    tabBtn: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderBottomWidth: 3,
        borderBottomColor: 'transparent',
    },
    tabText: { fontSize: 12, fontWeight: '600', color: '#94a3b8' },

    /* List Container */
    listContainer: { flex: 1 },
    listHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginTop: 15,
        marginBottom: 5,
    },
    sectionHeading: { fontSize: 16, fontWeight: '800', color: TEXT_COLOR },
    countText: { fontSize: 12, fontWeight: '600', color: SUBTEXT_COLOR, backgroundColor: '#e2e8f0', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },

    /* Card Styling */
    card: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
        overflow: 'hidden',
    },
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

    // REMOVED detailsRow styles as they are no longer used

    divider: { height: 1, backgroundColor: '#f1f5f9', marginBottom: 10 },

    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    dateTimeContainer: { flexDirection: 'row', alignItems: 'center' },
    dateText: { fontSize: 12, color: SUBTEXT_COLOR, fontWeight: '600' },
    
    actionBtn: { flexDirection: 'row', alignItems: 'center' },
    actionText: { fontSize: 12, fontWeight: '700', color: PRIMARY_COLOR, marginRight: 2 },

    /* Empty State */
    emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
    emptyIconBg: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: TEXT_COLOR, marginBottom: 5 },
    emptySub: { fontSize: 14, color: SUBTEXT_COLOR },
});