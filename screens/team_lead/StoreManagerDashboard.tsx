import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// --- Theme Colors ---
const THEME_BLUE = '#003478'; 
const BG_LIGHT = '#F5F9FF';
const CARD_WHITE = '#FFFFFF';

const StoreManagerDashboard = () => {
  const [pincode, setPincode] = useState('');
  const [loading, setLoading] = useState(false);
  
  // --- Dummy Values for Testing ---
  const [storeData, setStoreData] = useState<any>({
    storeName: 'Downtown Electronics',
    completedAlerts: 9,
    pendingAlerts: 7,
    noActionAlerts: 5,
    performance: 60,
    deliveries: { current: 14, total: 28 },
    team: [
      { name: 'John Smith', score: '16 / 20', color: '#60A5FA' },
      { name: 'Emily Johnson', score: '15 / 20', color: '#F97316' },
      { name: 'Michael Brown', score: '9 / 20', color: '#4ADE80' },
      { name: 'Sarah Lee', score: '6 / 20', color: '#60A5FA' },
    ]
  });

  const handleSearch = () => {
    if (pincode.length < 6) return;
    setLoading(true);
    
    // Simulating API call with a 1-second delay
    setTimeout(() => {
      setLoading(false);
      // Data remains for testing, or you can update it here
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={BG_LIGHT} />
      
      {/* Navigation Bar */}
      <View style={styles.navRow}>
        <TouchableOpacity><Icon name="chevron-left" size={32} color={THEME_BLUE} /></TouchableOpacity>
        <TouchableOpacity><Icon name="bell" size={26} color={THEME_BLUE} /></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Title Section - Left Aligned */}
        <View style={styles.headerTextSection}>
          <Text style={styles.mainTitle}>Store Manager Dashboard</Text>
          <Text style={styles.subTitle}>Store Manager Dashboard</Text>
        </View>

        {/* 1. PINCODE SEARCH CARD (Dynamic Input) */}
        <View style={styles.card}>
          <Text style={styles.inputLabel}>Enter Store Pincode</Text>
          <View style={styles.searchRow}>
            <TextInput
              style={styles.textInput}
              placeholder="Pincode: 560001"
              keyboardType="numeric"
              maxLength={6}
              value={pincode}
              onChangeText={setPincode}
            />
            <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Icon name="chevron-right" size={24} color="#FFF" />
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.storeResultText}>{storeData.storeName}</Text>
        </View>

        {/* 2. ALERT CARDS */}
        <AlertItem icon="check-circle-outline" label="ORDERS COMPLETED ALERTS" count={storeData.completedAlerts} color="#4ADE80" />
        
        <View style={styles.card}>
           <View style={styles.alertHeader}>
              <View style={[styles.iconBox, {backgroundColor: '#FFEDD5'}]}>
                <Icon name="clock-outline" size={22} color="#F97316" />
              </View>
              <Text style={styles.alertLabel}>ORDERS PENDING ALERTS</Text>
              <Text style={[styles.alertCount, {color: '#F97316'}]}>{storeData.pendingAlerts}</Text>
           </View>
           {/* Detailed list in alert card */}
           <View style={styles.alertDetails}>
              {storeData.team.map((m: any, i: number) => (
                <View key={i} style={styles.miniRow}>
                  <View style={[styles.dot, {backgroundColor: m.color}]} />
                  <Text style={styles.miniText}>{m.name}  {m.score.split('/')[0]} Leads</Text>
                </View>
              ))}
           </View>
        </View>

        <AlertItem icon="alert-outline" label="NO ACTION ALERTS" count={storeData.noActionAlerts} color="#F97316" subtext="No Response in the Last 24 Hours" />

        {/* 3. STORE DELIVERIES STATUS */}
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardHeading}>Store Deliveries Status</Text>
            <Text style={styles.countText}>{storeData.deliveries.current} / {storeData.deliveries.total}</Text>
          </View>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: '50%' }]} />
          </View>
        </View>

        {/* 4. PERFORMANCE MONITOR (Donut + donutInfo) */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Performance Monitor</Text>
          <View style={styles.donutRow}>
            <View style={styles.donutInfo}>
               <View style={styles.infoRow}>
                  <View style={[styles.dot, { backgroundColor: '#F97316' }]} />
                  <Text style={styles.infoLabel}>Store Performance</Text>
                  <Text style={styles.infoScore}>57 / 80</Text>
               </View>
               {storeData.team.map((member: any, index: number) => (
                 <View key={index} style={styles.infoRow}>
                    <View style={[styles.dot, { backgroundColor: member.color }]} />
                    <Text style={styles.infoLabel}>{member.name}</Text>
                    <Text style={styles.infoScore}>{member.score}</Text>
                 </View>
               ))}
            </View>

            <View style={styles.donutContainer}>
              <View style={styles.donutCircle}>
                <Text style={styles.donutPercent}>{storeData.performance}%</Text>
              </View>
            </View>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

// --- Helper Components ---
const AlertItem = ({ icon, label, count, color, subtext }: any) => (
  <View style={styles.card}>
    <View style={styles.alertHeader}>
      <View style={[styles.iconBox, {backgroundColor: color + '15'}]}>
        <Icon name={icon} size={22} color={color} />
      </View>
      <Text style={styles.alertLabel}>{label}</Text>
      <Text style={[styles.alertCount, {color}]}>{count}</Text>
    </View>
    {subtext && <Text style={styles.miniSubtext}>{subtext}</Text>}
  </View>
);

// --- Styles ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BG_LIGHT },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10 },
  container: { paddingHorizontal: 20, paddingBottom: 30 },
  headerTextSection: { marginTop: 15, marginBottom: 15, paddingHorizontal: 5 },
  mainTitle: { fontSize: 22, fontWeight: '800', color: THEME_BLUE },
  subTitle: { fontSize: 14, color: '#64748B', marginTop: 4 },

  card: { backgroundColor: CARD_WHITE, borderRadius: 15, padding: 18, marginBottom: 15, elevation: 3 },
  inputLabel: { fontSize: 13, fontWeight: '700', color: '#64748B', marginBottom: 8 },
  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 8, paddingRight: 5 },
  textInput: { flex: 1, height: 45, paddingHorizontal: 12, fontSize: 15, color: '#1E293B' },
  searchButton: { backgroundColor: THEME_BLUE, width: 35, height: 35, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  storeResultText: { marginTop: 12, fontSize: 18, fontWeight: '700', color: '#1E293B' },

  alertHeader: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 38, height: 38, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  alertLabel: { flex: 1, fontSize: 13, fontWeight: '700', color: '#475569' },
  alertCount: { fontSize: 22, fontWeight: '800' },
  alertDetails: { marginTop: 10, paddingLeft: 50 },
  miniRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 3 },
  miniText: { fontSize: 12, color: '#64748B' },
  miniSubtext: { fontSize: 12, color: '#94A3B8', marginLeft: 50, marginTop: 5 },

  cardHeading: { fontSize: 16, fontWeight: '700', color: THEME_BLUE, marginBottom: 15 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  countText: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  barTrack: { height: 8, backgroundColor: '#E2E8F0', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: '#4ADE80' },

  donutRow: { flexDirection: 'row', alignItems: 'center' },
  donutInfo: { flex: 1.6 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  infoLabel: { flex: 1, fontSize: 12, color: '#64748B' },
  infoScore: { fontSize: 12, fontWeight: '700', color: '#1E293B' },
  donutContainer: { flex: 1, alignItems: 'flex-end' },
  donutCircle: { 
    width: 85, height: 85, borderRadius: 42.5, borderWidth: 10, 
    borderColor: '#DBEAFE', borderTopColor: '#60A5FA', borderRightColor: '#60A5FA',
    justifyContent: 'center', alignItems: 'center' 
  },
  donutPercent: { fontSize: 20, fontWeight: '800', color: '#1E293B' }
});

export default StoreManagerDashboard;