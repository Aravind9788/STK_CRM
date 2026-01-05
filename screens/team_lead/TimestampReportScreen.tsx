import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    FlatList,
    Platform,
    Modal,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SERVER_URL } from '../../config';
import { fetchWithToken, setNavigationRef } from '../../fetchWithToken';

// --- THEME CONSTANTS ---
const COLORS = {
    primary: '#004aad',
    background: '#f8f9fa',
    white: '#ffffff',
    text: '#002d69',
    subText: '#666666',
    border: '#e6f0ff',
    success: '#10B981',
    greyLine: '#cbd5e1',
};

const TimestampReportScreen = ({ navigation }: any) => {
    // --- STATE ---
    const [executives, setExecutives] = useState<any[]>([]);
    const [selectedExecutive, setSelectedExecutive] = useState<any | null>(null);
    const [showExecModal, setShowExecModal] = useState(false);
    const [loading, setLoading] = useState(true);

    // Date Logic: Default to today
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());

    // Picker State
    const [showPicker, setShowPicker] = useState(false);
    const [pickerMode, setPickerMode] = useState<'start' | 'end'>('start');

    const [reportData, setReportData] = useState<any[]>([]);

    // Helper to format Date to String (DD-MM-YYYY) for Display
    const formatDateDisplay = (date: Date) => {
        return date.toLocaleDateString('en-GB').replace(/\//g, '-');
    };

    // Helper to format date for API (YYYY-MM-DD)
    const formatDateForAPI = (date: Date) => {
        return date.toISOString().split('T')[0];
    };

    // Fetch executives list
    useEffect(() => {
        setNavigationRef(navigation);
        fetchExecutives();
    }, []);

    const fetchExecutives = async () => {
        try {
            const response = await fetchWithToken(`${SERVER_URL}/team-lead/individual-performance-list`);
            if (response.ok) {
                const data = await response.json();
                const execList = [
                    { id: 'all', name: 'All Executives', username: 'All Executives' },
                    ...data.map((item: any) => ({
                        id: item.user_id.toString(),
                        name: item.username,
                        username: item.username
                    }))
                ];
                setExecutives(execList);
                setSelectedExecutive(execList[0]);
            }
        } catch (error) {
            console.error('Error fetching executives:', error);
            setExecutives([{ id: 'all', name: 'All Executives', username: 'All Executives' }]);
            setSelectedExecutive({ id: 'all', name: 'All Executives', username: 'All Executives' });
        } finally {
            setLoading(false);
        }
    };

    // Fetch timeline report
    const fetchTimestampReport = async () => {
        try {
            setLoading(true);

            // Prepare request body for POST endpoint
            const requestBody = {
                start_date: startDate.toISOString(),
                end_date: endDate.toISOString(),
                sales_executive_id: selectedExecutive?.id === 'all' ? null : parseInt(selectedExecutive?.id)
            };

            const response = await fetchWithToken(`${SERVER_URL}/team-lead/time-logs/report`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error('Failed to fetch timestamp report');
            }

            const data = await response.json();

            // Group by date
            const groupedData: { [key: string]: any[] } = {};

            data.forEach((item: any, index: number) => {
                const dateStr = formatDateDisplay(new Date(item.timestamp));

                if (!groupedData[dateStr]) {
                    groupedData[dateStr] = [];
                }

                groupedData[dateStr].push({
                    id: `${item.lead_code}-${item.event_type}-${index}`, // Unique key combining lead_code, event_type, and index
                    leadCode: item.lead_code, // Keep original lead_code for navigation
                    name: item.customer_name,
                    eventType: item.event_type, // Add event type for display
                    time: new Date(item.timestamp).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                    }),
                    amount: item.amount ? `₹${(item.amount / 100000).toFixed(1)}L` : '-',
                    status: item.status
                });
            });

            // Convert to array format and sort
            const result = Object.keys(groupedData).map(date => ({
                date,
                leads: groupedData[date]
            })).sort((a, b) => {
                const [d1, m1, y1] = a.date.split('-').map(Number);
                const [d2, m2, y2] = b.date.split('-').map(Number);
                const date1 = new Date(y1, m1 - 1, d1);
                const date2 = new Date(y2, m2 - 1, d2);
                return date2.getTime() - date1.getTime();
            });

            setReportData(result);

        } catch (error) {
            console.error('Error fetching timestamp report:', error);
            setReportData([]);
        } finally {
            setLoading(false);
        }
    };

    // Initial Load
    useEffect(() => {
        if (selectedExecutive) {
            fetchTimestampReport();
        }
    }, []); // Only run once on mount


    // --- HANDLERS ---
    const openDatePicker = (mode: 'start' | 'end') => {
        setPickerMode(mode);
        setShowPicker(true);
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        setShowPicker(false);
        if (selectedDate) {
            if (pickerMode === 'start') {
                setStartDate(selectedDate);
            } else {
                setEndDate(selectedDate);
            }
        }
    };

    // --- RENDER CARD ---
    const renderCard = (item: any) => (
        <TouchableOpacity
            key={item.id}
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('TimeTracking', {
                customerName: item.name,
                leadId: item.leadCode // Use leadCode instead of id
            })}
        >
            <View style={styles.cardHeader}>
                <View style={styles.avatarContainer}>
                    <Icon name="account" size={16} color={COLORS.primary} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.clientName} numberOfLines={1}>{item.name}</Text>
                    <Text style={{ fontSize: 9, color: COLORS.subText }}>{item.eventType}</Text>
                </View>
            </View>

            <View style={styles.infoRow}>
                <Icon name="clock-time-four-outline" size={12} color={COLORS.subText} />
                <Text style={styles.infoText}>{item.time}</Text>
            </View>

            <View style={[styles.infoRow, { marginTop: 4 }]}>
                <Icon name="currency-inr" size={12} color={COLORS.subText} />
                <Text style={styles.infoText}>{item.amount}</Text>
            </View>

            <View style={styles.cardFooter}>
                <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>{item.status}</Text>
                </View>
                <View style={styles.viewAction}>
                    <Text style={styles.viewText}>View</Text>
                    <Icon name="chevron-right" size={14} color={COLORS.primary} />
                </View>
            </View>
        </TouchableOpacity>
    );

    // --- RENDER DATE SECTION ---
    const renderDateSection = ({ item }: { item: any }) => (
        <View style={styles.sectionContainer}>

            {/* Separator Style Header - CENTERED */}
            <View style={styles.separatorContainer}>
                <View style={styles.separatorLine} />
                <View style={styles.dateBubble}>
                    <Text style={styles.separatorDate}>{item.date}</Text>
                </View>
                <View style={styles.separatorLine} />
            </View>

            <Text style={styles.floatingCount}>{item.leads.length} Leads</Text>

            {/* Grid Container */}
            <View style={styles.gridContainer}>
                {item.leads.map((lead: any) => renderCard(lead))}
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Icon name="chevron-left" size={28} color={COLORS.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Timeline Report</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <ScrollView showsVerticalScrollIndicator={false}>

                    {/* --- FILTERS SECTION --- */}
                    <View style={styles.filterContainer}>

                        <Text style={styles.inputLabel}>Sales Executive</Text>
                        <TouchableOpacity
                            style={styles.dropdownBox}
                            onPress={() => setShowExecModal(true)}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Icon name="account-tie" size={20} color={COLORS.primary} style={{ marginRight: 10 }} />
                                <Text style={styles.inputText}>{selectedExecutive.name}</Text>
                            </View>
                            <Icon name="chevron-down" size={24} color={COLORS.subText} />
                        </TouchableOpacity>

                        <View style={styles.dateRow}>
                            <View style={{ flex: 1, marginRight: 10 }}>
                                <Text style={styles.inputLabel}>Start Date</Text>
                                <TouchableOpacity
                                    style={styles.dateBox}
                                    onPress={() => openDatePicker('start')}
                                >
                                    <Icon name="calendar-start" size={18} color={COLORS.subText} style={{ marginRight: 8 }} />
                                    <Text style={styles.dateInputText}>{formatDateDisplay(startDate)}</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={{ flex: 1 }}>
                                <Text style={styles.inputLabel}>End Date</Text>
                                <TouchableOpacity
                                    style={styles.dateBox}
                                    onPress={() => openDatePicker('end')}
                                >
                                    <Icon name="calendar-end" size={18} color={COLORS.subText} style={{ marginRight: 8 }} />
                                    <Text style={styles.dateInputText}>{formatDateDisplay(endDate)}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Apply Button - NOW TRIGGERS GENERATION */}
                        <TouchableOpacity
                            style={styles.applyButton}
                            activeOpacity={0.7}
                            onPress={fetchTimestampReport}
                        >
                            <Text style={styles.applyButtonText}>Apply Filters</Text>
                            <Icon name="filter-check-outline" size={18} color={COLORS.white} />
                        </TouchableOpacity>
                    </View>

                    {/* --- RESULTS LIST --- */}
                    <View style={styles.resultsContainer}>
                        <FlatList
                            data={reportData}
                            renderItem={renderDateSection}
                            keyExtractor={(item) => item.date}
                            scrollEnabled={false}
                            ListEmptyComponent={
                                <View style={{ alignItems: 'center', marginTop: 30 }}>
                                    <Text style={{ color: COLORS.subText }}>No leads found for this range.</Text>
                                </View>
                            }
                        />
                    </View>

                    <View style={{ height: 40 }} />
                </ScrollView>
            )}

            {/* --- DATE PICKER MODAL --- */}
            {showPicker && (
                <DateTimePicker
                    value={pickerMode === 'start' ? startDate : endDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onDateChange}
                />
            )}

            {/* --- MODAL FOR EXECUTIVE --- */}
            <Modal visible={showExecModal} transparent animationType="fade">
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowExecModal(false)}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select Executive</Text>
                        {executives.map((exec) => (
                            <TouchableOpacity
                                key={exec.id}
                                style={styles.modalItem}
                                onPress={() => {
                                    setSelectedExecutive(exec);
                                    setShowExecModal(false);
                                }}
                            >
                                <Text style={[
                                    styles.modalItemText,
                                    selectedExecutive.id === exec.id && { color: COLORS.primary, fontWeight: '700' }
                                ]}>
                                    {exec.name}
                                </Text>
                                {selectedExecutive.id === exec.id && (
                                    <Icon name="check" size={20} color={COLORS.primary} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>

        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.background,
        ...Platform.select({ android: { paddingTop: StatusBar.currentHeight } }),
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backBtn: { width: 40 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },

    // Filters
    filterContainer: {
        backgroundColor: COLORS.white,
        margin: 20,
        padding: 20,
        borderRadius: 16,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    inputLabel: {
        fontSize: 12, fontWeight: '700', color: '#94a3b8',
        marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5,
    },
    dropdownBox: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: '#F3F6FC', borderWidth: 1, borderColor: COLORS.border,
        borderRadius: 10, paddingHorizontal: 15, paddingVertical: 12, marginBottom: 16,
    },
    inputText: { fontSize: 14, color: COLORS.text, fontWeight: '600' },
    dateRow: { flexDirection: 'row', marginBottom: 16 },
    dateBox: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#F3F6FC', borderWidth: 1, borderColor: COLORS.border,
        borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12,
    },
    dateInputText: { fontSize: 13, color: COLORS.text, fontWeight: '600' },
    applyButton: {
        backgroundColor: COLORS.primary, flexDirection: 'row',
        alignItems: 'center', justifyContent: 'center',
        paddingVertical: 14, borderRadius: 10,
    },
    applyButtonText: {
        color: COLORS.white, fontWeight: '700', fontSize: 14, marginRight: 8,
    },

    // Results
    resultsContainer: { paddingHorizontal: 20 },
    sectionContainer: { marginBottom: 25 },

    // --- CENTERED SEPARATOR STYLES ---
    separatorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center', // Ensures content is centered
        marginBottom: 8,
        marginTop: 5,
    },
    separatorLine: {
        height: 1,
        backgroundColor: COLORS.greyLine,
        flex: 1,
    },
    dateBubble: {
        paddingHorizontal: 12,
    },
    separatorDate: {
        fontSize: 13,
        fontWeight: '700',
        color: '#64748b',
        textAlign: 'center',
    },
    floatingCount: {
        textAlign: 'right',
        fontSize: 10,
        color: '#94a3b8',
        fontWeight: '600',
        marginBottom: 10,
        marginTop: -4
    },

    // Grid & Card
    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    card: {
        backgroundColor: COLORS.white, width: '48%', borderRadius: 12, padding: 12, marginBottom: 12,
        borderWidth: 1, borderColor: COLORS.border,
        shadowColor: COLORS.text, shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    avatarContainer: {
        width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.border,
        alignItems: 'center', justifyContent: 'center', marginRight: 8,
    },
    clientName: { fontSize: 13, fontWeight: '700', color: COLORS.text, flex: 1 },
    infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
    infoText: { fontSize: 11, color: COLORS.subText, marginLeft: 6 },

    cardFooter: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        marginTop: 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f1f5f9',
    },
    statusBadge: { backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
    statusText: { fontSize: 10, fontWeight: '700', color: COLORS.success },
    viewAction: { flexDirection: 'row', alignItems: 'center' },
    viewText: { fontSize: 11, fontWeight: '700', color: COLORS.primary, marginRight: 2 },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: '80%', backgroundColor: COLORS.white, borderRadius: 12, padding: 20 },
    modalTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 15 },
    modalItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    modalItemText: { fontSize: 14, color: COLORS.subText },
});

export default TimestampReportScreen;