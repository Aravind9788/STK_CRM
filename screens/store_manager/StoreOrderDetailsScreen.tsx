import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    TouchableOpacity,
    Platform,
    TextInput,
    Alert,
    ScrollView,
    KeyboardAvoidingView,
    Keyboard,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const PRIMARY_COLOR = '#004aad';
const BG_COLOR = '#f8f9fa';
const ACCENT_COLOR = '#f0f4ff'; // Light blue background for inputs
const TEXT_COLOR = '#1e293b';
const SUBTEXT_COLOR = '#64748b';

/* ===============================
   API PLACEHOLDERS
   =============================== */
const submitDispatchDetails = async (payload: any) => {
    console.log('DISPATCH API PAYLOAD:', payload);
    return true;
};

const markOrderAsDelivered = async (payload: any) => {
    console.log('DELIVERED API PAYLOAD:', payload);
    return true;
};


/* ===============================
   HELPER COMPONENTS
   =============================== */
// 1. Custom Input Field with Icon
const InputField = ({ icon, placeholder, value, onChangeText, keyboardType = 'default' }: any) => (
    <View style={styles.inputContainer}>
        <View style={styles.iconBox}>
            <Icon name={icon} size={20} color={PRIMARY_COLOR} />
        </View>
        <TextInput
            placeholder={placeholder}
            placeholderTextColor="#94a3b8"
            value={value}
            onChangeText={onChangeText}
            keyboardType={keyboardType}
            style={styles.textInput}
        />
    </View>
);

// 2. Info Row for Quotation Card
const InfoRow = ({ label, value, icon }: any) => (
    <View style={styles.infoRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {icon && <Icon name={icon} size={14} color={SUBTEXT_COLOR} style={{ marginRight: 6 }} />}
            <Text style={styles.infoLabel}>{label}:</Text>
        </View>
        <Text style={styles.infoValue}>{value}</Text>
    </View>
);

/* ===============================
   MAIN SCREEN
   =============================== */
const StoreOrderDetailsScreen = ({ route, navigation }: any) => {
    // Fallback if params are missing for preview
    const { order = {}, updateOrder = () => { } } = route.params || {};

    /* ===== State Management ===== */
    const [driverName, setDriverName] = useState('');
    const [driverPhone, setDriverPhone] = useState('');
    const [vehicleNumber, setVehicleNumber] = useState('');
    const [estimatedTime, setEstimatedTime] = useState('');
    const [dispatchDate, setDispatchDate] = useState(new Date().toLocaleDateString());

    const [feedback, setFeedback] = useState(order.feedback || '');
    const [paymentStatus, setPaymentStatus] = useState(order.payment_status || '');

    // Keyboard handling
    const [isKeyboardVisible, setKeyboardVisible] = useState(false);

    useEffect(() => {
        const showListener = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
        const hideListener = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
        return () => {
            showListener.remove();
            hideListener.remove();
        };
    }, []);

    // Helper to get status color
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return '#f59e0b'; // Amber
            case 'DISPATCHED': return '#3b82f6'; // Blue
            case 'DELIVERED': return '#10b981'; // Green
            default: return '#64748b';
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />

            {/* ===== Header ===== */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Icon name="arrow-left" size={24} color={TEXT_COLOR} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Order Details</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: isKeyboardVisible ? 250 : 40, paddingTop: 10 }}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* ===== QUOTATION SUMMARY CARD ===== */}
                    <View style={styles.card}>
                        {/* Status Badge */}
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
                            <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                                {order.status || 'UNKNOWN'}
                            </Text>
                        </View>

                        {/* Order Header */}
                        <View style={styles.cardHeader}>
                            <View style={styles.iconCircle}>
                                <Icon name="file-document-outline" size={24} color={PRIMARY_COLOR} />
                            </View>
                            <View>
                                <Text style={styles.companyName}>STK Associates</Text>
                                <Text style={styles.orderId}>#{order.id || 'QT-001'}</Text>
                            </View>
                        </View>

                        <View style={styles.dashedDivider} />

                        {/* Customer Info */}
                        <Text style={styles.sectionHeader}>CUSTOMER INFO</Text>
                        <InfoRow label="Name" value={order.customer_name} icon="account" />
                        <InfoRow label="Phone" value={order.phone} icon="phone" />
                        <InfoRow label="Location" value={order.location || 'Salem'} icon="map-marker" />

                        <View style={styles.spacer} />

                        {/* Material Info */}
                        <Text style={styles.sectionHeader}>ORDER DETAILS</Text>
                        <InfoRow label="Material" value={order.material_name || 'Grid Ceiling'} icon="cube-outline" />
                        <InfoRow label="Brand" value={order.brand || 'Armstrong'} icon="tag-outline" />

                        {/* Total Price */}
                        <View style={styles.totalContainer}>
                            <Text style={styles.totalLabel}>Total Amount</Text>
                            <Text style={styles.totalAmount}>₹{order.amount?.toLocaleString()}</Text>
                        </View>
                    </View>


                    {/* ===== ACTION SECTIONS BASED ON STATUS ===== */}

                    {/* 1. PENDING -> DISPATCH FORM */}
                    {order.status === 'PENDING' && (
                        <View style={styles.actionCard}>
                            <Text style={styles.cardTitle}>📋 Assign Dispatch</Text>

                            {/* Group 1: Driver */}
                            <Text style={styles.groupLabel}>DRIVER DETAILS</Text>
                            <InputField icon="account" placeholder="Driver Name" value={driverName} onChangeText={setDriverName} />
                            <InputField icon="phone" placeholder="Driver Phone" value={driverPhone} onChangeText={setDriverPhone} keyboardType="phone-pad" />

                            {/* Group 2: Vehicle */}
                            <Text style={styles.groupLabel}>VEHICLE DETAILS</Text>
                            <InputField icon="truck" placeholder="Vehicle Number" value={vehicleNumber} onChangeText={setVehicleNumber} />

                            {/* Group 3: Dispatch */}
                            <Text style={styles.groupLabel}>DISPATCH DETAILS</Text>
                            <InputField icon="calendar" placeholder="Date (DD/MM/YYYY)" value={dispatchDate} onChangeText={setDispatchDate} />
                            <InputField icon="clock-outline" placeholder="Delivery Time" value={estimatedTime} onChangeText={setEstimatedTime} />

                            <TouchableOpacity
                                style={[styles.mainButton, (!driverName || !driverPhone || !vehicleNumber) && styles.disabledButton]}
                                disabled={!driverName || !driverPhone || !vehicleNumber}
                                onPress={async () => {
                                    const payload = { order_id: order.id, driverName, driverPhone, vehicleNumber, dispatchDate, estimatedTime };
                                    if (await submitDispatchDetails(payload)) {
                                        updateOrder({ ...order, status: 'DISPATCHED', driver_name: driverName, driver_phone: driverPhone, vehicle_number: vehicleNumber, dispatch_date: dispatchDate, estimated_time: estimatedTime });
                                        navigation.goBack();
                                    }
                                }}
                            >
                                <Text style={styles.mainButtonText}>Confirm Dispatch</Text>
                                <Icon name="check" size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* 2. DISPATCHED -> DELIVERY FORM */}
                    {order.status === 'DISPATCHED' && (
                        <View style={styles.actionCard}>
                            <Text style={styles.cardTitle}>🚚 Delivery Updates</Text>

                            <View style={styles.readOnlyBox}>
                                <InfoRow label="Driver" value={order.driver_name} icon="account" />
                                <InfoRow label="Vehicle" value={order.vehicle_number} icon="truck" />
                                <InfoRow label="Est. Time" value={order.estimated_time} icon="clock" />
                            </View>

                            <Text style={styles.groupLabel}>FEEDBACK & PAYMENT</Text>
                            <InputField icon="comment-text-outline" placeholder="Customer Feedback..." value={feedback} onChangeText={setFeedback} />

                            <View style={styles.radioContainer}>
                                <TouchableOpacity style={[styles.radioBtn, paymentStatus === 'STORE' && styles.radioBtnActive]} onPress={() => setPaymentStatus('STORE')}>
                                    <Icon name={paymentStatus === 'STORE' ? 'radiobox-marked' : 'radiobox-blank'} size={20} color={paymentStatus === 'STORE' ? PRIMARY_COLOR : '#94a3b8'} />
                                    <Text style={[styles.radioText, paymentStatus === 'STORE' && styles.radioTextActive]}>Recv. in Store</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.radioBtn, paymentStatus === 'PAID' && styles.radioBtnActive]} onPress={() => setPaymentStatus('PAID')}>
                                    <Icon name={paymentStatus === 'PAID' ? 'radiobox-marked' : 'radiobox-blank'} size={20} color={paymentStatus === 'PAID' ? PRIMARY_COLOR : '#94a3b8'} />
                                    <Text style={[styles.radioText, paymentStatus === 'PAID' && styles.radioTextActive]}>Already Paid</Text>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                style={[styles.successButton, !paymentStatus && styles.disabledButton]}
                                disabled={!paymentStatus}
                                onPress={async () => {
                                    if (await markOrderAsDelivered({ order_id: order.id, feedback, paymentStatus })) {
                                        updateOrder({ ...order, status: 'DELIVERED', feedback, payment_status: paymentStatus });
                                        navigation.goBack();
                                    }
                                }}
                            >
                                <Text style={styles.mainButtonText}>Mark as Delivered</Text>
                                <Icon name="check-circle-outline" size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* 3. DELIVERED -> SUMMARY */}
                    {order.status === 'DELIVERED' && (
                        <View style={styles.actionCard}>
                            <Text style={styles.cardTitle}>Delivery Complete</Text>
                            <View style={styles.readOnlyBox}>
                                <InfoRow label="Feedback" value={order.feedback || 'None'} icon="comment-quote-outline" />
                                <InfoRow label="Payment" value={order.payment_status === 'PAID' ? 'Already Paid' : 'Received in Store'} icon="cash" />
                            </View>

                        </View>
                    )}

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default StoreOrderDetailsScreen;

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: BG_COLOR,
        ...Platform.select({ android: { paddingTop: StatusBar.currentHeight } })
    },

    // HEADER
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#fff', elevation: 2 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: TEXT_COLOR },
    backButton: { padding: 8, borderRadius: 8, backgroundColor: '#f1f5f9' },

    // CARD COMMON STYLES
    card: { marginHorizontal: 20, marginBottom: 20, backgroundColor: '#fff', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4, position: 'relative' },
    actionCard: { marginHorizontal: 20, backgroundColor: '#fff', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },

    // QUOTATION CARD INTERNALS
    statusBadge: { position: 'absolute', top: 20, right: 10, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    statusText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    iconCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: ACCENT_COLOR, alignItems: 'center', justifyContent: 'center', marginRight: 15 },
    companyName: { fontSize: 18, fontWeight: '800', color: TEXT_COLOR },
    orderId: { fontSize: 13, color: SUBTEXT_COLOR, fontWeight: '500' },
    dashedDivider: { height: 1, borderWidth: 1, borderColor: '#e2e8f0', borderStyle: 'dashed', borderRadius: 1, marginVertical: 15 },
    sectionHeader: { fontSize: 11, fontWeight: '700', color: '#94a3b8', marginBottom: 10, letterSpacing: 1 },
    spacer: { height: 15 },

    // INFO ROW
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    infoLabel: { fontSize: 14, color: SUBTEXT_COLOR, fontWeight: '500' },
    infoValue: { fontSize: 14, color: TEXT_COLOR, fontWeight: '600' },

    // TOTAL PRICE
    totalContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
    totalLabel: { fontSize: 16, fontWeight: '700', color: TEXT_COLOR },
    totalAmount: { fontSize: 22, fontWeight: '900', color: PRIMARY_COLOR },

    // FORMS
    cardTitle: { fontSize: 18, fontWeight: '700', color: TEXT_COLOR, marginBottom: 20 },
    groupLabel: { fontSize: 12, fontWeight: '700', color: '#64748b', marginTop: 15, marginBottom: 8, letterSpacing: 0.5, textTransform: 'uppercase' },

    // INPUT STYLING
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 12, overflow: 'hidden' },
    iconBox: { width: 44, alignItems: 'center', justifyContent: 'center', borderRightWidth: 1, borderRightColor: '#e2e8f0' },
    textInput: { flex: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: TEXT_COLOR },

    // RADIO BUTTONS
    radioContainer: { flexDirection: 'row', marginBottom: 20, marginTop: 10 },
    radioBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, marginHorizontal: 4, backgroundColor: '#fff' },
    radioBtnActive: { borderColor: PRIMARY_COLOR, backgroundColor: ACCENT_COLOR },
    radioText: { marginLeft: 8, fontSize: 13, fontWeight: '600', color: '#64748b' },
    radioTextActive: { color: PRIMARY_COLOR },

    // BUTTONS
    mainButton: { backgroundColor: PRIMARY_COLOR, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 14, marginTop: 10, shadowColor: PRIMARY_COLOR, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
    successButton: { backgroundColor: '#10b981', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 14, marginTop: 10, shadowColor: '#10b981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
    salesButton: { backgroundColor: '#f59e0b', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 14, marginTop: 10 },
    disabledButton: { backgroundColor: '#cbd5e1', shadowOpacity: 0, elevation: 0 },
    mainButtonText: { color: '#fff', fontSize: 16, fontWeight: '700', marginRight: 8 },

    // READ ONLY BOX
    readOnlyBox: { backgroundColor: '#f8fafc', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
});