import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// --- THEME CONSTANTS ---
const COLORS = {
  primary: '#004aad',
  background: '#f8f9fa',
  white: '#ffffff',
  text: '#002d69',
  subText: '#64748b',
  border: '#e2e8f0',
  accentBG: '#f1f5f9',
  success: '#10B981',
};

const TRACKING_DATA = [
  {
    id: '1',
    title: 'Lead Created',
    icon: 'account-plus',
    startTime: '10:00:00 AM',
    endTime: '10:05:30 AM',
    totalTime: '05:30',
  },
  {
    id: '2',
    title: 'Quotation Time',
    icon: 'file-document-edit',
    startTime: '10:05:30 AM',
    endTime: '10:25:00 AM',
    totalTime: '19:30',
  },
  {
    id: '3',
    title: 'Approval Time',
    icon: 'check-decagram',
    startTime: '10:25:00 AM',
    endTime: '10:45:15 AM',
    totalTime: '20:15',
  },
  {
    id: '4',
    title: 'Quotation Sent',
    icon: 'send-circle',
    startTime: '10:45:15 AM',
    endTime: '10:46:00 AM',
    totalTime: '00:45',
  },
  // --- NEW ADDITIONS BELOW ---
  {
    id: '5',
    title: 'Followup Stages',
    icon: 'list-status',
    startTime: '11:00:00 AM',
    endTime: '11:15:20 AM',
    totalTime: '15:20',
  },
  {
    id: '6',
    title: 'Next Followup Set',
    icon: 'calendar-clock',
    startTime: '11:15:20 AM',
    endTime: '11:16:45 AM',
    totalTime: '01:25',
  },
  {
    id: '7',
    title: 'Advance Received',
    icon: 'cash-fast',
    startTime: '02:30:00 PM',
    endTime: '02:35:10 PM',
    totalTime: '05:10',
  },
  {
    id: '8',
    title: 'Delivery Marked',
    icon: 'truck-check', // Icon for delivery button click
    startTime: '04:00:00 PM',
    endTime: '04:00:05 PM',
    totalTime: '00:05',
  },
];

const TimeTrackingScreen = ({ navigation, route }: any) => {
  // Optional: Get customer name from previous screen
  const { customerName } = route?.params || { customerName: 'Lead #1024 Details' };

  // --- RENDER SINGLE CARD ---
  const renderTrackingCard = (item: any) => (
    <View key={item.id} style={styles.cardContainer}>

      {/* === LEFT SIDE: Details === */}
      <View style={styles.leftSection}>

        {/* Title Row */}
        <View style={styles.titleRow}>
          <View style={styles.iconBox}>
            <Icon name={item.icon} size={18} color={COLORS.primary} />
          </View>
          <Text style={styles.cardTitle}>{item.title}</Text>
        </View>

        {/* Time Row */}
        <View style={styles.timeRow}>
          {/* Start Time */}
          <View style={styles.timeBlock}>
            <Text style={styles.timeLabel}>Start Time</Text>
            <Text style={styles.timeValue}>{item.startTime}</Text>
          </View>

          {/* Arrow Icon */}
          <Icon name="arrow-right-thin" size={20} color={COLORS.subText} style={{ marginTop: 12 }} />

          {/* End Time */}
          <View style={styles.timeBlock}>
            <Text style={styles.timeLabel}>End Time</Text>
            <Text style={styles.timeValue}>{item.endTime}</Text>
          </View>
        </View>
      </View>

      {/* === DIVIDER LINE === */}
      <View style={styles.verticalDivider} />

      {/* === RIGHT SIDE: Total Duration === */}
      <View style={styles.rightSection}>
        <Text style={styles.totalLabel}>TOTAL</Text>
        <View style={styles.totalBadge}>
          <Icon name="timer-outline" size={14} color={COLORS.white} style={{ marginRight: 4 }} />
          <Text style={styles.totalValue}>{item.totalTime}</Text>
        </View>
        <Text style={styles.unitLabel}>min : sec</Text>
      </View>

    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* --- HEADER --- */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Time Tracking</Text>
          <Text style={styles.headerSubtitle}>{customerName}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* --- CONTENT --- */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Render all cards from data */}
        {TRACKING_DATA.map((item) => renderTrackingCard(item))}

        {/* Summary Footer */}
        <View style={styles.footerSummary}>
          <Text style={styles.footerText}>Total Process Duration</Text>
          <Text style={styles.footerTime}>01:08:20 hours</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
    ...Platform.select({ android: { paddingTop: StatusBar.currentHeight } }),
  },

  // HEADER
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    elevation: 2,
  },
  backBtn: { padding: 5 },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.subText,
    textAlign: 'center',
    marginTop: 2
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  // === CARD STYLES ===
  cardContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
    overflow: 'hidden',
    minHeight: 110,
  },

  // LEFT SECTION
  leftSection: {
    flex: 2.2,
    padding: 15,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e0e7ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  timeBlock: {
    alignItems: 'flex-start',
  },
  timeLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  timeValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },

  // DIVIDER
  verticalDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginVertical: 10,
  },

  // RIGHT SECTION
  rightSection: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: '#f1f5f9',
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    marginBottom: 6,
    letterSpacing: 1,
  },
  totalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.white,
  },
  unitLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#94a3b8',
  },

  // FOOTER
  footerSummary: {
    marginTop: 10,
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#e0e7ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#c7d2fe',
    borderStyle: 'dashed',
  },
  footerText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 4,
  },
  footerTime: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
});

export default TimeTrackingScreen;