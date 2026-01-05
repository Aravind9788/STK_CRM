import React, { useState, useEffect, useCallback } from 'react';
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
    ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SERVER_URL } from '../../config';
import { fetchWithToken, setNavigationRef } from '../../fetchWithToken';

const PRIMARY_COLOR = '#004aad';
const BG_COLOR = '#f8f9fa';
const ACCENT_COLOR = '#f0f4ff';
const TEXT_COLOR = '#1e293b';
const SUBTEXT_COLOR = '#64748b';

// Unified Interface for UI
interface OrderDetails {
    id: string;
    lead_code: string;
    quotation_id: string;
    customer_name: string;
    phone: string;
    status: 'PENDING' | 'DISPATCHED' | 'DELIVERED';

    location: string;
    district?: string;
    profile?: string;
    material_name?: string;
    brand?: string;

    total_estimated_cost: number;
    advance_paid: number;
    dispatch_amount?: number;
    payment_mode_handover?: string;
    payment_mode?: string;
    sales_executive_name?: string;

    driver_name?: string;
    driver_phone?: string;
    vehicle_number?: string;
    dispatch_date_time?: string;
    payment_mode_dispatch?: string;

    feedback?: string;
    payment_status?: string;
    delivery_timestamp?: string;
}

/* ===============================
   API HANDLERS (UPDATED)
   =============================== */

const submitDispatchDetails = async (payload: any) => {
    try {
        console.log("Sending Dispatch Payload:", JSON.stringify(payload, null, 2));

        const response = await fetchWithToken(
            `${SERVER_URL}/store-manager/pending-to-dispatch`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            }
        );

        const data = await response.json();

        // ERROR HANDLING FOR 422 (Validation Error)
        if (response.status === 422) {
            const errorDetails = data.detail?.map((err: any) =>
                `• ${err.loc[1]}: ${err.msg}`
            ).join('\n') || "Validation error";

            Alert.alert('Validation Error', `Please check these fields:\n\n${errorDetails}`);
            return false;
        }

        if (!response.ok) throw new Error(data?.detail || 'Dispatch failed');
        return true;

    } catch (error: any) {
        Alert.alert('Error', error.message || 'Unable to submit dispatch');
        return false;
    }
};

const markOrderAsDelivered = async (payload: any) => {
    try {
        const response = await fetchWithToken(
            `${SERVER_URL}/store-manager/dispatch-to-delivered`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            }
        );

        const data = await response.json();
        if (!response.ok) throw new Error(data?.detail || 'Delivery update failed');
        return true;

    } catch (error: any) {
        Alert.alert('Error', error.message || 'Unable to mark as delivered');
        return false;
    }
};

const getCurrentTimestamp = () => new Date().toISOString();


/* ===============================
   HELPER COMPONENTS
   =============================== */
const InputField = ({ icon, placeholder, value, onChangeText, keyboardType = 'default', editable = true }: any) => (
    <View style={[styles.inputContainer, !editable && { backgroundColor: '#f1f5f9' }]}>
        <View style={styles.iconBox}>
            <Icon name={icon} size={20} color={PRIMARY_COLOR} />
        </View>
        <TextInput
            placeholder={placeholder}
            placeholderTextColor="#94a3b8"
            value={value}
            onChangeText={onChangeText}
            keyboardType={keyboardType}
            editable={editable}
            style={[styles.textInput, !editable && { color: '#334155' }]}
        />
    </View>
);

const InfoRow = ({ label, value, icon }: any) => (
    <View style={styles.infoRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {icon && <Icon name={icon} size={14} color={SUBTEXT_COLOR} style={{ marginRight: 6 }} />}
            <Text style={styles.infoLabel}>{label}:</Text>
        </View>
        <Text style={styles.infoValue}>{value || '-'}</Text>
    </View>
);


/* ===============================
   MAIN SCREEN
   =============================== */
const StoreOrderDetailsScreen = ({ route, navigation }: any) => {
    const { lead_id, status: initialStatus } = route.params || {};

    // Form States
    const [driverName, setDriverName] = useState('');
    const [driverPhone, setDriverPhone] = useState('');
    const [vehicleNumber, setVehicleNumber] = useState('');

    const [dateObj, setDateObj] = useState(new Date());
    const [timeObj, setTimeObj] = useState(new Date());
    const [displayDate, setDisplayDate] = useState(new Date().toLocaleDateString('en-GB'));
    const [displayTime, setDisplayTime] = useState(new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }));

    // Data States
    const [order, setOrder] = useState<OrderDetails | null>(null);
    const [feedback, setFeedback] = useState('');
    const [paymentStatus, setPaymentStatus] = useState<string>('');

    // UI States
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [isKeyboardVisible, setKeyboardVisible] = useState(false);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // --- FETCH LOGIC ---
    const fetchOrders = useCallback(async () => {
        try {
            if (!refreshing) setLoading(true);

            let data;
            let status = initialStatus || 'PENDING';
            let fetchedStatus = status;

            try {
                if (status === 'DISPATCHED') {
                    const res = await fetchWithToken(`${SERVER_URL}/store-manager/fetch-dispatch-details/${lead_id}`);
                    if (!res.ok) throw new Error('Not found in dispatched');
                    data = await res.json();
                    fetchedStatus = 'DISPATCHED';
                } else if (status === 'DELIVERED') {
                    const res = await fetchWithToken(`${SERVER_URL}/store-manager/fetch-delivered-details/${lead_id}`);
                    if (!res.ok) throw new Error('Not found in delivered');
                    data = await res.json();
                    fetchedStatus = 'DELIVERED';
                } else {
                    // Fetch from Pending
                    const res = await fetchWithToken(`${SERVER_URL}/store-manager/fetch-pending-leads/${lead_id}`);
                    if (!res.ok) {
                        const resDispatch = await fetchWithToken(`${SERVER_URL}/store-manager/fetch-dispatch-details/${lead_id}`);
                        if (resDispatch.ok) {
                            data = await resDispatch.json();
                            fetchedStatus = 'DISPATCHED';
                        } else {
                            const resDelivered = await fetchWithToken(`${SERVER_URL}/store-manager/fetch-delivered-details/${lead_id}`);
                            if (resDelivered.ok) {
                                data = await resDelivered.json();
                                fetchedStatus = 'DELIVERED';
                            } else {
                                throw new Error('Lead not found in any stage');
                            }
                        }
                    } else {
                        data = await res.json();
                        fetchedStatus = 'PENDING';
                    }
                }
            } catch (err) {
                console.log("Fetch Error Chain:", err);
                throw err;
            }

            console.log("Fetched Data:", data, "Status:", fetchedStatus);

            const formattedData: OrderDetails = {
                id: data.lead_id || lead_id,
                lead_code: data.lead_code, // Ensure this exists
                quotation_id: data.lead_code,
                customer_name: data.customer_name,
                phone: data.phone || data.driver_phone || '',
                status: fetchedStatus,

                location: data.location,
                district: data.district,
                profile: data.profile,
                material_name: data.material_category || data.material_brand,
                brand: data.material_brand,

                total_estimated_cost: data.total_estimated_cost || 0,
                advance_paid: (data.advance_received_amount || 0) + (data.dispatch_amount || 0) + (data.advance_paid || 0),
                payment_mode_handover: data.payment_mode_handover,

                driver_name: data.driver_name,
                driver_phone: data.driver_phone,
                vehicle_number: data.vehicle_number,
                dispatch_date_time: data.dispatched_at,
                payment_mode_dispatch: data.payment_mode_dispatch,

                feedback: data.dispatch_feedback || data.feedback,
                delivery_timestamp: data.delivered_at,
                payment_status: data.payment_mode_delivery
            };

            setOrder(formattedData);

            if (formattedData.driver_name) setDriverName(formattedData.driver_name);
            if (formattedData.driver_phone) setDriverPhone(formattedData.driver_phone);
            if (formattedData.vehicle_number) setVehicleNumber(formattedData.vehicle_number);

        } catch (error) {
            console.error("Error:", error);
            Alert.alert("Error", "Unable to load order details.");
            navigation.goBack();
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [lead_id, initialStatus, refreshing]);


    useEffect(() => {
        setNavigationRef(navigation);
        fetchOrders();
    }, [fetchOrders]);

    const onDateChange = (_: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (selectedDate) {
            setDateObj(selectedDate);
            setDisplayDate(selectedDate.toLocaleDateString('en-GB'));
        }
    };

    const onTimeChange = (_: any, selectedTime?: Date) => {
        setShowTimePicker(false);
        if (selectedTime) {
            setTimeObj(selectedTime);
            setDisplayTime(selectedTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }));
        }
    };

    const getFinalISOString = () => {
        const finalDate = new Date(dateObj);
        finalDate.setHours(timeObj.getHours());
        finalDate.setMinutes(timeObj.getMinutes());
        finalDate.setSeconds(0);
        return finalDate.toISOString();
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return '#f59e0b';
            case 'DISPATCHED': return '#3b82f6';
            case 'DELIVERED': return '#10b981';
            default: return '#64748b';
        }
    };

    if (loading || !order) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: BG_COLOR }}>
                <ActivityIndicator size="large" color={PRIMARY_COLOR} />
                <Text style={{ marginTop: 10, color: SUBTEXT_COLOR }}>Loading Details...</Text>
            </View>
        );
    }

    // If payment mode is "Sales Team", balance should be zero (collected by sales team already)
    const balanceAmount = order.payment_mode_handover === 'Sales Team'
        ? 0
        : (order.total_estimated_cost || 0) - (order.advance_paid || 0);

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />

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
                    {/* QUOTATION SUMMARY CARD */}
                    <View style={styles.card}>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
                            <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                                {order.status}
                            </Text>
                        </View>

                        <View style={styles.cardHeader}>
                            <View style={styles.iconCircle}>
                                <Icon name="file-document-outline" size={24} color={PRIMARY_COLOR} />
                            </View>
                            <View>
                                <Text style={styles.companyName}>STK Associates</Text>
                                <Text style={styles.orderId}>#{order.lead_code}</Text>
                            </View>
                        </View>
                        <View style={styles.dashedDivider} />
                        <Text style={styles.sectionHeader}>CUSTOMER INFO</Text>
                        <InfoRow label="Name" value={order.customer_name} icon="account" />
                        <InfoRow label="Phone" value={order.phone} icon="phone" />
                        <InfoRow label="Location" value={order.location} icon="map-marker" />
                        <View style={styles.spacer} />
                        <Text style={styles.sectionHeader}>ORDER DETAILS</Text>
                        <InfoRow label="Material" value={order.material_name} icon="cube-outline" />
                        <InfoRow label="Brand" value={order.brand} icon="tag-outline" />
                        <View style={styles.totalContainer}>
                            <Text style={styles.totalLabel}>Total Amount</Text>
                            <Text style={styles.totalAmount}>₹{order.total_estimated_cost?.toLocaleString()}</Text>
                        </View>
                    </View>

                    {/* PAYMENT STATUS CARD */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>💰 Payment Status</Text>
                        <InfoRow label="Advance Received" value={`₹${(order.advance_paid || order.dispatch_amount || 0).toLocaleString()}`} icon="cash-check" />
                        <InfoRow label="Collected By" value={order.sales_executive_name || 'Sales Executive'} icon="account-tie" />
                        <View style={styles.dashedDivider} />
                        <InfoRow label="Balance Collected Site" value={order.payment_mode_handover || order.payment_mode} icon="hand-coin" />
                        <View style={{ height: 10 }} />
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Icon name="scale-balance" size={16} color={SUBTEXT_COLOR} style={{ marginRight: 6 }} />
                                <Text style={{ fontSize: 14, color: SUBTEXT_COLOR, fontWeight: '700' }}>Balance to Collect:</Text>
                            </View>
                            <Text style={{ fontSize: 18, fontWeight: '800', color: PRIMARY_COLOR }}>
                                ₹{balanceAmount.toLocaleString()}
                            </Text>
                        </View>
                    </View>


                    {/* 1. PENDING -> DISPATCH FORM */}
                    {order.status === 'PENDING' && (
                        <View style={styles.actionCard}>
                            <Text style={styles.cardTitle}>📋 Assign Dispatch</Text>

                            <Text style={styles.groupLabel}>DRIVER DETAILS</Text>
                            <InputField icon="account" placeholder="Driver Name" value={driverName} onChangeText={setDriverName} />
                            <InputField icon="phone" placeholder="Driver Phone" value={driverPhone} onChangeText={setDriverPhone} keyboardType="phone-pad" />

                            <Text style={styles.groupLabel}>VEHICLE DETAILS</Text>
                            <InputField icon="truck" placeholder="Vehicle Number" value={vehicleNumber} onChangeText={setVehicleNumber} />

                            <Text style={styles.groupLabel}>SCHEDULE</Text>
                            <TouchableOpacity activeOpacity={0.8} onPress={() => setShowDatePicker(true)}>
                                <InputField icon="calendar" placeholder="Date" value={displayDate} editable={false} />
                            </TouchableOpacity>

                            <TouchableOpacity activeOpacity={0.8} onPress={() => setShowTimePicker(true)}>
                                <InputField icon="clock-outline" placeholder="Time" value={displayTime} editable={false} />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.mainButton, (!driverName || !driverPhone || !vehicleNumber) && styles.disabledButton]}
                                disabled={!driverName || !driverPhone || !vehicleNumber}
                                onPress={async () => {
                                    // 🚀 FIXED: Using order.lead_code instead of order.id
                                    // The backend expects "L-1001" (lead_code), not "55" (database ID).
                                    const payload = {
                                        lead_id: order.lead_code,
                                        driver_name: driverName,
                                        driver_phone: driverPhone,
                                        vehicle_number: vehicleNumber,
                                        payment_mode: 'Cash',
                                        payment_received_amount: 0,
                                        expected_delivery_at: getFinalISOString(),
                                        dispatch_timestamp: getCurrentTimestamp(),
                                    };

                                    if (await submitDispatchDetails(payload)) {
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
                                <InfoRow label="Phone" value={order.driver_phone} icon="phone" />
                                <InfoRow label="Vehicle" value={order.vehicle_number} icon="truck" />
                                <InfoRow label="Dispatched" value={new Date(order.dispatch_date_time || '').toLocaleDateString()} icon="calendar" />
                            </View>

                            <Text style={styles.groupLabel}>FEEDBACK & PAYMENT</Text>
                            <InputField icon="comment-text-outline" placeholder="Customer Feedback..." value={feedback} onChangeText={setFeedback} />

                            <Text style={[styles.groupLabel, { marginTop: 10 }]}>PAYMENT COLLECTION</Text>
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
                                    // Payload for /dispatch-to-delivered
                                    const payload = {
                                        lead_id: parseInt(order.id), // Delivery endpoint expects Integer ID
                                        feedback: feedback,
                                        payment_mode: paymentStatus,
                                        payment_received_amount: paymentStatus === 'STORE' ? balanceAmount : 0,
                                    };

                                    if (await markOrderAsDelivered(payload)) {
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
                                <InfoRow label="Payment Mode" value={order.payment_status} icon="cash" />
                                <InfoRow label="Delivered At" value={new Date(order.delivery_timestamp || '').toLocaleString()} icon="clock-check-outline" />
                            </View>
                        </View>
                    )}

                    {showDatePicker && <DateTimePicker value={dateObj} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'calendar'} onChange={onDateChange} />}
                    {showTimePicker && <DateTimePicker value={timeObj} mode="time" display="spinner" onChange={onTimeChange} />}

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default StoreOrderDetailsScreen;

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: BG_COLOR, ...Platform.select({ android: { paddingTop: StatusBar.currentHeight } }) },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#fff', elevation: 2 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: TEXT_COLOR },
    backButton: { padding: 8, borderRadius: 8, backgroundColor: '#f1f5f9' },
    card: { marginHorizontal: 20, marginBottom: 20, backgroundColor: '#fff', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4, position: 'relative' },
    actionCard: { marginHorizontal: 20, backgroundColor: '#fff', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
    statusBadge: { position: 'absolute', top: 20, right: 10, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    statusText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    iconCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: ACCENT_COLOR, alignItems: 'center', justifyContent: 'center', marginRight: 15 },
    companyName: { fontSize: 18, fontWeight: '800', color: TEXT_COLOR },
    orderId: { fontSize: 13, color: SUBTEXT_COLOR, fontWeight: '500' },
    dashedDivider: { height: 1, borderWidth: 1, borderColor: '#e2e8f0', borderStyle: 'dashed', borderRadius: 1, marginVertical: 15 },
    sectionHeader: { fontSize: 11, fontWeight: '700', color: '#94a3b8', marginBottom: 10, letterSpacing: 1 },
    spacer: { height: 15 },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    infoLabel: { fontSize: 14, color: SUBTEXT_COLOR, fontWeight: '500' },
    infoValue: { fontSize: 14, color: TEXT_COLOR, fontWeight: '600' },
    totalContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
    totalLabel: { fontSize: 16, fontWeight: '700', color: TEXT_COLOR },
    totalAmount: { fontSize: 22, fontWeight: '900', color: PRIMARY_COLOR },
    cardTitle: { fontSize: 18, fontWeight: '700', color: TEXT_COLOR, marginBottom: 20 },
    groupLabel: { fontSize: 12, fontWeight: '700', color: '#64748b', marginTop: 15, marginBottom: 8, letterSpacing: 0.5, textTransform: 'uppercase' },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 12, overflow: 'hidden' },
    iconBox: { width: 44, alignItems: 'center', justifyContent: 'center', borderRightWidth: 1, borderRightColor: '#e2e8f0' },
    textInput: { flex: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: TEXT_COLOR },
    radioContainer: { flexDirection: 'row', marginBottom: 20, marginTop: 10 },
    radioBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, marginHorizontal: 4, backgroundColor: '#fff' },
    radioBtnActive: { borderColor: PRIMARY_COLOR, backgroundColor: ACCENT_COLOR },
    radioText: { marginLeft: 8, fontSize: 13, fontWeight: '600', color: '#64748b' },
    radioTextActive: { color: PRIMARY_COLOR },
    mainButton: { backgroundColor: PRIMARY_COLOR, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 14, marginTop: 10, shadowColor: PRIMARY_COLOR, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
    successButton: { backgroundColor: '#10b981', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 14, marginTop: 10, shadowColor: '#10b981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
    disabledButton: { backgroundColor: '#cbd5e1', shadowOpacity: 0, elevation: 0 },
    mainButtonText: { color: '#fff', fontSize: 16, fontWeight: '700', marginRight: 8 },
    readOnlyBox: { backgroundColor: '#f8fafc', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
});