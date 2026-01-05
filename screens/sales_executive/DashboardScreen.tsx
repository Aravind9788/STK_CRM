import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
  Image,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SERVER_URL } from '../../config';
import { useNavigation } from '@react-navigation/native';
import { fetchWithToken, setNavigationRef } from '../../fetchWithToken';

// --- Types ---
interface DashboardData {
  userName: string;
  monthlyGoal: {
    current: number;
    target: number;
    percentage: number;
  };
  dailyGoal: {
    current: number;
    target: number;
    percentage: number;
  };
  totalCommission: number;
  todaysActivity: {
    onlineTime: string;
    leadsContacted: number;
    commissionEarned: number;
  };
}

// --- Configuration ---
const USE_DUMMY_DATA = false;
const PRIMARY_COLOR = '#004aad';
const BG_COLOR = '#F5F9FF';

const DUMMY_DATA: DashboardData = {
  userName: 'Mr. Vishnu',
  monthlyGoal: {
    current: 350000,
    target: 500000,
    percentage: 70,
  },
  dailyGoal: {
    current: 5000,
    target: 10000,
    percentage: 100,
  },
  totalCommission: 28500,
  todaysActivity: {
    onlineTime: '6h 45m',
    leadsContacted: 32,
    commissionEarned: 1200,
  },
};

const DashboardScreen = ({ route }: any) => {
  const sales_person_id = route.params?.email;
  const navigation = useNavigation<any>();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setNavigationRef(navigation);
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);

    try {
      console.log(' Dashboard API called');

      const response = await fetchWithToken(`${SERVER_URL}/dashboard/metrics`);
      const result = await response.json();

      console.log(' Dashboard API response:', result);

      const transformedData: DashboardData = {
        userName: sales_person_id || 'User',
        monthlyGoal: {
          current: result.daily_achieved_amount,
          target: result.monthly_goal_amount,
          percentage: Math.round(
            (result.daily_achieved_amount / result.monthly_goal_amount) * 100
          ),
        },
        dailyGoal: {
          current: result.daily_achieved_amount,
          target: result.daily_goal_amount,
          percentage: Math.round(
            (result.daily_achieved_amount / result.daily_goal_amount) * 100
          ),
        },
        totalCommission: 0,
        todaysActivity: {
          onlineTime: '0h',
          leadsContacted: 0,
          commissionEarned: 0,
        },
      };

      setData(transformedData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };



  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatShortCurrency = (amount: number) => {
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`;
    return `₹${amount}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
      </View>
    );
  }

  if (!data) return null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={BG_COLOR} />

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[PRIMARY_COLOR]}
            tintColor={PRIMARY_COLOR}
          />
        }>

        {/* HEADER */}
        <View style={styles.header}>
          {/* Step 2: Replaced Icon with Logo Image */}
          <Image
            source={{ uri: 'https://stkassociates.co.in/wp-content/uploads/STK-Associates-Logo-1.png' }}
            style={styles.logo}
          />

          <View style={styles.bellContainer}>
            <Icon name="bell" size={26} color={PRIMARY_COLOR} />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>3</Text>
            </View>
          </View>
        </View>

        <View style={styles.welcomeSection}>
          <Text style={styles.greeting}>
            Hi, <Text style={styles.userName}>{data.userName}</Text>
          </Text>
          <Text style={styles.subHeader}>Goals & Commission</Text>
        </View>

        {/* MAIN METRIC CARD */}
        <View style={styles.mainCard}>

          {/* Circular Chart */}
          <View style={styles.chartContainer}>
            <View style={styles.circleOuter}>
              <View style={styles.circleInner}>
                <Text style={styles.chartLabel}>Monthly Goal</Text>
                <Text style={styles.chartSubLabel}>
                  {formatShortCurrency(data.monthlyGoal.current)} / {formatShortCurrency(data.monthlyGoal.target)}
                </Text>
                <Text style={styles.chartPercent}>{data.monthlyGoal.percentage}%</Text>
              </View>
              <View style={[styles.progressArc, { transform: [{ rotate: '45deg' }] }]} />
            </View>
          </View>

          {/* Daily Goal Bar */}
          <View style={styles.goalSection}>
            <View style={styles.goalHeader}>
              <Text style={styles.goalTitle}>Daily Goal</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {/* Step 3: Changed to show Money (1000/10000 format) */}
                <Text style={styles.goalPercentText}>
                  {formatCurrency(data.dailyGoal.current)} / {formatCurrency(data.dailyGoal.target)}
                </Text>
              </View>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${Math.min(data.dailyGoal.percentage, 100)}%` }]} />
            </View>
          </View>

          <View style={styles.divider} />

          {/* Total Commission */}
          <View style={styles.totalSection}>
            <Text style={styles.totalLabel}>Total Commission Earned</Text>
            <Text style={styles.totalValue}>{formatCurrency(data.totalCommission)}</Text>
          </View>
        </View>

        {/* GRID BUTTONS (Minimized / Compact) */}
        <View style={styles.gridContainer}>
          <GridButton
            icon="account-plus"
            text="New Lead"
            onPress={() => navigation.navigate('NewLead')}
          />
          <GridButton
            icon="clipboard-text-clock"
            text="Followups"
            onPress={() => navigation.navigate('FollowupsScreen')}
          />
          <GridButton
            icon="file-document-edit"
            text="Quote Builder"
            onPress={() => navigation.navigate('Quotebuilder')}
          />
          <GridButton
            icon="store-search"
            text="Catelog"
            onPress={() => navigation.navigate('catelog')}
          />
        </View>

        {/* TODAY'S ACTIVITY */}
        <View style={styles.activityCard}>
          <Text style={styles.activityHeader}>Today's Activity</Text>

          <ActivityRow
            icon="clock-outline"
            label="Online Time"
            value={data.todaysActivity.onlineTime}
          />
          <ActivityRow
            icon="phone-outline"
            label="Leads Contacted"
            value={data.todaysActivity.leadsContacted.toString()}
          />
          <ActivityRow
            icon="cash"
            label="Commission Earned Today"
            value={formatCurrency(data.todaysActivity.commissionEarned)}
            isLast
          />
        </View>
        <TouchableOpacity
          style={styles.leaveButton}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('TakeLeaveScreen')}
        >
          <Text style={styles.leaveButtonText}>Take Leave</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// --- Sub Components ---

const GridButton = ({ icon, text, onPress }: { icon: string, text: string, onPress?: () => void }) => (
  <TouchableOpacity
    style={styles.gridButton}
    onPress={onPress}
    activeOpacity={0.8}
  >
    {/* Minimized Icon Size */}
    <Icon name={icon} size={24} color="#fff" style={{ marginRight: 10 }} />
    <Text style={styles.gridButtonText}>{text}</Text>
  </TouchableOpacity>
);

const ActivityRow = ({ icon, label, value, isLast }: { icon: string, label: string, value: string, isLast?: boolean }) => (
  <View style={[styles.activityRow, !isLast && styles.activityBorder]}>
    <View style={styles.iconCircle}>
      <Icon name={icon} size={20} color={PRIMARY_COLOR} />
    </View>
    <Text style={styles.activityLabel}>{label}</Text>
    <Text style={styles.activityValue}>{value}</Text>
  </View>
);

// --- Styles ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    ...Platform.select({
      ios: {
        paddingTop: 0,
      },
      android: {
        paddingTop: StatusBar.currentHeight || 0,
      },
    }),
  },

  // ... existing styles ...

  leaveButton: {
    backgroundColor: '#ffffff',
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0', // Subtle light grey border
    elevation: 1, // Tiny shadow for depth
  },
  leaveButtonText: {
    color: '#000000', // Black text
    fontSize: 16,
    fontWeight: '600',
  },
  container: { padding: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: BG_COLOR },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  logo: {
    width: 140,
    height: 45,
    resizeMode: 'contain',
    marginLeft: -10 // Pulling left slightly to align with edge
  },
  bellContainer: { position: 'relative' },
  badge: { position: 'absolute', right: -2, top: -4, backgroundColor: '#EF4444', borderRadius: 8, width: 16, height: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: BG_COLOR },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },

  // Welcome
  welcomeSection: { marginBottom: 20 },
  greeting: { fontSize: 22, color: '#1E293B', fontWeight: '400' },
  userName: { fontWeight: '800', color: PRIMARY_COLOR }, // Step 4: Name color changed to Theme Blue
  subHeader: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginTop: 4 },

  // Main Card
  mainCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: PRIMARY_COLOR,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 8,
    alignItems: 'center'
  },

  // Chart
  chartContainer: { marginBottom: 24, alignItems: 'center', justifyContent: 'center' },
  circleOuter: {
    width: 140, height: 140, borderRadius: 70, borderWidth: 10, borderColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center', position: 'relative'
  },
  progressArc: {
    position: 'absolute', width: 140, height: 140, borderRadius: 70, borderWidth: 10, borderColor: 'transparent', borderTopColor: PRIMARY_COLOR, borderRightColor: PRIMARY_COLOR, top: -10, left: -10
  },
  circleInner: { alignItems: 'center', zIndex: 10 },
  chartLabel: { fontSize: 11, color: '#64748B', marginBottom: 4 },
  chartSubLabel: { fontSize: 12, fontWeight: '600', color: '#334155' },
  chartPercent: { fontSize: 28, fontWeight: '800', color: PRIMARY_COLOR, marginTop: 2 },

  // Daily Goal
  goalSection: { width: '100%', marginBottom: 24 },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  goalTitle: { fontSize: 14, color: '#475569' },
  goalPercentText: { fontSize: 14, fontWeight: '700', color: PRIMARY_COLOR },
  track: { height: 8, backgroundColor: '#F1F5F9', borderRadius: 4, width: '100%', overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: PRIMARY_COLOR, borderRadius: 4 },

  divider: { height: 1, width: '100%', backgroundColor: '#E2E8F0', marginBottom: 20 },

  // Total Section
  totalSection: { alignItems: 'center' },
  totalLabel: { fontSize: 14, color: PRIMARY_COLOR, fontWeight: '600', marginBottom: 4 },
  totalValue: { fontSize: 28, fontWeight: '800', color: PRIMARY_COLOR },

  // Grid Buttons (Minimized / Compact Style)
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 10, marginHorizontal: 10 },
  gridButton: {
    width: '48%',
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 12, // Slightly smaller radius
    paddingVertical: 12, // REDUCED HEIGHT (was 20)
    paddingHorizontal: 12,
    marginBottom: 12,
    flexDirection: 'row', // CHANGED to Row (Icon Left, Text Right)
    alignItems: 'center',
    justifyContent: 'flex-start', // Align content to left
    elevation: 3,
    shadowColor: PRIMARY_COLOR,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4
  },
  gridButtonText: {
    color: '#fff',
    fontSize: 14, // Slightly smaller text
    fontWeight: '700',
    textAlign: 'center',
  },

  // Activity Card
  activityCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  activityHeader: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 16 },
  activityRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  activityBorder: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  iconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  activityLabel: { flex: 1, fontSize: 14, color: '#475569', fontWeight: '500' },
  activityValue: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
});

export default DashboardScreen;