import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    StatusBar,
    ActivityIndicator,
    Alert,
    Platform,
    TextInput,
    Modal,
    KeyboardAvoidingView,
    TouchableWithoutFeedback,
    Keyboard
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SERVER_URL } from '../../config';
import { fetchWithToken, setNavigationRef } from '../../fetchWithToken';
import { useNavigation } from '@react-navigation/native';

// 1. Added specific icons for the locations
const STORE_LOCATIONS = [
    { name: 'Palakad', icon: 'map-marker-radius' },
    { name: 'Erana Kuzham', icon: 'map-marker-radius' },
    { name: 'Thrishoor', icon: 'map-marker-radius' },
    { name: 'Alzhapula', icon: 'map-marker-radius' }
];

const QuotationDetailsScreen = ({ route, navigation }: any) => {
    const { leadId } = route.params;

    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [modalVisible, setModalVisible] = useState(false);

    // Form State
    const [storeName, setStoreName] = useState('');
    const [isStoreDropdownOpen, setIsStoreDropdownOpen] = useState(false);
    const [advanceAmount, setAdvanceAmount] = useState('');
    const [paymentMode, setPaymentMode] = useState<'Store' | 'Sales Team' | null>(null);

    // Follow-up State
    const [followStage, setFollowStage] = useState('');
    const [stageOpen, setStageOpen] = useState(false);

    // Date & Time State
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

    const [followReason, setFollowReason] = useState('');

    // Follow-up timestamps
    const [stageSelectedAt, setStageSelectedAt] = useState<string | null>(null);
    const [followupSubmittedAt, setFollowupSubmittedAt] = useState<string | null>(null);

    // Handover timestamps
    const [advanceConfirmedAt, setAdvanceConfirmedAt] = useState<string | null>(null);
    const [sentToStoreAt, setSentToStoreAt] = useState<string | null>(null);


    const FOLLOW_STAGES = [
        'Pending',
        'In Discussion',
        'Follow-up / Retention',
        'Not Picked',
        'Contacted',
        'Quoted',
        'Negotiation',
        'Store Customer',
    ];

    const fetchQuotationDetails = async () => {
        try {
            const response = await fetch(
                `${SERVER_URL}/leads/follow-up-leads/${leadId}`,
                { method: 'GET' }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch quotation');
            }

            const result = await response.json();
            setData(result);
        } catch (error) {
            console.log(error);
            Alert.alert('Error', 'Unable to load quotation details');
        } finally {
            setLoading(false);
        }
    };

    const handleHandoverSubmit = async () => {
        if (!storeName || !paymentMode) {
            Alert.alert("Missing Info", "Please select a store and payment mode.");
            return;
        }

        const sentTime = new Date().toISOString();
        setSentToStoreAt(sentTime);

        const payload = {
            lead_id: data.lead_id,
            // Store & payment
            store_name: storeName,
            advance_received_amount: advanceAmount || "0",
            payment_mode: paymentMode,

            // ⏱ timestamps
            advance_received_amount_at: advanceConfirmedAt,
            handover_at: sentTime,
        };

        console.log("HANDOVER PAYLOAD:", payload);

        try {
            const response = await fetchWithToken(`${SERVER_URL}/store-manager/handover-lead-store-manager`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    // Authorization: `Bearer ${token}` // if JWT needed
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (response.ok) {
                Alert.alert("Success", "Sent to store manager");
                setModalVisible(false);
            } else {
                Alert.alert("Error", result.message || "Something went wrong");
            }
        } catch (error) {
            console.error("API ERROR:", error);
            Alert.alert("Network Error", "Please try again later");
        }
    };
    const submitQuotation = async () => {
        try {
            setLoading(true);

            const payload = {
                lead_id: data.lead_code,            // example: "LD-001"
                sent_at: new Date().toISOString(),
                method: "WHATSAPP"
            };

            const response = await fetch(
                `${SERVER_URL}/quotations/send-customer`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                }
            );

            const result = await response.json();
            console.log("SEND QUOTATION RESPONSE:", result);
            if (response.status === 400) {
                Alert.alert('Alert', result.detail || 'Quotation not approved');
                return;
            }

            // ❌ Handle other failures
            if (!response.ok) {
                throw new Error(result?.message || 'Failed to send quotation');
            }

            Alert.alert('Success', 'Quotation sent via WhatsApp!', [
                {
                    text: 'OK',
                    onPress: () => navigation.replace(route.name),
                },
            ]);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Unable to send quotation');
        } finally {
            setLoading(false);
        }
    };


    const handleSubmitFollowup = async () => {
        if (!followStage) {
            Alert.alert('Missing Info', 'Please select a stage');
            return;
        }

        const submittedTime = new Date().toISOString();
        setFollowupSubmittedAt(submittedTime);

        const payload = {
            lead_code: data.lead_code,
            update_stage: followStage,
            next_followup: date ? date.toISOString() : null,
            reason: followReason || null,
            stage_selected_at: stageSelectedAt,
            followup_updated_at: submittedTime
        };

        console.log('FOLLOW-UP PAYLOAD:', payload);

        try {
            const response = await fetch(
                `${SERVER_URL}/leads/follow-up-lead-update`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                }
            );

            const result = await response.json();
            console.log('SERVER RESPONSE:', result);

            if (response.ok) {
                Alert.alert('Success', 'Follow-up Submitted!', [
                    {
                        text: 'OK',
                        onPress: () => navigation.replace(route.name),
                    },
                ]);
            } else {
                Alert.alert('Error', result.message || 'Something went wrong');
            }

        } catch (error) {
            console.error('FETCH ERROR:', error);
            Alert.alert('Error', 'Unable to connect to server');
        }
    };


    // Date Picker Handler
    const onDateChange = (event: any, selectedDate?: Date) => {
        const currentDate = selectedDate || date;
        setShowDatePicker(Platform.OS === 'ios');
        setDate(currentDate);
    };

    // Time Picker Handler
    const onTimeChange = (event: any, selectedTime?: Date) => {
        const currentTime = selectedTime || date;
        setShowTimePicker(Platform.OS === 'ios');
        setDate(currentTime);
    };

    useEffect(() => {
        setNavigationRef(navigation);
        fetchQuotationDetails();
    }, []);

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <ActivityIndicator size="large" color="#004aad" />
            </SafeAreaView>
        );
    }

    if (!data) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <Text>No data found</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="chevron-left" size={28} color="#004aad" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Quotation Details</Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView contentContainerStyle={styles.container}>

                {/* Customer Card */}
                <View style={styles.card}>
                    <View style={styles.rowBetween}>
                        <Text style={styles.customerName}>{data.customer_name}</Text>
                        <View style={styles.statusBadge}>
                            <Text style={styles.statusText}>
                                {data.quotation_status}
                            </Text>
                        </View>
                        <View style={styles.statusBadge}>
                            <Text style={styles.statusText}>
                                {data.approver_status}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.infoRow}>
                        <Icon name="phone" size={16} color="#666" />
                        <Text style={styles.infoText}>{data.phone}</Text>
                        <View style={styles.callBadge}>
                            <Icon name="phone-outline" size={14} color="#22c55e" />
                            <Text style={styles.callBadgeText}>Call</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.rowBetween}>
                        <View>
                            <Text style={styles.label}>ESTIMATED VALUE</Text>
                            <Text style={styles.valueText}>
                                ₹{data.estimated_value.toLocaleString()}
                            </Text>
                        </View>
                        <View>
                            <Text style={styles.label}>PROJECT TYPE</Text>
                            <Text style={styles.valueSub}>{data.project_type}</Text>
                        </View>
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.whatsappBtn} onPress={submitQuotation}>
                        <Icon name="whatsapp" size={18} color="#fff" />
                        <Text style={styles.btnText}>WhatsApp</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.callBtn}>
                        <Icon name="phone" size={18} color="#004aad" />
                        <Text style={styles.callBtnText}>Call</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.logBtn}>
                        <Icon name="clipboard-text-outline" size={18} color="#fff" />
                        <Text style={styles.btnText}>Log Call</Text>
                    </TouchableOpacity>
                </View>

                {/* Confirm Order Card */}
                <View style={styles.confirmCard}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <Icon name="check-circle" size={24} color="#16a34a" />
                        <View style={{ marginLeft: 10 }}>
                            <Text style={styles.confirmTitle}>Confirm Order?</Text>
                            <Text style={styles.confirmSub}>
                                Handover for delivery
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.handoverBtn}
                        onPress={() => setModalVisible(true)}
                    >
                        <Text style={styles.handoverText}>Handover</Text>
                    </TouchableOpacity>
                </View>

                {/* ===== FOLLOW-UP UPDATE CARD ===== */}
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={styles.card}
                >


                    <View style={styles.rowBetween}>
                        <Text style={styles.sectionTitle}>Follow-up Update</Text>

                        <View style={styles.pendingBadge}>
                            <Text style={styles.pendingBadgeText}>
                                {data.current_stage || 'Pending'}
                            </Text>
                        </View>
                    </View>



                    {/* Stage Dropdown */}
                    <Text style={styles.modalLabel}>Stages</Text>

                    <TouchableOpacity
                        style={styles.dropdownTrigger}
                        onPress={() => setStageOpen(!stageOpen)}
                        activeOpacity={0.8}
                    >
                        <Text style={[
                            styles.dropdownText,
                            !followStage && { color: '#999' }
                        ]}>
                            {followStage || 'Select Stage'}
                        </Text>
                        <Icon
                            name={stageOpen ? 'chevron-up' : 'chevron-down'}
                            size={20}
                            color="#666"
                        />
                    </TouchableOpacity>

                    {stageOpen && (
                        <View style={styles.dropdownOverlay}>
                            <ScrollView style={{ maxHeight: 220 }}>
                                {FOLLOW_STAGES.map((item, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={styles.dropdownItem}
                                        onPress={() => {
                                            setFollowStage(item);
                                            setStageSelectedAt(new Date().toISOString());
                                            setStageOpen(false);
                                        }}

                                    >
                                        <Text style={styles.dropdownItemText}>{item}</Text>
                                        {followStage === item && (
                                            <Icon name="check" size={16} color="#004aad" />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {/* Date & Time Section */}
                    <Text style={[styles.modalLabel, { marginTop: 14 }]}>
                        Next Follow-up Date & Time
                    </Text>

                    <View style={{ flexDirection: 'row', gap: 10 }}>

                        {/* Date Picker Field */}
                        <TouchableOpacity
                            style={[styles.inputBox, { flex: 1 }]}
                            onPress={() => setShowDatePicker(true)}
                        >
                            <Icon name="calendar" size={18} color="#004aad" />
                            <Text style={{ marginLeft: 10, color: '#333' }}>
                                {date.toLocaleDateString()}
                            </Text>
                        </TouchableOpacity>

                        {/* Time Picker Field */}
                        <TouchableOpacity
                            style={[styles.inputBox, { flex: 1 }]}
                            onPress={() => setShowTimePicker(true)}
                        >
                            <Icon name="clock-outline" size={18} color="#004aad" />
                            <Text style={{ marginLeft: 10, color: '#333' }}>
                                {date.toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: true,
                                })}
                            </Text>
                        </TouchableOpacity>

                    </View>

                    {/* Actual Date Picker Component */}
                    {showDatePicker && (
                        <DateTimePicker
                            testID="dateTimePicker"
                            value={date}
                            mode="date"
                            is24Hour={true}
                            display="default"
                            onChange={onDateChange}
                        />
                    )}

                    {/* Actual Time Picker Component */}
                    {showTimePicker && (
                        <DateTimePicker
                            testID="timePicker"
                            value={date}
                            mode="time"
                            is24Hour={false}
                            display="default"
                            onChange={onTimeChange}
                        />
                    )}

                    {/* Reason */}
                    <Text style={[styles.modalLabel, { marginTop: 14 }]}>
                        Reason
                    </Text>

                    <TextInput
                        placeholder="Enter follow-up reason / feedback"
                        value={followReason}
                        onChangeText={setFollowReason}
                        multiline
                        style={[
                            styles.textInput,
                            {
                                height: 90,
                                textAlignVertical: 'top',
                                backgroundColor: '#f8f9fa',
                                borderWidth: 1,
                                borderColor: '#cbd5e1',
                                borderRadius: 10,
                                padding: 12
                            }
                        ]}
                    />

                    {/* Submit Button */}
                    <TouchableOpacity
                        style={{
                            marginTop: 18,
                            backgroundColor: '#004aad',
                            paddingVertical: 14,
                            borderRadius: 12,
                            alignItems: 'center'
                        }}
                        activeOpacity={0.9}
                        onPress={handleSubmitFollowup}
                    >
                        <Text style={{
                            color: '#fff',
                            fontSize: 15,
                            fontWeight: '800'
                        }}>
                            Submit Follow-up
                        </Text>
                    </TouchableOpacity>

                </KeyboardAvoidingView>


                {/* AI Assistant */}
                {/* <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>AI Sales Assistant</Text>
                    <Text style={styles.emptyText}>Analyzing lead potential…</Text>
                </View> */}

                {/* Timeline
                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Sales Timeline</Text>
                    {data.timeline?.map((t: any, idx: number) => (

                        <View key={idx} style={styles.timelineItem}>
                            <Icon name="circle" size={10} color="#004aad" />
                            <Text style={styles.timelineText}>
                                {t.date} - {t.label}
                            </Text>
                        </View>
                    ))}
                </View> */}

            </ScrollView>

            {/* HANDOVER MODAL */}
            <Modal
                visible={modalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === "ios" ? "padding" : "height"}
                        style={styles.modalOverlay}
                    >
                        <View style={styles.modalContent}>

                            {/* Modal Header */}
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Handover Details</Text>
                                <TouchableOpacity onPress={() => setModalVisible(false)}>
                                    <Icon name="close" size={24} color="#666" />
                                </TouchableOpacity>
                            </View>

                            {/* --- FORM CONTENT --- */}

                            {/* 1. Store Name DROPDOWN */}
                            <View style={{ zIndex: 2000 }}>
                                <Text style={styles.modalLabel}>Store Name</Text>
                                <TouchableOpacity
                                    style={styles.dropdownTrigger}
                                    onPress={() => setIsStoreDropdownOpen(!isStoreDropdownOpen)}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Icon name="store" size={20} color="#004aad" />
                                        <Text style={[
                                            styles.dropdownText,
                                            !storeName && { color: '#999' }
                                        ]}>
                                            {storeName || "Select Store Location"}
                                        </Text>
                                    </View>
                                    <Icon
                                        name={isStoreDropdownOpen ? "chevron-up" : "chevron-down"}
                                        size={20}
                                        color="#666"
                                    />
                                </TouchableOpacity>

                                {/* Dropdown List */}
                                {isStoreDropdownOpen && (
                                    <View style={styles.dropdownOverlay}>
                                        <ScrollView nestedScrollEnabled style={{ maxHeight: 200 }}>
                                            {STORE_LOCATIONS.map((loc, index) => (
                                                <TouchableOpacity
                                                    key={index}
                                                    style={styles.dropdownItem}
                                                    onPress={() => {
                                                        setStoreName(loc.name);
                                                        setIsStoreDropdownOpen(false);
                                                    }}
                                                >
                                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                        <Icon name={loc.icon} size={18} color="#004aad" style={{ marginRight: 10 }} />
                                                        <Text style={styles.dropdownItemText}>{loc.name}</Text>
                                                    </View>

                                                    {storeName === loc.name && (
                                                        <Icon name="check" size={16} color="#004aad" />
                                                    )}
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    </View>
                                )}
                            </View>

                            <View style={styles.divider} />

                            {/* 2. Payment Terms Section */}
                            <View style={{ zIndex: 1000 }}>
                                <Text style={styles.modalSectionTitle}>Payment Terms</Text>

                                {/* Advance Received Input */}
                                <Text style={styles.modalLabel}>Advance Received (₹)</Text>
                                <View style={styles.inputBox}>
                                    <Icon name="cash-plus" size={20} color="#16a34a" />

                                    <TextInput
                                        style={styles.textInput}
                                        placeholder="Enter advance amount"
                                        keyboardType="numeric"
                                        value={advanceAmount}
                                        onChangeText={setAdvanceAmount}
                                    />

                                    {/* ✔ Tick Button */}
                                    <TouchableOpacity
                                        onPress={() => {
                                            setAdvanceConfirmedAt(new Date().toISOString());
                                            Alert.alert('Confirmed', 'Advance amount confirmed');
                                        }}
                                    >
                                        <Icon name="check-circle" size={22} color="#16a34a" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {advanceConfirmedAt && (
                                <>
                                    <Text style={[styles.modalLabel, { marginTop: 12 }]}>Select Balance Mode:</Text>

                                    {/* Radio Options */}
                                    <View style={styles.radioContainer}>
                                        <TouchableOpacity
                                            style={[styles.radioBtn, paymentMode === 'Store' && styles.radioBtnActive]}
                                            onPress={() => setPaymentMode('Store')}
                                        >
                                            <Icon
                                                name={paymentMode === 'Store' ? "radiobox-marked" : "radiobox-blank"}
                                                size={20}
                                                color={paymentMode === 'Store' ? "#004aad" : "#666"}
                                            />
                                            <Text style={[styles.radioText, paymentMode === 'Store' && styles.radioTextActive]}>
                                                Collect At Store
                                            </Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[styles.radioBtn, paymentMode === 'Sales Team' && styles.radioBtnActive]}
                                            onPress={() => setPaymentMode('Sales Team')}
                                        >
                                            <Icon
                                                name={paymentMode === 'Sales Team' ? "radiobox-marked" : "radiobox-blank"}
                                                size={20}
                                                color={paymentMode === 'Sales Team' ? "#004aad" : "#666"}
                                            />
                                            <Text style={[styles.radioText, paymentMode === 'Sales Team' && styles.radioTextActive]}>
                                                Collected By Sales Team
                                            </Text>
                                        </TouchableOpacity>
                                    </View>

                                    {/* Submit Button */}
                                    <View style={styles.modalFooter}>
                                        <TouchableOpacity style={styles.deliverBtn} onPress={handleHandoverSubmit}>
                                            <Icon name="truck-delivery" size={24} color="#fff" />
                                        </TouchableOpacity>
                                    </View>
                                </>
                            )}
                        </View>
                    </KeyboardAvoidingView>
                </TouchableWithoutFeedback>
            </Modal>

        </SafeAreaView>
    );
};

export default QuotationDetailsScreen;

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        ...Platform.select({
            ios: { paddingTop: 0 },
            android: { paddingTop: StatusBar.currentHeight || 0 },
        }),
    },
    container: {
        padding: 20,
        paddingBottom: 40,
    },
    /* ===== Header ===== */
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e6f0ff',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#002d69',
    },
    /* ===== Cards ===== */
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 14,
        padding: 16,
        borderWidth: 1,
        borderColor: '#e6f0ff',
        marginBottom: 16,
        // Added zIndex for Dropdowns to work properly
        zIndex: 10,
    },
    sectionCard: {
        backgroundColor: '#ffffff',
        borderRadius: 14,
        padding: 16,
        borderWidth: 1,
        borderColor: '#e6f0ff',
        marginBottom: 16,
    },
    rowBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    divider: {
        height: 1,
        backgroundColor: '#f1f1f1',
        marginVertical: 12,
    },
    /* ===== Customer Info ===== */
    customerName: {
        fontSize: 18,
        fontWeight: '800',
        color: '#002d69',
    },
    statusBadge: {
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#B45309',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
    },
    infoText: {
        fontSize: 14,
        color: '#444',
        marginLeft: 6,
        marginRight: 10,
    },
    callBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    callBadgeText: {
        fontSize: 12,
        color: '#22c55e',
        fontWeight: '600',
        marginLeft: 4,
    },
    /* ===== Values ===== */
    label: {
        fontSize: 11,
        color: '#777',
        fontWeight: '600',
        marginBottom: 4,
    },
    valueText: {
        fontSize: 18,
        fontWeight: '800',
        color: '#004aad',
    },
    valueSub: {
        fontSize: 14,
        color: '#444',
        fontWeight: '600',
    },
    /* ===== Action Buttons ===== */
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    whatsappBtn: {
        flex: 1,
        backgroundColor: '#25D366',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 10,
        marginRight: 8,
    },
    callBtn: {
        flex: 1,
        backgroundColor: '#ffffff',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#004aad',
        marginRight: 8,
    },
    logBtn: {
        flex: 1,
        backgroundColor: '#2563EB',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 10,
    },
    btnText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '700',
        marginLeft: 6,
    },
    callBtnText: {
        color: '#004aad',
        fontSize: 14,
        fontWeight: '700',
        marginLeft: 6,
    },
    /* ===== Section Titles ===== */
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#002d69',
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 13,
        color: '#888',
        fontStyle: 'italic',
    },
    /* ===== Confirm Order - FIXED ===== */
    confirmCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#ECFDF5',
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#BBF7D0',
        marginBottom: 16,
    },
    confirmTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#065F46',
    },
    confirmSub: {
        fontSize: 12,
        color: '#047857',
    },
    handoverBtn: {
        backgroundColor: '#16A34A',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
    },
    handoverText: {
        color: '#ffffff',
        fontSize: 13,
        fontWeight: '700',
    },
    /* ===== Timeline ===== */
    timelineItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    timelineText: {
        fontSize: 13,
        color: '#444',
        marginLeft: 8,
        fontWeight: '500',
    },

    /* ===== MODAL STYLES ===== */
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '90%',
        maxWidth: 350,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },

    pendingBadge: {
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
    },

    pendingBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#B45309',
        textTransform: 'uppercase',
    },

    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#002d69',
    },
    modalSectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#333',
        marginBottom: 10,
    },
    modalLabel: {
        fontSize: 12,
        color: '#666',
        fontWeight: '600',
        marginBottom: 5,
    },
    inputBox: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderRadius: 10,
        paddingHorizontal: 10,
        height: 45,
        marginBottom: 12,
        backgroundColor: '#f8f9fa'
    },
    textInput: {
        flex: 1,
        marginLeft: 10,
        color: '#333',
        height: '100%',
    },

    /* Dropdown Styles */
    dropdownTrigger: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderRadius: 10,
        paddingHorizontal: 10,
        height: 45,
        marginBottom: 5,
        backgroundColor: '#f8f9fa'
    },
    dropdownText: {
        marginLeft: 10,
        color: '#333',
        fontSize: 14,
    },
    dropdownOverlay: {
        marginTop: 6,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 8,
        zIndex: 5000,
        elevation: 10,
    },

    dropdownItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    dropdownItemText: {
        color: '#333',
        fontSize: 14,
    },

    radioContainer: {
        marginBottom: 15,
    },
    radioBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 8,
        marginBottom: 8,
    },
    radioBtnActive: {
        borderColor: '#004aad',
        backgroundColor: '#e0edff',
    },
    radioText: {
        marginLeft: 10,
        color: '#555',
        fontSize: 14,
    },
    radioTextActive: {
        color: '#004aad',
        fontWeight: '700',
    },
    modalFooter: {
        alignItems: 'flex-end',
        marginTop: 10,
    },
    deliverBtn: {
        backgroundColor: '#16a34a', // Green
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#16a34a",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
});