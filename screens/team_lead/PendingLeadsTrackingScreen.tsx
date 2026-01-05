import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
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
  green: '#10b981', // For completed stages
  grey: '#cbd5e1',  // For pending stages
  orange: '#f59e0b', // For current active stage
};

// --- STAGES CONFIGURATION ---
const STAGES = ['New', 'Quotation', 'Approval Sent', 'Approved', 'Customer', 'Followup', 'Store', 'Dispatch', 'Delivered'];

const PendingLeadsTrackingScreen = ({ navigation }: any) => {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setNavigationRef(navigation);
    fetchPendingLeads();
  }, []);

  const fetchPendingLeads = async () => {
    try {
      setLoading(true);
      const response = await fetchWithToken(`${SERVER_URL}/team-lead/pending-leads-tracking`);

      if (!response.ok) {
        throw new Error('Failed to fetch pending leads');
      }

      const data = await response.json();
      setLeads(data);
    } catch (error) {
      console.error('Error fetching pending leads:', error);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  // --- COMPONENT: TRACKING LINE ---
  const StageTracker = ({ currentStage }: { currentStage: number }) => {
    return (
      <View style={styles.trackerContainer}>
        {STAGES.map((stage, index) => {
          // Logic for styling
          const isCompleted = index < currentStage;
          const isActive = index === currentStage;
          const isLast = index === STAGES.length - 1;

          let dotColor = COLORS.grey;
          let lineColor = COLORS.grey;

          if (isCompleted) {
            dotColor = COLORS.green;
            lineColor = COLORS.green;
          } else if (isActive) {
            dotColor = COLORS.orange;
          }

          return (
            <View key={index} style={styles.stageItem}>
              {/* The Line (Except for the last item) */}
              {!isLast && (
                <View style={[styles.line, { backgroundColor: isCompleted ? COLORS.green : '#e2e8f0' }]} />
              )}

              {/* The Dot */}
              <View style={[
                styles.dot,
                { backgroundColor: dotColor },
                isActive && styles.activeDot // Make active dot slightly larger
              ]}>
                {isCompleted && <MaterialCommunityIcons name="check" size={10} color="#fff" />}
              </View>

              {/* The Label */}
              <Text style={[
                styles.stageLabel,
                isActive ? { color: COLORS.primary, fontWeight: '700' } : { color: COLORS.textSub }
              ]}>
                {stage}
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  // --- RENDER CARD ---
  const renderLeadCard = ({ item }: any) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onPress={() => navigation.navigate('TimeTracking', {
        customerName: item.name,
        leadId: item.id
      })}
    >
      {/* Header: Name & Value */}
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="account-clock" size={20} color={COLORS.primary} />
          </View>
          <View>
            <Text style={styles.clientName}>{item.name}</Text>
            <Text style={styles.leadId}>#{item.id}</Text>
          </View>
        </View>
        <View style={styles.valueBadge}>
          <Text style={styles.valueText}>{item.value}</Text>
        </View>
      </View>

      {/* Sales Person Info */}
      <View style={styles.infoRow}>
        <MaterialCommunityIcons name="account-tie" size={14} color={COLORS.textSub} />
        <Text style={styles.infoText}>{item.salesPerson}</Text>
        <Text style={styles.dotSeparator}>•</Text>
        <MaterialCommunityIcons name="clock-time-four-outline" size={14} color={COLORS.textSub} />
        <Text style={styles.infoText}>{item.lastUpdate}</Text>
      </View>

      <View style={styles.divider} />

      {/* Tracking Line */}
      <View style={styles.trackSection}>
        <Text style={styles.trackTitle}>Progress Tracker</Text>
        <StageTracker currentStage={item.currentStageIndex} />
      </View>

      {/* Footer Arrow */}
      <View style={styles.cardFooter}>
        <Text style={styles.footerText}>View Timeline</Text>
        <MaterialCommunityIcons name="arrow-right" size={16} color={COLORS.primary} />
      </View>

    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={{ marginTop: 10, color: COLORS.textSub }}>Loading pending leads...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      {/* HEADER */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pending Leads</Text>
        <View style={{ width: 40 }} />
      </View>

      {leads.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <MaterialCommunityIcons name="inbox" size={64} color={COLORS.grey} />
          <Text style={{ marginTop: 16, fontSize: 16, color: COLORS.textSub }}>No pending leads</Text>
        </View>
      ) : (
        <FlatList
          data={leads}
          renderItem={renderLeadCard}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

export default PendingLeadsTrackingScreen;

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

  /* LIST */
  listContainer: { padding: 20 },

  /* CARD */
  card: {
    backgroundColor: COLORS.cardBg, borderRadius: 16, marginBottom: 16, padding: 16,
    shadowColor: '#64748b', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
  },

  /* HEADER ROW */
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#e0e7ff',
    alignItems: 'center', justifyContent: 'center', marginRight: 10
  },
  clientName: { fontSize: 15, fontWeight: '700', color: COLORS.textMain },
  leadId: { fontSize: 12, color: COLORS.textSub, marginTop: 2 },

  valueBadge: { backgroundColor: '#f0fdf4', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#dcfce7' },
  valueText: { fontSize: 13, fontWeight: '800', color: '#15803d' },

  /* INFO ROW */
  infoRow: { flexDirection: 'row', alignItems: 'center', marginLeft: 50 },
  infoText: { fontSize: 12, color: COLORS.textSub, marginLeft: 4 },
  dotSeparator: { marginHorizontal: 6, color: COLORS.textSub },

  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 15 },

  /* TRACKING SECTION */
  trackSection: { marginBottom: 10 },
  trackTitle: { fontSize: 11, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 10, letterSpacing: 0.5 },

  trackerContainer: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  stageItem: { alignItems: 'center', flex: 1, position: 'relative' },

  // The Line connecting dots
  line: {
    position: 'absolute', top: 6, left: '50%', right: '-50%', height: 2,
    zIndex: -1, // Behind the dots
  },

  // The Dot
  dot: {
    width: 14, height: 14, borderRadius: 7,
    alignItems: 'center', justifyContent: 'center', marginBottom: 6,
    borderWidth: 2, borderColor: '#fff', // White border to separate from line
  },
  activeDot: {
    width: 18, height: 18, borderRadius: 9, top: -2,
    shadowColor: COLORS.orange, shadowOpacity: 0.4, shadowRadius: 4, elevation: 3
  },

  stageLabel: {
    fontSize: 6,
    color: COLORS.textSub,
    textAlign: 'center',
    maxWidth: 50,
    lineHeight: 10,
    fontWeight: '700'
  },

  /* FOOTER */
  cardFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end',
    marginTop: 5, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f8fafc'
  },
  footerText: { fontSize: 11, fontWeight: '700', color: COLORS.primary, marginRight: 4 },
});