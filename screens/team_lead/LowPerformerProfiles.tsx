import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SERVER_URL } from '../../config';

// --- Theme Colors ---
const THEME_BLUE = '#003478';
const BG_LIGHT = '#F5F7FB';
const CARD_WHITE = '#FFFFFF';
const DANGER_RED = '#EF4444';

interface Performer {
  id: string;
  name: string;
  role: string;
  icon: string;
}

interface LeadStats {
  name: string;
  count: number;
  color: string;
}

const LowPerformerProfiles = () => {
  const [performers, setPerformers] = useState<Performer[]>([]);
  const [stats, setStats] = useState<LeadStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLowPerformers();
  }, []);

  const fetchLowPerformers = async () => {
    setLoading(true);
    try {
      // Get authentication token
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${SERVER_URL}/team-lead/low-performers`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch low performers');
      }

      const result = await response.json();

      setPerformers(result);
      setStats([]); // Stats chart was removed, keeping empty for potential future use
    } catch (error) {
      console.error('Error fetching low performers:', error);
      setPerformers([]);
      setStats([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={THEME_BLUE} />;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={THEME_BLUE} />


      <SafeAreaView>
        <View style={styles.navRow}>
          <TouchableOpacity><Icon name="chevron-left" size={30} color="#FFF" /></TouchableOpacity>
          <TouchableOpacity><Icon name="bell" size={26} color="#FFF" /></TouchableOpacity>
        </View>
        <Text style={styles.headerTitle}>Low Performer Profiles</Text>
        <Text style={styles.headerSub}>List of sales representatives with consistently low performance</Text>
      </SafeAreaView>


      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>

        {/* PERFORMER CARDS */}
        {performers.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="account-check" size={64} color="#94A3B8" />
            <Text style={styles.emptyText}>No low performers identified</Text>
            <Text style={styles.emptySubText}>All sales executives are meeting performance targets</Text>
          </View>
        ) : (
          performers.map((item) => (
            <View key={item.id} style={styles.profileCard}>
              <View style={styles.iconAvatarContainer}>
                <Icon name={item.icon} size={28} color="#004aad" />
              </View>
              <View style={styles.info}>
                <Text style={styles.nameText}>{item.name}</Text>
                <Text style={styles.roleText}>{item.role}</Text>
              </View>
              <View style={styles.badge}>
                <Icon name="arrow-down-bold" size={14} color={DANGER_RED} />
                <Text style={styles.badgeText}>Low Performer</Text>
              </View>
            </View>
          ))
        )}

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG_LIGHT },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, marginBottom: 15 },
  headerTitle: { color: THEME_BLUE, fontSize: 24, fontWeight: 'bold', marginHorizontal: 20 },
  headerSub: { color: '#000', fontSize: 14, marginTop: 5, lineHeight: 20, marginHorizontal: 20 },

  scrollBody: { padding: 20 },

  profileCard: {
    backgroundColor: CARD_WHITE,
    borderRadius: 15,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  avatar: { width: 55, height: 55, borderRadius: 27.5, marginRight: 15 },
  info: { flex: 1 },
  nameText: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  roleText: { fontSize: 14, color: '#64748B' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  badgeText: { color: DANGER_RED, fontSize: 12, fontWeight: '700', marginLeft: 4 },

  chartCard: { backgroundColor: CARD_WHITE, borderRadius: 20, padding: 20, marginTop: 10, elevation: 3 },
  cardHeading: { fontSize: 18, fontWeight: '700', color: '#1E293B', marginBottom: 20 },
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  barName: { width: 90, fontSize: 14, color: '#334155', fontWeight: '500' },
  track: { flex: 1, height: 14, backgroundColor: '#F1F5F9', borderRadius: 7, marginHorizontal: 10, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 7 },
  barCount: { fontSize: 13, color: '#64748B', width: 60, textAlign: 'right' },

  axis: { flexDirection: 'row', justifyContent: 'space-between', paddingLeft: 110, paddingRight: 60, marginTop: 5 },
  axisText: { fontSize: 12, color: '#94A3B8' },
  iconAvatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default LowPerformerProfiles;