import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SERVER_URL } from '../../config';

const { width } = Dimensions.get('window');

// --- Theme Colors ---
const THEME_BLUE = '#003478';
const BG_COLOR = '#F5F9FF';
const CARD_WHITE = '#FFFFFF';

const PendingLeadsOverview = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [leadData, setLeadData] = useState<any[]>([]);
  const [totalPending, setTotalPending] = useState(0);
  const [totalActive, setTotalActive] = useState(0);

  useEffect(() => {
    fetchPendingLeads();
  }, []);

  const fetchPendingLeads = async () => {
    try {
      setLoading(true);

      // Get authentication token
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${SERVER_URL}/team-lead/pending-leads-overview`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch pending leads');
      }

      const data = await response.json();

      // Transform API data to UI format
      const colors = ['#F97316', '#4ADE80', '#60A5FA', '#86EFAC'];
      const transformed = data.breakdown?.map((item: any, index: number) => ({
        name: item.name,
        leads: item.pending_count,
        percent: item.percentage,
        color: colors[index % colors.length]
      })) || [];

      setLeadData(transformed);
      setTotalPending(data.total_pending || 0);
      setTotalActive(data.total_active_leads || 0);

    } catch (error) {
      console.error('Error fetching pending leads:', error);
      setLeadData([]);
      setTotalPending(0);
      setTotalActive(0);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={BG_COLOR} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={THEME_BLUE} />
        </View>
      </SafeAreaView>
    );
  }

  const maxLeads = Math.max(...leadData.map(d => d.leads), 1);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={BG_COLOR} />

      {/* Header Navigation */}
      <View style={styles.navHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="chevron-left" size={30} color={THEME_BLUE} />
        </TouchableOpacity>
        <TouchableOpacity><Icon name="bell" size={26} color={THEME_BLUE} /></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.mainTitle}>Pending Leads Overview</Text>
        <Text style={styles.subTitle}>Follow-Ups and Pending Leads</Text>

        {/* 1. TOP SUMMARY CARD */}
        <View style={styles.summaryCard}>
          <View style={styles.iconBox}>
            <Icon name="clock-outline" size={24} color="#F97316" />
          </View>
          <Text style={styles.cardLabel}>Follow-Ups Pending</Text>
          <View style={styles.summaryRight}>
            <Text style={styles.countText}>
              {totalPending} / <Text style={{ color: '#000' }}>{totalActive}</Text>
            </Text>
            <View style={styles.miniTrack}>
              <View style={[
                styles.miniFill,
                { width: `${totalActive > 0 ? (totalPending / totalActive) * 100 : 0}%` }
              ]} />
            </View>
          </View>
        </View>

        {/* 2. MULTI-COLOR DONUT CHART CARD */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Pending Leads</Text>
          <View style={styles.donutRow}>
            {/* Custom Donut View */}
            <View style={styles.donutContainer}>
              {/* Dynamically generate segments based on leadData */}
              {leadData.map((item, index) => {
                // Calculate cumulative rotation for each segment
                let cumulativePercent = 0;
                for (let i = 0; i < index; i++) {
                  cumulativePercent += leadData[i].percent;
                }
                const startDegree = (cumulativePercent / 100) * 360;
                const segmentPercent = item.percent;

                // For segments > 50%, we need to render two half-circles
                if (segmentPercent > 50) {
                  return (
                    <React.Fragment key={index}>
                      {/* First half (50%) */}
                      <View
                        style={[
                          styles.donutSegment,
                          {
                            borderTopColor: item.color,
                            borderRightColor: item.color,
                            transform: [{ rotate: `${startDegree}deg` }]
                          }
                        ]}
                      />
                      {/* Second half (remaining %) */}
                      <View
                        style={[
                          styles.donutSegment,
                          {
                            borderTopColor: item.color,
                            borderRightColor: segmentPercent > 75 ? item.color : 'transparent',
                            transform: [{ rotate: `${startDegree + 180}deg` }]
                          }
                        ]}
                      />
                    </React.Fragment>
                  );
                }

                // For segments <= 50%, single half-circle is enough
                return (
                  <View
                    key={index}
                    style={[
                      styles.donutSegment,
                      {
                        borderTopColor: item.color,
                        borderRightColor: segmentPercent > 25 ? item.color : 'transparent',
                        transform: [{ rotate: `${startDegree}deg` }]
                      }
                    ]}
                  />
                );
              })}
              <View style={styles.donutInner}>
                <Text style={styles.donutBigNum}>{totalPending}</Text>
                <Text style={styles.donutSubText}>Pending Leads</Text>
              </View>
            </View>

            {/* Legend List */}
            <View style={styles.legendContainer}>
              {leadData.map((item, idx) => (
                <View key={idx} style={styles.legendItem}>
                  <View style={[styles.dot, { backgroundColor: item.color }]} />
                  <View>
                    <Text style={styles.legendName}>{item.name}</Text>
                    <Text style={styles.legendStats}>{item.leads} Leads   {item.percent}%</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* 3. HORIZONTAL BAR CHART CARD */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Pending Leads</Text>
          {leadData.map((item, idx) => (
            <View key={idx} style={styles.barRow}>
              <View style={[styles.dot, { backgroundColor: item.color }]} />
              <Text style={styles.barName}>{item.name}</Text>
              <View style={styles.barTrack}>
                <View style={[
                  styles.barFill,
                  {
                    width: `${(item.leads / maxLeads) * 100}%`,
                    backgroundColor: item.color
                  }
                ]} />
              </View>
              <Text style={styles.barVal}>{item.leads} Leads</Text>
            </View>
          ))}

          {/* Chart Axis Labels */}
          <View style={styles.axisLabels}>
            <Text style={styles.axisText}>0</Text>
            <Text style={styles.axisText}>{Math.round(maxLeads / 3)}</Text>
            <Text style={styles.axisText}>{Math.round(maxLeads * 2 / 3)}</Text>
            <Text style={styles.axisText}>{maxLeads}</Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BG_COLOR },
  navHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 15, paddingTop: 10 },
  container: { padding: 20 },
  mainTitle: { fontSize: 24, fontWeight: '800', color: '#1E293B' },
  subTitle: { fontSize: 16, color: '#64748B', marginBottom: 20 },

  // Summary Card
  summaryCard: {
    backgroundColor: CARD_WHITE,
    borderRadius: 15,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 4,
  },
  iconBox: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#FFEDD5', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cardLabel: { flex: 1, fontSize: 16, fontWeight: '600', color: '#1E293B' },
  summaryRight: { alignItems: 'flex-end' },
  countText: { fontSize: 16, fontWeight: '800', color: '#64748B' },
  miniTrack: { width: 100, height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, marginTop: 5 },
  miniFill: { height: '100%', backgroundColor: '#F97316', borderRadius: 3 },

  // General Card
  card: { backgroundColor: CARD_WHITE, borderRadius: 20, padding: 20, marginBottom: 20, elevation: 4 },
  cardHeading: { fontSize: 18, fontWeight: '700', color: '#1E293B', marginBottom: 15 },

  // Donut Layout
  donutRow: { flexDirection: 'row', alignItems: 'center' },
  donutContainer: { width: 140, height: 140, justifyContent: 'center', alignItems: 'center' },
  donutSegment: { position: 'absolute', width: 140, height: 140, borderRadius: 70, borderWidth: 18, borderColor: 'transparent' },
  donutInner: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', elevation: 2 },
  donutBigNum: { fontSize: 28, fontWeight: '800', color: '#1E293B' },
  donutSubText: { fontSize: 10, color: '#64748B', textAlign: 'center' },
  legendContainer: { flex: 1, marginLeft: 20 },
  legendItem: { flexDirection: 'row', marginBottom: 12 },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 4, marginRight: 10 },
  legendName: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  legendStats: { fontSize: 12, color: '#64748B' },

  // Bar Chart Layout
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  barName: { width: 90, fontSize: 14, fontWeight: '600', color: '#1E293B' },
  barTrack: { flex: 1, height: 14, backgroundColor: '#E2E8F0', borderRadius: 4, marginHorizontal: 10 },
  barFill: { height: '100%', borderRadius: 4 },
  barVal: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  axisLabels: { flexDirection: 'row', justifyContent: 'space-between', paddingLeft: 105, paddingRight: 70 },
  axisText: { fontSize: 12, color: '#94A3B8' }
});

export default PendingLeadsOverview;