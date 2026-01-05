import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SERVER_URL } from '../../config';
import { fetchWithToken } from '../../fetchWithToken';

// --- Theme Configuration ---
const THEME_COLOR = '#003478'; // Your specific deep blue
const ACCENT_LIGHT = '#E0E7FF'; // Light blue background
const CARD_BG = '#FFFFFF';

/* ================= COMPONENT ================= */

const TeamPerformanceDashboard = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);


      // Fetch data from multiple endpoints
      const [pendingLeadsRes, dashboardStatsRes, teamStatsRes] = await Promise.all([
        fetchWithToken(`${SERVER_URL}/team-lead/pending-leads-overview`),
        fetchWithToken(`${SERVER_URL}/team-lead/dashboard-stats`),
        fetchWithToken(`${SERVER_URL}/team-lead/team-stats`)
      ]);

      if (!pendingLeadsRes.ok || !dashboardStatsRes.ok || !teamStatsRes.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const pendingLeadsData = await pendingLeadsRes.json();
      const dashboardStats = await dashboardStatsRes.json();
      const teamStats = await teamStatsRes.json();

      console.log("teamStats:",teamStats);
      // Color palette for visual variety
      const colors = ['#F97316', THEME_COLOR, '#4ADE80', '#8b5cf6'];

      // Transform API data to UI format
      const transformedData = {
        followUpsPending: {
          current: pendingLeadsData.total_pending || 0,
          total: pendingLeadsData.total_active_leads || 0,
          list: pendingLeadsData.breakdown?.map((item: any, index: number) => ({
            name: item.name,
            leads: item.pending_count,
            color: colors[index % colors.length]
          })) || []
        },
        storeDeliveries: {
          current: dashboardStats.deliveries_completed || 0,
          total: dashboardStats.deliveries_total || 0,
          list: teamStats.team_members?.map((member: any, index: number) => ({
            name: member.name,
            sent: member.deliveries_completed,
            total: member.deliveries_total_handover,
            color: colors[index % colors.length]
          })) || []
        },
        dailyGoal: {
          completed: dashboardStats.deliveries_completed || 0,
          target: dashboardStats.deliveries_total || 1, // Avoid division by zero
          percentage: dashboardStats.team_goal_percentage || 0
        }
      };

      setData(transformedData);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      // Set empty data on error to show UI gracefully
      setData({
        followUpsPending: { current: 0, total: 0, list: [] },
        storeDeliveries: { current: 0, total: 0, list: [] },
        dailyGoal: { completed: 0, target: 1, percentage: 0 }
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={THEME_COLOR} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="dark-content" />

      {/* HEADER */}
      <Text style={styles.title}>Team Performance</Text>
      <Text style={styles.subtitle}>Sales team performance</Text>

      {/* 1. TOP SUMMARY CARD */}
      <View style={styles.summaryCard}>
        <View style={styles.iconCircle}>
          <Text style={{ fontSize: 18, color: THEME_COLOR }}>🕒</Text>
        </View>
        <Text style={styles.summaryText}>Follow-Ups Pending</Text>
        <View style={styles.summaryRight}>
          <Text style={styles.summaryCount}>
            {data.followUpsPending.current} / {data.followUpsPending.total}
          </Text>
          <View style={styles.miniBar}>
            <View style={[styles.miniFill, {
              width: `${data.followUpsPending.total > 0
                ? (data.followUpsPending.current / data.followUpsPending.total) * 100
                : 0}%`
            }]} />
          </View>
        </View>
      </View>

      {/* 2. DETAILED FOLLOW-UPS */}
      <View style={styles.card}>
        <View style={styles.profileRow}>
          <View style={styles.iconAvatarContainer}>
            <Icon name='account-tie' size={28} color="#004aad" />
          </View>
          <View>
            <Text style={styles.cardTitle}>Follow-Ups Pending</Text>
            <Text style={styles.cardCountSub}>
              {data.followUpsPending.current} / {data.followUpsPending.total} Pending Leads
            </Text>
          </View>
        </View>

        {data.followUpsPending.list.map((item: any, index: number) => (
          <View key={index} style={styles.listRow}>
            <View style={[styles.dot, { backgroundColor: item.color }]} />
            <Text style={styles.rowText}>{item.name}</Text>
            <Text style={styles.leadsValue}>{item.leads} Leads</Text>
          </View>
        ))}
      </View>

      {/* 3. STORE DELIVERIES */}
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.cardTitle}>Store Deliveries Status</Text>
          <Text style={styles.cardCountText}>{data.storeDeliveries.current} / {data.storeDeliveries.total}</Text>
        </View>

        {data.storeDeliveries.list.map((item: any, index: number) => (
          <View key={index} style={styles.barContainer}>
            <View style={styles.barLabelRow}>
              <View style={[styles.dot, { backgroundColor: item.color }]} />
              <Text style={styles.nameLabel}>{item.name}</Text>
              <View style={styles.fullBarTrack}>
                <View style={[styles.barFill, { width: `${(item.sent / item.total) * 100}%`, backgroundColor: item.color }]} />
              </View>
              <Text style={styles.sentValue}>{item.sent} / {item.total}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* 4. DAILY GOAL */}
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.cardTitle}>Daily Goal Status</Text>
          <Text style={styles.cardCountText}>{data.dailyGoal.completed} / {data.dailyGoal.target}</Text>
        </View>

        <View style={styles.dailyGoalContent}>
          <View style={styles.dailyGoalLeft}>
            {data.followUpsPending.list.slice(0, 2).map((member: any, index: number) => (
              <View key={index} style={styles.goalRow}>
                <View style={[styles.dot, { backgroundColor: member.color }]} />
                <Text style={styles.smallText}>{member.name}</Text>
              </View>
            ))}
          </View>

          <View style={styles.donutWrapper}>
            <View style={[
              styles.donutCircle,
              {
                transform: [{ rotate: `${(data.dailyGoal.percentage * 3.6) - 90}deg` }]
              }
            ]}>
              <Text style={[
                styles.donutPercent,
                {
                  transform: [{ rotate: `${90 - (data.dailyGoal.percentage * 3.6)}deg` }]
                }
              ]}>
                {data.dailyGoal.percentage}%
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.footerText}>Daily Goal Status {data.dailyGoal.completed} / {data.dailyGoal.target}</Text>
      </View>
    </ScrollView>
  );
};

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: ACCENT_LIGHT, padding: 20 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  title: { fontSize: 26, fontWeight: '800', color: THEME_COLOR, letterSpacing: 0.5 },
  subtitle: { fontSize: 16, color: '#64748B', marginBottom: 25, fontWeight: '500' },

  summaryCard: {
    backgroundColor: CARD_BG,
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 4,
    shadowColor: THEME_COLOR,
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  iconCircle: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  summaryText: { flex: 1, fontWeight: '700', color: '#334155', fontSize: 15 },
  summaryRight: { alignItems: 'flex-end' },
  summaryCount: { fontWeight: '800', color: THEME_COLOR, fontSize: 16 },
  miniBar: { width: 100, height: 6, backgroundColor: '#E2E8F0', marginTop: 6, borderRadius: 3, overflow: 'hidden' },
  miniFill: { height: '100%', backgroundColor: '#F97316', borderRadius: 3 },

  card: { backgroundColor: CARD_BG, borderRadius: 24, padding: 20, marginBottom: 20, elevation: 5, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 15 },
  profileRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  avatar: { width: 55, height: 55, borderRadius: 27.5, marginRight: 15, borderWidth: 2, borderColor: THEME_COLOR },
  cardTitle: { fontSize: 18, fontWeight: '800', color: THEME_COLOR },
  cardCountSub: { color: '#64748B', fontSize: 14, fontWeight: '600' },

  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  cardCountText: { fontWeight: '800', color: THEME_COLOR, fontSize: 16 },

  listRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  rowText: { flex: 1, color: '#1E293B', fontWeight: '600', fontSize: 15 },
  leadsValue: { color: '#64748B', fontWeight: '700' },

  barContainer: { marginVertical: 10 },
  barLabelRow: { flexDirection: 'row', alignItems: 'center' },
  nameLabel: { width: 90, fontSize: 13, color: '#334155', fontWeight: '600' },
  fullBarTrack: { flex: 1, height: 10, backgroundColor: '#F1F5F9', borderRadius: 5, marginHorizontal: 12 },
  barFill: { height: '100%', borderRadius: 5 },
  sentValue: { width: 65, fontSize: 12, color: '#64748B', textAlign: 'right', fontWeight: '700' },

  dailyGoalContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  dailyGoalLeft: { flex: 1 },
  goalRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 6 },
  smallText: { fontSize: 14, color: '#1E293B', fontWeight: '600' },

  donutWrapper: { width: 110, height: 110, justifyContent: 'center', alignItems: 'center' },
  donutCircle: {
    width: 100, height: 100, borderRadius: 50, borderWidth: 12,
    borderColor: '#DBEAFE', // Base ring color
    borderTopColor: '#F97316', // Orange segment
    borderRightColor: '#F97316', // Matches screenshot arc
    justifyContent: 'center', alignItems: 'center'
  },
  donutPercent: { fontSize: 24, fontWeight: '900', color: THEME_COLOR },

  footerText: { textAlign: 'center', marginTop: 15, color: '#64748B', fontSize: 14, fontWeight: '700', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 15 },
  iconAvatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10
  },
});

export default TeamPerformanceDashboard;