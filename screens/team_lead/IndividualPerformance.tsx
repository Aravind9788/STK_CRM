import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

/* ================= DATA ================= */

const performanceData = [
  { id: '1', name: 'John Smith', subtitle: 'Sales Rep', icon: 'account-tie' },
  { id: '2', name: 'Maria Rodriguez', subtitle: '52 Leads This Month', icon: 'account-tie' },
  { id: '3', name: 'Ahmed Khan', subtitle: 'Sales Rep', icon: 'account-tie' },
  { id: '4', name: 'Soplia Lee', subtitle: '52 Leads This Month', icon: 'account-tie' },
  { id: '5', name: 'Sophia Lee', subtitle: 'Sales Rep', icon: 'account-tie' },
  { id: '6', name: 'David Chen', subtitle: 'Sales Rep', icon: 'account-tie' },
];

/* ================= COMPONENT ================= */

const IndividualPerformance = ({ navigation }: any) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#EBF1FF" />
      
      {/* 1. TOP NAV BAR */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.navButton} onPress={() => navigation.goBack()}>
            <Icon name="chevron-left" size={30} color="#2563EB" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton}>
          <Icon name="bell-outline" size={24} color="#2563EB" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>
        
        {/* 2. HEADER SECTION */}
        <View style={styles.headerSection}>
          <Text style={styles.mainTitle}>Individual Performance</Text>
        </View>

        {/* 3. SECTION LABEL */}
        <Text style={styles.sectionLabel}>Leads Completed</Text>

        {/* 4. PERFORMANCE CARDS */}
        {performanceData.map((item) => (
          <TouchableOpacity 
            key={item.id} 
            style={styles.card} 
            onPress={() => navigation.navigate('IndividualSalesPerformance')}
          >
            {/* Replaced Image with Icon Container */}
            <View style={styles.iconAvatarContainer}>
              <Icon name={item.icon} size={28} color="#004aad" />
            </View>

            <View style={styles.textContainer}>
              <Text style={styles.userName}>{item.name}</Text>
              <Text style={styles.userSubtitle}>{item.subtitle}</Text>
            </View>

            <View style={styles.statusCircle}>
               <Icon name="check-circle" size={20} color="#16a34a" />
            </View>
          </TouchableOpacity>
        ))}

      </ScrollView>
    </SafeAreaView>
  );
};

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EBF1FF',
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: Platform.OS === 'android' ? 10 : 0,
  },
  navButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollPadding: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  headerSection: {
    marginVertical: 15,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 15,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  // New container for the leading icon
  iconAvatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    marginLeft: 15,
  },
  userName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
  },
  userSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  statusCircle: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default IndividualPerformance;