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
      // Mocking API data based on your screenshots
      const dummyData = {
        followUpsPending: {
          current: 24,
          total: 54,
          list: [
            { name: 'John Smith', leads: 5, color: '#F97316' },
            { name: 'Emily Johnson', leads: 7, color: THEME_COLOR },
            { name: 'Michael Brown', leads: 8, color: '#F97316' },
            { name: 'Sarah Lee', leads: 4, color: '#4ADE80' },
          ],
        },
        storeDeliveries: {
          current: 14,
          total: 28,
          list: [
            { name: 'John Smith', sent: 14, total: 28, color: '#4ADE80' },
            { name: 'Emily Johnson', sent: 4, total: 20, color: THEME_COLOR },
            { name: 'Michael Brown', sent: 3, total: 20, color: '#4ADE80' },
            { name: 'Sarah Lee', sent: 3, total: 20, color: '#F97316' },
          ],
        },
        dailyGoal: {
          completed: 46,
          target: 80,
          percentage: 57,
        },
      };
      setData(dummyData);
    } catch (error) {
      console.log('Error:', error);
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
          <Text style={styles.summaryCount}>24 / 54</Text>
          <View style={styles.miniBar}>
            <View style={[styles.miniFill, { width: '45%' }]} />
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
              <Text style={styles.sentValue}>{item.sent === 14 ? '14 - 28' : `${item.sent} Sent`}</Text>
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
             <View style={styles.goalRow}><View style={[styles.dot, { backgroundColor: '#F97316' }]} /><Text style={styles.smallText}>John Smith</Text></View>
             <View style={styles.goalRow}><View style={[styles.dot, { backgroundColor: THEME_COLOR }]} /><Text style={styles.smallText}>Emily Johnson</Text></View>
          </View>

          <View style={styles.donutWrapper}>
            <View style={styles.donutCircle}>
              <Text style={styles.donutPercent}>{data.dailyGoal.percentage}%</Text>
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
    justifyContent: 'center', alignItems: 'center',
    transform: [{ rotate: '40deg' }]
  },
  donutPercent: { fontSize: 24, fontWeight: '900', color: THEME_COLOR, transform: [{ rotate: '-40deg' }] },
  
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