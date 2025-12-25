import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// --- Theme Colors ---
const THEME_BLUE = '#003478'; 
const BG_LIGHT = '#f8f9fa';
const CARD_WHITE = '#ffffff';

const DirectorDashboard = ({ navigation }: any) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={BG_LIGHT} />

      {/* 1. Header with Logo */}
      <View style={styles.header}>
        <Image
          source={{ uri: 'https://stkassociates.co.in/wp-content/uploads/STK-Associates-Logo-1.png' }}
          style={styles.logo}
        />
        <TouchableOpacity>
           <Icon name="bell-badge-outline" size={26} color={THEME_BLUE} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 30}}>
        
        {/* 2. Welcome Section */}
        <View style={styles.headerTextSection}>
          <Text style={styles.welcomeText}>Executive Overview</Text>
          <Text style={styles.mainTitle}>Director Dashboard</Text>
          <Text style={styles.subTitle}>Real-time tracking of Sales and Store performance metrics.</Text>
        </View>

        {/* 3. FOUR KEY SUMMARY TOPICS */}
        <View style={styles.statsGrid}>
          {/* Row 1: Deliveries */}
          <View style={styles.statCard}>
            <View style={[styles.iconCircle, {backgroundColor: '#ecfdf5'}]}>
               <Icon name="truck-check" size={24} color="#10b981" />
            </View>
            <Text style={styles.statValue}>1,240</Text>
            <Text style={styles.statLabel}>Total Delivery Completed</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.iconCircle, {backgroundColor: '#fef2f2'}]}>
               <Icon name="truck-delivery-outline" size={24} color="#ef4444" />
            </View>
            <Text style={styles.statValue}>85</Text>
            <Text style={styles.statLabel}>Pending Deliveries</Text>
          </View>

          {/* Row 2: Leads */}
          <View style={styles.statCard}>
            <View style={[styles.iconCircle, {backgroundColor: '#eff6ff'}]}>
               <Icon name="account-check-outline" size={24} color="#3b82f6" />
            </View>
            <Text style={styles.statValue}>458</Text>
            <Text style={styles.statLabel}>Leads Completed</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.iconCircle, {backgroundColor: '#fff7ed'}]}>
               <Icon name="account-clock-outline" size={24} color="#f97316" />
            </View>
            <Text style={styles.statValue}>112</Text>
            <Text style={styles.statLabel}>Pending Leads</Text>
          </View>
        </View>

        {/* 4. NAVIGATION MODULES */}
        <View style={styles.sectionLabelContainer}>
           <Text style={styles.sectionTitle}>Performance Portals</Text>
        </View>
        
        <View style={styles.buttonGrid}>
          {/* Sales Portal Button */}
          <TouchableOpacity
            style={styles.navButton}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('TeamLeadSales')}
          >
            <View style={[styles.moduleIcon, {backgroundColor: '#e0e7ff'}]}>
               <Icon name="chart-line" size={32} color={THEME_BLUE} />
            </View>
            <Text style={styles.cardTitle}>Sales Performance</Text>
            <Text style={styles.cardSub}>Analyze lead conversion & executive efficiency</Text>
          </TouchableOpacity>

          {/* Store Portal Button */}
          <TouchableOpacity
            style={styles.navButton}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('StoreManagerPerformance')}
          >
            <View style={[styles.moduleIcon, {backgroundColor: '#ccfbf1'}]}>
               <Icon name="warehouse" size={32} color="#0f766e" />
            </View>
            <Text style={styles.cardTitle}>Store Management</Text>
            <Text style={styles.cardSub}>Monitor inventory & delivery logistics</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

export default DirectorDashboard;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG_LIGHT,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: CARD_WHITE,
    elevation: 2,
  },
  logo: {
    width: 130,
    height: 40,
    resizeMode: 'contain',
  },
  headerTextSection: {
    paddingHorizontal: 20,
    paddingVertical: 25,
  },
  welcomeText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: THEME_BLUE,
    marginTop: 2,
  },
  subTitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 6,
    lineHeight: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 15,
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: CARD_WHITE,
    width: '47%',
    padding: 16,
    borderRadius: 20,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E293B',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  sectionLabelContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME_BLUE,
  },
  buttonGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
  navButton: {
    width: '47%',
    backgroundColor: CARD_WHITE,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  moduleIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME_BLUE,
    textAlign: 'center',
  },
  cardSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 14,
  },
});