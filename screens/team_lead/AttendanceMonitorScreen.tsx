import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    StatusBar,
    Modal,
    ScrollView,
    LayoutAnimation,
    Platform,
    UIManager,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SERVER_URL } from '../../config';
import { fetchWithToken, setNavigationRef } from '../../fetchWithToken';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- THEME ---
const COLORS = {
    bg: '#F8F9FD',
    primary: '#002d69',
    cardBg: '#ffffff',
    textMain: '#1e293b',
    textSub: '#64748b',
    border: '#e2e8f0',
    green: '#10b981',
    red: '#ef4444',
    orange: '#f59e0b',
    blue: '#3b82f6',
};



const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const AttendanceMonitorScreen = ({ navigation }: any) => {
    const [activeTab, setActiveTab] = useState<'Today' | 'Monthly'>('Today');
    const [selectedMonth, setSelectedMonth] = useState('October');
    const [selectedExec, setSelectedExec] = useState('All Executives');
    const [showMonthModal, setShowMonthModal] = useState(false);
    const [showExecModal, setShowExecModal] = useState(false);
    const [executivesList, setExecutivesList] = useState<string[]>(['All Executives']);

    // Update executives list helper
    const updateExecutivesList = (data: any[]) => {
        const names = data.map((item: any) => item.name);
        // Unique names only just in case, though API returns unique users
        const uniqueNames = Array.from(new Set(names));
        setExecutivesList(['All Executives', ...uniqueNames]);
    };


    // API state
    const [loading, setLoading] = useState(true);
    const [todayData, setTodayData] = useState<any[]>([]);
    const [monthlyData, setMonthlyData] = useState<any[]>([]);
    const [todaySummary, setTodaySummary] = useState({ present: 0, absent: 0, late: 0 });

    // Fetch Today's Attendance
    const fetchTodayAttendance = async () => {
        try {
            setLoading(true);
            const response = await fetchWithToken(`${SERVER_URL}/attendance/monitor-today`);
            const data = await response.json();

            // Transform to match frontend structure
            const transformedLogs = data.logs.map((log: any) => ({
                id: log.user_id.toString(),
                name: log.name,
                role: log.role,
                status: log.status,
                checkIn: log.check_in || '--',
                checkOut: log.check_out || '--',
                location: log.location || '--'
            }));

            setTodayData(transformedLogs);
            setTodaySummary({
                present: data.present_count,
                absent: data.absent_count,
                late: data.late_count
            });
            updateExecutivesList(transformedLogs);
        } catch (error) {
            console.error('Error fetching today attendance:', error);
            setTodayData([]);
        } finally {
            setLoading(false);
        }
    };

    // Fetch Monthly Attendance
    const fetchMonthlyAttendance = async () => {
        try {
            setLoading(true);
            const monthIndex = MONTHS.indexOf(selectedMonth) + 1;
            const currentYear = new Date().getFullYear();
            const response = await fetchWithToken(`${SERVER_URL}/attendance/monitor-monthly-list?month=${monthIndex}&year=${currentYear}`);
            const data = await response.json();

            // Transform to match frontend structure
            const transformedData = data.map((report: any) => ({
                id: report.user_id.toString(),
                name: report.user_name,
                role: report.role,
                leaves: report.leaves_taken_count,
                present: report.days_present_count,
                late: report.late_marks_count,
                score: `${report.score_percentage}%`,
                leaveHistory: report.leave_history.map((h: any) => ({
                    date: h.date_str,
                    reason: h.reason
                })),
                lateHistory: report.late_history.map((h: any) => ({
                    date: h.date_str,
                    time: h.time_str
                }))
            }));

            setMonthlyData(transformedData);
            updateExecutivesList(transformedData);
        } catch (error) {
            console.error('Error fetching monthly attendance:', error);
            setMonthlyData([]);
        } finally {
            setLoading(false);
        }
    };

    // Fetch on mount and tab change
    React.useEffect(() => {
        setNavigationRef(navigation);
        if (activeTab === 'Today') {
            fetchTodayAttendance();
        } else {
            fetchMonthlyAttendance();
        }
    }, [activeTab, selectedMonth]);

    // --- HELPER FUNCTIONS ---
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Present': return COLORS.green;
            case 'Absent': return COLORS.red;
            case 'Late': return COLORS.orange;
            case 'On Duty': return COLORS.blue;
            default: return COLORS.textSub;
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Present': return 'check-circle-outline';
            case 'Absent': return 'close-circle-outline';
            case 'Late': return 'clock-alert-outline';
            case 'On Duty': return 'briefcase-check-outline';
            default: return 'help-circle-outline';
        }
    };

    // --- COMPONENT: MONTHLY CARD (Handles Expansion Logic) ---
    const MonthlyAttendanceCard = ({ item }: any) => {
        const [expanded, setExpanded] = useState<'none' | 'leaves' | 'late'>('none');

        const toggleExpand = (section: 'leaves' | 'late') => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setExpanded(prev => prev === section ? 'none' : section);
        };

        // Filter check
        if (selectedExec !== 'All Executives' && item.name !== selectedExec) return null;

        return (
            <View style={styles.card}>
                <View style={[styles.accentBar, { backgroundColor: item.leaves > 3 ? COLORS.red : COLORS.primary }]} />
                <View style={styles.cardContent}>

                    {/* Header Row */}
                    <View style={styles.rowBetween}>
                        <View style={styles.userInfo}>
                            <View style={[styles.avatar, { backgroundColor: '#e0e7ff', borderColor: '#c7d2fe' }]}>
                                <MaterialCommunityIcons name="account" size={18} color={COLORS.primary} />
                            </View>
                            <View>
                                <Text style={styles.userName}>{item.name}</Text>
                                <Text style={styles.userRole}>{item.role}</Text>
                            </View>
                        </View>
                        <View style={styles.scoreBadge}>
                            <Text style={styles.scoreLabel}>Score</Text>
                            <Text style={styles.scoreValue}>{item.score}</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    {/* Stats Grid */}
                    <View style={styles.statsGrid}>

                        {/* 1. LEAVES BOX (Clickable) */}
                        <TouchableOpacity
                            style={[styles.statBox, styles.leaveBox, expanded === 'leaves' && styles.activeBox]}
                            activeOpacity={0.7}
                            onPress={() => toggleExpand('leaves')}
                        >
                            <Text style={[styles.statValue, { color: COLORS.red }]}>{item.leaves}</Text>
                            <Text style={[styles.statLabel, { color: '#b91c1c' }]}>Leaves Taken</Text>
                            {item.leaves > 0 && (
                                <MaterialCommunityIcons name={expanded === 'leaves' ? "chevron-up" : "chevron-down"} size={16} color="#b91c1c" style={{ marginTop: 4 }} />
                            )}
                        </TouchableOpacity>

                        {/* 2. PRESENT BOX (Static) */}
                        <View style={styles.statBox}>
                            <Text style={[styles.statValue, { color: COLORS.green }]}>{item.present}</Text>
                            <Text style={styles.statLabel}>Days Present</Text>
                        </View>

                        {/* 3. LATE BOX (Clickable) */}
                        <TouchableOpacity
                            style={[styles.statBox, expanded === 'late' && styles.activeBox]}
                            activeOpacity={0.7}
                            onPress={() => toggleExpand('late')}
                        >
                            <Text style={[styles.statValue, { color: COLORS.orange }]}>{item.late}</Text>
                            <Text style={styles.statLabel}>Late Marks</Text>
                            {item.late > 0 && (
                                <MaterialCommunityIcons name={expanded === 'late' ? "chevron-up" : "chevron-down"} size={16} color={COLORS.orange} style={{ marginTop: 4 }} />
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* --- EXPANDED DETAILS SECTION --- */}
                    {expanded === 'leaves' && (
                        <View style={styles.detailsContainer}>
                            <Text style={styles.detailHeader}>Leave History</Text>
                            {item.leaveHistory.length > 0 ? (
                                item.leaveHistory.map((h: any, i: number) => (
                                    <View key={i} style={styles.historyRow}>
                                        <View style={styles.historyDate}>
                                            <MaterialCommunityIcons name="calendar-remove" size={14} color={COLORS.red} />
                                            <Text style={styles.hDateText}>{h.date}</Text>
                                        </View>
                                        <Text style={styles.hReasonText}>{h.reason}</Text>
                                    </View>
                                ))
                            ) : (
                                <Text style={styles.noDataText}>No leaves taken.</Text>
                            )}
                        </View>
                    )}

                    {expanded === 'late' && (
                        <View style={styles.detailsContainer}>
                            <Text style={styles.detailHeader}>Late Mark History</Text>
                            {item.lateHistory.length > 0 ? (
                                item.lateHistory.map((h: any, i: number) => (
                                    <View key={i} style={styles.historyRow}>
                                        <View style={styles.historyDate}>
                                            <MaterialCommunityIcons name="clock-alert" size={14} color={COLORS.orange} />
                                            <Text style={styles.hDateText}>{h.date}</Text>
                                        </View>
                                        <Text style={styles.hReasonText}>Arrived at {h.time}</Text>
                                    </View>
                                ))
                            ) : (
                                <Text style={styles.noDataText}>No late marks.</Text>
                            )}
                        </View>
                    )}

                </View>
            </View>
        );
    };

    // --- RENDER TODAY ITEM ---
    const renderTodayItem = ({ item }: any) => {
        const statusColor = getStatusColor(item.status);
        return (
            <View style={styles.card}>
                <View style={[styles.accentBar, { backgroundColor: statusColor }]} />
                <View style={styles.cardContent}>
                    <View style={styles.rowBetween}>
                        <View style={styles.userInfo}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
                            </View>
                            <View>
                                <Text style={styles.userName}>{item.name}</Text>
                                <Text style={styles.userRole}>{item.role}</Text>
                            </View>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: statusColor + '15', borderColor: statusColor + '30' }]}>
                            <MaterialCommunityIcons name={getStatusIcon(item.status)} size={14} color={statusColor} style={{ marginRight: 4 }} />
                            <Text style={[styles.statusText, { color: statusColor }]}>{item.status}</Text>
                        </View>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.timeRow}>
                        <View style={styles.timeBlock}>
                            <Text style={styles.timeLabel}>Check In</Text>
                            <Text style={[styles.timeValue, { color: COLORS.green }]}>{item.checkIn}</Text>
                        </View>
                        <View style={styles.vDivider} />
                        <View style={styles.timeBlock}>
                            <Text style={styles.timeLabel}>Check Out</Text>
                            <Text style={[styles.timeValue, { color: COLORS.red }]}>{item.checkOut}</Text>
                        </View>
                        <View style={styles.vDivider} />
                        <View style={styles.timeBlock}>
                            <Text style={styles.timeLabel}>Location</Text>
                            <Text style={styles.timeValue}>{item.location}</Text>
                        </View>
                    </View>
                </View>
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
                <Text style={styles.headerTitle}>Attendance Monitor</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* TAB SWITCHER */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tabBtn, activeTab === 'Today' && styles.activeTabBtn]}
                    onPress={() => setActiveTab('Today')}
                >
                    <Text style={[styles.tabText, activeTab === 'Today' && styles.activeTabText]}>Today</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tabBtn, activeTab === 'Monthly' && styles.activeTabBtn]}
                    onPress={() => setActiveTab('Monthly')}
                >
                    <Text style={[styles.tabText, activeTab === 'Monthly' && styles.activeTabText]}>Monthly Report</Text>
                </TouchableOpacity>
            </View>

            {/* CONTENT AREA */}
            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : activeTab === 'Today' ? (
                <FlatList
                    data={todayData}
                    renderItem={renderTodayItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    ListHeaderComponent={
                        <>
                            <View style={styles.dateStrip}>
                                <MaterialCommunityIcons name="calendar-month" size={20} color={COLORS.primary} style={{ marginRight: 8 }} />
                                <Text style={styles.dateText}>{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
                            </View>
                            <View style={styles.statsRow}>
                                <View style={[styles.miniStat, { borderBottomColor: COLORS.green }]}>
                                    <Text style={styles.msCount}>{todaySummary.present}</Text>
                                    <Text style={styles.msLabel}>Present</Text>
                                </View>
                                <View style={[styles.miniStat, { borderBottomColor: COLORS.red }]}>
                                    <Text style={styles.msCount}>{todaySummary.absent.toString().padStart(2, '0')}</Text>
                                    <Text style={styles.msLabel}>Absent</Text>
                                </View>
                                <View style={[styles.miniStat, { borderBottomColor: COLORS.orange }]}>
                                    <Text style={styles.msCount}>{todaySummary.late.toString().padStart(2, '0')}</Text>
                                    <Text style={styles.msLabel}>Late</Text>
                                </View>
                            </View>
                        </>
                    }
                />
            ) : (
                <>
                    {/* MONTHLY FILTERS */}
                    <View style={styles.filterContainer}>
                        <TouchableOpacity style={styles.dropdown} onPress={() => setShowMonthModal(true)}>
                            <MaterialCommunityIcons name="calendar" size={18} color={COLORS.textSub} />
                            <Text style={styles.ddText}>{selectedMonth}</Text>
                            <MaterialCommunityIcons name="chevron-down" size={18} color={COLORS.textSub} />
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.dropdown, { flex: 1.5 }]} onPress={() => setShowExecModal(true)}>
                            <MaterialCommunityIcons name="account-search" size={18} color={COLORS.textSub} />
                            <Text style={styles.ddText} numberOfLines={1}>{selectedExec}</Text>
                            <MaterialCommunityIcons name="chevron-down" size={18} color={COLORS.textSub} />
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        data={monthlyData}
                        renderItem={({ item }) => <MonthlyAttendanceCard item={item} />}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.listContainer}
                        showsVerticalScrollIndicator={false}
                    />
                </>
            )}

            {/* --- MODALS --- */}
            <Modal visible={showMonthModal} transparent animationType="fade">
                <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowMonthModal(false)}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalHeader}>Select Month</Text>
                        <ScrollView style={{ maxHeight: 300 }}>
                            {MONTHS.map(m => (
                                <TouchableOpacity key={m} style={styles.modalItem} onPress={() => { setSelectedMonth(m); setShowMonthModal(false); }}>
                                    <Text style={[styles.modalItemText, selectedMonth === m && { color: COLORS.primary, fontWeight: '700' }]}>{m}</Text>
                                    {selectedMonth === m && <MaterialCommunityIcons name="check" size={18} color={COLORS.primary} />}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>

            <Modal visible={showExecModal} transparent animationType="fade">
                <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowExecModal(false)}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalHeader}>Select Executive</Text>
                        <ScrollView style={{ maxHeight: 300 }}>
                            {executivesList.map(e => (
                                <TouchableOpacity key={e} style={styles.modalItem} onPress={() => { setSelectedExec(e); setShowExecModal(false); }}>
                                    <Text style={[styles.modalItemText, selectedExec === e && { color: COLORS.primary, fontWeight: '700' }]}>{e}</Text>
                                    {selectedExec === e && <MaterialCommunityIcons name="check" size={18} color={COLORS.primary} />}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>

        </SafeAreaView>
    );
};

export default AttendanceMonitorScreen;

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: COLORS.bg },

    /* HEADER */
    headerContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15 },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, borderWidth: 1, borderColor: '#f1f5f9' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.primary },

    /* TABS */
    tabContainer: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 15, backgroundColor: '#e0e7ff', borderRadius: 10, padding: 4 },
    tabBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 8 },
    activeTabBtn: { backgroundColor: '#fff', elevation: 2 },
    tabText: { fontWeight: '600', color: '#64748b' },
    activeTabText: { color: COLORS.primary, fontWeight: '700' },

    /* FILTERS */
    filterContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 15, gap: 10 },
    dropdown: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border },
    ddText: { fontSize: 13, fontWeight: '600', color: COLORS.textMain, flex: 1, marginLeft: 8 },

    /* LIST STYLES */
    listContainer: { paddingHorizontal: 20, paddingBottom: 20 },
    card: { flexDirection: 'row', backgroundColor: COLORS.cardBg, borderRadius: 16, marginBottom: 16, overflow: 'hidden', shadowColor: '#64748b', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    accentBar: { width: 5 },
    cardContent: { flex: 1, padding: 15 },

    /* USER INFO */
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    userInfo: { flexDirection: 'row', alignItems: 'center' },
    avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', marginRight: 10, borderWidth: 1, borderColor: '#e2e8f0' },
    avatarText: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
    userName: { fontSize: 14, fontWeight: '700', color: COLORS.textMain },
    userRole: { fontSize: 11, color: COLORS.textSub },

    /* STATUS BADGE (TODAY) */
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
    statusText: { fontSize: 10, fontWeight: '700' },

    /* SCORE BADGE (MONTHLY) */
    scoreBadge: { alignItems: 'flex-end' },
    scoreLabel: { fontSize: 9, color: '#94a3b8' },
    scoreValue: { fontSize: 16, fontWeight: '900', color: COLORS.primary },

    divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 12 },

    /* STATS GRID */
    statsGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
    statBox: { flex: 1, backgroundColor: '#f8fafc', padding: 10, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9', minHeight: 60, justifyContent: 'center' },
    leaveBox: { backgroundColor: '#fef2f2', borderColor: '#fee2e2' },
    activeBox: { borderColor: COLORS.primary, backgroundColor: '#e0e7ff' }, // Highlight when expanded
    statValue: { fontSize: 16, fontWeight: '800', marginBottom: 2 },
    statLabel: { fontSize: 9, color: '#64748b', fontWeight: '600', textAlign: 'center' },

    /* EXPANDED DETAILS */
    detailsContainer: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
    detailHeader: { fontSize: 12, fontWeight: '700', color: COLORS.primary, marginBottom: 8, textTransform: 'uppercase' },
    historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, backgroundColor: '#f9fafb', padding: 8, borderRadius: 6 },
    historyDate: { flexDirection: 'row', alignItems: 'center' },
    hDateText: { fontSize: 12, fontWeight: '700', color: COLORS.textMain, marginLeft: 6 },
    hReasonText: { fontSize: 12, color: COLORS.textSub, fontStyle: 'italic' },
    noDataText: { fontSize: 12, color: '#94a3b8', fontStyle: 'italic', textAlign: 'center' },

    /* TODAY VIEW EXTRAS */
    dateStrip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
    dateText: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 15 },
    miniStat: { flex: 1, backgroundColor: '#fff', marginHorizontal: 4, borderRadius: 8, padding: 10, alignItems: 'center', borderBottomWidth: 3, shadowColor: '#000', shadowOpacity: 0.05, elevation: 2 },
    msCount: { fontSize: 16, fontWeight: '800', color: COLORS.textMain },
    msLabel: { fontSize: 10, color: '#64748b' },
    timeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    timeBlock: { flex: 1, alignItems: 'center' },
    timeLabel: { fontSize: 10, color: '#94a3b8', marginBottom: 2 },
    timeValue: { fontSize: 12, fontWeight: '600', color: COLORS.textMain },
    vDivider: { width: 1, height: 20, backgroundColor: '#f1f5f9' },

    /* MODAL */
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: '80%', backgroundColor: '#fff', borderRadius: 12, padding: 20 },
    modalHeader: { fontSize: 16, fontWeight: '700', marginBottom: 15, color: COLORS.primary },
    modalItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    modalItemText: { fontSize: 14, color: COLORS.textSub },
});