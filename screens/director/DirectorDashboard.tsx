import React, { useState, useEffect } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SERVER_URL } from '../../config';
import { fetchWithToken, setNavigationRef } from '../../fetchWithToken';

// --- Theme Colors ---
const THEME_BLUE = '#003478';
const BG_LIGHT = '#f8f9fa';
const CARD_WHITE = '#ffffff';

const DirectorDashboard = ({ navigation }: any) => {
  const [stats, setStats] = useState({
    total_delivered_count: 0,
    pending_deliveries_count: 0,
    leads_completed_count: 0,
    leads_pending_count: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setNavigationRef(navigation);
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetchWithToken(`${SERVER_URL}/director-dashboard/stats`);

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        console.error('Failed to fetch director stats');
      }
    } catch (error) {
      console.error('Error fetching director stats:', error);
    } finally {
      setLoading(false);
    }
  };

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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>

        {/* 2. Welcome Section */}
        <View style={styles.headerTextSection}>
          <Text style={styles.welcomeText}>Executive Overview</Text>
          <Text style={styles.mainTitle}>Director Dashboard</Text>
          <Text style={styles.subTitle}>Real-time tracking of Sales and Store performance metrics.</Text>
        </View>

        {/* 3. FOUR KEY SUMMARY TOPICS */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={THEME_BLUE} />
          </View>
        ) : (
          <View style={styles.statsGrid}>
            {/* Row 1: Deliveries */}
            <View style={styles.statCard}>
              <View style={[styles.iconCircle, { backgroundColor: '#ecfdf5' }]}>
                <Icon name="truck-check" size={24} color="#10b981" />
              </View>
              <Text style={styles.statValue}>{stats.total_delivered_count.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Total Delivery Completed</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.iconCircle, { backgroundColor: '#fef2f2' }]}>
                <Icon name="truck-delivery-outline" size={24} color="#ef4444" />
              </View>
              <Text style={styles.statValue}>{stats.pending_deliveries_count}</Text>
              <Text style={styles.statLabel}>Pending Deliveries</Text>
            </View>

            {/* Row 2: Leads */}
            <View style={styles.statCard}>
              <View style={[styles.iconCircle, { backgroundColor: '#eff6ff' }]}>
                <Icon name="account-check-outline" size={24} color="#3b82f6" />
              </View>
              <Text style={styles.statValue}>{stats.leads_completed_count}</Text>
              <Text style={styles.statLabel}>Leads Completed</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.iconCircle, { backgroundColor: '#fff7ed' }]}>
                <Icon name="account-clock-outline" size={24} color="#f97316" />
              </View>
              <Text style={styles.statValue}>{stats.leads_pending_count}</Text>
              <Text style={styles.statLabel}>Pending Leads</Text>
            </View>
          </View>
        )}

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
            <View style={[styles.moduleIcon, { backgroundColor: '#e0e7ff' }]}>
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
            <View style={[styles.moduleIcon, { backgroundColor: '#ccfbf1' }]}>
              <Icon name="warehouse" size={32} color="#0f766e" />
            </View>
            <Text style={styles.cardTitle}>Store Management</Text>
            <Text style={styles.cardSub}>Monitor inventory & delivery logistics</Text>
          </TouchableOpacity>
        </View>

        {/* 5. STAFF MANAGEMENT SECTION */}
        <View style={styles.sectionLabelContainer}>
          <Text style={styles.sectionTitle}>Staff Management</Text>
        </View>

        <View style={styles.buttonGrid}>
          {/* Create Team Lead Button */}
          <TouchableOpacity
            style={styles.navButton}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('AddTeamLeadScreen')}
          >
            <View style={[styles.moduleIcon, { backgroundColor: '#fef3c7' }]}>
              <Icon name="account-tie" size={32} color="#d97706" />
            </View>
            <Text style={styles.cardTitle}>Create Team Lead</Text>
            <Text style={styles.cardSub}>Add new team lead with auto-generated ID</Text>
          </TouchableOpacity>

          {/* Create Store Manager Button */}
          <TouchableOpacity
            style={styles.navButton}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('AddStoreManagerScreen')}
          >
            <View style={[styles.moduleIcon, { backgroundColor: '#ddd6fe' }]}>
              <Icon name="briefcase-account" size={32} color="#7c3aed" />
            </View>
            <Text style={styles.cardTitle}>Create Store Manager</Text>
            <Text style={styles.cardSub}>Add new store manager with auto-generated ID</Text>
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
  loadingContainer: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
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