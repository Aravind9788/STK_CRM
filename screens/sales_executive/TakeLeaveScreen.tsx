import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    StatusBar,
    Alert,
    Modal,
    Platform,
    FlatList,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SERVER_URL } from '../../config';
import { fetchWithToken, setNavigationRef } from '../../fetchWithToken';
import { useNavigation } from '@react-navigation/native';

// --- THEME ---
const COLORS = {
    bg: '#F8F9FD',
    primary: '#002d69',
    cardBg: '#ffffff',
    textMain: '#1e293b',
    textSub: '#64748b',
    border: '#e2e8f0',
    inputBg: '#f1f5f9',
    green: '#10b981',
    orange: '#f59e0b',
    red: '#ef4444',
};

// Data will be fetched from backend

const TakeLeaveScreen = ({ navigation }: any) => {
    // --- STATE ---
    const [viewMode, setViewMode] = useState<'form' | 'status'>('form'); // Control View
    const [leaveStatus, setLeaveStatus] = useState<'Pending' | 'Approved'>('Pending'); // Simulate Backend Status

    const [fromDate, setFromDate] = useState(new Date());
    const [toDate, setToDate] = useState(new Date());
    const [showPicker, setShowPicker] = useState<'from' | 'to' | null>(null);

    // Dynamic data from backend
    const [pendingLeads, setPendingLeads] = useState<any[]>([]);
    const [colleagues, setColleagues] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(true);

    // Selection & Assignment
    const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
    const [selectedExec, setSelectedExec] = useState('');

    interface Assignment {
        id: number;
        exec: string;
        leads: { id: string, name: string }[];
    }
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [showExecModal, setShowExecModal] = useState(false);
    const [reason, setReason] = useState('');

    // --- FETCH DATA ON MOUNT ---
    useEffect(() => {
        setNavigationRef(navigation);
        fetchPendingLeads();
        fetchColleagues();
    }, []);

    const fetchPendingLeads = async () => {
        try {
            const response = await fetchWithToken(`${SERVER_URL}/attendance/handover-candidates`);
            if (!response.ok) throw new Error('Failed to fetch leads');

            const data = await response.json();
            // Transform backend format to match UI format
            const formattedLeads = data.map((lead: any) => ({
                id: lead.lead_code,
                name: lead.customer_name,
                date: new Date(lead.created_at || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
                status: lead.status
            }));
            setPendingLeads(formattedLeads);
        } catch (error) {
            console.error('Fetch leads error:', error);
            Alert.alert('Error', 'Failed to load pending leads. Please try again.');
            setPendingLeads([]);
        } finally {
            setIsLoadingData(false);
        }
    };

    const fetchColleagues = async () => {
        try {
            const response = await fetchWithToken(`${SERVER_URL}/attendance/colleagues`);
            if (!response.ok) throw new Error('Failed to fetch colleagues');

            const data = await response.json();
            console.log(data);
            setColleagues(data); // Store full objects with user_id and username
        } catch (error) {
            console.error('Fetch colleagues error:', error);
            Alert.alert('Error', 'Failed to load colleagues. Please try again.');
            setColleagues([]);
        }
    };

    // --- HANDLERS ---
    const onDateChange = (event: any, selectedDate?: Date) => {
        const currentMode = showPicker;
        setShowPicker(null);
        if (selectedDate && currentMode) {
            if (currentMode === 'from') setFromDate(selectedDate);
            else setToDate(selectedDate);
        }
    };

    const toggleLeadSelection = (id: string) => {
        if (selectedLeads.includes(id)) {
            setSelectedLeads(selectedLeads.filter(leadId => leadId !== id));
        } else {
            setSelectedLeads([...selectedLeads, id]);
        }
    };

    const handleAddToAssignment = () => {
        if (selectedLeads.length === 0) {
            Alert.alert('No Leads Selected', 'Please select leads to assign.');
            return;
        }
        if (!selectedExec) {
            Alert.alert('No Executive', 'Please select a sales executive.');
            return;
        }

        const leadsToAdd = pendingLeads
            .filter((l: any) => selectedLeads.includes(l.id))
            .map((l: any) => ({ id: l.id, name: l.name }));

        const newAssignment: Assignment = {
            id: Date.now(),
            exec: selectedExec,
            leads: leadsToAdd,
        };

        setAssignments([...assignments, newAssignment]);
        setSelectedLeads([]);
        setSelectedExec('');
    };

    const handleRemoveAssignment = (assignmentId: number) => {
        setAssignments(assignments.filter(a => a.id !== assignmentId));
    };

    const getAssignedExecName = (leadId: string) => {
        const found = assignments.find(a => a.leads.some(l => l.id === leadId));
        return found ? found.exec : null;
    };

    // --- SUBMIT LOGIC ---
    const handleSubmit = async () => {
        const totalAssignedCount = assignments.reduce((acc, curr) => acc + curr.leads.length, 0);
        const pendingCount = pendingLeads.length - totalAssignedCount;

        if (pendingCount > 0) {
            Alert.alert(
                'Action Required',
                `You have ${pendingCount} unassigned leads. You must assign ALL pending leads to your colleagues before taking leave.`,
                [{ text: 'OK' }]
            );
            return;
        }

        if (!reason) {
            Alert.alert('Missing Info', 'Please enter a reason for your leave.');
            return;
        }

        // Prepare handover payload
        const handoverPayload = assignments.flatMap(a =>
            a.leads.map(lead => ({
                lead_id: pendingLeads.find((l: any) => l.id === lead.id)?.lead_id || parseInt(lead.id.split('-').pop() || '0'),
                to_user_id: colleagues.find((c: any) => c.full_name === a.exec)?.user_id || 0
            }))
        );

        const payload = {
            start_date: fromDate.toISOString(),
            end_date: toDate.toISOString(),
            reason: reason,
            handovers: handoverPayload
        };

        try {
            setLoading(true);
            const response = await fetchWithToken(`${SERVER_URL}/attendance/apply-leave`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData?.detail || 'Failed to submit leave request');
            }

            // SUCCESS: Switch to Status View
            setViewMode('status');
        } catch (error: any) {
            console.error('Submit leave error:', error);
            Alert.alert('Error', error.message || 'Failed to submit leave request');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date: Date) => date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    // --- HELPER: RENDER FORM VIEW ---
    const renderFormView = () => (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {/* 1. DATE SELECTION */}
            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Duration</Text>
                <View style={styles.dateRow}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={styles.label}>From</Text>
                        <TouchableOpacity style={styles.dateBox} onPress={() => setShowPicker('from')}>
                            <MaterialCommunityIcons name="calendar-start" size={18} color={COLORS.primary} />
                            <Text style={styles.dateText} numberOfLines={1}>{formatDate(fromDate)}</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={styles.label}>To</Text>
                        <TouchableOpacity style={styles.dateBox} onPress={() => setShowPicker('to')}>
                            <MaterialCommunityIcons name="calendar-end" size={18} color={COLORS.primary} />
                            <Text style={styles.dateText} numberOfLines={1}>{formatDate(toDate)}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* 2. HANDOVER SECTION */}
            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Select Leads to Handover</Text>
                <View style={styles.leadsContainer}>
                    <ScrollView
                        style={styles.leadsScroll}
                        nestedScrollEnabled={true}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 10 }}
                    >
                        {isLoadingData ? (
                            <View style={{ padding: 20, alignItems: 'center' }}>
                                <ActivityIndicator color={COLORS.primary} />
                                <Text style={{ marginTop: 8, color: COLORS.textSub }}>Loading leads...</Text>
                            </View>
                        ) : pendingLeads.length === 0 ? (
                            <View style={{ padding: 20, alignItems: 'center' }}>
                                <Text style={{ color: COLORS.textSub }}>No pending leads available</Text>
                            </View>
                        ) : (
                            pendingLeads.map((lead: any) => {
                                const isSelected = selectedLeads.includes(lead.id);
                                const assignedExec = getAssignedExecName(lead.id);
                                const isLocked = !!assignedExec;
                                return (
                                    <TouchableOpacity
                                        key={lead.id}
                                        style={[
                                            styles.leadItem,
                                            isSelected && styles.leadItemSelected,
                                            isLocked && styles.leadItemLocked
                                        ]}
                                        onPress={() => !isLocked && toggleLeadSelection(lead.id)}
                                        activeOpacity={isLocked ? 1 : 0.7}
                                    >
                                        <View style={styles.leadInfoContainer}>
                                            <Text
                                                style={[
                                                    styles.leadName,
                                                    isSelected && { color: COLORS.primary },
                                                    isLocked && { color: COLORS.textSub }
                                                ]}
                                                numberOfLines={1}
                                            >
                                                {lead.name}
                                            </Text>
                                            <Text style={styles.leadDate} numberOfLines={1}>
                                                {lead.id} • {lead.date} • {lead.status}
                                            </Text>
                                        </View>
                                        {isLocked ? (
                                            <View style={styles.lockedBadge}>
                                                <Text style={styles.lockedText}>Assigned</Text>
                                            </View>
                                        ) : isSelected ? (
                                            <MaterialCommunityIcons name="check-circle" size={22} color={COLORS.primary} />
                                        ) : (
                                            <View style={styles.circlePlaceholder} />
                                        )}
                                    </TouchableOpacity>
                                );
                            })
                        )}
                    </ScrollView>
                </View>

                <Text style={[styles.label, { marginTop: 15 }]}>Assign Selected To</Text>
                <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.dropdown} onPress={() => setShowExecModal(true)}>
                        <Text style={[styles.dropdownText, !selectedExec && { color: '#94a3b8' }]} numberOfLines={1}>
                            {selectedExec || 'Select Executive'}
                        </Text>
                        <MaterialCommunityIcons name="chevron-down" size={20} color={COLORS.textSub} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.plusBtn, (selectedLeads.length === 0 || !selectedExec) && styles.plusBtnDisabled]}
                        onPress={handleAddToAssignment}
                        disabled={selectedLeads.length === 0 || !selectedExec}
                    >
                        <MaterialCommunityIcons name="plus" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* 3. ASSIGNMENT REFERENCE CARD */}
            {assignments.length > 0 && (
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Handover Summary</Text>
                    {assignments.map((assign) => (
                        <View key={assign.id} style={styles.summaryItem}>
                            <View style={styles.summaryHeader}>
                                <View style={styles.summaryLeft}>
                                    <MaterialCommunityIcons name="account-arrow-right" size={20} color={COLORS.primary} />
                                    <Text style={styles.summaryExec} numberOfLines={1}>{assign.exec}</Text>
                                </View>
                                <TouchableOpacity onPress={() => handleRemoveAssignment(assign.id)}>
                                    <MaterialCommunityIcons name="close-circle-outline" size={22} color={COLORS.red} />
                                </TouchableOpacity>
                            </View>
                            <View style={styles.summaryList}>
                                {assign.leads.map(l => (
                                    <Text key={l.id} style={styles.summaryLeadText} numberOfLines={1}>
                                        • {l.name} <Text style={{ fontSize: 10, color: '#94a3b8' }}>({l.id})</Text>
                                    </Text>
                                ))}
                            </View>
                        </View>
                    ))}
                </View>
            )}

            {/* 4. REASON CARD */}
            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Reason for Leave</Text>
                <TextInput
                    style={styles.textArea}
                    placeholder="Type your reason here..."
                    placeholderTextColor="#94a3b8"
                    multiline
                    numberOfLines={3}
                    value={reason}
                    onChangeText={setReason}
                    textAlignVertical="top"
                />
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                <Text style={styles.submitText}>Submit Leave Request</Text>
            </TouchableOpacity>
            <View style={{ height: 40 }} />
        </ScrollView>
    );

    // --- HELPER: RENDER STATUS VIEW (AFTER SUBMIT) ---
    const renderStatusView = () => {
        // Dynamic Styles based on Status
        const isApproved = leaveStatus === 'Approved';
        const statusColor = isApproved ? COLORS.green : COLORS.orange;
        const statusIcon = isApproved ? 'check-decagram' : 'clock-alert';
        const bgAccent = isApproved ? '#ecfdf5' : '#fff7ed';
        const borderAccent = isApproved ? '#a7f3d0' : '#fed7aa';

        return (
            <View style={styles.statusContainer}>

                {/* Success Icon */}
                <View style={styles.statusIconCircle}>
                    <MaterialCommunityIcons name="email-check-outline" size={48} color={COLORS.primary} />
                </View>
                <Text style={styles.statusTitle}>Request Sent!</Text>
                <Text style={styles.statusSub}>Your application has been submitted to the Team Lead.</Text>

                {/* --- THE NEW STATUS CARD --- */}
                <View style={[styles.statusCard, { backgroundColor: bgAccent, borderColor: borderAccent }]}>

                    {/* Header: Status Badge */}
                    <View style={styles.statusCardHeader}>
                        <Text style={styles.statusCardTitle}>Current Status</Text>
                        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                            <MaterialCommunityIcons name={statusIcon} size={14} color="#fff" style={{ marginRight: 4 }} />
                            <Text style={styles.statusBadgeText}>{leaveStatus}</Text>
                        </View>
                    </View>

                    {/* Details */}
                    <View style={styles.statusDetailRow}>
                        <Text style={styles.statusLabel}>Duration:</Text>
                        <Text style={styles.statusValue}>{formatDate(fromDate)} - {formatDate(toDate)}</Text>
                    </View>
                    <View style={styles.statusDetailRow}>
                        <Text style={styles.statusLabel}>Handover:</Text>
                        <Text style={styles.statusValue}>{assignments.reduce((acc, c) => acc + c.leads.length, 0)} Leads Assigned</Text>
                    </View>

                    {/* Approval Note */}
                    <View style={[styles.noteBox, { backgroundColor: '#fff', borderColor: borderAccent }]}>
                        <Text style={[styles.noteText, { color: statusColor }]}>
                            {isApproved
                                ? "Your leave has been approved by Admin."
                                : "Waiting for Team Lead approval."
                            }
                        </Text>
                    </View>
                </View>

                {/* DEMO BUTTON TO TOGGLE STATUS (For your testing) */}
                <TouchableOpacity
                    style={styles.demoToggle}
                    onPress={() => setLeaveStatus(prev => prev === 'Pending' ? 'Approved' : 'Pending')}
                >
                    <Text style={styles.demoText}>[Demo: Toggle Approval]</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.homeButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.homeBtnText}>Back to Menu</Text>
                </TouchableOpacity>

            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

            {/* HEADER */}
            <View style={styles.headerContainer}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {viewMode === 'form' ? 'Apply for Leave' : 'Application Status'}
                </Text>
                <View style={{ width: 40 }} />
            </View>

            {/* VIEW SWITCHER */}
            {viewMode === 'form' ? renderFormView() : renderStatusView()}

            {/* --- DATE PICKER MODALS --- */}
            {showPicker && (
                <DateTimePicker
                    value={showPicker === 'from' ? fromDate : toDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onDateChange}
                />
            )}

            {/* --- EXECUTIVE MODAL --- */}
            <Modal visible={showExecModal} transparent animationType="fade">
                <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowExecModal(false)}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalHeader}>Select Executive</Text>
                        <FlatList
                            data={colleagues}
                            keyExtractor={(item) => item.user_id.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.modalItem} onPress={() => { setSelectedExec(item.full_name); setShowExecModal(false); }}>
                                    <Text style={styles.modalItemText}>{item.full_name}</Text>
                                    {selectedExec === item.full_name && <MaterialCommunityIcons name="check" size={18} color={COLORS.primary} />}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>

        </SafeAreaView>
    );
};

export default TakeLeaveScreen;

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: COLORS.bg },

    /* HEADER */
    headerContainer: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 15,
    },
    backButton: {
        width: 40, height: 40, borderRadius: 20, backgroundColor: '#ffffff',
        alignItems: 'center', justifyContent: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
        borderWidth: 1, borderColor: '#f1f5f9',
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.primary },

    content: { padding: 20 },

    /* CARD COMMON */
    card: {
        backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 16, marginBottom: 20,
        shadowColor: '#64748b', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    },
    sectionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.primary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
    label: { fontSize: 12, color: '#64748b', marginBottom: 6, fontWeight: '600' },

    /* DATE ROW */
    dateRow: { flexDirection: 'row', justifyContent: 'space-between' },
    dateBox: {
        flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.inputBg,
        paddingHorizontal: 10, paddingVertical: 12, borderRadius: 10,
        borderWidth: 1, borderColor: COLORS.border
    },
    dateText: { marginLeft: 8, fontSize: 13, fontWeight: '600', color: COLORS.textMain, flexShrink: 1 },

    /* LEADS LIST SCROLL AREA */
    leadsContainer: {
        backgroundColor: '#fcfcfc', borderRadius: 12, borderWidth: 1, borderColor: '#f1f5f9',
        maxHeight: 220, minHeight: 100, padding: 6,
    },
    leadsScroll: { flexGrow: 0 },
    leadItem: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0',
        marginBottom: 8, backgroundColor: '#ffffff',
        elevation: 1, shadowColor: '#000', shadowOpacity: 0.03, shadowOffset: { width: 0, height: 1 }
    },
    leadItemSelected: { borderColor: COLORS.primary, backgroundColor: '#f0f7ff' },
    leadItemLocked: { backgroundColor: '#f1f5f9', borderColor: '#e2e8f0', opacity: 0.6 },
    leadInfoContainer: { flex: 1, marginRight: 10 },
    leadName: { fontSize: 13, fontWeight: '700', color: COLORS.textMain, marginBottom: 2 },
    leadDate: { fontSize: 11, color: COLORS.textSub },
    circlePlaceholder: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#cbd5e1' },
    lockedBadge: { backgroundColor: '#cbd5e1', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    lockedText: { fontSize: 9, fontWeight: '700', color: '#fff' },

    /* ACTION ROW */
    actionRow: { flexDirection: 'row', gap: 10 },
    dropdown: {
        flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: COLORS.inputBg, paddingHorizontal: 12, paddingVertical: 12, borderRadius: 10,
        borderWidth: 1, borderColor: COLORS.border
    },
    dropdownText: { fontSize: 13, fontWeight: '600', color: COLORS.textMain, flexShrink: 1, marginRight: 4 },
    plusBtn: {
        width: 48, backgroundColor: COLORS.primary, borderRadius: 10,
        alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.primary, shadowOpacity: 0.3, elevation: 3
    },
    plusBtnDisabled: { backgroundColor: '#cbd5e1', shadowOpacity: 0, elevation: 0 },

    /* SUMMARY CARD ITEMS */
    summaryItem: { backgroundColor: '#f8fafc', padding: 10, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0' },
    summaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
    summaryLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 },
    summaryExec: { marginLeft: 6, fontWeight: '700', color: COLORS.textMain, fontSize: 13, flexShrink: 1 },
    summaryList: { paddingLeft: 4 },
    summaryLeadText: { fontSize: 12, color: COLORS.textSub, marginBottom: 2 },

    /* REASON INPUT */
    textArea: {
        backgroundColor: COLORS.inputBg, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border,
        padding: 12, fontSize: 14, color: COLORS.textMain, minHeight: 80
    },

    /* SUBMIT BUTTON */
    submitButton: {
        backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 12,
        alignItems: 'center', justifyContent: 'center', marginHorizontal: 0,
        shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, elevation: 4
    },
    submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },

    /* --- STATUS VIEW STYLES --- */
    statusContainer: { flex: 1, alignItems: 'center', padding: 20, paddingTop: 40 },
    statusIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#e0e7ff', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
    statusTitle: { fontSize: 24, fontWeight: '800', color: COLORS.primary, marginBottom: 8 },
    statusSub: { fontSize: 14, color: COLORS.textSub, textAlign: 'center', marginBottom: 30, lineHeight: 20 },

    statusCard: { width: '100%', borderRadius: 16, borderWidth: 1, padding: 20, marginBottom: 30 },
    statusCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    statusCardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textMain },
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
    statusBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },

    statusDetailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    statusLabel: { fontSize: 13, color: COLORS.textSub },
    statusValue: { fontSize: 14, fontWeight: '600', color: COLORS.textMain },

    noteBox: { marginTop: 15, padding: 12, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
    noteText: { fontSize: 13, fontWeight: '600', textAlign: 'center' },

    demoToggle: { marginBottom: 20 },
    demoText: { color: '#94a3b8', fontSize: 12 },

    homeButton: { paddingVertical: 12, paddingHorizontal: 30, borderRadius: 25, borderWidth: 1, borderColor: COLORS.primary },
    homeBtnText: { color: COLORS.primary, fontWeight: '700' },

    /* MODAL */
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: '80%', backgroundColor: '#fff', borderRadius: 12, padding: 20 },
    modalHeader: { fontSize: 16, fontWeight: '700', marginBottom: 15, color: COLORS.primary },
    modalItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    modalItemText: { fontSize: 14, color: COLORS.textSub },
});