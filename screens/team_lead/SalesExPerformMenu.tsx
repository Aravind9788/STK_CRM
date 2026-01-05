import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SERVER_URL } from '../../config';

// --- THEME CONSTANTS ---
const COLORS = {
  bg: '#F8F9FD',
  primary: '#002d69',
  cardBg: '#ffffff',
  textMain: '#1e293b',
  textSub: '#64748b',

  // Expanded Palette for Grid
  blueAccent: '#3b82f6',
  tealAccent: '#10b981',
  orangeAccent: '#f59e0b',
  redAccent: '#ef4444',
  purpleAccent: '#8b5cf6',
  indigoAccent: '#6366f1',
  pinkAccent: '#ec4899',
  cyanAccent: '#06b6d4',
};

const SalesExPerformMenu = ({ navigation }: any) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);

      // Get authentication token
      const token = await AsyncStorage.getItem('userToken');
      const headers = {
        'Authorization': `Bearer ${token}`,
      };

      // Fetch multiple endpoints in parallel
      const [teamStatsRes, pendingLeadsRes, pendingApprovalsRes] = await Promise.all([
        fetch(`${SERVER_URL}/team-lead/team-stats`, { headers }),
        fetch(`${SERVER_URL}/team-lead/pending-leads-overview`, { headers }),
        fetch(`${SERVER_URL}/team-lead/pending-approvals`, { headers })
      ]);

      const teamStats = teamStatsRes.ok ? await teamStatsRes.json() : { overall_conversion_rate: 0 };
      const pendingLeads = pendingLeadsRes.ok ? await pendingLeadsRes.json() : { total_pending: 0 };
      const pendingApprovals = pendingApprovalsRes.ok ? await pendingApprovalsRes.json() : [];

      setMetrics({
        conversionRate: teamStats.overall_conversion_rate || 0,
        pendingLeadsCount: pendingLeads.total_pending || 0,
        quotationsCount: Array.isArray(pendingApprovals) ? pendingApprovals.length : 0,
        leaveRequestsCount: 0 // Placeholder - can be connected to leave endpoint later
      });
    } catch (error) {
      console.error('Error fetching metrics:', error);
      setMetrics({
        conversionRate: 0,
        pendingLeadsCount: 0,
        quotationsCount: 0,
        leaveRequestsCount: 0
      });
    } finally {
      setLoading(false);
    }
  };

  // --- SQUARE MENU CARD COMPONENT ---
  const MenuCard = ({
    title,
    subtitle,
    value,
    icon,
    color,
    onPress,
  }: any) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={onPress}
    >
      {/* Icon Circle */}
      <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
        <MaterialCommunityIcons name={icon} size={32} color={color} />
      </View>

      {/* Text Content */}
      <View style={styles.textContainer}>
        <Text style={styles.cardTitle} numberOfLines={1}>{title}</Text>
        <Text style={styles.cardSubtitle} numberOfLines={1}>{subtitle}</Text>

        {value && (
          <View style={[styles.valueBadge, { backgroundColor: color + '10' }]}>
            <Text style={[styles.cardValue, { color: color }]} numberOfLines={1}>
              {value}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* ===== HEADER ===== */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.primary} />
          </TouchableOpacity>

          <Image
            source={{ uri: 'https://stkassociates.co.in/wp-content/uploads/STK-Associates-Logo-1.png' }}
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={{ width: 40 }} />
        </View>

        {/* ===== TITLE ===== */}
        <View style={styles.titleSection}>
          <Text style={styles.pageTitle}>Performance Dashboard</Text>
          <Text style={styles.pageSubtitle}>Overview & Quick Actions</Text>
        </View>

        {/* ===== GRID SECTION ===== */}
        <View style={styles.gridContainer}>

          {loading ? (
            <View style={{ width: '100%', padding: 40, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : (
            <>
              {/* 1. Team Overview */}
              <MenuCard
                title="Team Stats"
                subtitle="Overview"
                value={`${metrics?.conversionRate || 0}% Conv.`}
                icon="chart-donut"
                color={COLORS.blueAccent}
                onPress={() => navigation.navigate('TeamPerformanceDashboard')}
              />

              {/* 2. Individual */}
              <MenuCard
                title="Individual"
                subtitle="Personal"
                value="Top 5%"
                icon="account-tie"
                color={COLORS.tealAccent}
                onPress={() => navigation.navigate('IndividualPerformance')}
              />

              {/* 3. Pending Leads */}
              <MenuCard
                title="Pending Leads"
                subtitle="Action Needed"
                value={`${metrics?.pendingLeadsCount || 0} Pending`}
                icon="clock-alert-outline"
                color={COLORS.orangeAccent}
                onPress={() => navigation.navigate('PendingLeadsOverview')}
              />

              {/* 4. Time Tracking */}
              <MenuCard
                title="Time Logs"
                subtitle="Daily Tracker"
                value="Active Now"
                icon="chart-timeline-variant"
                color={COLORS.purpleAccent}
                onPress={() => navigation.navigate('TimestampReport')}
              />

              {/* 5. Attendance */}
              <MenuCard
                title="Attendance"
                subtitle="Monitor"
                value="View Log"
                icon="calendar-clock"
                color={COLORS.cyanAccent}
                onPress={() => navigation.navigate('AttendanceMonitorScreen')}
              />

              {/* 6. Quotation Approvals */}
              <MenuCard
                title="Quotations"
                subtitle="Approvals"
                value={`${metrics?.quotationsCount || 0} Pending`}
                icon="file-document-check-outline"
                color={COLORS.indigoAccent}
                onPress={() => navigation.navigate('QuotationMenuScreen')}
              />

              {/* 7. Leave Management */}
              <MenuCard
                title="Leave Requests"
                subtitle="Manage"
                value={`${metrics?.leaveRequestsCount || 0} Requests`}
                icon="calendar-remove"
                color={COLORS.pinkAccent}
                onPress={() => navigation.navigate('LeaveMenuScreen')}
              />

              {/* 8. Add Staff */}
              <MenuCard
                title="Add Staff"
                subtitle="Admin"
                value="New User"
                icon="account-plus-outline"
                color={COLORS.blueAccent}
                onPress={() => navigation.navigate('AddStaffScreen')}
              />

              {/* 9. Low Performers (Alert) */}
              <MenuCard
                title="Low Performers"
                subtitle="Critical"
                value="View All"
                icon="alert-circle-outline"
                color={COLORS.redAccent}
                onPress={() => navigation.navigate('LowPerformerProfiles')}
              />

              <MenuCard
                title="Pending Leads Tracking"
                subtitle="Stage Tracker"
                value="View Progress"
                icon="chart-timeline"
                color={COLORS.orangeAccent}
                onPress={() => navigation.navigate('PendingLeadsTrackingScreen')}
              />
            </>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default SalesExPerformMenu;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },

  /* HEADER */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  logo: {
    width: 140,
    height: 45,
  },

  /* TITLE */
  titleSection: {
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 13,
    color: COLORS.textSub,
    marginTop: 2,
    fontWeight: '500',
  },

  /* GRID CONTAINER */
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12, // Native gap for consistent spacing
  },

  /* SQUARE CARD */
  card: {
    width: '48%', // Ensures 2 items per row
    aspectRatio: 1, // Makes it a square
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    // Elegant Shadow
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 12, // Fallback for older RN without gap
  },

  /* ICON */
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  /* TEXT */
  textContainer: {
    alignItems: 'center',
    width: '100%',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textMain,
    textAlign: 'center',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 11,
    color: COLORS.textSub,
    textAlign: 'center',
    marginBottom: 8,
  },

  /* VALUE BADGE */
  valueBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    maxWidth: '90%',
  },
  cardValue: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
});