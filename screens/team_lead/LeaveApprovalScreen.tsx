import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SERVER_URL } from '../../config';
import { fetchWithToken, setNavigationRef } from '../../fetchWithToken';

// --- THEME ---
const COLORS = {
    bg: '#F8F9FD',
    primary: '#002d69',
    cardBg: '#ffffff',
    textMain: '#1e293b',
    textSub: '#64748b',
    green: '#10b981',
    red: '#ef4444',
    border: '#e2e8f0',
};

const LeaveApprovalScreen = ({ navigation, route }: any) => {
    const { request, onRefresh } = route.params;
    const [assignees, setAssignees] = useState<any[]>([]);
    const [leaveDetails, setLeaveDetails] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        setNavigationRef(navigation); fetchLeaveDetails();
    }, []);

    const fetchLeaveDetails = async () => {
        try {
            setLoading(true);
            const response = await fetchWithToken(`${SERVER_URL}/attendance/leave-request-detail/${request.leave_id}`);

            if (!response.ok) {
                throw new Error('Failed to fetch leave details');
            }

            const data = await response.json();
            setLeaveDetails(data);

            // Transform handover_summary to assignees format
            if (data.handover_summary && data.handover_summary.length > 0) {
                const assigneeList = data.handover_summary.map((item: any, index: number) => ({
                    id: index.toString(),
                    name: item.assignee_name,
                    leadsAssigned: item.leads_assigned ? item.leads_assigned.length : 0
                }));
                setAssignees(assigneeList);
            } else {
                setAssignees([]);
            }
        } catch (error) {
            console.error('Error fetching leave details:', error);
            Alert.alert('Error', 'Failed to load leave details');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (action: string) => {
        Alert.alert(
            `${action} Leave?`,
            `Are you sure you want to ${action.toLowerCase()} this request?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    onPress: async () => {
                        try {
                            setSubmitting(true);

                            const response = await fetchWithToken(`${SERVER_URL}/attendance/approve-leave`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    leave_id: request.leave_id,
                                    action: action
                                })
                            });

                            const data = await response.json();

                            if (!response.ok) {
                                throw new Error(data.detail || 'Failed to process action');
                            }

                            Alert.alert(
                                'Success',
                                `Leave request ${action.toLowerCase()}d successfully`,
                                [
                                    {
                                        text: 'OK',
                                        onPress: () => {
                                            if (onRefresh) onRefresh();
                                            navigation.goBack();
                                        }
                                    }
                                ]
                            );
                        } catch (error: any) {
                            Alert.alert(
                                'Error',
                                error.message || `Failed to ${action.toLowerCase()} leave request`
                            );
                        } finally {
                            setSubmitting(false);
                        }
                    }
                }
            ]
        );
    };

    // Reusable Card Component
    const DetailCard = ({ title, icon, children, noHeader = false }: any) => (
        <View style={styles.card}>
            {!noHeader && (
                <View style={styles.cardHeader}>
                    <MaterialCommunityIcons name={icon} size={20} color={COLORS.primary} style={{ marginRight: 8 }} />
                    <Text style={styles.cardTitle}>{title}</Text>
                </View>
            )}
            <View style={styles.cardBody}>
                {children}
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

            {/* HEADER */}
            <View style={styles.headerContainer}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Approval Details</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={{ marginTop: 10, color: COLORS.textSub }}>Loading details...</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    {/* 1. PROFILE CARD (Now inside a card) */}
                    <DetailCard noHeader>
                        <View style={styles.profileRow}>
                            <View style={styles.bigAvatar}>
                                <Text style={styles.avatarText}>{request.name.charAt(0)}</Text>
                            </View>
                            <View style={styles.profileTextContainer}>
                                <Text style={styles.profileName}>{request.name}</Text>
                                <Text style={styles.profileRole}>{request.role}</Text>
                                <View style={styles.statusBadge}>
                                    <Text style={styles.statusText}>Pending Approval</Text>
                                </View>
                            </View>
                        </View>
                    </DetailCard>

                    {/* 2. DURATION DETAILS */}
                    <DetailCard title="Leave Duration" icon="calendar-clock">
                        <View style={styles.rowBetween}>
                            <View>
                                <Text style={styles.label}>Start Date</Text>
                                <Text style={styles.value}>{request.fromDate}</Text>
                            </View>
                            <MaterialCommunityIcons name="arrow-right" size={20} color="#cbd5e1" />
                            <View>
                                <Text style={styles.label}>End Date</Text>
                                <Text style={styles.value}>{request.toDate}</Text>
                            </View>
                            <View style={styles.totalBadge}>
                                <Text style={styles.totalText}>{request.duration}</Text>
                            </View>
                        </View>
                    </DetailCard>

                    {/* 3. WORKLOAD HANDOVER (Multi-Assignee Support) */}
                    <DetailCard title="Workload Distribution" icon="account-switch">
                        <View style={styles.handoverContainer}>

                            {/* Total Pending Count */}
                            <View style={styles.totalPendingBox}>
                                <Text style={styles.tpLabel}>Total Pending Leads</Text>
                                <Text style={styles.tpValue}>{request.pendingLeads}</Text>
                            </View>

                            <View style={styles.divider} />

                            <Text style={styles.assignLabel}>Assigned Executives:</Text>

                            {/* List of Assignees */}
                            {assignees.map((person) => (
                                <View key={person.id} style={styles.assigneeRow}>
                                    <View style={styles.assigneeLeft}>
                                        <View style={styles.smallAvatar}>
                                            <MaterialCommunityIcons name="account" size={14} color={COLORS.primary} />
                                        </View>
                                        <Text style={styles.assigneeName}>{person.name}</Text>
                                    </View>
                                    <View style={styles.leadCountBadge}>
                                        <Text style={styles.leadCountText}>{person.leadsAssigned} Leads</Text>
                                    </View>
                                </View>
                            ))}

                        </View>
                        <Text style={styles.infoNote}>
                            *Leads have been split and routed to the executives above.
                        </Text>
                    </DetailCard>

                    {/* 4. REASON */}
                    <DetailCard title="Reason for Leave" icon="text-box-outline">
                        <Text style={styles.reasonText}>"{request.reason}"</Text>
                    </DetailCard>

                    {/* 5. ACTION BUTTONS (Inside ScrollView) */}
                    <View style={styles.actionContainer}>
                        <TouchableOpacity
                            style={[styles.btn, styles.rejectBtn, submitting && styles.btnDisabled]}
                            onPress={() => handleAction('Reject')}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <>
                                    <MaterialCommunityIcons name="close" size={20} color="#fff" />
                                    <Text style={styles.btnText}>Reject</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.btn, styles.approveBtn, submitting && styles.btnDisabled]}
                            onPress={() => handleAction('Approve')}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <>
                                    <MaterialCommunityIcons name="check" size={20} color="#fff" />
                                    <Text style={styles.btnText}>Approve</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>

                    <View style={{ height: 20 }} />

                </ScrollView>
            )}
        </SafeAreaView>
    );
};

export default LeaveApprovalScreen;

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

    scrollContent: { padding: 20 },

    /* CARD COMMON */
    card: {
        backgroundColor: COLORS.cardBg, borderRadius: 16, marginBottom: 16, padding: 16,
        shadowColor: '#64748b', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    cardTitle: { fontSize: 14, fontWeight: '700', color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
    cardBody: { paddingLeft: 4 },

    /* PROFILE CARD STYLES */
    profileRow: { flexDirection: 'row', alignItems: 'center' },
    bigAvatar: {
        width: 60, height: 60, borderRadius: 30, backgroundColor: '#f0f4ff',
        alignItems: 'center', justifyContent: 'center', marginRight: 15,
        borderWidth: 1, borderColor: '#e0e7ff'
    },
    avatarText: { fontSize: 24, fontWeight: '700', color: COLORS.primary },
    profileTextContainer: { flex: 1 },
    profileName: { fontSize: 18, fontWeight: '800', color: COLORS.textMain },
    profileRole: { fontSize: 13, color: COLORS.textSub, marginTop: 2, marginBottom: 6 },
    statusBadge: {
        backgroundColor: '#fff7ed', paddingHorizontal: 8, paddingVertical: 3,
        alignSelf: 'flex-start', borderRadius: 4, borderWidth: 1, borderColor: '#ffedd5'
    },
    statusText: { fontSize: 10, fontWeight: '700', color: '#f59e0b' },

    /* DURATION STYLES */
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    label: { fontSize: 11, color: '#94a3b8', marginBottom: 4 },
    value: { fontSize: 14, fontWeight: '700', color: COLORS.textMain },
    totalBadge: { backgroundColor: '#eff6ff', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
    totalText: { fontSize: 12, fontWeight: '700', color: '#3b82f6' },

    /* HANDOVER STYLES */
    handoverContainer: { marginTop: 5 },
    totalPendingBox: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: '#fff1f2', padding: 12, borderRadius: 10, marginBottom: 12,
        borderWidth: 1, borderColor: '#ffe4e6'
    },
    tpLabel: { fontSize: 13, fontWeight: '600', color: '#be123c' },
    tpValue: { fontSize: 16, fontWeight: '800', color: '#be123c' },

    divider: { height: 1, backgroundColor: '#f1f5f9', marginBottom: 12 },

    assignLabel: { fontSize: 12, color: COLORS.textSub, marginBottom: 10, fontWeight: '600' },

    assigneeRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: '#f8fafc', padding: 10, borderRadius: 8, marginBottom: 8,
        borderWidth: 1, borderColor: '#f1f5f9'
    },
    assigneeLeft: { flexDirection: 'row', alignItems: 'center' },
    smallAvatar: {
        width: 24, height: 24, borderRadius: 12, backgroundColor: '#e2e8f0',
        alignItems: 'center', justifyContent: 'center', marginRight: 8
    },
    assigneeName: { fontSize: 13, fontWeight: '600', color: COLORS.textMain },
    leadCountBadge: { backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
    leadCountText: { fontSize: 11, fontWeight: '700', color: '#166534' },

    infoNote: { fontSize: 11, color: '#94a3b8', fontStyle: 'italic', marginTop: 8 },

    reasonText: { fontSize: 14, color: COLORS.textMain, lineHeight: 22, fontStyle: 'italic' },

    /* ACTION BUTTONS */
    actionContainer: { flexDirection: 'row', gap: 15, marginTop: 10 },
    btn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 14, borderRadius: 12, elevation: 2
    },
    rejectBtn: { backgroundColor: COLORS.red },
    approveBtn: { backgroundColor: COLORS.green },
    btnDisabled: { opacity: 0.5 },
    btnText: { color: '#fff', fontWeight: '700', fontSize: 16, marginLeft: 6 },
});