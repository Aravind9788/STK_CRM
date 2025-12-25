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
import { SERVER_URL } from '../../config';

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
    const [paymentMode, setPaymentMode] = useState<'ONLINE_SITE' | 'CASH_SITE' | null>(null);

    const fetchQuotationDetails = async () => {
        try {
            const response = await fetch(
                `${SERVER_URL}/leads/${leadId}`,
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

    const handleHandoverSubmit = () => {
        if (!storeName || !paymentMode) {
            Alert.alert("Missing Info", "Please select a store and payment mode.");
            return;
        }

        const payload = {
            lead_id: data.lead_id,
            customer_name: data.customer_name,
            store_name: storeName,
            advance_received: advanceAmount || '0',
            payment_mode: paymentMode, 
            handover_at: new Date().toISOString(),
        };

        console.log('HANDOVER PAYLOAD:', payload);
        
        setModalVisible(false);
        Alert.alert('Success', 'Order handed over successfully!');
    };

    useEffect(() => {
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
                    <TouchableOpacity style={styles.whatsappBtn}>
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
                    <Icon name="check-circle" size={22} color="#16a34a" />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.confirmTitle}>Confirm Order?</Text>
                        <Text style={styles.confirmSub}>
                            Send this lead for delivery handover
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={styles.handoverBtn}
                        onPress={() => setModalVisible(true)}
                    >
                        <Text style={styles.handoverText}>Handover</Text>
                    </TouchableOpacity>
                </View>

                {/* AI Assistant */}
                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>AI Sales Assistant</Text>
                    <Text style={styles.emptyText}>Analyzing lead potential…</Text>
                </View>

                {/* Timeline */}
                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Sales Timeline</Text>
                    {data.timeline.map((t: any, idx: number) => (
                        <View key={idx} style={styles.timelineItem}>
                            <Icon name="circle" size={10} color="#004aad" />
                            <Text style={styles.timelineText}>
                                {t.date} - {t.label}
                            </Text>
                        </View>
                    ))}
                </View>

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
                            
                            {/* 1. Store Name DROPDOWN (ZIndex Wrapper) */}
                            <View style={{ zIndex: 2000 }}>
                                <Text style={styles.modalLabel}>Store Name</Text>
                                <TouchableOpacity 
                                    style={styles.dropdownTrigger}
                                    onPress={() => setIsStoreDropdownOpen(!isStoreDropdownOpen)}
                                >
                                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
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

                                {/* Dropdown List - OVERLAY (Absolute) */}
                                {isStoreDropdownOpen && (
                                    <View style={styles.dropdownOverlay}>
                                        {/* Increased maxHeight so Alzhapula is visible */}
                                        <ScrollView nestedScrollEnabled style={{maxHeight: 200}}>
                                            {STORE_LOCATIONS.map((loc, index) => (
                                                <TouchableOpacity 
                                                    key={index}
                                                    style={styles.dropdownItem}
                                                    onPress={() => {
                                                        setStoreName(loc.name);
                                                        setIsStoreDropdownOpen(false);
                                                    }}
                                                >
                                                    {/* Added Icon next to the name */}
                                                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                                        <Icon name={loc.icon} size={18} color="#004aad" style={{marginRight: 10}} />
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

                            {/* 2. Payment Terms Section (ZIndex lower so dropdown covers it) */}
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
                                </View>

                                <Text style={[styles.modalLabel, {marginTop: 12}]}>Select Balance Mode:</Text>
                                
                                {/* Radio Options */}
                                <View style={styles.radioContainer}>
                                    <TouchableOpacity 
                                        style={[styles.radioBtn, paymentMode === 'ONLINE_SITE' && styles.radioBtnActive]}
                                        onPress={() => setPaymentMode('ONLINE_SITE')}
                                    >
                                        <Icon 
                                            name={paymentMode === 'ONLINE_SITE' ? "radiobox-marked" : "radiobox-blank"} 
                                            size={20} 
                                            color={paymentMode === 'ONLINE_SITE' ? "#004aad" : "#666"} 
                                        />
                                        <Text style={[styles.radioText, paymentMode === 'ONLINE_SITE' && styles.radioTextActive]}>
                                            Online Payment At Site
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity 
                                        style={[styles.radioBtn, paymentMode === 'CASH_SITE' && styles.radioBtnActive]}
                                        onPress={() => setPaymentMode('CASH_SITE')}
                                    >
                                        <Icon 
                                            name={paymentMode === 'CASH_SITE' ? "radiobox-marked" : "radiobox-blank"} 
                                            size={20} 
                                            color={paymentMode === 'CASH_SITE' ? "#004aad" : "#666"} 
                                        />
                                        <Text style={[styles.radioText, paymentMode === 'CASH_SITE' && styles.radioTextActive]}>
                                            Cash At Site
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Submit Button (Bottom Right) */}
                                <View style={styles.modalFooter}>
                                    <TouchableOpacity style={styles.deliverBtn} onPress={handleHandoverSubmit}>
                                        <Icon name="truck-delivery" size={24} color="#fff" />
                                    </TouchableOpacity>
                                </View>
                            </View>

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
    /* ===== Confirm Order ===== */
    confirmCard: {
        flexDirection: 'row',
        alignItems: 'center',
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
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 8,
        marginLeft: 'auto'
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
        position: 'absolute',
        top: 70, // Adjust based on Trigger height + Label margin
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 8,
        zIndex: 5000, // Very high Z-index to overlay everything
        elevation: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
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