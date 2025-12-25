import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  StatusBar
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');

// --- Theme Colors ---
const THEME_BLUE = '#003478'; 
const BG_COLOR = '#F5F9FF';
const CARD_WHITE = '#FFFFFF';

const PendingLeadsOverview = () => {
  const [loading, setLoading] = useState(false);

  // Dummy Data matching the uploaded design
  const leadData = [
    { name: 'John Smith', leads: 5, percent: 42, color: '#F97316' },
    { name: 'Emily Johnson', leads: 4, percent: 33, color: '#4ADE80' },
    { name: 'Michael Brown', leads: 2, percent: 17, color: '#60A5FA' },
    { name: 'Sarah Lee', leads: 1, percent: 8, color: '#86EFAC' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={BG_COLOR} />
      
      {/* Header Navigation */}
      <View style={styles.navHeader}>
        <TouchableOpacity><Icon name="chevron-left" size={30} color={THEME_BLUE} /></TouchableOpacity>
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
            <Text style={styles.countText}>12 / <Text style={{color: '#000'}}>18</Text></Text>
            <View style={styles.miniTrack}>
               <View style={[styles.miniFill, { width: '66%' }]} />
            </View>
          </View>
        </View>

        {/* 2. MULTI-COLOR DONUT CHART CARD */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Pending Leads</Text>
          <View style={styles.donutRow}>
            {/* Custom Donut View */}
            <View style={styles.donutContainer}>
               <View style={[styles.donutSegment, { borderTopColor: '#F97316', borderRightColor: '#F97316', transform: [{rotate: '0deg'}] }]} />
               <View style={[styles.donutSegment, { borderTopColor: '#4ADE80', transform: [{rotate: '110deg'}] }]} />
               <View style={[styles.donutSegment, { borderTopColor: '#60A5FA', transform: [{rotate: '220deg'}] }]} />
               <View style={styles.donutInner}>
                  <Text style={styles.donutBigNum}>12</Text>
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
              <View style={[styles.dot, { backgroundColor: '#60A5FA' }]} />
              <Text style={styles.barName}>{item.name}</Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${(item.leads / 6) * 100}%`, backgroundColor: '#60A5FA' }]} />
              </View>
              <Text style={styles.barVal}>{item.leads} Leads</Text>
            </View>
          ))}
          
          {/* Chart Axis Labels */}
          <View style={styles.axisLabels}>
             <Text style={styles.axisText}>0</Text>
             <Text style={styles.axisText}>2</Text>
             <Text style={styles.axisText}>4</Text>
             <Text style={styles.axisText}>6</Text>
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