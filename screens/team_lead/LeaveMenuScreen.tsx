import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Platform,
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
  border: '#e2e8f0',
  orangeAccent: '#f59e0b', // Pending color
};

const LeaveMenuScreen = ({ navigation }: any) => {
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setNavigationRef(navigation);
    fetchLeaveRequests();
  }, []);

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      const response = await fetchWithToken(`${SERVER_URL}/attendance/pending-leaves`);

      if (!response.ok) {
        throw new Error('Failed to fetch leave requests');
      }

      const data = await response.json();

      // Transform API data to match UI format
      const transformed = data.map((item: any) => ({
        id: item.leave_id.toString(),
        leave_id: item.leave_id,
        name: item.user_name,
        role: item.role,
        fromDate: new Date(item.start_date).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }),
        toDate: new Date(item.end_date).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }),
        duration: `${item.days_count} ${item.days_count === 1 ? 'Day' : 'Days'}`,
        pendingLeads: item.pending_leads_count,
        reason: item.reason
      }));

      setLeaveRequests(transformed);
    } catch (error) {
      console.error('Error fetching leave requests:', error);
      setLeaveRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const renderLeaveCard = ({ item }: any) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onPress={() => navigation.navigate('LeaveApprovalScreen', {
        request: item,
        onRefresh: fetchLeaveRequests
      })}
    >

      <View style={styles.cardContent}>
        {/* Top Row: Name & Date */}
        <View style={styles.headerRow}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <MaterialCommunityIcons name="account" size={20} color={COLORS.primary} />
            </View>
            <View>
              <Text style={styles.userName}>{item.name}</Text>
              <Text style={styles.userRole}>{item.role}</Text>
            </View>
          </View>
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{item.duration}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Bottom Row: Date Range */}
        <View style={styles.dateRow}>
          <View style={styles.dateBlock}>
            <Text style={styles.dateLabel}>From</Text>
            <Text style={styles.dateValue}>{item.fromDate}</Text>
          </View>
          <MaterialCommunityIcons name="arrow-right-thin" size={20} color={COLORS.textSub} />
          <View style={styles.dateBlock}>
            <Text style={styles.dateLabel}>To</Text>
            <Text style={styles.dateValue}>{item.toDate}</Text>
          </View>

          {/* Action Arrow */}
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#cbd5e1" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      {/* HEADER */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Leave Requests</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={{ marginTop: 10, color: COLORS.textSub }}>Loading leave requests...</Text>
        </View>
      ) : leaveRequests.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <MaterialCommunityIcons name="calendar-check" size={64} color={COLORS.textSub} />
          <Text style={{ marginTop: 16, fontSize: 16, color: COLORS.textSub, textAlign: 'center' }}>
            No pending leave requests
          </Text>
        </View>
      ) : (
        <FlatList
          data={leaveRequests}
          renderItem={renderLeaveCard}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

export default LeaveMenuScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },

  /* HEADER */
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#ffffff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
    borderWidth: 1, borderColor: '#f1f5f9',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.primary },

  /* LIST */
  listContainer: { padding: 20 },

  /* CARD */
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#64748b', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  cardContent: { flex: 1, padding: 16 },

  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#f1f5f9',
    alignItems: 'center', justifyContent: 'center', marginRight: 10
  },
  userName: { fontSize: 15, fontWeight: '700', color: COLORS.textMain },
  userRole: { fontSize: 11, color: COLORS.textSub },

  durationBadge: {
    backgroundColor: '#fff7ed', paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 6, borderWidth: 1, borderColor: '#ffedd5'
  },
  durationText: { fontSize: 11, fontWeight: '700', color: COLORS.orangeAccent },

  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 12 },

  dateRow: { flexDirection: 'row', alignItems: 'center' },
  dateBlock: { marginRight: 10 },
  dateLabel: { fontSize: 10, color: '#94a3b8', textTransform: 'uppercase' },
  dateValue: { fontSize: 13, fontWeight: '600', color: COLORS.textMain },
});