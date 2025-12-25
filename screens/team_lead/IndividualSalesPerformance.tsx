import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  Modal,
  FlatList,
  Alert,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SERVER_URL } from '../../config';

const PRIMARY_COLOR = '#004aad';
const BG_COLOR = '#F5F9FF';
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// --- Types ---
interface PerformanceData {
  userName: string;
  role: string;
  status: string;
  followUps: number;
  dailyGoal: {
    sent: number;
    target: number;
  };
  leadsCompleted: {
    current: number;
    target: number;
    percentage: number;
  };
}

// --- Data Generators ---
const generateDailyData = () => [
  { label: '9 AM', value: 2500 },
  { label: '11 AM', value: 6200 },
  { label: '1 PM', value: 4100 },
  { label: '3 PM', value: 8500 },
  { label: '5 PM', value: 3200 },
];

const generateWeeklyData = () => [
  { label: 'Mon', value: 12500 },
  { label: 'Tue', value: 18000 },
  { label: 'Wed', value: 9500 },
  { label: 'Thu', value: 22000 },
  { label: 'Fri', value: 16000 },
  { label: 'Sat', value: 8000 },
];

const generateMonthlyData = () => [
  { label: 'Wk 1', value: 45000 },
  { label: 'Wk 2', value: 58000 },
  { label: 'Wk 3', value: 42000 },
  { label: 'Wk 4', value: 65000 },
];

const IndividualSalesPerformance = () => {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);

  // --- Calendar Date Selection State ---
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear().toString());
  const [calMonthIndex, setCalMonthIndex] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  
  // --- Chart Filter State ---
  const [chartYear, setChartYear] = useState(today.getFullYear().toString());
  const [chartMonthIndex, setChartMonthIndex] = useState(today.getMonth());

  // --- Modal State ---
  const [isMonthPickerVisible, setIsMonthPickerVisible] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<'calendar' | 'chart'>('calendar');

  // --- Chart Data State ---
  const [selectedTab, setSelectedTab] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [chartData, setChartData] = useState(generateDailyData());
  const [dailyGoalStats, setDailyGoalStats] = useState({ achieved: 6500, target: 10000 });

  useEffect(() => {
    fetchPerformanceData();
  }, []);

  // Update chart when Tab changes
  useEffect(() => {
    refreshChartData();
  }, [selectedTab]);

  // Update Daily Goal when Calendar Day changes
  useEffect(() => {
    const randomAchieved = Math.floor(Math.random() * 8000) + 1000;
    setDailyGoalStats({ achieved: randomAchieved, target: 10000 });
  }, [selectedDay]);

  const fetchPerformanceData = async () => {
    setLoading(true);
    setTimeout(() => {
        setData({
            userName: 'John Smith',
            role: 'Sales Executive',
            status: 'Active',
            followUps: 12,
            dailyGoal: { sent: 18, target: 10 },
            leadsCompleted: { current: 7, target: 10, percentage: 70 },
        });
        setLoading(false);
    }, 1000);
  };

  const refreshChartData = () => {
    let newData = [];
    if (selectedTab === 'daily') newData = generateDailyData();
    else if (selectedTab === 'weekly') newData = generateWeeklyData();
    else newData = generateMonthlyData();

    const randomMultiplier = Math.random() * 0.5 + 0.7; 
    setChartData(newData.map(d => ({ ...d, value: Math.floor(d.value * randomMultiplier) })));
  };

  // --- Handlers ---
  const handleChartFilterSubmit = () => {
    if (!chartYear || isNaN(Number(chartYear)) || chartYear.length !== 4) {
        Alert.alert("Invalid Year", "Please enter a valid 4-digit year.");
        return;
    }
    refreshChartData();
    Alert.alert("Chart Updated", `Showing data for ${MONTHS[chartMonthIndex]} ${chartYear}`);
  };

  const openMonthPicker = (target: 'calendar' | 'chart') => {
      setPickerTarget(target);
      setIsMonthPickerVisible(true);
  };

  const handleMonthSelect = (index: number) => {
      if (pickerTarget === 'calendar') {
          setCalMonthIndex(index);
      } else {
          setChartMonthIndex(index);
      }
      setIsMonthPickerVisible(false);
  };

  // --- 1. Custom Calendar Grid ---
  const CalendarGrid = () => {
    const year = parseInt(calYear) || today.getFullYear();
    const month = calMonthIndex;

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday

    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    return (
        <View style={styles.calendarWrapper}>
            <View style={styles.weekRow}>
                {weekDays.map((d, i) => (
                    <Text key={i} style={styles.weekHeader}>{d}</Text>
                ))}
            </View>
            <View style={styles.daysGrid}>
                {days.map((day, index) => {
                    if (day === null) return <View key={index} style={styles.dayCell} />;
                    const isSelected = day === selectedDay;
                    return (
                        <TouchableOpacity 
                            key={index} 
                            style={[styles.dayCell, isSelected && styles.activeDayCell]}
                            onPress={() => setSelectedDay(day)}
                        >
                            <Text style={[styles.dayText, isSelected && styles.activeDayText]}>
                                {day}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
  };

  // --- 2. Donut Chart ---
  const DonutChart = ({ achieved, target }: { achieved: number, target: number }) => {
    const percentage = Math.min(100, Math.max(0, (achieved / target) * 100));
    let color = '#F87171';
    if(percentage > 50) color = '#FDBA74';
    if(percentage > 80) color = '#4ADE80';

    return (
        <View style={styles.donutContainer}>
            <View style={[styles.donutOuter, { borderColor: '#E2E8F0' }]}>
                <View style={styles.donutInner}>
                    <Text style={styles.donutPercent}>{Math.round(percentage)}%</Text>
                </View>
            </View>
            <View style={[styles.donutProgress, { borderTopColor: color, borderRightColor: percentage > 50 ? color : 'transparent' }]} />
            <Text style={styles.donutLabel}>Daily Goal</Text>
            <Text style={styles.donutValue}>₹{(achieved/1000).toFixed(1)}k / {(target/1000).toFixed(1)}k</Text>
        </View>
    );
  };

  // --- 3. Square Bar Chart (Fixed Alignment) ---
  const BarChart = ({ data }: { data: { label: string, value: number }[] }) => {
    const maxValue = Math.max(...data.map(d => d.value));
    const ceiling = Math.ceil(maxValue / 1000) * 1000 || 1000;
    
    // Create 5 Y-axis ticks
    const ticks = [ceiling, ceiling * 0.75, ceiling * 0.5, ceiling * 0.25, 0];
    const PLOT_HEIGHT = 180; // Fixed height for exact alignment

    const formatYLabel = (val: number) => {
        if (val >= 1000) return `${(val/1000).toFixed(0)}k`;
        return val.toString();
    };

    const formatValueLabel = (val: number) => {
        if (val >= 1000) return `${(val/1000).toFixed(1)}k`;
        return val.toString();
    };

    return (
      <View style={{ marginTop: 15 }}>
        
        {/* Main Chart Area (Y-Axis + Plot) */}
        <View style={{ flexDirection: 'row', height: PLOT_HEIGHT }}>
            
            {/* Y-Axis Column */}
            <View style={{ width: 40, justifyContent: 'space-between', height: '100%', paddingRight: 8 }}>
                {ticks.map((tick, index) => (
                    // Shift text up by half fontSize to center on the grid line
                    <Text key={index} style={[styles.yAxisText, { transform: [{ translateY: -6 }] }]}>
                        {formatYLabel(tick)}
                    </Text>
                ))}
            </View>

            {/* Plot Area */}
            <View style={{ flex: 1, height: '100%', position: 'relative' }}>
                {/* Horizontal Grid Lines */}
                {ticks.map((_, index) => (
                    <View 
                        key={`grid-${index}`} 
                        style={[
                            styles.gridLine, 
                            { top: `${(index / (ticks.length - 1)) * 100}%` }
                        ]} 
                    />
                ))}

                {/* Bars Row */}
                <View style={styles.barsRow}>
                    {data.map((item, index) => {
                        const heightPercent = (item.value / ceiling) * 100;
                        return (
                            <View key={index} style={styles.barWrapper}>
                                {/* Amount Label Above Bar */}
                                <Text style={styles.barValueText}>
                                    {formatValueLabel(item.value)}
                                </Text>

                                {/* SQUARE BAR */}
                                <View 
                                    style={[
                                        styles.squareBar, 
                                        { 
                                            height: `${heightPercent}%`,
                                            backgroundColor: PRIMARY_COLOR
                                        }
                                    ]} 
                                />
                            </View>
                        );
                    })}
                </View>
            </View>
        </View>

        {/* X-Axis Labels (Separate Row below Plot) */}
        <View style={{ flexDirection: 'row', marginLeft: 40, marginTop: 8 }}>
            {data.map((item, index) => (
                <View key={index} style={{ flex: 1, alignItems: 'center' }}>
                     <Text style={styles.xAxisText}>{item.label}</Text>
                </View>
            ))}
        </View>

      </View>
    );
  };

  if (loading || !data) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={BG_COLOR} />

      {/* Header */}
      <View style={styles.navHeader}>
        <TouchableOpacity><Icon name="chevron-left" size={30} color={PRIMARY_COLOR} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Performance Analytics</Text>
        <TouchableOpacity><Icon name="bell" size={26} color={PRIMARY_COLOR} /></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* --- MOVED: PROFILE CARD (Now at Top) --- */}
        <View style={styles.card}>
          <View style={styles.profileRow}>
            <View style={styles.iconAvatarContainer}>
              <Icon name='account-tie' size={28} color="#004aad" />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>{data.userName}</Text>
              <Text style={styles.roleText}>Role: {data.role}</Text>
            </View>
            <View style={styles.statusBadge}>
              <Icon name="checkbox-marked-circle" size={16} color="#4ADE80" />
              <Text style={styles.statusText}>{data.status}</Text>
            </View>
          </View>
        </View>

        {/* --- SECTION 1: CALENDAR --- */}
        <View style={styles.card}>
            <Text style={styles.sectionHeader}>Select Period</Text>
            
            <View style={styles.controlRow}>
                <TouchableOpacity 
                    style={styles.monthSelector}
                    onPress={() => openMonthPicker('calendar')}
                >
                    <Text style={styles.controlText}>{MONTHS[calMonthIndex]}</Text>
                    <Icon name="chevron-down" size={20} color="#555" />
                </TouchableOpacity>

                <TextInput
                    style={styles.yearInput}
                    value={calYear}
                    onChangeText={setCalYear}
                    keyboardType="numeric"
                    maxLength={4}
                    placeholder="YYYY"
                />
            </View>

            <View style={styles.calendarRow}>
                <View style={{ flex: 1, marginRight: 10 }}>
                    <CalendarGrid />
                </View>
                <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                    <DonutChart achieved={dailyGoalStats.achieved} target={dailyGoalStats.target} />
                </View>
            </View>
        </View>

        {/* --- SECTION 2: SALES REVENUE (Chart) --- */}
        <View style={styles.card}>
            
            <View style={[styles.controlRow, { marginBottom: 15 }]}>
                <TouchableOpacity 
                    style={styles.monthSelector}
                    onPress={() => openMonthPicker('chart')}
                >
                    <Text style={styles.controlText}>{MONTHS[chartMonthIndex]}</Text>
                    <Icon name="chevron-down" size={20} color="#555" />
                </TouchableOpacity>

                <TextInput
                    style={styles.yearInput}
                    value={chartYear}
                    onChangeText={setChartYear}
                    keyboardType="numeric"
                    maxLength={4}
                    placeholder="YYYY"
                />

                <TouchableOpacity style={styles.tickBtn} onPress={handleChartFilterSubmit}>
                    <Icon name="check" size={20} color="#fff" />
                </TouchableOpacity>
            </View>

            <View style={styles.tabContainer}>
                {['daily', 'weekly', 'monthly'].map((tab) => (
                    <TouchableOpacity 
                        key={tab} 
                        style={[styles.tabButton, selectedTab === tab && styles.tabButtonActive]}
                        onPress={() => setSelectedTab(tab as any)}
                    >
                        <Text style={[styles.tabText, selectedTab === tab && styles.tabTextActive]}>
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
            
            <View style={{ marginBottom: 5 }}>
                <Text style={styles.chartTitle}>Sales Revenue</Text>
                <Text style={styles.chartSubTitle}>
                    Performance for {MONTHS[chartMonthIndex]} {chartYear}
                </Text>
            </View>

            <BarChart data={chartData} />
        </View>

        {/* --- SECTION 3: METRICS --- */}
        <Text style={styles.subTitle}>Activity Metrics</Text>

        <View style={styles.row}>
          <View style={[styles.card, styles.halfCard]}>
             <View style={styles.iconBoxRow}>
                 <Icon name="clock-outline" size={24} color="#F97316" />
                 <Text style={styles.kpiLabel}>Pending</Text>
             </View>
             <Text style={styles.bigNumber}>{data.followUps}</Text>
             <Text style={styles.kpiSub}>Follow-ups</Text>
          </View>

          <View style={[styles.card, styles.halfCard]}>
             <View style={styles.iconBoxRow}>
                 <Icon name="target" size={24} color={PRIMARY_COLOR} />
                 <Text style={styles.kpiLabel}>Daily Goal</Text>
             </View>
             <View style={{flexDirection:'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 5}}>
                 <Text style={styles.bigNumber}>{data.dailyGoal.sent}</Text>
                 <Text style={styles.kpiSub}> / {data.dailyGoal.target}</Text>
             </View>
             <Text style={styles.kpiSub}>Quotations</Text>
          </View>
        </View>

        {/* LEADS COMPLETED CARD */}
        <View style={styles.card}>
          <View style={styles.leadsHeader}>
            <View style={[styles.iconBox, { backgroundColor: '#DBEAFE' }]}>
              <Icon name="checkbox-marked-outline" size={24} color={PRIMARY_COLOR} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.userName}>Leads Completed</Text>
              <Text style={styles.miniLabel}>Target: {data.leadsCompleted.target} Leads</Text>
            </View>
            <Text style={styles.userName}>{data.leadsCompleted.current} / {data.leadsCompleted.target}</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${data.leadsCompleted.percentage}%` }]} />
          </View>
          <Text style={styles.percentLabel}>{data.leadsCompleted.percentage}%</Text>
        </View>

        {/* OVERALL PERFORMANCE */}
        <View style={styles.card}>
          <Text style={styles.userName}>Overall Performance Rating</Text>
          <View style={styles.performanceContainer}>
            <View style={styles.gradientBar}>
              <View style={[styles.segment, { backgroundColor: '#4ADE80', borderTopLeftRadius: 10, borderBottomLeftRadius: 10 }]} />
              <View style={[styles.segment, { backgroundColor: '#86EFAC' }]} />
              <View style={[styles.segment, { backgroundColor: '#FDBA74' }]} />
              <View style={[styles.segment, { backgroundColor: '#F87171', borderTopRightRadius: 10, borderBottomRightRadius: 10 }]} />
            </View>
            <View style={[styles.indicatorDot, { left: '65%' }]}>
              <View style={styles.dotInner} />
            </View>
          </View>
          <View style={styles.legendRow}>
            <LegendItem color="#4ADE80" label="Excellent" />
            <LegendItem color="#86EFAC" label="Good" />
            <LegendItem color="#FDBA74" label="Average" />
            <LegendItem color="#F87171" label="Low" />
          </View>
        </View>

      </ScrollView>

      {/* --- MONTH PICKER MODAL --- */}
      <Modal
        visible={isMonthPickerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsMonthPickerVisible(false)}
      >
        <TouchableOpacity 
            style={styles.modalOverlay} 
            activeOpacity={1} 
            onPress={() => setIsMonthPickerVisible(false)}
        >
            <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Select Month</Text>
                <FlatList
                    data={MONTHS}
                    keyExtractor={(item) => item}
                    renderItem={({ item, index }) => {
                        const isSelected = pickerTarget === 'calendar' 
                            ? index === calMonthIndex 
                            : index === chartMonthIndex;

                        return (
                            <TouchableOpacity 
                                style={styles.modalItem}
                                onPress={() => handleMonthSelect(index)}
                            >
                                <Text style={[
                                    styles.modalItemText, 
                                    isSelected && { color: PRIMARY_COLOR, fontWeight: '700' }
                                ]}>
                                    {item}
                                </Text>
                                {isSelected && <Icon name="check" size={18} color={PRIMARY_COLOR} />}
                            </TouchableOpacity>
                        );
                    }}
                />
            </View>
        </TouchableOpacity>
      </Modal>

    </SafeAreaView>
  );
};

const LegendItem = ({ color, label }: { color: string, label: string }) => (
  <View style={styles.legendItem}>
    <View style={[styles.dot, { backgroundColor: color }]} />
    <Text style={styles.miniLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BG_COLOR },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: 20 },
  navHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 10 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  sectionHeader: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 12 },

  // --- Controls ---
  controlRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  monthSelector: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
    marginRight: 8,
    backgroundColor: '#F8FAFC'
  },
  yearInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
    marginRight: 8,
    backgroundColor: '#F8FAFC',
    textAlign: 'center',
    color: '#333'
  },
  tickBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: PRIMARY_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlText: { fontSize: 14, color: '#334155' },

  // --- Calendar ---
  calendarRow: { flexDirection: 'row', justifyContent: 'space-between' },
  calendarWrapper: { backgroundColor: '#F8FAFC', borderRadius: 8, padding: 5 },
  weekRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 5 },
  weekHeader: { width: 20, textAlign: 'center', fontSize: 10, color: '#94A3B8', fontWeight: '700' },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around' },
  dayCell: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 4, borderRadius: 4 },
  activeDayCell: { backgroundColor: PRIMARY_COLOR },
  dayText: { fontSize: 10, color: '#334155' },
  activeDayText: { color: '#fff', fontWeight: '700' },

  // --- Donut ---
  donutContainer: { alignItems: 'center' },
  donutOuter: { width: 60, height: 60, borderRadius: 30, borderWidth: 5, alignItems: 'center', justifyContent: 'center' },
  donutProgress: { position: 'absolute', top: 0, width: 60, height: 60, borderRadius: 30, borderWidth: 5, borderColor: 'transparent', transform: [{rotate: '45deg'}] },
  donutInner: { position: 'absolute' },
  donutPercent: { fontSize: 12, fontWeight: '800', color: '#1E293B' },
  donutLabel: { fontSize: 9, color: '#64748B', marginTop: 4 },
  donutValue: { fontSize: 9, fontWeight: '700', color: '#1E293B' },

  // --- Chart ---
  tabContainer: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 10, padding: 4, marginBottom: 15 },
  tabButton: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabButtonActive: { backgroundColor: '#FFF', elevation: 2 },
  tabText: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  tabTextActive: { color: PRIMARY_COLOR, fontWeight: '700' },
  chartTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  chartSubTitle: { fontSize: 12, color: '#64748B' },

  // --- Bar Chart Styling ---
  yAxisText: { fontSize: 10, color: '#64748B', textAlign: 'right' },
  gridLine: { 
    position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: '#E2E8F0', 
  },
  barsRow: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'flex-end', 
    justifyContent: 'space-between',
    paddingTop: 10 
  },
  barWrapper: { alignItems: 'center', flex: 1, justifyContent: 'flex-end' },
  barValueText: { fontSize: 9, color: '#64748B', marginBottom: 4, fontWeight: '600' },
  squareBar: { width: 16, minHeight: 2 },
  xAxisText: { fontSize: 10, color: '#64748B' },

  // --- Bottom Metrics ---
  subTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 15 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  halfCard: { width: '48%' },
  iconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  iconBoxRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  kpiLabel: { fontSize: 13, color: '#64748B', fontWeight: '600', marginLeft: 6 },
  bigNumber: { fontSize: 22, fontWeight: '800', color: '#1E293B' },
  kpiSub: { fontSize: 11, color: '#94A3B8', fontWeight: '500' },

  // --- Profile & Overall ---
  profileRow: { flexDirection: 'row', alignItems: 'center' },
  profileInfo: { flex: 1, marginLeft: 15 },
  userName: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  roleText: { fontSize: 14, color: '#64748B' },
  statusBadge: { flexDirection: 'row', alignItems: 'center' },
  statusText: { color: '#4ADE80', fontWeight: '700', marginLeft: 4 },
  iconAvatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  smallCardTitle: {
    fontSize: 13,         
    fontWeight: '700',
    color: '#1E293B',
    marginLeft: 8,
    flexShrink: 1,        
    lineHeight: 16        
  },
  miniLabel: {
    fontSize: 11,
    color: '#64748B',
    marginLeft: 8
  },
  leadsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  progressBarBg: { height: 8, backgroundColor: '#E2E8F0', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: PRIMARY_COLOR },
  percentLabel: { textAlign: 'right', fontSize: 14, fontWeight: '700', color: '#64748B', marginTop: 5 },
  
  performanceContainer: {
    height: 40,
    justifyContent: 'center',
    marginVertical: 15,
    position: 'relative',
  },
  gradientBar: {
    height: 12,
    flexDirection: 'row',
    width: '100%',
    borderRadius: 10,
  },
  segment: {
    flex: 1,
    height: '100%',
  },
  indicatorDot: {
    position: 'absolute',
    top: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotInner: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#86EFAC', 
    borderWidth: 2,
    borderColor: '#FFF',
  },
  legendRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 5 },

  // --- Modal ---
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: 300, backgroundColor: '#fff', borderRadius: 16, padding: 20, maxHeight: 400 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B', marginBottom: 15 },
  modalItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  modalItemText: { fontSize: 16, color: '#333' },
});

export default IndividualSalesPerformance;